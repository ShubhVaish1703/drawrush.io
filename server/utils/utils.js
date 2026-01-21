const { CohereClient } = require("cohere-ai");

const createWordHint = (word) => {
    const randomIndex = Math.floor(Math.random() * word.length);

    return word
        .split('')
        .map((char, index) => (index === randomIndex ? char : '_'))
        .join(' ');
};


const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

// 🛟 Static fallback hints (rotated randomly)
const fallbackHints = [
    "No hint available",
    "Try guessing without a hint!",
    "This one is tricky!",
    "Think carefully before guessing!",
    "No clues this time 😉",
];

const getFallbackHint = () =>
    fallbackHints[Math.floor(Math.random() * fallbackHints.length)];


// Generate AI-based hint
const generateHint = async (word) => {
    if (!word) return getFallbackHint();

    try {
        const response = await cohere.chat({
            model: 'command-a-03-2025',
            message: `You are a hint generator for a guessing game. Give ONE short hint. Do NOT use the word itself or obvious synonyms. Word: ${word}`,
        });

        const hint = response?.text;

        // AI returned nothing
        if (!hint) return getFallbackHint();
        return hint;
    } catch (error) {
        console.error("Cohere error:", error.message);
        return getFallbackHint();
    }
};

module.exports = { createWordHint, generateHint }
