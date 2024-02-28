const mongoose = require("mongoose")

const CinemaSchema = new mongoose.Schema({
        uid: {
            type: String,
            unique: true,
        },
        name: {
            type: String,
            unique: true,
            required: true,
            min: 1,
            max: 128,
        },
    }, { timestamps: true } // Pour ajouter des champs 'createdAt' et 'updatedAt' mis à jour automatiquement par Mongo
);

module.exports = mongoose.model("Cinema", CinemaSchema);