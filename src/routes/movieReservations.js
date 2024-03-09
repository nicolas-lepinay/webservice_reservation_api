const router = require("express").Router();
const reservationController = require("../controllers/reservationController");
const { authenticate, ensureAdmin, ensureSelfOrAdmin } = require('../middlewares/middleware');

// CREATE A RESERVATION REQUEST
router.post(`/:movieUid${process.env.RESERVATION_ENDPOINT}/:email`, authenticate, reservationController.create);  

// FIND ALL RESERVATIONS FOR ONE MOVIE
router.get(`/:movieUid${process.env.RESERVATION_ENDPOINT}`, authenticate, ensureAdmin, reservationController.findAll);  

module.exports = router;