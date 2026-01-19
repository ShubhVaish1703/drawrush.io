const createWordHint = (word) => {
    const randomIndex = Math.floor(Math.random() * word.length);

    return word
        .split('')
        .map((char, index) => (index === randomIndex ? char : '_'))
        .join(' ');
};

module.exports = { createWordHint }
