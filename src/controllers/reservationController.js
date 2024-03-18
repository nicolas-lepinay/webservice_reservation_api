const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const Seance = require("../models/Seance");
const amqp = require("amqplib");

const { v4: uuidv4 } = require('uuid');
const { sendMsgToRabbitMQ } = require('../utils/rabbitmqUtils');

// * CONFIRM A RESERVATION *
module.exports.confirm = async (req, res) => {
    const reservationUid = req.params.uid;
    const userUid = req.user.uid;

    try {
        // Trouver la réservation spécifique par UID
        const reservation = await Reservation.findOne({ uid: reservationUid });
        if (!reservation) return res.status(404).json({ error: { message: "Réservation introuvable." }});
        if (reservation.userUid !== userUid) return res.status(403).json({ error: { message: "Action non-autorisée (la réservation n'appartient pas à l'utilisateur connecté)." }});
        if (reservation.status !== 'open') return res.status(410).json({ error: { message: `Cette réservation ne peut plus être confirmée (statut actuel : ${reservation.status}).`  }});

        // Récupérer toutes les réservations pour cette séance
        let otherReservations = await Reservation.find({ seanceUid: { $in: reservation.seanceUid } }).select('-_id -__v');

        // 1️⃣ MISE A JOUR DU STATUS DES RESERVATIONS EXPIRED
        // Préparer une liste de promesses pour les mises à jour de statut
        const updatePromises = [];

        // Vérifier si la date actuelle est supérieure à 'expiresAt' pour les réservations 'open'
        otherReservations.forEach(reservation => {
            if (reservation.status === 'open' && new Date() > reservation.expiresAt) {
                // Ajouter la promesse de mise à jour à la liste
                updatePromises.push(Reservation.updateOne({ uid: reservation.uid }, { status: 'expired' }));
            }
        });

        // Exécuter toutes les mises à jour en parallèle
        await Promise.all(updatePromises);

        // Si des mises à jour ont eu lieu, récupérer à nouveau les réservations
        if (updatePromises.length > 0) otherReservations = await Reservation.find({ seanceUid: { $in: reservation.seanceUid } }).select('-_id -__v');

        // 2️⃣ CALCUL DU RANK
        // Filtrer les réservations ouvertes
        const openReservations = otherReservations.filter(res => res.status === 'open');

        // Trouver le rang de la position de la réservation actuelle
        const rank = getRank(reservation, openReservations);

        if (rank !== 1) return res.status(400).json({ error: { message: `Vous êtes en ${rank}ème position dans la file d'attente et ne pouvez pas confirmer la réservation actuellement.` }});

        reservation.status = 'confirmed';
        await reservation.save();

        // 📨 Envoyer à Rabbitmq notification de réservation
        const msg = {
            email: req.user.email,
            seats: reservation.seats,
        }
        console.log("Sending message to rabbit MQ...");
        sendMsgToRabbitMQ("reservation-queue", msg)

        return res.status(201).json({ message: "Réservation confirmée avec succès." });
        
    } catch(err) {
        return res.status(500).json({ error: { message: `Erreur interne : ${err}` }});
    }
}

// * GET ALL RESERVATIONS *
module.exports.findAll = async (req, res) => {
    try {
        const { movieUid } = req.params;

        // Trouver toutes les séances pour le film donné
        const seances = await Seance.find({ movieUid: movieUid });

        // Extraire les UIDs de séances
        const seanceUids = seances.map(seance => seance.uid);

        // Récupérer toutes les réservations
        let reservations = await Reservation.find({ seanceUid: { $in: seanceUids } }).select('-_id -__v');

        // Préparer une liste de promesses pour les mises à jour de statut
        const updatePromises = [];

        const now = new Date();
        reservations.forEach(reservation => {
            // Vérifier si la date actuelle est supérieure à 'expiresAt' pour les réservations 'open'
            if (reservation.status === 'open' && now > reservation.expiresAt) {
                updatePromises.push(Reservation.updateOne({ uid: reservation.uid }, { status: 'expired' }));
            }
        });

        // Exécuter toutes les mises à jour en parallèle
        await Promise.all(updatePromises);

        // Si des mises à jour ont eu lieu, récupérer à nouveau les réservations
        if (updatePromises.length > 0) reservations = await Reservation.find({ seanceUid: { $in: seanceUids } }).select('-_id -__v');

        // Calcul du rank des réservations
        const rankedReservations = reservations.map((reservation, index, array) => {
            let rank = null;
            if (reservation.status === 'open') {
                const openReservations = array.filter(res => res.status === 'open');
                rank = getRank(reservation, openReservations);
            }
            // Exclure la propriété 'position'
            const { position, ...reservationWithoutPosition } = reservation.toObject();
            return { ...reservationWithoutPosition, rank }; // Retourne l'objet sans la propriété 'position'
        });
        
        // Retourner les réservations avec rank
        return res.status(200).json(rankedReservations);
    } catch (err) {
        return res.status(500).json({ error: { message: `Erreur interne : ${err}` }});
    }
}

// * CREATE A RESERVATION REQUEST *
module.exports.create = async (req, res) => {
    const movieUid = req.params.movieUid; // Inutilisé
    const seanceUid = req.body.seance;
    const roomUid = req.body.room;
    const nbSeats = req.body.nbSeats;
    const userUid = req.user.uid; // Extrait du middleware d'authentification

    try {
        // Trouver la salle pour obtenir le nombre total de sièges
        const room = await Room.findOne({ uid: roomUid });
        if (!room) return res.status(404).json({ error: { message: "Salle de cinéma non trouvée." }});

        // Récupérer toutes les réservations existantes pour cette séance
        const existingReservations = await Reservation.find({ seanceUid: seanceUid });

        // Calculer le nombre total de sièges déjà réservés avec un statut 'confirmed'
        const confirmedSeats = existingReservations.reduce((acc, reservation) => {
            return reservation.status === 'confirmed' ? acc + reservation.seats : acc;
        }, 0);

        // Vérifier la disponibilité des sièges
        if (room.seats - confirmedSeats < nbSeats) return res.status(400).json({ error: { message: `Le nombre de sièges disponibles est insuffisant : ${confirmedSeats} sièges disponibles.` }});

        // Trouver la position la plus élevée parmi les réservations ouvertes existantes
        const highestPosition = existingReservations.filter(r => r.status == 'open').reduce((max, reservation) => {
            return reservation.position > max ? reservation.position : max;
        }, 0);

        // Déterminer la position de la nouvelle réservation
        const position = highestPosition + 1;

        // Calculer le rang de la nouvelle réservation
        const rank = createRank(existingReservations);

        // Créer une date d'expiration pour la nouvelle réservation
        const expiresAt = new Date(Date.now() + 10 * 60000); // Ajoute 10 minutes à la date actuelle

        // Sauvegarder la nouvelle réservation avec le statut 'open'
        const newReservation = new Reservation({
            uid: uuidv4(),
            status: 'open',
            seats: nbSeats,
            seanceUid: seanceUid,
            userUid: userUid,
            expiresAt: expiresAt,
            position: position,
        });

        const savedReservation = await newReservation.save();

        return res.status(201).json({
            uid: savedReservation.uid,
            status: savedReservation.status,
            seats: savedReservation.seats,
            seanceUid: savedReservation.seanceUid,
            userUid: savedReservation.userUid,
            expiresAt: savedReservation.expiresAt,
            rank: rank,
        });

    } catch (err) {
        return res.status(500).json({ error: { message: `Erreur interne : ${err}` }});
    }
}

// * GET ONE RESERVATION *
module.exports.findOne = async (req, res) => {
    try {
        const { uid } = req.params;
        const reservations = await Reservation.find().select('-_id -__v');
        const reservation = reservations.find(r => r.uid === uid);

        // La réservation n'existe pas
        if (!reservation) {
            return res.status(404).json({ error: { message: "Réservation introuvable." }})
        };
        // La réservation n'appartient pas à l'utilisateur et il n'est pas admin 
        if (reservation.userUid !== req.user.uid && !req.user.roles.includes('ROLE_ADMIN')) {
            return res.status(403).json({ error: { message: "Action non-autorisée (la réservation n'appartient pas à l'utilisateur connecté)." }})
        };
        // Le statut de la réservation doit être mis à jour
        if (reservation.status === 'open' && new Date() > reservation.expiresAt) {
            Reservation.updateOne({uid: reservation.uid}, { status: 'expired' });
        }
        const openReservations = reservations.filter(res => res.status === 'open');
        const rank = reservation.status === 'open' ? getRank(reservation, openReservations) : null;

        // Retourner la réservation (sans la position mais avec le rank)
        const { position, ...reservationWithoutPosition } = reservation.toObject();
        return res.status(200).json({ ...reservationWithoutPosition, rank });

    } catch (err) {
        return res.status(500).json({ error: { message: `Erreur interne : ${err}` }});
    }
}

function getRank(reservation, otherReservations) {
    // Trier les positions des réservations ouvertes par ordre croissant
    const sortedPositions = otherReservations.map(reservation => reservation.position).sort((a, b) => a - b);

    // Trouver le rang de la position de la réservation actuelle
    const rank = sortedPositions.indexOf(reservation?.position) + 1; // +1 car les index commencent à 0

    return rank;
}

function createRank(otherReservations) {
    // Calculer le rang de la nouvelle réservation
    const rank = otherReservations.filter(reservation => reservation.status === 'open').length + 1;
    return rank;
}