const WORD_BANK = [
    "apple", "banana", "orange", "office", "school", "college", "study", "food", "water", "breakfast", "lunch", "dinner", "tea", "coffee", "sleep", "wake", "morning", "evening", "night", "sun", "moon", "star", "planet", "galaxy", "comet", "meteor", "asteroid",
    "cloud", "rain", "storm", "lightning", "Qualcomm", "Salesforce",
    "Spotify", "Samsung", "Sony", "Panasonic", "Dell", "HP", "Lenovo",
    "grape", "mango", "pineapple", "watermelon",
    "cafe", "bakery",
    "market", "factory", "office", "bank", "cave", "glacier", "canyon", "thunder", "rainbow", "snow",
    "tornado", "hurricane", "earthquake",
    "pizza", "burger", "sandwich", "donut", "cake", "beach", "island", "mountain", "hill", "forest", "jungle", "desert",
    "river", "lake", "waterfall", "volcano", "medal", "balloon",
    "kite", "fireworks", "tent", "lantern", "flashlight",
    "dolphin", "whale", "shark", "octopus", "jellyfish", "turtle",
    "eagle", "owl", "parrot", "penguin", "duck", "chicken",
    "butterfly", "bee", "ant", "spider", "snail", "frog", "snake", "lizard",
    "cookie", "cupcake",
    "chocolate", "cheese", "bread", "butter", "honey", "pancake", "waffle",
    "house", "school", "college", "hospital", "library", "museum", "zoo",
    "park", "stadium", "airport", "restaurant",
    "cat", "dog", "lion", "tiger", "elephant", "giraffe", "zebra", "horse",
    "cow", "sheep", "goat", "pig", "monkey", "bear", "panda", "kangaroo",
    "koala", "rabbit", "hamster",
    "road", "bus", "train", "car", "market", "shop", "money", "phone", "message", "music", "movie", "book", "news", "weather", "health",
    "fox", "wolf", "deer", "camel",
    "car", "bus", "truck", "van", "motorcycle", "bicycle", "scooter",
    "train", "airplane", "helicopter",
    "chair", "table", "bed", "sofa", "lamp", "mirror", "clock", "watch",
    "phone", "computer", "keyboard", "mouse", "monitor", "television",
    "camera", "headphones", "speaker", "microphone", "printer",
    "tennis", "baseball", "hockey",
    "golf", "badminton", "volleyball", "boxing", "chess", "cards", "dice",
    "book", "notebook", "pen", "pencil", "eraser", "marker", "backpack",
    "wallet", "key", "lock", "door", "window", "ladder", "hammer", "drill",
    "rocket", "spaceship", "dragon", "wizard", "witch", "knight", "castle", "princess", "prince",
    "king", "queen", "crown",
    "boat", "ship", "submarine", "canoe", "yacht",
    "sword", "shield", "armor", "treasure",
    "unicorn", "phoenix", "giant", "goblin", "elf",
    "football", "basketball", "cricket",
    "robot", "alien", "astronaut", "satellite", "telescope", "microscope",
    "compass", "map", "globe", "flag", "trophy",
    "home", "family", "friend", "work", "travel", "exercise", "walk", "run", "rest", "clean", "cook", "wash", "clothes", "shoes", "bag", "watch", "clock", "calendar", "holiday"
];


const getRandomWords = (() => {
    let recent = new Set();
    const MAX_RECENT = 50;


    return (count = 3) => {
        // safety: never ask for more than available
        count = Math.min(count, WORD_BANK.length);


        const selected = new Set();
        const maxAttempts = WORD_BANK.length * 2;
        let attempts = 0;


        while (selected.size < count && attempts < maxAttempts) {
            const word =
                WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];


            if (!recent.has(word) && !selected.has(word)) {
                selected.add(word);
            }


            attempts++;
        }


        // guaranteed fallback
        if (selected.size < count) {
            for (const word of WORD_BANK) {
                if (!selected.has(word)) {
                    selected.add(word);
                    if (selected.size === count) break;
                }
            }
        }


        // update recent cache
        selected.forEach(w => recent.add(w));


        if (recent.size > MAX_RECENT) {
            recent = new Set([...recent].slice(-MAX_RECENT));
        }


        return [...selected];
    };
})();


module.exports = { getRandomWords };