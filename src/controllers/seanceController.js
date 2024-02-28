const Room = require("../models/Room");
const Seance = require("../models/Seance");

const { v4: uuidv4 } = require('uuid');
const { fetchMovieByUid } = require('../utils/fetch');

// * CREATE A SEANCE *
module.exports.createSeance = async (req, res) => {
    try {
        const uid = uuidv4();
        const { roomUid } = req.params;
        const { movieUid, date } = req.body;

        // Sauvegarder la séance
        const newSeance = new Seance({ uid, movieUid, roomUid, date });
        const savedSeance = await newSeance.save();

        // Récupérer le film
        const response = await fetchMovieByUid(movieUid);
        const movieData = await response.json();

        if (movieData.error) {
            return res.status(data.error.code || 500).json({ error: { code: data.error.code || 500, message: data.error?.message }});
        }

        return res.status(201).json({
            uid: savedSeance.uid,
            roomUid: savedSeance.roomUid,
            date: savedSeance.date,
            movie: movieData,
            createdAt: savedSeance.createdAt,
            updatedAt: savedSeance.updatedAt,
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Seance est invalide (${err.message})`}});
        }
        // For other error types:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }   
}