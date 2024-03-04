const router = require("express").Router();
const reservationController = require("../controllers/reservationController");
const { authenticate } = require('../middlewares/middleware');

/**
 * 🎫 RESERVATIONS
 */
// CONFIRM A RESERVATION
router.post(`/:uid/confirm`, authenticate, reservationController.confirm); 

// FIND A RESERVATION
router.get(`/:uid`, authenticate, reservationController.findOne); 

module.exports = router;