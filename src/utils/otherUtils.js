exports.randomInt = (min, max) => { // min and max included 
    if (!min) min = 0;
    if (!max) max = 10;
    return Math.floor(Math.random() * (max - min + 1) + min)
}

exports.convertToReadableDate = (isoDateString) => {
    // Convertir la chaîne de caractères en objet Date
    const date = new Date(isoDateString);

    // Format lisible
    const readableDate = date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    });

    const readableTime = date.toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return `${readableDate} à ${readableTime}`;
}