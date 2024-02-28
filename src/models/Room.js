const mongoose = require("mongoose")

const RoomSchema = new mongoose.Schema({
        uid: {
            type: String,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            min: 1,
            max: 128,
        },
        seats: {
            type: Number,
            required: true,
            min: 1,
            validate : {
                validator : Number.isInteger,
                message   : 'Seats ({VALUE}) is not an integer value.'
              }
        },
        cinemaUid: {
            type: String,
            required: true
        },
    }, { timestamps: true } // Pour ajouter des champs 'createdAt' et 'updatedAt' mis à jour automatiquement par Mongo
);

// Ajout d'un index composé pour garantir l'unicité de la combinaison name et cinemaUid
// Deux salles portant le même nom peuvent coexister, mais uniquement si elles ont un cinemaUid différent chacune
RoomSchema.index({ 'name': 1, 'cinemaUid': 1 }, { unique: true });

module.exports = mongoose.model("Room", RoomSchema);