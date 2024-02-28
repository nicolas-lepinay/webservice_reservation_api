const mongoose = require("mongoose")

const MovieSchema = new mongoose.Schema({
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
        description: {
            type: String,
            required: true,
            min: 1,
            max: 4096,
        },
        release_date: {
            type: Date,
        },
        duration: {
            type: Number,
            required: true,
            min: 0,
            max: 240,
            validate : {
                validator : Number.isInteger,
                message   : 'The duration ({VALUE}) is not an integer value.'
              }
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
            max: 5,
            validate : {
                validator : Number.isInteger,
                message   : 'The rate ({VALUE}) is not an integer value.'
              }
        },
    }, { timestamps: true } // Pour ajouter des champs 'createdAt' et 'updatedAt' mis à jour automatiquement par Mongo
);

module.exports = mongoose.model("Movie", MovieSchema);