const fetch = require('node-fetch');

exports.fetchMovieByUid = async (movieUid) => { 
    const url = `${process.env.FILM_API_URL}:${process.env.FILM_API_PORT}/api${process.env.MOVIES_ENDPOINT}/${movieUid}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return response;
}