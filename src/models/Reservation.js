const mongoose = require("mongoose");
const Seance = require('./Seance');

const ReservationSchema = new mongoose.Schema({
    uid: {
        type: String,
        unique: true,
    },
    status: [
        { 
            type: String, 
            enum: ['open', 'expired', 'confirmed'], 
            default: 'open'
        }
    ],
    seats: {
        type: Number,
        required: true,
        min: 1,
        validate : {
            validator : Number.isInteger,
            message   : 'Seats ({VALUE}) is not an integer value.'
          }
    },
    seanceUid: {
        type: String,
        required: true,
        validate: {
            validator: async function(seanceUid) {
                // Vérifier si une séance avec l'uid donné existe
                const seance = await Seance.findOne({ uid: seanceUid });
                // Si la séance existe, la validation réussit (true)
                return !!seance;
            },
            message: "La séance correspondant à l'UID fourni n'existe pas."
        }
    },
    userUid: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
    },
    position: {
        type: Number,
        min: 1,
        validate : {
            validator : Number.isInteger,
            message   : 'Position ({VALUE}) is not an integer value.'
        }
    },
}, { timestamps: true });

module.exports = mongoose.model("Reservation", ReservationSchema);
