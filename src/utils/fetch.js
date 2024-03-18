const fetch = require('node-fetch');

exports.fetchMovieByUid = async (movieUid) => { 
    const url = `${process.env.FILM_API_URL}:${process.env.FILM_API_PORT}/api${process.env.MOVIES_ENDPOINT}/${movieUid}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return response;
}

exports.fetchAllUsers = async (req) => { 
    const url = `${process.env.AUTH_API_URL}:${process.env.AUTH_API_PORT}/api${process.env.ACCOUNT_ENDPOINT}${process.env.ALL_USERS}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization' : 'Bearer ' + req.token },
    });
    return response;
}