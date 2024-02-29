const router = require("express").Router();
const cinemaController = require("../controllers/cinemaController");
const roomsController = require("../controllers/roomsController");
const seanceController = require("../controllers/seanceController");
const reservationController = require("../controllers/reservationController");

const { authenticate, ensureAdmin } = require('../middlewares/middleware');

/**
 * 🎬 CINEMAS
 */

// CREATE A CINEMA
router.post("/", authenticate, ensureAdmin, cinemaController.create); 

// GET ALL CINEMAS
router.get("/", authenticate, cinemaController.findAll); 

// GET ONE CINEMA
router.get("/:uid", authenticate, cinemaController.findOne); 

// UPDATE A CINEMA
router.put("/:uid", authenticate, ensureAdmin, cinemaController.update);   

// DELETE A CINEMA
router.delete("/:uid", authenticate, ensureAdmin, cinemaController.delete); 



/**
 * 💺 ROOMS
 */

// CREATE A ROOM
router.post(`/:cinemaUid${process.env.ROOMS_ENDPOINT}`, authenticate, ensureAdmin, roomsController.createRoom); 

// GET ALL OF A CINEMA'S ROOMS
router.get(`/:cinemaUid${process.env.ROOMS_ENDPOINT}`, authenticate, roomsController.findByCinemaUid); 

// GET ONE ROOM
router.get(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid`, authenticate, roomsController.findOne); 

// UPDATE A ROOM
router.put(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid`, authenticate, ensureAdmin, roomsController.update);   

// DELETE A ROOM
router.delete(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid`, authenticate, ensureAdmin, roomsController.delete); 



/**
 * 🎫 SEANCE
 */

// CREATE A SEANCE
router.post(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid${process.env.SEANCE_ENDPOINT}`, authenticate, ensureAdmin, seanceController.createSeance); 

// GET A ROOM'S SEANCES
router.get(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid${process.env.SEANCE_ENDPOINT}`, authenticate, seanceController.findByRoomUid); 

// UPDATE A SEANCE
router.put(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid${process.env.SEANCE_ENDPOINT}/:seanceUid`, authenticate, ensureAdmin, seanceController.createSeance); 

// UPDATE A SEANCE
router.put(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid${process.env.SEANCE_ENDPOINT}/:seanceUid`, authenticate, ensureAdmin, seanceController.updateSeance); 

// DELETE A SEANCE
router.delete(`/:cinemaUid${process.env.ROOMS_ENDPOINT}/:roomUid${process.env.SEANCE_ENDPOINT}/:seanceUid`, authenticate, ensureAdmin, seanceController.deleteSeance);

module.exports = router;