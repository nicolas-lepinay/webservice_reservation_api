const Cinema = require("../models/Cinema");
const Room = require("../models/Room");

const { v4: uuidv4 } = require('uuid');
const { randomInt } = require('../utils/otherUtils');

// * CREATE A CINEMA *
module.exports.create = async (req, res) => {
    try {
        const uid = uuidv4();
        const name = req.body.name;
        const newCinema = new Cinema({ uid, name });

        const savedCinema = await newCinema.save();
        res.status(201).json({
            uid: savedCinema.uid,
            name: savedCinema.name,
            createdAt: savedCinema.createdAt,
            updatedAt: savedCinema.updatedAt,
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Cinéma est invalide (${err.message})`}});
        }
        // For other error types:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }   
}

// * GET ALL CINEMA *
module.exports.findAll = async (req, res) => {
    try {
        const cinemas = await Cinema.find().select('-_id -__v');

        // 204 - AUCUN CINEMA
        if (cinemas.length == 0) return res.status(204).json("Aucun résultat.");

        // 200
        return res.status(200).json(cinemas);
    } catch (err) {
        // 500 - Erreur interner
        res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}

// * GET ONE CINEMA *
module.exports.findOne = async (req, res) => {
    try {
        const uid = req.params.uid;
        const cinema = await Cinema.findOne({ uid: uid}).select('-_id -__v'); // Exclure les champs _id et __v du résultat

         // 404 - No cinema found:
         if (!cinema) {
            return res.status(404).json({error: { code: 404, message: "Aucun cinéma correspondant n'a été trouvé."}});
        }

        // 200
        return res.status(200).json(cinema);
    } catch (err) {
        // 500 - Server error:
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}

// * UPDATE A CINEMA *
module.exports.update = async (req, res) => {
    const uid = req.params.uid;
    try {
        // Trouver le cinéma par uid et le mettre à jour avec les données reçues dans req.body
        // L'option { new: true } garantit que le document retourné est post-mis à jour
        // .select('-_id') exclut le champ _id du document retourné
        const updatedCinema = await Cinema.findOneAndUpdate({ uid: uid }, req.body, { new: true }).select('-_id -__v');
        
        if (!updatedCinema) {
            return res.status(404).json({error: { code: 404, message: "Aucun cinéma correspondant n'a été trouvé."}});
        }
        
        res.status(200).json(updatedCinema);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({error: { code: 422, message: `Le contenu de l'objet Cinéma est invalide (${err.message})`}});
        }
        // Pour d'autres types d'erreurs
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
};


// * DELETE A CINEMA *
module.exports.delete = async (req, res) => {
    try {
        const uid = req.params.uid;
        const cinema = await Cinema.findOne({ uid: uid });

        if(!cinema) {
            return res.status(404).json({error: { code: 404, message: "Aucun cinéma correspondant n'a été trouvé."}});
        }
        await cinema.deleteOne();
        return res.status(200).send(`Le cinéma '${cinema?.name}' a été supprimé avec succès.`);
    } catch (err) {
        return res.status(500).json({error: { code: 500, message: `Erreur interne (${err})`}});
    }
}

