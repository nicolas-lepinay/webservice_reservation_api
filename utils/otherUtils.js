exports.randomInt = (min, max) => { // min and max included 
    if (!min) min = 0;
    if (!max) max = 10;
    return Math.floor(Math.random() * (max - min + 1) + min)
}