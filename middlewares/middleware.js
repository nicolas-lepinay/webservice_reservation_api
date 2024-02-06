const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

exports.authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).send("Accès refusé. Aucun token fourni.");

    try {
        const url = `${process.env.BASE_URL}:${process.env.AUTH_API_PORT}/api${process.env.VALIDATE_TOKEN_ENDPOINT}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });

        const data = await response.json();

        if (!data.success) return res.status(403).json(
            {
                success: false, 
                error: { code: 403, message: "Access token invalide." }
            });


        req.user = data.user;
        next();
    } catch (error) {
        return res.status(500).json(
            {
                success: false, 
                error: { code: 500, message: error }
            });
    }
};

exports.ensureAdmin = (req, res, next) => {
    if (req.user && req.user.roles.includes('ROLE_ADMIN')) {
        return next();
    }
    return res.status(403).json({ message: "Accès refusé : nécessite le rôle d'administrateur." });
};

exports.ensureSelfOrAdmin = (req, res, next) => {
    if (req.user && (req.user.id === req.params.uid || req.params.uid === 'me' || req.user.roles.includes('ROLE_ADMIN'))) {
        return next();
    }
    return res.status(403).json({ message: "Accès refusé : vous ne pouvez accéder qu'à votre propre compte, sauf si vous êtes administrateur." });
};
