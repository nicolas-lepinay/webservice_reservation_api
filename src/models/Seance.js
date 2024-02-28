const mongoose = require("mongoose")
const Movie = require('./Movie');
const Room = require('./Room');

const SeanceSchema = new mongoose.Schema({
        uid: {
            type: String,
            unique: true,
        },
        movieUid: {
            type: String,
            required: true,
            validate: {
                validator: async function(movieUid) {
                    // Vérifier si un film avec l'uid donné existe
                    const movie = await Movie.findOne({ uid: movieUid });
                    // Si le film existe, la validation réussit (true)
                    return !!movie;
                },
                message: "Le film correspondant à l'UID fourni n'existe pas."
            }
        },
        roomUid: {
            type: String,
            required: true,
            validate: {
                validator: async function(roomUid) {
                    // Vérifier si une salle avec l'uid donné existe
                    const room = await Room.findOne({ uid: roomUid });
                    // Si la salle existe, la validation réussit (true)
                    return !!room;
                },
                message: "La salle correspondant à l'UID fourni n'existe pas."
            }
        },
        date: {
            type: Date,
            required: true
        },
    }, { timestamps: true } // Pour ajouter des champs 'createdAt' et 'updatedAt' mis à jour automatiquement par Mongo
);

// Ajout d'un index composé pour garantir l'unicité de la combinaison roomUid et date
// Deux séances peuvent coexister à la même date, mais uniquement si elles ont une salle différente
SeanceSchema.index({ 'roomUid': 1, 'date': 1 }, { unique: true });

module.exports = mongoose.model("Seance", SeanceSchema);