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

module.exports = mongoose.model("Room", RoomSchema);