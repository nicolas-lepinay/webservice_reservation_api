const Room = require("../models/Room");
const Seance = require("../models/Seance");
const Movie = require("../models/Movie");
const amqp = require("amqplib");

const { v4: uuidv4 } = require('uuid');
const { fetchMovieByUid } = require('../utils/fetch');

// * CREATE A SEANCE *
module.exports.createSeance = async (req, res) => {
    try {
        const { roomUid } = req.params;
        const movieUid  = req.body.movie;
        const date = req.body.date;

        // Convertir la date de string à objet Date
        const seanceDate = new Date(date);

        // Récupérer la durée du film pour cette séance
        const movie = await Movie.findOne({ uid: movieUid });
        if (!movie) return res.status(404).json({ error: { code: 404, message: "Film non trouvé." }});

        const movieDuration = movie.duration;
        const maxDuration = Movie.schema.path('duration').options.max || 240;

        // Calculer la fenêtre de temps pour vérifier les séances existantes
        const startTimeWindow = new Date(seanceDate.getTime() - maxDuration * 60000);
        const endTimeWindow = new Date(seanceDate.getTime() + movieDuration * 60000);

        // Trouver les séances existantes dans la fenêtre de temps
        const seances = await Seance.find({
            roomUid: roomUid,
            date: { $gte: startTimeWindow, $lte: endTimeWindow }
        });

        // Première vérification : séances directement en conflit avec la nouvelle séance (séances comprises entre le début et la fin de la nouvelle séance)
        const directConflict = seances.some(seance => {
            const seanceEndDate = new Date(seance.date.getTime() + seance.movieDuration * 60000);
            return seance.date < endTimeWindow && seanceEndDate > seanceDate;
        });

        if (directConflict) {
            return res.status(400).json({ error: { code: 400, message: "Conflit direct de séance détecté." }});
        }

        // Deuxième vérification : vérifier le chevauchement avec la durée des films des séances existantes
        for (let seance of seances) {
            const existingMovie = await Movie.findOne({ uid: seance.movieUid });
            if (!existingMovie) continue; // Si le film n'est pas trouvé, continuer avec la prochaine séance

            const existingMovieDuration = existingMovie.duration;
            const existingSeanceEndDate = new Date(seance.date.getTime() + existingMovieDuration * 60000);
            
            if (seanceDate < existingSeanceEndDate) {
                return res.status(400).json({ error: { code: 400, message: "Conflit de séance détecté avec la durée des films." }});
            }
        }

        // Si aucune séance conflictuelle, sauvegarder la nouvelle séance
        const newSeance = new Seance({ uid: uuidv4(), movieUid, roomUid, date: date });
        const savedSeance = await newSeance.save();

        // Récuperer tous les utilisateurs
        const url = `${process.env.AUTH_API_URL}:${process.env.AUTH_API_PORT}/api${process.env.ACCOUNT_ENDPOINT}${process.env.ALL_USERS}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization' : 'Bearer ' + req.token }
        });

        //console.log(await allUsers.json());
        const dataAllUsers = await response.json();

       // Envoyer à Rabbitmq notification de nouvelle séance pour chaque utilisateur
        dataAllUsers.forEach(async user => {
             // Send message to rabbit mq
            if (user.email != undefined) {
                const msg = {
                    login: user.login,
                    email: user.email,
                    movie : movie.name,
                    dateSeance : savedSeance.date
                }
                
                console.log("Envoi d'un message à RabbitMQ pour l'utilisateur : " + user.login);
                const amqpServer = "amqp://guest:guest@rabbitmq:5672"
                const connection = await amqp.connect(amqpServer)
                const channel = await connection.createChannel();
                await channel.assertQueue("seance-queue");
                await channel.sendToQueue("seance-queue", Buffer.from(JSON.stringify(msg)))
                await channel.close();
                await connection.close();
            }            
        });       

        return res.status(201).json({
            uid: savedSeance.uid,
            roomUid: savedSeance.roomUid,
            date: savedSeance.date,
            movie: movie,
            createdAt: savedSeance.createdAt,
            updatedAt: savedSeance.updatedAt,
        });
    } catch (err) {
        return res.status(500).json({ error: { code: 500, message: `Erreur interne (${err})` }});
    }   
}

// * GET A ROOM'S SEANCES *
module.exports.findByRoomUid = async (req, res) => {
    try {
        // Récupérer le roomUid à partir des paramètres de la requête
        const { roomUid } = req.params;

        // Trouver toutes les séances associées au roomUid
        const seances = await Seance.find({ roomUid: roomUid }).select('-_id -__v');

        // Si aucune séance n'est trouvée, renvoyer une réponse 204
        if (seances.length == 0) return res.status(204).json("Aucune séance n'existe dans cette salle.");

        // Récupérer tous les movieUid uniques
        const movieUids = [...new Set(seances.map(seance => seance.movieUid))];

        // Trouver tous les films correspondants
        const movies = await Movie.find({ uid: { $in: movieUids } }).select('-_id -__v');

        // Créer un objet pour accéder rapidement aux films par leur uid
        const moviesByUid = movies.reduce((acc, movie) => {
            acc[movie.uid] = movie;
            return acc;
        }, {});

        // Associer chaque séance à son film correspondant
        const seancesWithMovies = seances.map(seance => {
            return { ...seance.toObject(), movie: moviesByUid[seance.movieUid] };
        });

        return res.status(200).json(seancesWithMovies);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Seance est invalide (${err.message})`}});
        }
        // For other error types:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }   
}

// * UPDATE A SEANCE *
module.exports.updateSeance = async (req, res) => {
    const { cinemaUid, roomUid, seanceUid } = req.params;
    try {
        // Trouver le cinéma par uid et le mettre à jour avec les données reçues dans req.body
        // L'option { new: true } garantit que le document retourné est post-mis à jour
        // .select('-_id') exclut le champ _id du document retourné
        const updatedSeance = await Seance.findOneAndUpdate({ uid: seanceUid, cinemaUid, roomUid }, req.body, { new: true }).select('-_id -__v');
        
        if (!updatedSeance) {
            return res.status(404).json({error: { code: 404, message: "Aucune séance correspondante n'a été trouvée."}});
        }
        res.status(200).json(updatedSeance);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Room est invalide (${err.message})`}});
        }
        // Pour d'autres types d'erreurs
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    } 
}

// * DELETE A SEANCE *
module.exports.deleteSeance = async (req, res) => {
    const { cinemaUid, roomUid, seanceUid } = req.params;
    try {
        const seance = await Seance.findOne({ uid: seanceUid, cinemaUid, roomUid });

        if(!seance) {
            return res.status(404).json({error: { code: 404, message: "Aucune séance correspondante n'a été trouvée."}});
        }
        await seance.deleteOne();
        return res.status(200).send(`La séance a été supprimée avec succès.`);
    } catch (err) {
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}