const EASY_WORD_BANK = [
    "cat", "dog", "cow", "pig", "hen", "fox", "bat", "rat", "ant", "box", "bag", "hat", "cap", "map", "key",
    "bed", "fan", "net", "pan", "oil", "gas", "eye", "ear", "lip", "nose", "chin", "fire", "ash", "rain",
    "fog", "dew", "snow", "hill", "hut", "web", "rope", "pin", "ball", "house", "table", "chair", "plant",
    "grass", "water", "bread", "sugar", "honey", "pizza", "mango", "apple", "grape", "lemon", "onion",
    "carrot", "chili", "tiger", "horse", "zebra", "sheep", "mouse", "snake", "panda", "koala", "whale",
    "shark", "train", "truck", "plane", "cycle", "beach", "river", "cloud", "storm", "flame", "smoke",
    "light", "smile", "laugh", "sleep", "dream", "brush", "paint", "color", "paper", "pencil", "eraser",
    "scale", "clock", "watch", "radio", "phone", "broom", "glass", "shirt", "pants", "shoes", "socks",
    "glove", "scarf", "crown", "sword", "shield", "magic", "robot", "alien", "fairy", "ghost", "witch",
    "pirate", "ninja", "knight", "angel", "devil", "arrow", "tower", "bridge", "camel", "eagle", "fruit",
    "banana", "orange", "watermelon", "burger", "cake", "donut", "candy", "chocolate", "cookie", "milk",
    "juice", "tea", "coffee", "egg", "rice", "noodles", "fries", "sandwich", "hotdog", "popcorn", "goat",
    "duck", "bird", "fish", "frog", "lion", "bear", "elephant", "monkey", "rabbit", "turtle", "giraffe",
    "dolphin", "octopus", "crab", "snail", "butterfly", "bee", "spider", "door", "window", "pillow",
    "lamp", "TV", "book", "pen", "bottle", "cup", "plate", "spoon", "fork", "knife", "lock", "mirror",
    "gift", "sun", "moon", "star", "rainbow", "tree", "flower", "leaf", "mountain", "lake", "ocean",
    "island", "volcano", "cave", "forest", "desert", "man", "woman", "boy", "girl", "baby", "family",
    "cry", "eat", "drink", "run", "walk", "jump", "dance", "sing", "read", "write", "clap", "wave", "kite",
    "toy", "doll", "monster", "wizard", "superhero", "treasure", "flag", "page", "shoe", "sock", "belt",
    "coat", "ring", "desk", "soup", "salt", "pear", "plum", "road", "path", "sand", "wind", "wall", "roof",
    "bell", "horn", "drum", "mask", "card", "coin", "soap", "comb", "boot", "mug", "bowl", "boat", "ship",
    "cart", "bike", "wheel", "rock", "seed", "soil", "nest", "wing", "tail", "fur", "claw", "beak", "horn",
    "bone", "skull", "face", "head", "hair", "hand", "foot", "circle", "square", "triangle", "heart", "line", "dot", "oval", "cube", "starfish", "snowman", "umbrella", "ladder", "stairs", "roadblock", "trafficlight", "mailbox",
    "envelope", "stamp", "postcard", "calendar", "notebook", "chalk", "blackboard", "whiteboard",
    "marker", "crayon", "paintbrush", "palette", "canvas", "easel", "glue", "tape", "scissors", "ruler",
    "compass", "calculator", "keyboard", "mousepad", "monitor", "laptop", "printer", "scanner", "camera",
    "battery", "charger", "socket", "switch", "bulb", "candle", "matchstick", "lighter",
    "toothbrush", "toothpaste", "comb", "mirrorstand", "soapbar", "towel", "bucket", "mop",
    "dustbin", "vacuum", "broomstick", "doormat", "keychain", "locksmith", "hanger", "closet", "drawer", "shelf", "cabinet", "wardrobe", "curtain", "blinds", "mat", "carpet", "helmet", "tie", "beltbuckle", "wallet", "purse", "backpack", "suitcase", "ticket", "passport", "mapbook", "signboard", "direction", "arrowmark", "stopwatch", "whistle", "medal", "trophy", "badge", "ribbon", "flagpole", "banner", "balloon", "sunflower", "rosebud", "cactus", "bush", "vine", "appletree", "coconut", "corn", "wheat", "ricebowl", "cupcake", "icecream", "lollipop", "pancake", "waffle", "tooth", "smiley",
    "sadface", "wink", "thumb", "fist", "peace", "clothesline", "windowpane", "doorknob",
    "stairsign", "speedbump", "crosswalk", "fence", "gate", "bench", "slide", "swing", "seesaw",
    "sandbox", "tent", "campfire", "torch", "lantern", "flashlight", "remote", "joystick",
    "gamepad", "dice", "puzzle", "topspin", "hula", "skate", "snowflake"
];

const MEDIUM_WORD_BANK = [
    "elephant", "giraffe", "dolphin", "penguin", "octopus", "jellyfish", "seahorse",
    "starfish", "lobster", "kangaroo", "koala", "panda", "raccoon", "squirrel",
    "chipmunk", "hedgehog", "porcupine", "armadillo", "platypus", "walrus", "seal",
    "otter", "beaver", "badger", "weasel", "meerkat", "lemur", "sloth", "anteater",
    "flamingo", "peacock", "toucan", "pelican", "hummingbird", "woodpecker", "ostrich",
    "vulture", "albatross", "crane", "stork", "swan", "heron", "kingfisher", "robin",
    "sparrow", "crow", "raven", "magpie", "bluejay", "cardinal", "finch", "canary",
    "salamander", "newt", "chameleon", "iguana", "gecko", "cobra", "python", "rattlesnake",
    "alligator", "crocodile", "tortoise", "tarantula", "scorpion", "centipede", "dragonfly",
    "grasshopper", "ladybug", "firefly", "mosquito", "caterpillar", "mantis", "beetle",
    "anchor", "compass", "telescope", "microscope", "binoculars", "thermometer",
    "hourglass", "stopwatch", "metronome", "barometer", "kaleidoscope", "periscope",
    "parachute", "submarine", "helicopter", "sailboat", "speedboat", "hovercraft",
    "ambulance", "firetruck", "bulldozer", "excavator", "tractor", "carousel",
    "ferris wheel", "rollercoaster", "trampoline", "seesaw", "skateboard", "scooter",
    "unicycle", "tricycle", "wheelchair", "stroller", "sleigh", "toboggan",
    "harmonica", "accordion", "saxophone", "trombone", "clarinet", "flute",
    "xylophone", "tambourine", "maracas", "bongos", "cymbals", "gong",
    "backpack", "briefcase", "suitcase", "lunchbox", "toolbox", "mailbox",
    "birdcage", "aquarium", "terrarium", "greenhouse", "doghouse", "treehouse",
    "lighthouse", "windmill", "pyramid", "igloo", "teepee", "pagoda",
    "fountain", "statue", "monument", "obelisk", "archway", "gazebo",
    "scarecrow", "snowman", "sandcastle", "campfire", "bonfire", "barbecue",
    "hammock", "canopy", "awning", "pergola", "trellis", "birdbath",
    "sunflower", "dandelion", "tulip", "daffodil", "orchid", "carnation",
    "hibiscus", "chrysanthemum", "peony", "magnolia", "lavender", "jasmine",
    "cactus", "bamboo", "fern", "moss", "ivy", "clover",
    "pineapple", "coconut", "avocado", "papaya", "mango", "kiwi",
    "pomegranate", "blueberry", "raspberry", "blackberry", "cranberry", "gooseberry",
    "peach", "plum", "apricot", "nectarine", "tangerine", "grapefruit",
    "asparagus", "broccoli", "cauliflower", "cabbage", "lettuce", "spinach",
    "celery", "radish", "turnip", "beet", "eggplant", "zucchini",
    "pumpkin", "squash", "cucumber", "pickle", "onion", "garlic",
    "mushroom", "tomato", "pepper", "chili", "jalapeño", "cornstalk",
    "pretzel", "croissant", "bagel", "muffin", "donut", "cupcake",
    "brownie", "cookie", "macaron", "eclair", "strudel", "tart",
    "cheesecake", "pudding", "sundae", "milkshake", "smoothie", "lemonade",
    "spaghetti", "lasagna", "ravioli", "tortilla", "burrito", "taco",
    "sushi", "dumpling", "wonton", "noodles", "ramen", "tempura",
    "kettle", "teapot", "coffeepot", "blender", "toaster", "mixer",
    "whisk", "spatula", "ladle", "colander", "grater", "peeler",
    "rolling pin", "cutting board", "apron", "oven mitt", "napkin", "placemat",
    "chandelier", "sconce", "lantern", "candelabra", "flashlight", "spotlight",
    "bookshelf", "cabinet", "wardrobe", "dresser", "nightstand", "ottoman",
    "rocking chair", "armchair", "loveseat", "futon", "hammock", "beanbag",
    "curtain", "blinds", "tapestry", "portrait", "landscape", "mural",
    "vase", "pitcher", "goblet", "chalice", "trophy", "medal",
    "crown", "tiara", "scepter", "throne", "sword", "shield",
    "helmet", "armor", "cannon", "catapult", "crossbow", "spear",
    "wizard", "witch", "knight", "princess", "dragon", "unicorn",
    "mermaid", "centaur", "phoenix", "griffin", "sphinx", "minotaur",
    "goblin", "troll", "ogre", "cyclops", "yeti", "bigfoot",
    "vampire", "werewolf", "zombie", "ghost", "skeleton", "mummy",
    "alien", "robot", "cyborg", "astronaut", "spaceship", "satellite",
    "rocket", "asteroid", "comet", "meteor", "nebula", "blackhole",
    "volcano", "earthquake", "tsunami", "avalanche", "blizzard", "tornado",
    "hurricane", "thunderstorm", "lightning", "rainbow", "sunrise", "sunset",
    "eclipse", "aurora", "constellation", "milkyway", "galaxy", "universe",
    "waterfall", "geyser", "hotspring", "glacier", "iceberg", "tundra",
    "desert", "oasis", "canyon", "valley", "plateau", "meadow",
    "prairie", "savanna", "rainforest", "jungle", "swamp", "bayou",
    "reef", "lagoon", "archipelago", "peninsula", "isthmus", "fjord",
    "summit", "peak", "cliff", "crater", "cavern", "stalactite",
    "stalagmite", "fossil", "amber", "crystal", "gemstone", "diamond",
    "ruby", "emerald", "sapphire", "topaz", "pearl", "coral",
    "treasure", "chest", "lockbox", "vault", "safe", "padlock",
    "keyhole", "doorknob", "handle", "hinge", "bolt", "latch",
    "zipper", "button", "buckle", "clasp", "brooch", "pendant",
    "necklace", "bracelet", "earring", "anklet", "tiara", "hairpin",
    "comb", "brush", "mirror", "lipstick", "perfume", "cologne",
    "shampoo", "conditioner", "lotion", "towel", "bathrobe", "slippers",
    "sneakers", "sandals", "boots", "heels", "flipflops", "moccasins",
    "baseball", "basketball", "football", "volleyball", "tennis", "badminton",
    "ping pong", "hockey", "cricket", "golf", "bowling", "archery",
    "dartboard", "billiards", "foosball", "pinball", "chessboard", "checkers",
    "dominoes", "puzzle", "rubik's cube", "yoyo", "frisbee", "boomerang",
    "kite", "balloon", "bubble", "pinwheel", "ribbon", "confetti",
    "fireworks", "sparkler", "torch", "beacon", "flare", "signal",
    "flag", "banner", "pennant", "streamer", "garland", "wreath",
    "bouquet", "corsage", "centerpiece", "ornament", "decoration", "trinket",
    "souvenir", "memento", "heirloom", "antique", "artifact", "relic",
    "scroll", "manuscript", "parchment", "document", "certificate", "diploma",
    "passport", "ticket", "receipt", "invoice", "blueprint", "diagram",
    "chart", "graph", "map", "atlas", "globe", "compass",
    "ruler", "protractor", "calculator", "abacus", "typewriter", "printer",
    "scanner", "photocopier", "projector", "screen", "whiteboard", "chalkboard",
    "easel", "canvas", "palette", "paintbrush", "crayon", "marker",
    "pencil", "eraser", "sharpener", "stapler", "paperclip", "binder",
    "folder", "envelope", "postcard", "stamp", "package", "parcel",
    "wagon", "cart", "wheelbarrow", "dolly", "conveyor", "pulley",
    "lever", "gear", "spring", "hinge", "screw", "bolt",
    "wrench", "pliers", "screwdriver", "hammer", "mallet", "chisel",
    "saw", "drill", "axe", "pickaxe", "shovel", "rake",
    "hoe", "pitchfork", "scythe", "sickle", "trowel", "pruner",
    "lawnmower", "sprinkler", "hose", "watering can", "bucket", "barrel"
];

const HARD_WORD_BANK = [
    "telescope", "volcano", "penguin", "scissors", "umbrella", "accordion", "pyramid",
    "lighthouse", "octopus", "windmill", "mushroom", "saxophone", "flamingo", "helicopter",
    "microscope", "cactus", "kangaroo", "trumpet", "chandelier", "peacock", "submarine",
    "crocodile", "unicorn", "bulldozer", "dragonfly", "skeleton", "parachute", "astronaut",
    "wheelbarrow", "rhinoceros", "thermometer", "caterpillar", "boomerang", "scarecrow",
    "fountain", "centipede", "trampoline", "chameleon", "saxophone", "speedometer", "avalanche",
    "binoculars", "porcupine", "metronome", "scorpion", "cauldron", "hippopotamus", "gargoyle",
    "harmonica", "grasshopper", "trombone", "periscope", "stalactite", "grenade", "piranha",
    "igloo", "machete", "guillotine", "glacier", "satellite", "platypus", "harmonica",
    "tricycle", "barracuda", "stalagmite", "anchor", "propeller", "sphinx", "compass",
    "carousel", "lobster", "gondola", "pelican", "ambulance", "jackhammer", "banjo",
    "pendulum", "hammerhead", "hammock", "tuxedo", "fireplace", "sombrero", "scythe",
    "toucan", "javelin", "tambourine", "pterodactyl", "easel", "tornado", "chisel",
    "stethoscope", "pickaxe", "centaur", "briefcase", "dandelion", "mandolin", "walrus",
    "anvil", "harmonica", "rattlesnake", "hourglass", "archway", "harpoon", "gargoyle",
    "trident", "gazelle", "catapult", "barometer", "medallion", "obelisk", "fortress",
    "galleon", "pavilion", "cannon", "corset", "kaleidoscope", "goblet", "falcon",
    "gauntlet", "armadillo", "narwhal", "blimp", "bayonet", "tapestry", "chalice",
    "drawbridge", "scepter", "incense", "scimitar", "shackles", "spyglass", "gladiator",
    "portcullis", "lantern", "dungeons", "tabernacle", "parapet", "turret", "mace",
    "halberd", "trebuchet", "basilisk", "garland", "colosseum", "aqueduct", "citadel",
    "brazier", "belfry", "sarcophagus", "hieroglyph", "oasis", "pagoda", "minaret",
    "ziggurat", "totem", "fjord", "geyser", "tundra", "cavern", "stalagmite",
    "constellation", "eclipse", "meteor", "asteroid", "nebula", "comet", "quasar",
    "blacksmith", "cobblestone", "vineyard", "orchard", "meadow", "waterfall", "rapids",
    "estuary", "delta", "lagoon", "archipelago", "peninsula", "canyon", "plateau",
    "mesa", "butte", "gully", "ravine", "crevasse", "precipice", "quarry",
    "reservoir", "aqueduct", "cistern", "moat", "rampart", "bulwark", "stockade",
    "palisade", "watchtower", "bastion", "barbican", "porthole", "gangplank", "rigging",
    "masthead", "bowsprit", "figurehead", "anchor", "rudder", "propeller", "periscope",
    "torpedo", "barnacle", "starfish", "anemone", "coral", "seaweed", "kelp",
    "plankton", "jellyfish", "seahorse", "manta", "barracuda", "swordfish", "marlin",
    "tuna", "sailfish", "hammerhead", "stingray", "moray", "angelfish", "clownfish",
    "pufferfish", "lionfish", "grouper", "snapper", "mackerel", "anchovy", "sardine",
    "herring", "salmon", "trout", "pike", "bass", "catfish", "sturgeon",
    "eel", "lamprey", "hagfish", "coelacanth", "nautilus", "chambered", "tentacle",
    "sucker", "beak", "mandible", "thorax", "abdomen", "antennae", "proboscis",
    "compound", "exoskeleton", "chrysalis", "cocoon", "metamorphosis", "larva", "pupa",
    "nymph", "instar", "molting", "carapace", "chitin", "venom", "fang",
    "talon", "claw", "hoof", "antler", "tusk", "horn", "mane",
    "whisker", "snout", "muzzle", "beak", "plumage", "feather", "wingspan",
    "tailfeather", "crest", "wattle", "spur", "webbed", "flipper", "dorsal",
    "ventral", "lateral", "pectoral", "caudal", "gills", "scales", "membrane",
    "cartilage", "vertebrae", "skeleton", "ribcage", "sternum", "pelvis", "femur",
    "tibia", "fibula", "humerus", "radius", "ulna", "scapula", "clavicle",
    "cranium", "mandible", "vertebra", "phalanges", "metacarpal", "metatarsal", "patella",
    "calcaneus", "tarsals", "carpals", "coccyx", "sacrum", "lumbar", "thoracic",
    "cervical", "atlas", "axis", "spinous", "transverse", "foramen", "suture",
    "fontanel", "temporal", "parietal", "frontal", "occipital", "sphenoid", "ethmoid",
    "maxilla", "zygomatic", "nasal", "lacrimal", "palatine", "vomer", "turbinate",
    "sinus", "cavity", "canal", "meatus", "fossa", "condyle", "tubercle",
    "tuberosity", "trochanter", "epicondyle", "styloid", "coronoid", "olecranon", "malleolus",
    "trochlea", "capitulum", "glenoid", "acetabulum", "obturator", "ischium", "pubis",
    "ilium", "innominate", "auricular", "articular", "synovial", "cartilaginous", "fibrous",
    "ligament", "tendon", "fascia", "aponeurosis", "retinaculum", "bursa", "meniscus",
    "labrum", "capsule", "membrane", "periosteum", "endosteum", "marrow", "trabeculae",
    "osteon", "lamella", "canaliculi", "lacuna", "osteocyte", "osteoblast", "osteoclast",
    "chondrocyte", "collagen", "elastin", "proteoglycan", "glycoprotein", "hydroxyapatite", "calcium",
    "phosphate", "magnesium", "fluoride", "carbonate", "citrate", "bicarbonate", "chloride",
    "sulfate", "nitrate", "phosphorus", "potassium", "sodium", "zinc", "copper",
    "manganese", "selenium", "chromium", "molybdenum", "cobalt", "iodine", "fluorine",
    "boron", "silicon", "vanadium", "nickel", "arsenic", "lithium", "rubidium"
];

const WORD_BANKS = {
    easy: EASY_WORD_BANK,
    medium: MEDIUM_WORD_BANK,
    hard: HARD_WORD_BANK
};

// Create separate recent sets for each difficulty
const recentCache = {
    easy: new Set(),
    medium: new Set(),
    hard: new Set()
};

const MAX_RECENT = 50;

const getRandomWords = (difficulty = 'easy', count = 3) => {
    // Validate difficulty
    const validDifficulty = WORD_BANKS[difficulty] ? difficulty : 'easy';
    const wordBank = WORD_BANKS[validDifficulty];
    const recent = recentCache[validDifficulty];

    // Safety: never ask for more than available
    const safeCount = Math.min(count, wordBank.length);

    // Calculate available words (not in recent)
    const availableWords = wordBank.filter(word => !recent.has(word));

    let selected;

    if (availableWords.length >= safeCount) {
        // We have enough non-recent words, select randomly from them
        selected = [];
        const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
        selected = shuffled.slice(0, safeCount);
    } else {
        // Not enough non-recent words, combine available + some recent
        selected = [...availableWords];
        const remainingCount = safeCount - selected.length;

        // Get additional words from the full bank
        const additionalWords = wordBank
            .filter(word => !selected.includes(word))
            .sort(() => Math.random() - 0.5)
            .slice(0, remainingCount);

        selected.push(...additionalWords);
    }

    // Update recent cache
    selected.forEach(word => recent.add(word));

    // Trim recent cache if it exceeds MAX_RECENT
    if (recent.size > MAX_RECENT) {
        const recentArray = [...recent];
        const toKeep = recentArray.slice(-MAX_RECENT);
        recentCache[validDifficulty] = new Set(toKeep);
    }

    return selected;
};

module.exports = { getRandomWords };