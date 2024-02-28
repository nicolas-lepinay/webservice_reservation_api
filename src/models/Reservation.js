const mongoose = require("mongoose");

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
    expiresAt: {
        type: Date,
    },
    movieUid: {
        type: String,
        required: true
    },
    userUid: {
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model("Reservation", ReservationSchema);
