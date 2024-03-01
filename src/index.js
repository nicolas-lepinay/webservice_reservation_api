const express = require("express"); // Framework JS
const mongoose = require("mongoose"); // MongoDB
const dotenv = require("dotenv"); // Pour stocker les variables d'environnements
const helmet = require("helmet"); // Pour la sécurité HHTPS
const morgan = require("morgan"); // Pour les logs et résultats des requêtes
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./doc/swagger-output.json');

dotenv.config();

// 🚗 Routes
const cinemaRoute = require("./routes/cinema")
const reservationRoute = require("./routes/reservations")
const movieReservationRoute = require("./routes/movieReservations")

// ➡️ Module imports :
//const swagger = require("./doc/swagger.js");

// ⛰️ Environment variables :
const port = process.env.RESERVATION_API_PORT;

const app = express();

// Connexion à MongoDB :
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✔️  Reservation API connected to MongoDB."))
    .catch((err) => console.log(err));

// Middleware :
app.use(express.json()); // Body parser for POST requests
app.use(helmet());
app.use(morgan("common"));

// =====> API Routes
app.use(`/api${process.env.CINEMA_ENDPOINT}`, cinemaRoute);
app.use(`/api${process.env.RESERVATION_ENDPOINT}`, reservationRoute);
app.use(`/api${process.env.MOVIE_ENDPOINT}`, movieReservationRoute);

// =====> Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, { swaggerOptions: { persistAuthorization: true } }));
//swagger.Run();

app.listen(port, '0.0.0.0', () => {
    console.log("✔️  Reservation API running on port " + port + "...")
})