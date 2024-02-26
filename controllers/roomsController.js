const Room = require("../models/Room");

const { v4: uuidv4 } = require('uuid');
const { randomInt } = require('../utils/otherUtils');

// * CREATE A ROOM *
module.exports.createRoom = async (req, res) => {
    try {
        const uid = uuidv4();
        const cinemaUid = req.params.cinemaUid;
        const name = req.body.name;
        const seats = req.body.seats || randomInt(90, 480);

        const newRoom = new Room({ uid, cinemaUid, name, seats });
        const savedRoom = await newRoom.save();

        res.status(201).json({
            uid: savedRoom.uid,
            name: savedRoom.name,
            seats: savedRoom.seats,
            cinemaUid: savedRoom.cinemaUid,
            createdAt: savedRoom.createdAt,
            updatedAt: savedRoom.updatedAt,
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Room est invalide (${err.message})`}});
        }
        // For other error types:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }   
}

// * GET ALL OF A CINEMA'S ROOMS *
module.exports.findByCinemaUid = async (req, res) => {
    try {
        // Récupérer le cinemaUid à partir des paramètres de la requête
        const { cinemaUid } = req.params;

        // Trouver toutes les salles associées au cinemaUid
        const rooms = await Room.find({ cinemaUid: cinemaUid }).select('-_id -__v');

        // Si aucune salle n'est trouvée, renvoyer une réponse 204
        if (rooms.length == 0) return res.status(204).json("Aucune salle n'est associée à ce cinéma.");

        // Sinon, renvoyer les salles trouvées
        res.status(200).json(rooms);
    } catch (err) {
        // Gérer les erreurs éventuelles
        return res.status(500).json({ error: { code: 500, message: `Erreur interne du serveur (${err})` } });
    }
};

// * GET ONE ROOM *
module.exports.findOne = async (req, res) => {
    try {
        const { cinemaUid, roomUid } = req.params;
        const room = await Room.findOne({ uid: roomUid, cinemaUid: cinemaUid }).select('-_id -__v'); // Exclure les champs _id et __v du résultat

        // 404 - No room found:
         if (!room) {
            return res.status(404).json({error: { code: 404, message: "Aucune salle correspondante n'a été trouvée."}});
        }

        // 200
        return res.status(200).json(room);
    } catch (err) {
        // 500 - Server error:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}

// * UPDATE A ROOM *
module.exports.update = async (req, res) => {
    const { cinemaUid, roomUid } = req.params;
    try {
        // Trouver le cinéma par uid et le mettre à jour avec les données reçues dans req.body
        // L'option { new: true } garantit que le document retourné est post-mis à jour
        // .select('-_id') exclut le champ _id du document retourné
        const updatedRoom = await Room.findOneAndUpdate({ uid: roomUid, cinemaUid: cinemaUid }, req.body, { new: true }).select('-_id -__v');
        
        if (!updatedRoom) {
            return res.status(404).json({error: { code: 404, message: "Aucune salle correspondante n'a été trouvée."}});
        }
        res.status(200).json(updatedRoom);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Room est invalide (${err.message})`}});
        }
        // Pour d'autres types d'erreurs
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
};


// * DELETE A ROOM *
module.exports.delete = async (req, res) => {
    const { cinemaUid, roomUid } = req.params;
    try {
        const room = await Room.findOne({ uid: roomUid, cinemaUid: cinemaUid });

        if(!room) {
            return res.status(404).json({error: { code: 404, message: "Aucune salle correspondante n'a été trouvée."}});
        }
        await room.deleteOne();
        return res.status(200).send(`La salle '${room?.name}' a été supprimée avec succès.`);
    } catch (err) {
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}