/**
 * COSMIC GATE RUNNER - questions.js
 * 
 * Curated multi-category question bank for high-speed quiz barrier gates.
 * Provides rich categories: Space/Cosmic, Science, Math, Technology, and World Trivia.
 * Includes helper methods to generate randomized 3-lane gate challenges with
 * 1 verified correct answer and 2 plausible distractors.
 */

const QUESTION_BANK = [
    // --- Space & Astronomy ---
    {
        id: 1,
        category: "Astronomy",
        question: "Which planet is known as the Red Planet?",
        correct: "Mars",
        distractors: ["Jupiter", "Venus"]
    },
    {
        id: 2,
        category: "Astronomy",
        question: "What is the closest star to Earth?",
        correct: "The Sun",
        distractors: ["Proxima Centauri", "Sirius"]
    },
    {
        id: 3,
        category: "Astronomy",
        question: "Which planet has the most prominent ring system?",
        correct: "Saturn",
        distractors: ["Neptune", "Uranus"]
    },
    {
        id: 4,
        category: "Astronomy",
        question: "What galaxy is home to our solar system?",
        correct: "Milky Way",
        distractors: ["Andromeda", "Triangulum"]
    },
    {
        id: 5,
        category: "Astronomy",
        question: "What celestial object has gravitational pull so strong light cannot escape?",
        correct: "Black Hole",
        distractors: ["Pulsar", "Neutron Star"]
    },
    {
        id: 6,
        category: "Astronomy",
        question: "How many moons does planet Earth have?",
        correct: "1",
        distractors: ["2", "0"]
    },
    {
        id: 7,
        category: "Astronomy",
        question: "What is the hottest planet in our solar system?",
        correct: "Venus",
        distractors: ["Mercury", "Mars"]
    },
    {
        id: 8,
        category: "Astronomy",
        question: "Which planet is the largest in our solar system?",
        correct: "Jupiter",
        distractors: ["Saturn", "Neptune"]
    },

    // --- Mathematics ---
    {
        id: 9,
        category: "Math",
        question: "What is 15 × 6?",
        correct: "90",
        distractors: ["85", "95"]
    },
    {
        id: 10,
        category: "Math",
        question: "What is the square root of 144?",
        correct: "12",
        distractors: ["14", "11"]
    },
    {
        id: 11,
        category: "Math",
        question: "What is 7 cubed (7³)?",
        correct: "343",
        distractors: ["243", "357"]
    },
    {
        id: 12,
        category: "Math",
        question: "What is the next prime number after 13?",
        correct: "17",
        distractors: ["15", "19"]
    },
    {
        id: 13,
        category: "Math",
        question: "What is 25% of 240?",
        correct: "60",
        distractors: ["50", "70"]
    },
    {
        id: 14,
        category: "Math",
        question: "How many degrees are in a full circle?",
        correct: "360°",
        distractors: ["180°", "270°"]
    },
    {
        id: 15,
        category: "Math",
        question: "What is 2 to the power of 8 (2⁸)?",
        correct: "256",
        distractors: ["128", "512"]
    },
    {
        id: 16,
        category: "Math",
        question: "What is 99 + 145?",
        correct: "244",
        distractors: ["234", "254"]
    },

    // --- Science & Physics ---
    {
        id: 17,
        category: "Science",
        question: "What chemical element has the symbol 'O'?",
        correct: "Oxygen",
        distractors: ["Osmium", "Gold"]
    },
    {
        id: 18,
        category: "Science",
        question: "What is the speed of light in vacuum approximately?",
        correct: "300,000 km/s",
        distractors: ["150,000 km/s", "500,000 km/s"]
    },
    {
        id: 19,
        category: "Science",
        question: "What state of matter has neither definite shape nor volume?",
        correct: "Gas",
        distractors: ["Liquid", "Solid"]
    },
    {
        id: 20,
        category: "Science",
        question: "What is the chemical formula for pure water?",
        correct: "H₂O",
        distractors: ["CO₂", "NaCl"]
    },
    {
        id: 21,
        category: "Science",
        question: "Which subatomic particle has a positive electric charge?",
        correct: "Proton",
        distractors: ["Electron", "Neutron"]
    },
    {
        id: 22,
        category: "Science",
        question: "What force pulls objects toward the center of the Earth?",
        correct: "Gravity",
        distractors: ["Magnetism", "Friction"]
    },
    {
        id: 23,
        category: "Science",
        question: "What is the most abundant gas in Earth's atmosphere?",
        correct: "Nitrogen",
        distractors: ["Oxygen", "Carbon Dioxide"]
    },
    {
        id: 24,
        category: "Science",
        question: "What organ in the human body pumps blood?",
        correct: "Heart",
        distractors: ["Lungs", "Brain"]
    },

    // --- Technology & Computing ---
    {
        id: 25,
        category: "Technology",
        question: "How many bits are in a single byte?",
        correct: "8",
        distractors: ["4", "16"]
    },
    {
        id: 26,
        category: "Technology",
        question: "What does 'CPU' stand for in computing?",
        correct: "Central Processing Unit",
        distractors: ["Core Power Utility", "Computer Program Unit"]
    },
    {
        id: 27,
        category: "Technology",
        question: "What is the binary representation of decimal 5?",
        correct: "101",
        distractors: ["110", "011"]
    },
    {
        id: 28,
        category: "Technology",
        question: "What protocol secures web traffic with encryption?",
        correct: "HTTPS",
        distractors: ["FTP", "HTTP"]
    },
    {
        id: 29,
        category: "Technology",
        question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
        correct: "Stack",
        distractors: ["Queue", "Array"]
    },
    {
        id: 30,
        category: "Technology",
        question: "What programming language powers native web interactivity?",
        correct: "JavaScript",
        distractors: ["Python", "C++"]
    },

    // --- General Trivia & Nature ---
    {
        id: 31,
        category: "Nature",
        question: "What is the hardest natural mineral on Earth?",
        correct: "Diamond",
        distractors: ["Quartz", "Granite"]
    },
    {
        id: 32,
        category: "Geography",
        question: "What is the largest ocean on Earth?",
        correct: "Pacific Ocean",
        distractors: ["Atlantic Ocean", "Indian Ocean"]
    },
    {
        id: 33,
        category: "Nature",
        question: "What gas do plants absorb during photosynthesis?",
        correct: "Carbon Dioxide",
        distractors: ["Nitrogen", "Hydrogen"]
    },
    {
        id: 34,
        category: "Trivia",
        question: "How many seconds are in one hour?",
        correct: "3,600",
        distractors: ["1,800", "6,000"]
    },
    {
        id: 35,
        category: "Trivia",
        question: "What is the Roman numeral for 100?",
        correct: "C",
        distractors: ["L", "M"]
    },
    {
        id: 36,
        category: "Nature",
        question: "What is molten rock called before it reaches Earth's surface?",
        correct: "Magma",
        distractors: ["Lava", "Basalt"]
    }
];

/**
 * Generates a randomized 3-lane Gate Quiz challenge.
 * Assigns one lane (0, 1, or 2) to the correct answer, and the remaining lanes
 * to the two distractors.
 * 
 * @param {number} questionIndex Optional index to pick, otherwise chooses randomly
 * @returns {Object} Gate challenge definition
 */
function generateGateQuiz(questionIndex = null) {
    let q;
    if (questionIndex !== null && questionIndex >= 0 && questionIndex < QUESTION_BANK.length) {
        q = QUESTION_BANK[questionIndex];
    } else {
        const randIdx = Math.floor(Math.random() * QUESTION_BANK.length);
        q = QUESTION_BANK[randIdx];
    }

    // Pick random lane (0: Left, 1: Center, 2: Right) for correct answer
    const correctLane = Math.floor(Math.random() * 3);
    const lanes = [0, 1, 2];
    const distractorLanes = lanes.filter(l => l !== correctLane);

    // Shuffle distractors
    const shuffledDistractors = Math.random() < 0.5 
        ? [q.distractors[0], q.distractors[1]] 
        : [q.distractors[1], q.distractors[0]];

    const options = [null, null, null];
    options[correctLane] = {
        lane: correctLane,
        text: q.correct,
        isCorrect: true
    };
    options[distractorLanes[0]] = {
        lane: distractorLanes[0],
        text: shuffledDistractors[0],
        isCorrect: false
    };
    options[distractorLanes[1]] = {
        lane: distractorLanes[1],
        text: shuffledDistractors[1],
        isCorrect: false
    };

    return {
        id: q.id,
        category: q.category,
        question: q.question,
        correctLane: correctLane,
        options: options,
        resolved: false
    };
}

// Module export for Node.js test environment & window exposure for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QUESTION_BANK,
        generateGateQuiz
    };
}

if (typeof window !== 'undefined') {
    window.QUESTION_BANK = QUESTION_BANK;
    window.generateGateQuiz = generateGateQuiz;
}
