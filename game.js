/**
 * RETRO NITRO RACING - game.js
 * 
 * A fully functional, responsive 2D procedural car racing web game.
 * Designed for full platform compliance, high performance, and fast starts.
 * Features Web Audio API synthesis, a 10-stage progression system, and 
 * responsive canvas letterboxing coordinate systems.
 */

// Global Game Configuration
const DESIGN_WIDTH = 600;
const DESIGN_HEIGHT = 800;

// 10-Level Structured Progression System (monotonically scaling difficulty)
const levels = [
    { level: 1, targetScore: 300, maxSpeed: 8, spawnInterval: 2200, obstacleDensity: 0.15, name: "Astral Runway" },
    { level: 2, targetScore: 700, maxSpeed: 9, spawnInterval: 1900, obstacleDensity: 0.22, name: "Molten Magma" },
    { level: 3, targetScore: 1200, maxSpeed: 10, spawnInterval: 1600, obstacleDensity: 0.30, name: "Bio-Mechanical Clockwork" },
    { level: 4, targetScore: 1800, maxSpeed: 11, spawnInterval: 1400, obstacleDensity: 0.35, name: "Synthwave Dream" },
    { level: 5, targetScore: 2500, maxSpeed: 12, spawnInterval: 1200, obstacleDensity: 0.40, name: "Solar Flare" },
    { level: 6, targetScore: 3300, maxSpeed: 13, spawnInterval: 1100, obstacleDensity: 0.45, name: "Cryo Void" },
    { level: 7, targetScore: 4200, maxSpeed: 14, spawnInterval: 1000, obstacleDensity: 0.50, name: "Toxic Nebula" },
    { level: 8, targetScore: 5200, maxSpeed: 15, spawnInterval: 900, obstacleDensity: 0.55, name: "Hyperdrive Warp" },
    { level: 9, targetScore: 6300, maxSpeed: 16, spawnInterval: 800, obstacleDensity: 0.60, name: "Event Horizon" },
    { level: 10, targetScore: 7500, maxSpeed: 17, spawnInterval: 700, obstacleDensity: 0.65, name: "Cosmic Championship" }
];

// 10 Distinct Procedural Sector Themes
const sectorThemes = [
    {
        name: "Astral Runway",
        leftRail: '#00f0ff',
        rightRail: '#ff5500',
        divider: 'rgba(0, 240, 255, 0.75)',
        spaceGrad: ['#160830', '#0a0418', '#04020a'],
        nebulaeColors: [
            { c1: 'rgba(255, 0, 127, 0.22)', c2: 'rgba(157, 0, 255, 0.15)' },
            { c1: 'rgba(0, 240, 255, 0.20)', c2: 'rgba(157, 0, 255, 0.16)' }
        ],
        crystalColor: '#00f0ff',
        filterHue: 0,
        hudAccent: '#00f0ff'
    },
    {
        name: "Molten Magma",
        leftRail: '#ff3300',
        rightRail: '#ffaa00',
        divider: 'rgba(255, 100, 0, 0.75)',
        spaceGrad: ['#2e0c05', '#170602', '#080201'],
        nebulaeColors: [
            { c1: 'rgba(255, 68, 0, 0.28)', c2: 'rgba(255, 170, 0, 0.18)' },
            { c1: 'rgba(200, 20, 0, 0.25)', c2: 'rgba(255, 80, 0, 0.15)' }
        ],
        crystalColor: '#ff5500',
        filterHue: 35,
        hudAccent: '#ff5500'
    },
    {
        name: "Bio-Mechanical Clockwork",
        leftRail: '#00ff88',
        rightRail: '#00e5ff',
        divider: 'rgba(0, 255, 136, 0.75)',
        spaceGrad: ['#042018', '#02120e', '#010806'],
        nebulaeColors: [
            { c1: 'rgba(0, 255, 136, 0.25)', c2: 'rgba(0, 229, 255, 0.15)' },
            { c1: 'rgba(30, 200, 120, 0.20)', c2: 'rgba(0, 180, 200, 0.15)' }
        ],
        crystalColor: '#00ffaa',
        filterHue: 120,
        hudAccent: '#00ffaa'
    },
    {
        name: "Synthwave Dream",
        leftRail: '#ff00a0',
        rightRail: '#00f0ff',
        divider: 'rgba(255, 0, 160, 0.75)',
        spaceGrad: ['#24052e', '#130219', '#08010d'],
        nebulaeColors: [
            { c1: 'rgba(255, 0, 160, 0.26)', c2: 'rgba(128, 0, 255, 0.18)' },
            { c1: 'rgba(0, 240, 255, 0.22)', c2: 'rgba(255, 0, 128, 0.15)' }
        ],
        crystalColor: '#ff00a0',
        filterHue: 290,
        hudAccent: '#ff00a0'
    },
    {
        name: "Solar Flare",
        leftRail: '#ffcc00',
        rightRail: '#ff3700',
        divider: 'rgba(255, 204, 0, 0.8)',
        spaceGrad: ['#301b00', '#1c1000', '#0a0500'],
        nebulaeColors: [
            { c1: 'rgba(255, 200, 0, 0.28)', c2: 'rgba(255, 80, 0, 0.20)' },
            { c1: 'rgba(255, 140, 0, 0.22)', c2: 'rgba(255, 50, 0, 0.16)' }
        ],
        crystalColor: '#ffd700',
        filterHue: 45,
        hudAccent: '#ffaa00'
    },
    {
        name: "Cryo Void",
        leftRail: '#70d6ff',
        rightRail: '#b388ff',
        divider: 'rgba(112, 214, 255, 0.75)',
        spaceGrad: ['#041528', '#020b17', '#01050d'],
        nebulaeColors: [
            { c1: 'rgba(112, 214, 255, 0.24)', c2: 'rgba(179, 136, 255, 0.16)' },
            { c1: 'rgba(200, 240, 255, 0.20)', c2: 'rgba(112, 214, 255, 0.15)' }
        ],
        crystalColor: '#70d6ff',
        filterHue: 200,
        hudAccent: '#70d6ff'
    },
    {
        name: "Toxic Nebula",
        leftRail: '#39ff14',
        rightRail: '#ccff00',
        divider: 'rgba(57, 255, 20, 0.75)',
        spaceGrad: ['#0d2403', '#061301', '#020800'],
        nebulaeColors: [
            { c1: 'rgba(57, 255, 20, 0.25)', c2: 'rgba(204, 255, 0, 0.18)' },
            { c1: 'rgba(30, 200, 50, 0.20)', c2: 'rgba(80, 255, 0, 0.14)' }
        ],
        crystalColor: '#39ff14',
        filterHue: 90,
        hudAccent: '#39ff14'
    },
    {
        name: "Hyperdrive Warp",
        leftRail: '#00ffff',
        rightRail: '#ffffff',
        divider: 'rgba(255, 255, 255, 0.85)',
        spaceGrad: ['#021833', '#010e1f', '#00060d'],
        nebulaeColors: [
            { c1: 'rgba(0, 255, 255, 0.30)', c2: 'rgba(100, 200, 255, 0.20)' },
            { c1: 'rgba(255, 255, 255, 0.22)', c2: 'rgba(0, 200, 255, 0.16)' }
        ],
        crystalColor: '#00ffff',
        filterHue: 180,
        hudAccent: '#00ffff'
    },
    {
        name: "Event Horizon",
        leftRail: '#9d00ff',
        rightRail: '#ff0055',
        divider: 'rgba(157, 0, 255, 0.8)',
        spaceGrad: ['#1c002b', '#0e0017', '#05000a'],
        nebulaeColors: [
            { c1: 'rgba(157, 0, 255, 0.30)', c2: 'rgba(255, 0, 85, 0.20)' },
            { c1: 'rgba(90, 0, 180, 0.25)', c2: 'rgba(200, 0, 120, 0.15)' }
        ],
        crystalColor: '#9d00ff',
        filterHue: 270,
        hudAccent: '#9d00ff'
    },
    {
        name: "Cosmic Championship",
        leftRail: '#ffd700',
        rightRail: '#ff007f',
        divider: 'rgba(255, 215, 0, 0.85)',
        spaceGrad: ['#2b1238', '#170821', '#0a0310'],
        nebulaeColors: [
            { c1: 'rgba(255, 215, 0, 0.30)', c2: 'rgba(255, 0, 127, 0.25)' },
            { c1: 'rgba(0, 240, 255, 0.22)', c2: 'rgba(255, 215, 0, 0.18)' }
        ],
        crystalColor: '#ffd700',
        filterHue: 320,
        hudAccent: '#ffd700'
    }
];

// Pure helper function for dynamic narrowing track safe corridors
function getTrackCorridor(levelIndex) {
    const clampedLevel = Math.max(0, Math.min(9, levelIndex || 0));
    const inset = clampedLevel * 7; // 0px to 63px narrowing on each side
    const left = 90 + inset;
    const right = 510 - inset;
    const width = right - left;
    return { left, right, width, inset };
}

// Pure helper function to compute landing shadow properties for airborne falling sky drops
function calculateLandingShadow(dropY, targetY, width = 40, height = 40) {
    const startY = -120;
    const totalDist = Math.max(1, targetY - startY);
    const currentDist = Math.max(0, dropY - startY);
    const progress = Math.min(1, Math.max(0, currentDist / totalDist));
    
    // Shadow grows and darkens as the drop falls toward the track surface
    const radiusX = (width * 0.5) * (0.3 + 0.7 * progress);
    const radiusY = (height * 0.28) * (0.3 + 0.7 * progress);
    const alpha = 0.2 + 0.6 * progress;
    
    return {
        progress,
        radiusX,
        radiusY,
        alpha,
        isLanded: dropY >= targetY
    };
}

// Pure helper function to apply sector theme colors to DOM/CSS variables and container glow
function applySectorVisualTheme(levelIndex, targetDoc = (typeof document !== 'undefined' ? document : null)) {
    if (!targetDoc) return null;
    const theme = sectorThemes[Math.max(0, Math.min(9, levelIndex || 0)) % sectorThemes.length];
    if (!theme) return null;

    // Apply CSS custom properties to document root
    const root = targetDoc.documentElement;
    if (root && root.style && typeof root.style.setProperty === 'function') {
        root.style.setProperty('--neon-cyan', theme.leftRail);
        root.style.setProperty('--neon-orange', theme.rightRail);
        root.style.setProperty('--glass-border', `${theme.leftRail}66`);
        root.style.setProperty('--neon-accent', theme.hudAccent || theme.leftRail);
    }

    // Update container glow box-shadow
    const container = targetDoc.getElementById ? targetDoc.getElementById('game-container') : null;
    if (container && container.style) {
        container.style.boxShadow = `0 0 50px ${theme.leftRail}40, 0 0 100px ${theme.rightRail}30, inset 0 0 30px rgba(0, 0, 0, 0.8)`;
    }

    return theme;
}

// Pure helper function to apply power-up buffs to game state
function applyPowerUp(state, type) {
    if (!state) return state;
    if (type === 'SHIELD') {
        state.shieldActive = true;
        state.shieldTimer = 10000; // 10 seconds
    } else if (type === 'BOOST') {
        state.boostActive = true;
        state.boostTimer = 5000; // 5 seconds
    } else if (type === 'MULTIPLIER') {
        state.multiplierActive = true;
        state.multiplierTimer = 10000; // 10 seconds
    }
    return state;
}

// Game State Definition
let gameState = {
    score: 0,
    stageScore: 0, // Score accumulated in current stage
    levelIndex: 0,
    speed: 0,
    distance: 0,
    laps: 1,
    timeInStage: 0,
    totalTime: 0,
    gameOver: false,
    levelClear: false,
    victory: false,
    isPaused: false,
    currentScreen: 'START', // 'START', 'PLAYING', 'LEVEL_CLEAR', 'GAME_OVER', 'VICTORY'
    // Active power-up buffs
    shieldActive: false,
    shieldTimer: 0,
    boostActive: false,
    boostTimer: 0,
    multiplierActive: false,
    multiplierTimer: 0
};

// Collision detection function (Pure AABB)
function checkCollision(rect1, rect2) {
    // Add slightly forgiving hitbox padding (2px on each side) for better gameplay experience
    const pad1 = 2;
    const pad2 = 2;
    return (
        rect1.x + pad1 < rect2.x + rect2.width - pad2 &&
        rect1.x + rect1.width - pad1 > rect2.x + pad2 &&
        rect1.y + pad1 < rect2.y + rect2.height - pad2 &&
        rect1.y + rect1.height - pad1 > rect2.y + pad2
    );
}

// State and Score updater function with Score Multiplier support
function updateScore(state, points, levelsArray) {
    const finalPoints = state.multiplierActive ? points * 2 : points;
    state.score += finalPoints;
    state.stageScore += finalPoints;
    
    const currentLevel = levelsArray[state.levelIndex];
    if (state.score >= currentLevel.targetScore) {
        if (state.levelIndex === levelsArray.length - 1) {
            state.victory = true;
            state.gameOver = false;
            state.levelClear = false;
            state.currentScreen = 'VICTORY';
        } else {
            state.levelClear = true;
            state.gameOver = false;
            state.currentScreen = 'LEVEL_CLEAR';
        }
        state.speed = 0; // stop moving on state transition
    }
    return state;
}

// Pure helper function to calculate responsive canvas dimensions preserving aspect ratio
function calculateCanvasDimensions(viewWidth, viewHeight, designWidth = DESIGN_WIDTH, designHeight = DESIGN_HEIGHT) {
    const designRatio = designWidth / designHeight;
    const viewRatio = viewWidth / viewHeight;

    let scale;
    let width, height;

    if (viewRatio > designRatio) {
        // Screen is wider than logical design -> Fit height, letterbox left/right
        scale = viewHeight / designHeight;
        width = designWidth * scale;
        height = viewHeight;
    } else {
        // Screen is taller than logical design -> Fit width, letterbox top/bottom
        scale = viewWidth / designWidth;
        width = viewWidth;
        height = designHeight * scale;
    }

    return {
        width,
        height,
        canvasWidth: width,
        canvasHeight: height,
        scale
    };
}

// Pure helper function to convert client screen coordinate to logical coordinate space
function screenToLogicalCoord(clientX, rectLeft, rectWidth, designWidth = DESIGN_WIDTH) {
    if (!rectWidth) return 0;
    return ((clientX - rectLeft) / rectWidth) * designWidth;
}

// Browser Environment Execution Block
if (typeof window !== 'undefined') {
    // Canvas & Context
    let canvas, ctx;
    let bgImage = new Image();
    let bgImageLoaded = false;

    // Entities
    let player = {
        x: 277.5,
        y: 640,
        width: 45,
        height: 80,
        color: '#ff3131',
        isSlipping: false,
        slipTimer: 0
    };

    // Cosmic Dreamworld Parallax Entities & Themes
    let stars = [];
    let nebulae = [];
    let floatingIslands = [];

    const playerTheme = {
        primary: '#00f0ff',
        secondary: '#0088cc',
        dark: '#071a33',
        underglow: '#00f0ff',
        number: '07'
    };

    const enemyThemes = [
        { name: 'Neon Phantom', primary: '#ff007f', secondary: '#800040', underglow: '#ff007f', number: '88' },
        { name: 'Void Stalker', primary: '#9d00ff', secondary: '#3b0066', underglow: '#9d00ff', number: '13' },
        { name: 'Solar Flare', primary: '#ff5500', secondary: '#ffaa00', underglow: '#ff5500', number: '42' },
        { name: 'Toxic Pulse', primary: '#00ffaa', secondary: '#008855', underglow: '#00ffaa', number: '99' },
        { name: 'Cyber Wraith', primary: '#00d2ff', secondary: '#004488', underglow: '#00d2ff', number: '01' }
    ];

    let enemies = [];
    let obstacles = [];
    let particles = [];
    let fallingDrops = [];
    let bgY = 0;
    let lastSpawnTime = 0;
    let lastDropSpawnTime = 0;
    let warningTimer = 0;
    let stageStartTime = 0;
    let raceStartTime = 0;
    let lastFrameTime = 0;

    // Screenshake state
    let shakeIntensity = 0;

    // Keys state
    let keys = {
        left: false,
        right: false,
        up: false,
        down: false
    };

    // Touch/Drag state
    let touchX = null;
    let isDragging = false;

    // Synthesized Audio Manager using Web Audio API
    let audioCtx = null;
    let engineOsc = null;
    let engineGain = null;

    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            setupContinuousEngine();
        } catch (e) {
            console.log("AudioContext not supported or blocked: ", e);
        }
    }

    function setupContinuousEngine() {
        if (!audioCtx) return;
        try {
            engineOsc = audioCtx.createOscillator();
            engineGain = audioCtx.createGain();
            
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.setValueAtTime(45, audioCtx.currentTime); // low idle frequency
            
            // Add a lowpass filter to make the motor sound deep and smooth
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(160, audioCtx.currentTime);
            
            engineOsc.connect(filter);
            filter.connect(engineGain);
            engineGain.connect(audioCtx.destination);
            
            engineGain.gain.setValueAtTime(0.0, audioCtx.currentTime); // start silent
            engineOsc.start(0);
        } catch (e) {
            console.log("Failed to setup engine audio: ", e);
        }
    }

    function updateEngineSound() {
        if (!audioCtx || !engineOsc || !engineGain) return;
        try {
            if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                // Map speed from [0, 18] to frequency [45, 150]
                const targetFreq = 45 + (gameState.speed / 18) * 115;
                engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
                
                // Set volume slightly fluctuating to simulate compression
                const vol = 0.04 + (gameState.speed / 18) * 0.05 + Math.random() * 0.01;
                engineGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
            } else {
                engineGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.15);
            }
        } catch (e) {}
    }

    function playSoundEffect(type) {
        if (!audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const ctxCurrent = audioCtx.currentTime;
            
            if (type === 'coin') {
                // Sweet electronic chime chord
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                osc1.type = 'sine';
                osc2.type = 'sine';
                
                osc1.frequency.setValueAtTime(523.25, ctxCurrent); // C5
                osc1.frequency.setValueAtTime(880, ctxCurrent + 0.08); // A5
                
                osc2.frequency.setValueAtTime(659.25, ctxCurrent); // E5
                osc2.frequency.setValueAtTime(1046.50, ctxCurrent + 0.08); // C6
                
                gainNode.gain.setValueAtTime(0.12, ctxCurrent);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + 0.45);
                
                osc1.connect(gainNode);
                osc2.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                osc1.start();
                osc2.start();
                osc1.stop(ctxCurrent + 0.5);
                osc2.stop(ctxCurrent + 0.5);
            } 
            else if (type === 'crash') {
                // Synthesize crunch/crash sound: burst of white/pink noise routed through a low-pass filter
                // with exponential gain decay, paired with a sub-bass sine drop (80Hz to 20Hz).
                const bufferSize = Math.floor(audioCtx.sampleRate * 0.48);
                const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.32));
                }
                const whiteNoise = audioCtx.createBufferSource();
                whiteNoise.buffer = noiseBuffer;

                const noiseFilter = audioCtx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(800, ctxCurrent);
                noiseFilter.frequency.exponentialRampToValueAtTime(60, ctxCurrent + 0.45);

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.3, ctxCurrent);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + 0.48);

                whiteNoise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);
                whiteNoise.start(ctxCurrent);

                // Sub-bass sine drop (80Hz to 20Hz)
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(80, ctxCurrent);
                subOsc.frequency.exponentialRampToValueAtTime(20, ctxCurrent + 0.5);

                subGain.gain.setValueAtTime(0.35, ctxCurrent);
                subGain.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + 0.52);

                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(ctxCurrent);
                subOsc.stop(ctxCurrent + 0.55);
            }
            else if (type === 'powerup') {
                // Ascending arpeggio chime using frequency sweeps with high-register triangle and sine waves (440Hz -> 880Hz -> 1320Hz)
                const arpeggio = [440, 880, 1320];
                const noteDur = 0.09;
                arpeggio.forEach((baseFreq, idx) => {
                    const noteStart = ctxCurrent + idx * noteDur;
                    
                    const oscTri = audioCtx.createOscillator();
                    const oscSine = audioCtx.createOscillator();
                    const noteGain = audioCtx.createGain();

                    oscTri.type = 'triangle';
                    oscSine.type = 'sine';

                    oscTri.frequency.setValueAtTime(baseFreq * 0.96, noteStart);
                    oscTri.frequency.exponentialRampToValueAtTime(baseFreq * 1.06, noteStart + noteDur);

                    oscSine.frequency.setValueAtTime(baseFreq, noteStart);
                    oscSine.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, noteStart + noteDur);

                    noteGain.gain.setValueAtTime(0.14, noteStart);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur + 0.1);

                    oscTri.connect(noteGain);
                    oscSine.connect(noteGain);
                    noteGain.connect(audioCtx.destination);

                    oscTri.start(noteStart);
                    oscSine.start(noteStart);
                    oscTri.stop(noteStart + noteDur + 0.12);
                    oscSine.stop(noteStart + noteDur + 0.12);
                });
            }
            else if (type === 'warning') {
                // Pulsating, high-frequency alert tone or sweep when a sky drop enters the viewport
                const osc = audioCtx.createOscillator();
                const filter = audioCtx.createBiquadFilter();
                const gainNode = audioCtx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(950, ctxCurrent);
                osc.frequency.linearRampToValueAtTime(1450, ctxCurrent + 0.08);
                osc.frequency.linearRampToValueAtTime(950, ctxCurrent + 0.16);
                osc.frequency.linearRampToValueAtTime(1450, ctxCurrent + 0.24);

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1200, ctxCurrent);
                filter.Q.setValueAtTime(2.5, ctxCurrent);

                gainNode.gain.setValueAtTime(0.12, ctxCurrent);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + 0.28);

                osc.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start(ctxCurrent);
                osc.stop(ctxCurrent + 0.3);
            }
            else if (type === 'gift_smash') {
                // Heavy distorted thud with rapid pitch decay
                const osc = audioCtx.createOscillator();
                const dist = audioCtx.createWaveShaper();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, ctxCurrent);
                osc.frequency.exponentialRampToValueAtTime(32, ctxCurrent + 0.24);

                // Waveshaper overdrive curve
                const nSamples = 256;
                const curve = new Float32Array(nSamples);
                for (let i = 0; i < nSamples; i++) {
                    const x = (i * 2) / nSamples - 1;
                    curve[i] = ((Math.PI + 4) * x) / (Math.PI + 4 * Math.abs(x));
                }
                dist.curve = curve;
                dist.oversample = '2x';

                gain.gain.setValueAtTime(0.3, ctxCurrent);
                gain.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + 0.26);

                osc.connect(dist);
                dist.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(ctxCurrent);
                osc.stop(ctxCurrent + 0.28);
            }
            else if (type === 'level_clear') {
                // Cheerful progression melody
                const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                const duration = 0.12;
                
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctxCurrent + i * duration);
                    
                    gainNode.gain.setValueAtTime(0.1, ctxCurrent + i * duration);
                    gainNode.gain.setValueAtTime(0.1, ctxCurrent + i * duration + duration - 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + i * duration + duration);
                    
                    osc.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    osc.start(ctxCurrent + i * duration);
                    osc.stop(ctxCurrent + (i + 1.2) * duration);
                });
            }
            else if (type === 'victory') {
                // Grand champion fanfare
                const melody = [523.25, 523.25, 523.25, 523.25, 659.25, 587.33, 659.25, 783.99, 1046.50];
                const rhythm = [0.15, 0.15, 0.15, 0.45, 0.15, 0.15, 0.15, 0.15, 0.8];
                let accumTime = 0;
                
                melody.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctxCurrent + accumTime);
                    
                    gainNode.gain.setValueAtTime(0.12, ctxCurrent + accumTime);
                    gainNode.gain.setValueAtTime(0.12, ctxCurrent + accumTime + rhythm[i] - 0.03);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctxCurrent + accumTime + rhythm[i]);
                    
                    osc.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    osc.start(ctxCurrent + accumTime);
                    osc.stop(ctxCurrent + accumTime + rhythm[i]);
                    
                    accumTime += rhythm[i];
                });
            }
        } catch (e) {
            console.log("Sound error: ", e);
        }
    }

    // Initialize Cosmic Dreamworld Parallax Environment
    function initCosmicEnvironment() {
        // Multi-depth deep space starscape
        stars = [];
        for (let i = 0; i < 120; i++) {
            const layer = i < 60 ? 1 : (i < 95 ? 2 : 3);
            const size = layer === 1 ? (0.8 + Math.random() * 0.6) : (layer === 2 ? (1.5 + Math.random() * 0.8) : (2.5 + Math.random() * 1.2));
            const colors = ['#ffffff', '#00f0ff', '#ff007f', '#d8b4fe', '#fef08a'];
            stars.push({
                x: Math.random() * DESIGN_WIDTH,
                y: Math.random() * DESIGN_HEIGHT,
                size: size,
                layer: layer,
                speedFactor: layer === 1 ? 0.08 : (layer === 2 ? 0.18 : 0.32),
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.35 + Math.random() * 0.65,
                flickerSpeed: 0.003 + Math.random() * 0.006,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Swirling vibrant nebulae (magenta, ultraviolet, cyan)
        nebulae = [
            { x: 130, y: 160, radius: 180, color1: 'rgba(255, 0, 127, 0.22)', color2: 'rgba(157, 0, 255, 0.15)', speedFactor: 0.2 },
            { x: 470, y: 460, radius: 220, color1: 'rgba(157, 0, 255, 0.24)', color2: 'rgba(0, 240, 255, 0.12)', speedFactor: 0.2 },
            { x: 280, y: 760, radius: 190, color1: 'rgba(255, 0, 127, 0.18)', color2: 'rgba(0, 240, 255, 0.14)', speedFactor: 0.2 },
            { x: 140, y: -80, radius: 170, color1: 'rgba(0, 240, 255, 0.20)', color2: 'rgba(157, 0, 255, 0.16)', speedFactor: 0.2 }
        ];

        // Celestial Floating Islands with Glowing Crystals on margins
        floatingIslands = [
            { side: 'left', x: 42, y: 110, w: 68, h: 90, crystalColor: '#00f0ff', speedFactor: 0.42 },
            { side: 'left', x: 36, y: 370, w: 72, h: 105, crystalColor: '#ff007f', speedFactor: 0.42 },
            { side: 'left', x: 44, y: 630, w: 64, h: 88, crystalColor: '#9d00ff', speedFactor: 0.42 },
            { side: 'right', x: 558, y: 210, w: 68, h: 95, crystalColor: '#9d00ff', speedFactor: 0.42 },
            { side: 'right', x: 552, y: 480, w: 72, h: 108, crystalColor: '#00f0ff', speedFactor: 0.42 },
            { side: 'right', x: 556, y: 730, w: 66, h: 92, crystalColor: '#00ffaa', speedFactor: 0.42 }
        ];
    }

    // Initialize Game on Window Load
    function initGame() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Initial sizing & cosmic environment setup
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        initCosmicEnvironment();
        applySectorVisualTheme(0);

        // Preload Track Background
        bgImage.onload = () => {
            bgImageLoaded = true;
        };
        bgImage.onerror = () => {
            console.log("Background image failed to load. Falling back to procedurally rendered track background.");
            bgImageLoaded = false;
        };
        bgImage.src = 'image/cartrack.jpeg';

        // Load High Score
        const savedHighScore = localStorage.getItem('car_racing_highscore');
        if (savedHighScore) {
            document.getElementById('high-score-val').textContent = parseInt(savedHighScore).toLocaleString();
        }

        // Setup DOM Button Event Listeners
        document.getElementById('start-button').addEventListener('click', () => {
            initAudio();
            startGame();
        });
        document.getElementById('next-level-btn').addEventListener('click', proceedToNextLevel);
        document.getElementById('retry-button').addEventListener('click', restartGame);
        document.getElementById('restart-button').addEventListener('click', restartGameFromVictory);
        document.getElementById('resume-button').addEventListener('click', togglePause);
        document.getElementById('pause-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePause();
        });

        // Setup Keyboard Event Listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Setup Mouse/Pointer Touch Event Listeners for Steer-by-Drag
        canvas.addEventListener('mousedown', handlePointerStart);
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('mouseup', handlePointerEnd);
        canvas.addEventListener('mouseleave', handlePointerEnd);

        canvas.addEventListener('touchstart', handlePointerStart, { passive: true });
        canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
        canvas.addEventListener('touchend', handlePointerEnd);

        // Facebook Instant Games SDK Lifecycle Integration
        if (typeof FBInstant !== 'undefined') {
            FBInstant.initializeAsync()
                .then(() => FBInstant.setLoadingProgress(100))
                .then(() => FBInstant.startGameAsync())
                .catch(err => console.log("FBInstant lifecycle notice: ", err));

            FBInstant.onPause(() => {
                if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                    togglePause();
                }
            });
        }

        // Platform Pause & Mute Lifecycles
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                    togglePause();
                }
                if (audioCtx && audioCtx.state === 'running') {
                    audioCtx.suspend();
                }
            } else {
                if (audioCtx && audioCtx.state === 'suspended' && gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                    audioCtx.resume();
                }
            }
        });

        // Start the Animation frame loops
        requestAnimationFrame(gameLoop);
    }

    // universal responsiveness resizing with letterbox aspect ratio fitting
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const dims = calculateCanvasDimensions(window.innerWidth, window.innerHeight, DESIGN_WIDTH, DESIGN_HEIGHT);

        // Apply physical dimension sizes to canvas element
        canvas.width = DESIGN_WIDTH;
        canvas.height = DESIGN_HEIGHT;
        canvas.style.width = `${dims.width}px`;
        canvas.style.height = `${dims.height}px`;

        // Update container sizes
        container.style.width = `${dims.width}px`;
        container.style.height = `${dims.height}px`;
    }

    // Convert screen pixel coordinates to responsive logical coordinate bounds
    function getLogicalCoords(evt) {
        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        
        if (evt.touches && evt.touches.length > 0) {
            clientX = evt.touches[0].clientX;
        } else {
            clientX = evt.clientX;
        }

        // Interpolate coordinate bounds proportional to scaling ratio
        return screenToLogicalCoord(clientX, rect.left, rect.width, DESIGN_WIDTH);
    }

    // Input handlers
    function handleKeyDown(e) {
        // Space to restart from GameOver
        if (e.code === 'Space') {
            if (gameState.currentScreen === 'GAME_OVER') {
                restartGame();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'START') {
                initAudio();
                startGame();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'LEVEL_CLEAR') {
                proceedToNextLevel();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'VICTORY') {
                restartGameFromVictory();
                e.preventDefault();
                return;
            }
        }

        // P or Escape to Pause
        if (e.code === 'KeyP' || e.code === 'Escape') {
            if (gameState.currentScreen === 'PLAYING') {
                togglePause();
                e.preventDefault();
                return;
            }
        }

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = true;
                break;
        }
    }

    function handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = false;
                break;
        }
    }

    function handlePointerStart(e) {
        if (gameState.currentScreen !== 'PLAYING' || gameState.isPaused) return;
        isDragging = true;
        touchX = getLogicalCoords(e);
    }

    function handlePointerMove(e) {
        if (!isDragging || gameState.currentScreen !== 'PLAYING' || gameState.isPaused) return;
        const currentTouchX = getLogicalCoords(e);
        touchX = currentTouchX;
    }

    function handlePointerEnd() {
        isDragging = false;
        touchX = null;
    }

    // State Screen Transitions
    function startGame() {
        // Initialize States
        gameState = {
            score: 0,
            stageScore: 0,
            levelIndex: 0,
            speed: 0,
            distance: 0,
            laps: 1,
            timeInStage: 0,
            totalTime: 0,
            gameOver: false,
            levelClear: false,
            victory: false,
            isPaused: false,
            currentScreen: 'PLAYING',
            shieldActive: false,
            shieldTimer: 0,
            boostActive: false,
            boostTimer: 0,
            multiplierActive: false,
            multiplierTimer: 0
        };

        // Reset player positions
        player.x = 277.5;
        player.y = 640;
        player.isSlipping = false;
        player.slipTimer = 0;

        // Clear Lists
        enemies = [];
        obstacles = [];
        particles = [];
        fallingDrops = [];
        warningTimer = 0;

        // Set start timers
        stageStartTime = Date.now();
        raceStartTime = Date.now();
        lastSpawnTime = Date.now();
        lastDropSpawnTime = Date.now();
        lastFrameTime = Date.now();

        // Update Overlays and Sector Themes
        applySectorVisualTheme(gameState.levelIndex);
        updateUIOverlays();
        playSoundEffect('coin'); // sweet start chime
    }

    function restartGame() {
        startGame();
    }

    function restartGameFromVictory() {
        startGame();
    }

    function proceedToNextLevel() {
        if (!gameState.levelClear) return;
        
        gameState.levelIndex++;
        gameState.stageScore = 0;
        gameState.levelClear = false;
        gameState.currentScreen = 'PLAYING';
        
        // Reset player positions
        player.x = 277.5;
        player.y = 640;
        player.isSlipping = false;
        player.slipTimer = 0;

        // Clear Lists
        enemies = [];
        obstacles = [];
        particles = [];
        fallingDrops = [];
        warningTimer = 0;

        stageStartTime = Date.now();
        lastSpawnTime = Date.now();
        lastDropSpawnTime = Date.now();
        lastFrameTime = Date.now();

        applySectorVisualTheme(gameState.levelIndex);
        updateUIOverlays();
        playSoundEffect('coin');
    }

    function togglePause() {
        if (gameState.currentScreen !== 'PLAYING') return;
        
        gameState.isPaused = !gameState.isPaused;
        
        if (!gameState.isPaused) {
            // Offset timers by paused duration
            lastFrameTime = Date.now();
            if (audioCtx && audioCtx.state === 'suspended' && !document.hidden) {
                audioCtx.resume();
            }
        } else {
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend();
            }
        }
        
        updateUIOverlays();
    }

    function handleCrash(reason) {
        gameState.gameOver = true;
        gameState.currentScreen = 'GAME_OVER';
        gameState.speed = 0;
        gameState.shieldActive = false;
        gameState.boostActive = false;
        gameState.multiplierActive = false;

        // Save High Score
        const currentHighScore = localStorage.getItem('car_racing_highscore') || 0;
        if (gameState.score > currentHighScore) {
            localStorage.setItem('car_racing_highscore', gameState.score);
            document.getElementById('high-score-val').textContent = Math.floor(gameState.score).toLocaleString();
        }

        document.getElementById('game-over-reason').textContent = reason;
        playSoundEffect('crash');
        updateUIOverlays();
    }

    function triggerVictory() {
        gameState.victory = true;
        gameState.currentScreen = 'VICTORY';
        gameState.speed = 0;
        gameState.shieldActive = false;
        gameState.boostActive = false;
        gameState.multiplierActive = false;

        // Save High Score
        const currentHighScore = localStorage.getItem('car_racing_highscore') || 0;
        if (gameState.score > currentHighScore) {
            localStorage.setItem('car_racing_highscore', gameState.score);
            document.getElementById('high-score-val').textContent = Math.floor(gameState.score).toLocaleString();
        }

        playSoundEffect('victory');
        updateUIOverlays();
    }

    function updateUIOverlays() {
        // Toggle screen views
        const startScreen = document.getElementById('start-screen');
        const levelClearScreen = document.getElementById('level-clear-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const victoryScreen = document.getElementById('victory-screen');
        const pauseScreen = document.getElementById('pause-screen');
        const hud = document.getElementById('hud');

        startScreen.classList.add('hidden');
        levelClearScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        hud.classList.add('hidden');

        if (gameState.currentScreen === 'START') {
            startScreen.classList.remove('hidden');
        } 
        else if (gameState.currentScreen === 'PLAYING') {
            hud.classList.remove('hidden');
            if (gameState.isPaused) {
                pauseScreen.classList.remove('hidden');
            }
        } 
        else if (gameState.currentScreen === 'LEVEL_CLEAR') {
            levelClearScreen.classList.remove('hidden');
            
            const currentLevel = levels[gameState.levelIndex];
            document.getElementById('lc-stage-name').textContent = `${currentLevel.level}: ${currentLevel.name}`;
            document.getElementById('lc-time').textContent = `${(gameState.timeInStage / 1000).toFixed(1)}s`;
            document.getElementById('lc-stage-score').textContent = Math.floor(gameState.stageScore).toLocaleString();
            document.getElementById('lc-total-score').textContent = Math.floor(gameState.score).toLocaleString();
        } 
        else if (gameState.currentScreen === 'GAME_OVER') {
            gameOverScreen.classList.remove('hidden');
            document.getElementById('go-score').textContent = Math.floor(gameState.score).toLocaleString();
            document.getElementById('go-laps').textContent = gameState.laps;
            document.getElementById('go-level').textContent = gameState.levelIndex + 1;
        } 
        else if (gameState.currentScreen === 'VICTORY') {
            victoryScreen.classList.remove('hidden');
            document.getElementById('vic-score').textContent = Math.floor(gameState.score).toLocaleString();
            document.getElementById('vic-time').textContent = `${(gameState.totalTime / 1000).toFixed(1)}s`;
            document.getElementById('vic-laps').textContent = gameState.laps;
        }

        // Power-Up HUD Badges & Warning Banner Refresh
        const shieldBadge = document.getElementById('hud-shield-badge');
        const boostBadge = document.getElementById('hud-boost-badge');
        const multiBadge = document.getElementById('hud-multi-badge');
        const warningBanner = document.getElementById('hud-warning');

        if (shieldBadge && boostBadge && multiBadge && warningBanner) {
            if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                if (gameState.shieldActive) {
                    shieldBadge.classList.remove('hidden');
                    shieldBadge.textContent = `🛡️ ${(Math.max(0, gameState.shieldTimer) / 1000).toFixed(0)}s`;
                } else {
                    shieldBadge.classList.add('hidden');
                }

                if (gameState.boostActive) {
                    boostBadge.classList.remove('hidden');
                    boostBadge.textContent = `⚡ ${(Math.max(0, gameState.boostTimer) / 1000).toFixed(0)}s`;
                } else {
                    boostBadge.classList.add('hidden');
                }

                if (gameState.multiplierActive) {
                    multiBadge.classList.remove('hidden');
                    multiBadge.textContent = `✨ 2X ${(Math.max(0, gameState.multiplierTimer) / 1000).toFixed(0)}s`;
                } else {
                    multiBadge.classList.add('hidden');
                }

                if (warningTimer > 0) {
                    warningBanner.classList.remove('hidden');
                } else {
                    warningBanner.classList.add('hidden');
                }
            } else {
                shieldBadge.classList.add('hidden');
                boostBadge.classList.add('hidden');
                multiBadge.classList.add('hidden');
                warningBanner.classList.add('hidden');
            }
        }
    }

    // Dynamic Spawning Engine
    function spawnEntities() {
        const now = Date.now();
        const currentLevel = levels[gameState.levelIndex];
        const corridor = getTrackCorridor(gameState.levelIndex);
        
        // 1. Spawning Ground Vehicles and Track Obstacles
        if (now - lastSpawnTime > currentLevel.spawnInterval) {
            lastSpawnTime = now;

            const rand = Math.random();
            const minX = corridor.left + 8;
            const maxX = corridor.right - 8;
            const spawnX = minX + Math.random() * Math.max(20, maxX - minX - 50);

            if (rand < 0.55) {
                // Spawn Futuristic Rival Supercar
                const sectorTheme = sectorThemes[gameState.levelIndex % sectorThemes.length];
                const sectorEnemyTheme = {
                    name: `${sectorTheme.name} Rival`,
                    primary: sectorTheme.rightRail,
                    secondary: sectorTheme.leftRail,
                    underglow: sectorTheme.rightRail,
                    number: `${Math.floor(10 + Math.random() * 89)}`
                };
                const combinedThemes = [...enemyThemes, sectorEnemyTheme];
                const randTheme = combinedThemes[Math.floor(Math.random() * combinedThemes.length)];
                
                // Speed scales dynamically with level
                const enemyBaseSpeed = 2 + Math.random() * 3 + (gameState.levelIndex * 0.45);
                
                enemies.push({
                    x: spawnX,
                    y: -100,
                    width: 45,
                    height: 80,
                    color: randTheme.primary,
                    theme: randTheme,
                    speed: enemyBaseSpeed,
                    laneChange: Math.random() < 0.35, // some cars shift lane dynamically
                    laneDir: Math.random() < 0.5 ? -1 : 1,
                    passed: false
                });
            } 
            else if (rand < 0.85) {
                // Spawn Track Hazard Obstacle
                const types = ['CONE', 'BARRIER', 'OIL'];
                const obstacleType = types[Math.floor(Math.random() * types.length)];
                let obsW = 35, obsH = 35;

                if (obstacleType === 'BARRIER') {
                    obsW = 75;
                    obsH = 30;
                } else if (obstacleType === 'OIL') {
                    obsW = 60;
                    obsH = 35;
                }

                obstacles.push({
                    x: Math.max(corridor.left + 5, Math.min(corridor.right - 5 - obsW, spawnX)),
                    y: -100,
                    width: obsW,
                    height: obsH,
                    type: obstacleType,
                    passed: false
                });
            } 
            else {
                // Spawn Collectible Coin
                obstacles.push({
                    x: Math.max(corridor.left + 10, Math.min(corridor.right - 10 - 30, spawnX)),
                    y: -100,
                    width: 30,
                    height: 30,
                    type: 'COIN',
                    pulseScale: 1,
                    pulseDir: 1,
                    passed: false
                });
            }
        }

        // 2. Spawning Falling Mystery Gifts & Hazards (Drops from Sky)
        // Interval tightens dynamically on higher sectors
        const dropInterval = Math.max(2600, 6200 - gameState.levelIndex * 340);
        if (now - lastDropSpawnTime > dropInterval) {
            lastDropSpawnTime = now;

            const dropRoll = Math.random();
            let dropType;
            let dropW = 38, dropH = 38;

            if (dropRoll < 0.38) {
                // Power-Up Star / Orb
                const pRoll = Math.random();
                if (pRoll < 0.34) {
                    dropType = 'POWERUP_SHIELD';
                } else if (pRoll < 0.68) {
                    dropType = 'POWERUP_BOOST';
                } else {
                    dropType = 'POWERUP_MULTIPLIER';
                }
            } else if (dropRoll < 0.70) {
                // Heavy Mystery Crate
                dropType = 'MYSTERY_CRATE';
                dropW = 42;
                dropH = 42;
            } else {
                // Falling Meteor Hazard
                dropType = 'METEOR';
                dropW = 46;
                dropH = 46;
            }

            const dropSpawnX = corridor.left + 10 + Math.random() * Math.max(20, corridor.width - 20 - dropW);
            const targetLandingY = 220 + Math.random() * 320;
            const fallSpeed = 4.2 + Math.random() * 2 + (gameState.levelIndex * 0.25);

            fallingDrops.push({
                x: dropSpawnX,
                y: -120, // Start above the screen
                targetY: targetLandingY,
                width: dropW,
                height: dropH,
                type: dropType,
                fallSpeed: fallSpeed,
                isLanded: false,
                warningPlayed: false,
                passed: false,
                pulse: 1
            });
        }
    }

    function createSparkleBurst(x, y, color) {
        for (let i = 0; i < 16; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 2.5 + Math.random() * 3.5,
                color: color,
                life: 22
            });
        }
    }

    // Engine Core Simulation Update Loop
    function gameLoop() {
        const now = Date.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
            updatePhysics(deltaTime);
            spawnEntities();
        }

        render();
        updateEngineSound();

        requestAnimationFrame(gameLoop);
    }

    function updatePhysics(dt) {
        const currentLevel = levels[gameState.levelIndex];
        const corridor = getTrackCorridor(gameState.levelIndex);

        // Update active power-up timers
        if (gameState.shieldActive) {
            gameState.shieldTimer -= dt;
            if (gameState.shieldTimer <= 0) {
                gameState.shieldActive = false;
            }
        }
        if (gameState.boostActive) {
            gameState.boostTimer -= dt;
            if (gameState.boostTimer <= 0) {
                gameState.boostActive = false;
            }
        }
        if (gameState.multiplierActive) {
            gameState.multiplierTimer -= dt;
            if (gameState.multiplierTimer <= 0) {
                gameState.multiplierActive = false;
            }
        }
        if (warningTimer > 0) {
            warningTimer -= dt;
        }

        // Track Stage level timers
        gameState.timeInStage = Date.now() - stageStartTime;
        gameState.totalTime = Date.now() - raceStartTime;

        // Dynamic Grass Slowdown boundary cap: based on narrowing corridor
        const onGrass = (player.x < corridor.left || player.x + player.width > corridor.right);
        const maxLevelSpeed = gameState.boostActive ? currentLevel.maxSpeed * 1.35 : currentLevel.maxSpeed;
        const speedCap = onGrass ? 3.5 : maxLevelSpeed;

        // Apply Keyboard movement speed controls (boosted acceleration if Boost is active)
        const accelRate = gameState.boostActive ? 0.24 : 0.12;
        if (keys.up) {
            gameState.speed += accelRate;
        } else if (keys.down) {
            gameState.speed -= 0.22;
        } else {
            // Smooth engine braking drag
            if (gameState.speed > 0) {
                gameState.speed -= 0.05;
            } else if (gameState.speed < 0) {
                gameState.speed += 0.05;
            }
        }

        // Clip Speed bounds
        if (gameState.speed > speedCap) {
            gameState.speed -= 0.15; // smooth decelerate down to limit
        }
        gameState.speed = Math.max(-2, Math.min(gameState.speed, maxLevelSpeed));

        // Player Slipping State (after hitting Oil Slicks or unstable crates)
        if (player.isSlipping) {
            player.slipTimer -= dt;
            if (player.slipTimer <= 0) {
                player.isSlipping = false;
            }
            // Push player left or right erratically
            player.x += Math.sin(Date.now() / 50) * 4.5;
        }

        // Apply Steering Controls
        const currentSteerSpeed = player.isSlipping ? 2.0 : 4.8;
        
        // Touch steer horizontal mapping
        if (touchX !== null) {
            const targetCenter = touchX;
            const playerCenter = player.x + player.width / 2;
            const diff = targetCenter - playerCenter;

            if (Math.abs(diff) > 4) {
                if (diff < 0) {
                    player.x -= currentSteerSpeed;
                } else {
                    player.x += currentSteerSpeed;
                }
            }
        } 
        else {
            // Keyboard controls
            if (keys.left) {
                player.x -= currentSteerSpeed;
            }
            if (keys.right) {
                player.x += currentSteerSpeed;
            }
        }

        // Hard Screen edge boundaries constraint
        player.x = Math.max(30, Math.min(DESIGN_WIDTH - 30 - player.width, player.x));

        // Background vertical scrolling
        const scrollDelta = gameState.speed > 0 ? gameState.speed : 1.2; // subtle cosmic idle drift
        bgY += gameState.speed;
        if (bgY >= DESIGN_HEIGHT) {
            bgY %= DESIGN_HEIGHT;
        }

        // Parallax scrolling for cosmic layers
        stars.forEach(s => {
            s.y += scrollDelta * s.speedFactor;
            if (s.y > DESIGN_HEIGHT) {
                s.y -= DESIGN_HEIGHT;
                s.x = Math.random() * DESIGN_WIDTH;
            }
        });

        nebulae.forEach(n => {
            n.y += scrollDelta * n.speedFactor;
            if (n.y > DESIGN_HEIGHT + n.radius) {
                n.y -= (DESIGN_HEIGHT + n.radius * 2);
            }
        });

        floatingIslands.forEach(isl => {
            isl.y += scrollDelta * isl.speedFactor;
            if (isl.y > DESIGN_HEIGHT + isl.h) {
                isl.y -= (DESIGN_HEIGHT + isl.h * 2 + 50);
            }
        });

        // Distance & Laps odometer counting
        if (gameState.speed > 0) {
            gameState.distance += gameState.speed * 0.15;
            const currentLaps = Math.floor(gameState.distance / 1500) + 1;
            if (currentLaps > gameState.laps) {
                gameState.laps = currentLaps;
            }
        }

        // Screen shake off-road
        if (onGrass && gameState.speed > 1.5) {
            shakeIntensity = Math.min(5, shakeIntensity + 0.5);
            // Spawn cosmic energy friction sparks
            if (Math.random() < 0.25) {
                particles.push({
                    x: player.x + (Math.random() * player.width),
                    y: player.y + player.height - 5,
                    vx: (Math.random() - 0.5) * 6,
                    vy: 2 + Math.random() * 4,
                    size: 3 + Math.random() * 4,
                    color: Math.random() < 0.5 ? '#ff007f' : '#ff5500', // Neon hazard sparks
                    life: 20
                });
            }
        } else if (shakeIntensity > 0) {
            shakeIntensity -= 0.5;
        }

        // Dual Neon Plasma Thruster Trail Particles (Supersonic Golden Plumes if Boost active)
        if (gameState.speed > 0.5) {
            const pColor = gameState.boostActive ?
                (Math.random() < 0.7 ? '#ffd700' : '#ff5500') :
                (Math.random() < 0.65 ? '#00f0ff' : '#ff007f');
            const pSize = gameState.boostActive ? 4.5 + Math.random() * 4 : 2.5 + Math.random() * 3.5;
            
            // Left jet thruster
            particles.push({
                x: player.x + player.width * 0.28 + (Math.random() * 4 - 2),
                y: player.y + player.height - 3,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 4 + Math.random() * 3 + gameState.speed * 0.3,
                size: pSize,
                color: pColor,
                life: gameState.boostActive ? 24 : 18
            });
            // Right jet thruster
            particles.push({
                x: player.x + player.width * 0.72 + (Math.random() * 4 - 2),
                y: player.y + player.height - 3,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 4 + Math.random() * 3 + gameState.speed * 0.3,
                size: pSize,
                color: pColor,
                life: gameState.boostActive ? 24 : 18
            });
        }

        // Update active dust and thruster particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Update and move Enemy Cars list
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            // Enemies move relative to the player's screen rate: Max guarantee downward velocity
            const scrollFactor = Math.max(2.0, gameState.speed - enemy.speed);
            enemy.y += scrollFactor;

            // Lane changing intelligence behavior
            if (enemy.laneChange) {
                enemy.x += enemy.laneDir * 1.2;
                // Bounce off current asphalt corridor boundaries
                if (enemy.x < corridor.left + 5 || enemy.x + enemy.width > corridor.right - 5) {
                    enemy.laneDir *= -1;
                }
            }

            // Verify Collision with player
            if (checkCollision(player, enemy)) {
                if (gameState.shieldActive) {
                    // Shield absorbs impact and protects player
                    gameState.shieldActive = false;
                    gameState.shieldTimer = 0;
                    playSoundEffect('gift_smash');
                    shakeIntensity = 6;
                    for (let pIdx = 0; pIdx < 20; pIdx++) {
                        particles.push({
                            x: player.x + player.width / 2,
                            y: player.y + player.height / 2,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            size: 3 + Math.random() * 5,
                            color: Math.random() < 0.5 ? '#00f0ff' : '#9d00ff',
                            life: 25
                        });
                    }
                    enemy.y += 120;
                    gameState.speed = Math.max(2, gameState.speed * 0.7);
                } else {
                    handleCrash(`You crashed into a rival hypercar in sector ${gameState.levelIndex + 1}!`);
                    return;
                }
            }

            // Check if player passed enemy safely to score points
            if (!enemy.passed && enemy.y > player.y + player.height) {
                enemy.passed = true;
                updateScore(gameState, 50, levels);
                playSoundEffect('coin');
            }

            // Remove out-of-screen enemies
            if (enemy.y > DESIGN_HEIGHT + 100) {
                enemies.splice(i, 1);
            }
        }

        // Update and move Obstacles/Coins list
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y += gameState.speed;

            // Coin hover pulsing effect
            if (obs.type === 'COIN') {
                obs.pulseScale += obs.pulseDir * 0.04;
                if (obs.pulseScale > 1.2 || obs.pulseScale < 0.7) {
                    obs.pulseDir *= -1;
                }
            }

            // Verify Collision
            if (checkCollision(player, obs)) {
                if (obs.type === 'COIN') {
                    // Collect standard currency
                    updateScore(gameState, 100, levels);
                    playSoundEffect('coin');
                    obstacles.splice(i, 1);
                    continue;
                } 
                else if (obs.type === 'OIL') {
                    // Slippery oil slick trigger
                    player.isSlipping = true;
                    player.slipTimer = 1000; // slip for 1s
                    for (let pIdx = 0; pIdx < 10; pIdx++) {
                        particles.push({
                            x: player.x + player.width/2,
                            y: player.y + player.height/2,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            size: 3 + Math.random() * 4,
                            color: '#2a2a2a',
                            life: 25
                        });
                    }
                    obstacles.splice(i, 1);
                    continue;
                } 
                else if (obs.type === 'CONE' || obs.type === 'BARRIER') {
                    if (gameState.shieldActive) {
                        // Shield absorbs impact!
                        gameState.shieldActive = false;
                        gameState.shieldTimer = 0;
                        playSoundEffect('gift_smash');
                        shakeIntensity = 5;
                        for (let pIdx = 0; pIdx < 16; pIdx++) {
                            particles.push({
                                x: obs.x + obs.width / 2,
                                y: obs.y + obs.height / 2,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                size: 3 + Math.random() * 4,
                                color: obs.type === 'CONE' ? '#ff5500' : '#ff007f',
                                life: 20
                            });
                        }
                        obstacles.splice(i, 1);
                        continue;
                    } else {
                        handleCrash(obs.type === 'CONE' ?
                            `You hit a heavy orange traffic warning cone at high speed!` :
                            `You smashed head-on into a reinforced hazard boundary barrier!`);
                        return;
                    }
                }
            }

            // Check if player passed obstacle safely to score points
            if (!obs.passed && obs.type !== 'COIN' && obs.type !== 'OIL' && obs.y > player.y + player.height) {
                obs.passed = true;
                updateScore(gameState, 25, levels);
            }

            // Remove out-of-screen elements
            if (obs.y > DESIGN_HEIGHT + 100) {
                obstacles.splice(i, 1);
            }
        }

        // Update and move Falling Sky Drops (Power-ups, Mystery Crates, Falling Meteors)
        for (let i = fallingDrops.length - 1; i >= 0; i--) {
            const drop = fallingDrops[i];

            // Trigger incoming drop warning alert when entering viewport
            if (drop.y > -20 && !drop.warningPlayed) {
                drop.warningPlayed = true;
                warningTimer = 1800; // show alert for 1.8s
                playSoundEffect('warning');
            }

            if (!drop.isLanded) {
                // Falling from sky towards projected landing altitude
                drop.y += drop.fallSpeed + (gameState.speed * 0.35);

                // Meteor flame trail while falling
                if (drop.type === 'METEOR' && Math.random() < 0.6) {
                    particles.push({
                        x: drop.x + drop.width / 2 + (Math.random() * 10 - 5),
                        y: drop.y + 4,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random() * 3,
                        size: 3 + Math.random() * 4,
                        color: Math.random() < 0.6 ? '#ff5500' : '#ffd700',
                        life: 18
                    });
                }

                if (drop.y >= drop.targetY) {
                    drop.isLanded = true;
                    drop.y = drop.targetY;
                    // Landing impact effects
                    if (drop.type === 'METEOR') {
                        shakeIntensity = Math.min(8, shakeIntensity + 3);
                        for (let pIdx = 0; pIdx < 16; pIdx++) {
                            particles.push({
                                x: drop.x + drop.width / 2,
                                y: drop.y + drop.height / 2,
                                vx: (Math.random() - 0.5) * 9,
                                vy: (Math.random() - 0.5) * 9,
                                size: 3 + Math.random() * 5,
                                color: Math.random() < 0.6 ? '#ff3700' : '#ffcc00',
                                life: 25
                            });
                        }
                    }
                }
            } else {
                // Landed on track: moves relative to player speed
                drop.y += gameState.speed;
            }

            // Check collision with player
            if (checkCollision(player, drop)) {
                if (drop.type === 'POWERUP_SHIELD') {
                    applyPowerUp(gameState, 'SHIELD');
                    updateScore(gameState, 150, levels);
                    playSoundEffect('powerup');
                    createSparkleBurst(drop.x + drop.width / 2, drop.y + drop.height / 2, '#00f0ff');
                    fallingDrops.splice(i, 1);
                    continue;
                }
                else if (drop.type === 'POWERUP_BOOST') {
                    applyPowerUp(gameState, 'BOOST');
                    gameState.speed = Math.min(levels[gameState.levelIndex].maxSpeed * 1.35, gameState.speed + 4);
                    updateScore(gameState, 150, levels);
                    playSoundEffect('powerup');
                    createSparkleBurst(drop.x + drop.width / 2, drop.y + drop.height / 2, '#ffaa00');
                    fallingDrops.splice(i, 1);
                    continue;
                }
                else if (drop.type === 'POWERUP_MULTIPLIER') {
                    applyPowerUp(gameState, 'MULTIPLIER');
                    updateScore(gameState, 200, levels);
                    playSoundEffect('powerup');
                    createSparkleBurst(drop.x + drop.width / 2, drop.y + drop.height / 2, '#ff007f');
                    fallingDrops.splice(i, 1);
                    continue;
                }
                else if (drop.type === 'MYSTERY_CRATE') {
                    playSoundEffect('gift_smash');
                    shakeIntensity = 4;
                    // Crate shatter debris particles
                    for (let pIdx = 0; pIdx < 14; pIdx++) {
                        particles.push({
                            x: drop.x + drop.width / 2,
                            y: drop.y + drop.height / 2,
                            vx: (Math.random() - 0.5) * 7,
                            vy: (Math.random() - 0.5) * 7,
                            size: 3 + Math.random() * 4,
                            color: Math.random() < 0.5 ? '#00f0ff' : '#ffd700',
                            life: 20
                        });
                    }

                    // 60% chance: beneficial rare power-up / score bonus!
                    if (Math.random() < 0.60) {
                        const gifts = ['SHIELD', 'BOOST', 'MULTIPLIER'];
                        const reward = gifts[Math.floor(Math.random() * gifts.length)];
                        applyPowerUp(gameState, reward);
                        updateScore(gameState, 300, levels);
                        playSoundEffect('powerup');
                    } else {
                        // 40% chance: unstable crate shock hazard
                        if (gameState.shieldActive) {
                            gameState.shieldActive = false;
                            gameState.shieldTimer = 0;
                        } else {
                            player.isSlipping = true;
                            player.slipTimer = 1000;
                            gameState.speed = Math.max(2, gameState.speed * 0.6);
                        }
                    }
                    fallingDrops.splice(i, 1);
                    continue;
                }
                else if (drop.type === 'METEOR') {
                    if (gameState.shieldActive) {
                        gameState.shieldActive = false;
                        gameState.shieldTimer = 0;
                        playSoundEffect('gift_smash');
                        shakeIntensity = 7;
                        for (let pIdx = 0; pIdx < 22; pIdx++) {
                            particles.push({
                                x: drop.x + drop.width / 2,
                                y: drop.y + drop.height / 2,
                                vx: (Math.random() - 0.5) * 11,
                                vy: (Math.random() - 0.5) * 11,
                                size: 3 + Math.random() * 6,
                                color: Math.random() < 0.5 ? '#ff3700' : '#00f0ff',
                                life: 25
                            });
                        }
                        fallingDrops.splice(i, 1);
                        continue;
                    } else {
                        handleCrash(`Your hypercar was obliterated by an incoming celestial meteor in sector ${gameState.levelIndex + 1}!`);
                        return;
                    }
                }
            }

            // Check if player safely passed landed meteor to score bonus points
            if (!drop.passed && drop.y > player.y + player.height) {
                drop.passed = true;
                if (drop.type === 'METEOR') {
                    updateScore(gameState, 40, levels);
                }
            }

            // Remove out-of-screen drops
            if (drop.y > DESIGN_HEIGHT + 120) {
                fallingDrops.splice(i, 1);
            }
        }

        // Distance progression score increments
        if (gameState.speed > 0) {
            updateScore(gameState, Math.floor(gameState.speed * 0.035), levels);
        }

        // Update DOM HUD values directly to prevent layout stutter
        document.getElementById('hud-score').querySelector('.value').textContent = Math.floor(gameState.score).toLocaleString();
        document.getElementById('hud-speed').querySelector('.value').textContent = Math.floor(gameState.speed * 18);
        document.getElementById('hud-level').querySelector('.value').textContent = `${gameState.levelIndex + 1}`;
        document.getElementById('hud-laps').querySelector('.value').textContent = gameState.laps;

        // Refresh power-up badges on HUD
        updateUIOverlays();

        // Check State transitions
        if (gameState.levelClear) {
            playSoundEffect('level_clear');
            updateUIOverlays();
        } else if (gameState.victory) {
            triggerVictory();
        }
    }

    // 2D Canvas Procedural Visual Drawing engine - Cosmic Dreamworld Edition
    function render() {
        ctx.save();
        
        // Apply Screenshake translate
        if (shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * shakeIntensity;
            const dy = (Math.random() - 0.5) * shakeIntensity;
            ctx.translate(dx, dy);
        }

        // 1. Draw Layered Cosmic Dreamworld Environment with active Sector Theme
        drawCosmicEnvironment();

        // 2. Draw Futuristic Neon Highway Track with dynamic corridors and theme colors
        drawFuturisticTrack();

        // 3. Draw Active Particle Effects (Plasma Thrusters, Hazard Sparks & Stardust)
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // 4. Draw Active Cosmic Obstacles & Collectibles
        obstacles.forEach(obs => {
            if (obs.type === 'COIN') {
                drawCoin(obs.x, obs.y, obs.width, obs.height, obs.pulseScale);
            } else if (obs.type === 'OIL') {
                drawOilSlick(obs.x, obs.y, obs.width, obs.height);
            } else if (obs.type === 'CONE') {
                drawTrafficCone(obs.x, obs.y, obs.width, obs.height);
            } else if (obs.type === 'BARRIER') {
                drawBarrier(obs.x, obs.y, obs.width, obs.height);
            }
        });

        // 5. Draw Landing Shadows on track for Airborne Falling Drops
        fallingDrops.forEach(drop => {
            if (!drop.isLanded) {
                drawLandingShadow(drop);
            }
        });

        // 6. Draw Falling Sky Drops (Power-Ups, Mystery Crates, Meteors)
        fallingDrops.forEach(drop => {
            drawFallingDrop(drop);
        });

        // 7. Draw Rival Futuristic Supercars
        enemies.forEach(enemy => {
            drawFuturisticCar(ctx, enemy.x, enemy.y, enemy.width, enemy.height, enemy.theme || enemyThemes[0], false);
        });

        // 8. Draw Player Futuristic Supercar
        drawFuturisticCar(ctx, player.x, player.y, player.width, player.height, playerTheme, true);

        // 9. Draw Active Shield Forcefield Energy Bubble if active
        if (gameState.shieldActive) {
            ctx.save();
            const shieldPulse = 1 + 0.05 * Math.sin(Date.now() * 0.008);
            const cx = player.x + player.width / 2;
            const cy = player.y + player.height / 2;
            const r = 52 * shieldPulse;
            
            ctx.shadowBlur = 22;
            ctx.shadowColor = '#00f0ff';
            
            const shieldGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
            shieldGrad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
            shieldGrad.addColorStop(0.75, 'rgba(157, 0, 255, 0.22)');
            shieldGrad.addColorStop(0.94, 'rgba(0, 240, 255, 0.65)');
            shieldGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
            
            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Orbiting energy sparkles
            const now = Date.now();
            for (let sIdx = 0; sIdx < 3; sIdx++) {
                const sAngle = now * 0.004 + (sIdx * Math.PI * 2) / 3;
                const sx = cx + Math.cos(sAngle) * (r - 2);
                const sy = cy + Math.sin(sAngle) * (r - 2);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    // Helper: Draw Landing Shadow on track surface
    function drawLandingShadow(drop) {
        const shadow = calculateLandingShadow(drop.y, drop.targetY, drop.width, drop.height);
        const shadowX = drop.x + drop.width / 2;
        const shadowY = drop.targetY;
        
        ctx.save();
        ctx.translate(shadowX, shadowY);
        
        if (drop.type === 'METEOR') {
            // Pulsing red/orange warning target circle on track
            const targetPulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.015);
            ctx.strokeStyle = `rgba(255, 60, 0, ${shadow.alpha * targetPulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, shadow.radiusX * 1.35, shadow.radiusY * 1.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Subtle gradient landing shadow on track
        const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, shadow.radiusX);
        shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadow.alpha * 0.85})`);
        shadowGrad.addColorStop(0.7, `rgba(0, 0, 0, ${shadow.alpha * 0.4})`);
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, shadow.radiusX, shadow.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Helper: Draw Falling Sky Drops (Power-ups, Mystery Crates, Meteors)
    function drawFallingDrop(drop) {
        ctx.save();
        const now = Date.now();
        const cx = drop.x + drop.width / 2;
        const cy = drop.y + drop.height / 2;

        if (drop.type === 'POWERUP_SHIELD') {
            // Glowing Shield Power-Up Orb
            const pulse = 1 + 0.1 * Math.sin(now * 0.008 + drop.x);
            ctx.translate(cx, cy);
            ctx.scale(pulse, pulse);

            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00f0ff';

            const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, drop.width * 0.5);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#00f0ff');
            grad.addColorStop(0.85, 'rgba(0, 140, 255, 0.8)');
            grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, drop.width * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Inner shield crest glyph
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0088cc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -drop.height * 0.28);
            ctx.lineTo(drop.width * 0.22, -drop.height * 0.12);
            ctx.lineTo(drop.width * 0.18, drop.height * 0.18);
            ctx.lineTo(0, drop.height * 0.28);
            ctx.lineTo(-drop.width * 0.18, drop.height * 0.18);
            ctx.lineTo(-drop.width * 0.22, -drop.height * 0.12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        else if (drop.type === 'POWERUP_BOOST') {
            // Glowing Hyper-Boost Energy Orb
            const pulse = 1 + 0.1 * Math.sin(now * 0.01 + drop.x);
            ctx.translate(cx, cy);
            ctx.scale(pulse, pulse);

            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffaa00';

            const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, drop.width * 0.5);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.45, '#ffcc00');
            grad.addColorStop(0.85, 'rgba(255, 85, 0, 0.85)');
            grad.addColorStop(1, 'rgba(255, 170, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, drop.width * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Lightning bolt glyph
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(2, -drop.height * 0.26);
            ctx.lineTo(-drop.width * 0.2, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2, drop.height * 0.26);
            ctx.lineTo(drop.width * 0.2, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }
        else if (drop.type === 'POWERUP_MULTIPLIER') {
            // Glowing 2X Multiplier Star
            const pulse = 1 + 0.12 * Math.sin(now * 0.007 + drop.x);
            ctx.translate(cx, cy);
            ctx.scale(pulse, pulse);

            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff007f';

            ctx.fillStyle = '#ff007f';
            ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points * 2; i++) {
                const r = (i % 2 === 0) ? drop.width * 0.5 : drop.width * 0.25;
                const angle = (i * Math.PI) / points;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            ctx.font = "900 13px 'Segoe UI', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText("2X", 0, 1);
        }
        else if (drop.type === 'MYSTERY_CRATE') {
            // Cybernetic Reinforced Mystery Crate
            ctx.translate(drop.x, drop.y);
            const w = drop.width, h = drop.height;

            ctx.shadowBlur = 16;
            ctx.shadowColor = '#00f0ff';

            const crateGrad = ctx.createLinearGradient(0, 0, w, h);
            crateGrad.addColorStop(0, '#251740');
            crateGrad.addColorStop(0.5, '#120b24');
            crateGrad.addColorStop(1, '#080512');
            ctx.fillStyle = crateGrad;
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, w, h);

            ctx.fillStyle = '#ffd700';
            ctx.fillRect(0, 0, 7, 7);
            ctx.fillRect(w - 7, 0, 7, 7);
            ctx.fillRect(0, h - 7, 7, 7);
            ctx.fillRect(w - 7, h - 7, 7, 7);

            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffd700';
            ctx.font = "900 18px 'Segoe UI', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffd700';
            ctx.fillText("?", w / 2, h / 2 + 1);
        }
        else if (drop.type === 'METEOR') {
            // Flaming Celestial Asteroid
            ctx.translate(cx, cy);
            const pulse = 1 + 0.08 * Math.sin(now * 0.015);
            ctx.scale(pulse, pulse);

            ctx.shadowBlur = 24;
            ctx.shadowColor = '#ff3700';

            const flameGrad = ctx.createRadialGradient(0, 0, drop.width * 0.2, 0, 0, drop.width * 0.65);
            flameGrad.addColorStop(0, 'rgba(255, 220, 0, 0.9)');
            flameGrad.addColorStop(0.4, 'rgba(255, 70, 0, 0.7)');
            flameGrad.addColorStop(0.8, 'rgba(180, 20, 0, 0.4)');
            flameGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.arc(0, 0, drop.width * 0.65, 0, Math.PI * 2);
            ctx.fill();

            const coreGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, drop.width * 0.38);
            coreGrad.addColorStop(0, '#5a1e06');
            coreGrad.addColorStop(0.6, '#280c02');
            coreGrad.addColorStop(1, '#110400');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            const r = drop.width * 0.38;
            ctx.moveTo(r * 0.9, 0);
            ctx.lineTo(r * 0.7, r * 0.7);
            ctx.lineTo(0, r * 0.95);
            ctx.lineTo(-r * 0.8, r * 0.6);
            ctx.lineTo(-r * 0.95, 0);
            ctx.lineTo(-r * 0.6, -r * 0.75);
            ctx.lineTo(0, -r * 0.9);
            ctx.lineTo(r * 0.7, -r * 0.65);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffff66';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.4, -r * 0.3);
            ctx.lineTo(0, 0);
            ctx.lineTo(r * 0.4, r * 0.3);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Layered Parallax Cosmic Dreamworld Background Renderer
    function drawCosmicEnvironment() {
        const now = Date.now();
        const theme = sectorThemes[gameState.levelIndex % sectorThemes.length];

        // Layer 0: Deep space void gradient with Sector Theme colors
        const spaceGrad = ctx.createRadialGradient(
            DESIGN_WIDTH * 0.5, DESIGN_HEIGHT * 0.35, 50,
            DESIGN_WIDTH * 0.5, DESIGN_HEIGHT * 0.5, DESIGN_HEIGHT * 0.8
        );
        spaceGrad.addColorStop(0, theme.spaceGrad[0]);
        spaceGrad.addColorStop(0.5, theme.spaceGrad[1]);
        spaceGrad.addColorStop(1, theme.spaceGrad[2]);
        ctx.fillStyle = spaceGrad;
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

        // Layer 1: Swirling Vibrant Nebulae with Sector Theme colors
        nebulae.forEach((n, idx) => {
            ctx.save();
            const pulse = 1 + Math.sin(now * 0.0015 + n.x) * 0.06;
            const r = n.radius * pulse;
            const nebGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
            const nebPair = theme.nebulaeColors[idx % theme.nebulaeColors.length];
            nebGrad.addColorStop(0, nebPair.c1);
            nebGrad.addColorStop(0.5, nebPair.c2);
            nebGrad.addColorStop(1, 'rgba(4, 2, 10, 0)');
            
            ctx.fillStyle = nebGrad;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Layer 2: Multi-Depth Starscape with Shimmer and Diffraction Flares
        stars.forEach(s => {
            ctx.save();
            const currentAlpha = Math.max(0.1, Math.min(1, s.alpha + Math.sin(now * s.flickerSpeed + s.phase) * 0.3));
            ctx.globalAlpha = currentAlpha;
            ctx.fillStyle = s.color;

            if (s.layer === 3) {
                // Bright star with 4-point diffraction cross spikes
                ctx.shadowBlur = 6;
                ctx.shadowColor = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = s.color;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(s.x - s.size * 2, s.y);
                ctx.lineTo(s.x + s.size * 2, s.y);
                ctx.moveTo(s.x, s.y - s.size * 2);
                ctx.lineTo(s.x, s.y + s.size * 2);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        // Layer 3: Floating Celestial Islands with Massive Glowing Crystals
        floatingIslands.forEach(isl => {
            ctx.save();
            const rockGrad = ctx.createLinearGradient(isl.x - isl.w / 2, isl.y, isl.x + isl.w / 2, isl.y + isl.h);
            rockGrad.addColorStop(0, '#1f1338');
            rockGrad.addColorStop(0.6, '#0f0821');
            rockGrad.addColorStop(1, '#05020d');

            ctx.fillStyle = rockGrad;
            ctx.beginPath();
            ctx.moveTo(isl.x, isl.y - isl.h * 0.45);
            ctx.lineTo(isl.x + isl.w * 0.45, isl.y - isl.h * 0.2);
            ctx.lineTo(isl.x + isl.w * 0.5, isl.y + isl.h * 0.25);
            ctx.lineTo(isl.x + isl.w * 0.15, isl.y + isl.h * 0.5);
            ctx.lineTo(isl.x - isl.w * 0.4, isl.y + isl.h * 0.35);
            ctx.lineTo(isl.x - isl.w * 0.48, isl.y - isl.h * 0.15);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(157, 0, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Massive Glowing Crystal Formations protruding from island using sector theme crystal color
            drawCrystalCluster(ctx, isl.x, isl.y, theme.crystalColor);

            ctx.restore();
        });
    }

    // Helper: Draw Massive Glowing Crystal Spires
    function drawCrystalCluster(c, cx, cy, glowColor) {
        c.save();
        c.shadowBlur = 18;
        c.shadowColor = glowColor;

        const crystalHeights = [28, 42, 34, 22];
        const crystalOffsets = [-14, -4, 8, 18];
        const now = Date.now();
        const pulse = 0.85 + Math.sin(now * 0.003 + cx) * 0.15;

        crystalHeights.forEach((h, idx) => {
            const x = cx + crystalOffsets[idx];
            const ch = h * pulse;
            const w = 7;

            const crystGrad = c.createLinearGradient(x - w / 2, cy, x + w / 2, cy - ch);
            crystGrad.addColorStop(0, glowColor);
            crystGrad.addColorStop(0.5, '#ffffff');
            crystGrad.addColorStop(1, glowColor);

            c.fillStyle = crystGrad;
            c.beginPath();
            c.moveTo(x - w / 2, cy);
            c.lineTo(x, cy - ch);
            c.lineTo(x + w / 2, cy);
            c.closePath();
            c.fill();

            c.strokeStyle = '#ffffff';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x, cy - ch);
            c.lineTo(x, cy);
            c.stroke();
        });

        c.restore();
    }

    // Futuristic Neon Highway Track Renderer with Dynamic Corridor and Theme Laser Borders
    function drawFuturisticTrack() {
        const now = Date.now();
        const corridor = getTrackCorridor(gameState.levelIndex);
        const theme = sectorThemes[gameState.levelIndex % sectorThemes.length];

        // 1. Dark cyber asphalt roadbed within dynamic narrowing corridor
        const roadGrad = ctx.createLinearGradient(corridor.left, 0, corridor.right, 0);
        roadGrad.addColorStop(0, '#0a051c');
        roadGrad.addColorStop(0.5, '#130a2a');
        roadGrad.addColorStop(1, '#0a051c');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(corridor.left, 0, corridor.width, DESIGN_HEIGHT);

        // 2. Horizontal perspective cyber-grid scanlines
        ctx.save();
        const gridSpacing = 42;
        const curOffset = bgY % gridSpacing;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1.5;

        for (let y = -gridSpacing; y < DESIGN_HEIGHT + gridSpacing; y += gridSpacing) {
            const lineY = y + curOffset;
            ctx.beginPath();
            ctx.moveTo(corridor.left, lineY);
            ctx.lineTo(corridor.right, lineY);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Dynamic Laser Border (Left Rail: x = corridor.left)
        const laserPulse = 0.8 + 0.2 * Math.sin(now * 0.006);
        ctx.save();
        ctx.strokeStyle = theme.leftRail;
        ctx.lineWidth = 5 * laserPulse;
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.leftRail;
        ctx.beginPath();
        ctx.moveTo(corridor.left, 0);
        ctx.lineTo(corridor.left, DESIGN_HEIGHT);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(corridor.left, 0);
        ctx.lineTo(corridor.left, DESIGN_HEIGHT);
        ctx.stroke();

        const pylonSpacing = 60;
        const pylonOffset = bgY % pylonSpacing;
        ctx.fillStyle = '#ffffff';
        for (let y = -pylonSpacing; y < DESIGN_HEIGHT + pylonSpacing; y += pylonSpacing) {
            const py = y + pylonOffset;
            ctx.beginPath();
            ctx.arc(corridor.left, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 4. Dynamic Laser Border (Right Rail: x = corridor.right)
        ctx.save();
        ctx.strokeStyle = theme.rightRail;
        ctx.lineWidth = 5 * laserPulse;
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.rightRail;
        ctx.beginPath();
        ctx.moveTo(corridor.right, 0);
        ctx.lineTo(corridor.right, DESIGN_HEIGHT);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(corridor.right, 0);
        ctx.lineTo(corridor.right, DESIGN_HEIGHT);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        for (let y = -pylonSpacing; y < DESIGN_HEIGHT + pylonSpacing; y += pylonSpacing) {
            const py = y + pylonOffset;
            ctx.beginPath();
            ctx.arc(corridor.right, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 5. Dual Dynamic Neon Energy Lane Dividers
        ctx.save();
        ctx.strokeStyle = theme.divider;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.leftRail;
        ctx.setLineDash([28, 26]);
        ctx.lineDashOffset = -bgY;

        const div1 = corridor.left + corridor.width * 0.33;
        const div2 = corridor.left + corridor.width * 0.67;

        ctx.beginPath();
        ctx.moveTo(div1, 0);
        ctx.lineTo(div1, DESIGN_HEIGHT);
        ctx.moveTo(div2, 0);
        ctx.lineTo(div2, DESIGN_HEIGHT);
        ctx.stroke();
        ctx.restore();
    }

    // Futuristic Supercar Procedural Renderer with Underglow & Glowing Numbers
    function drawFuturisticCar(c, x, y, w, h, theme, isPlayerCar) {
        c.save();
        const now = Date.now();
        const underglowColor = theme.underglow || '#00f0ff';
        const primaryColor = theme.primary || '#00f0ff';
        const secondaryColor = theme.secondary || '#071a33';
        const racingNumber = isPlayerCar ? '07' : (theme.number || '88');

        // 1. Vibrant Neon Underglow Pool on the Track Surface
        c.save();
        c.shadowColor = underglowColor;
        c.shadowBlur = 24;
        c.fillStyle = underglowColor;
        c.beginPath();
        c.ellipse(x + w / 2, y + h / 2 + 4, w * 0.72, h * 0.44, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 2. Cyber Wheels with Glowing Neon Rim Centers
        c.fillStyle = '#08060f';
        // Front-left wheel
        c.fillRect(x - 5, y + 12, 6, 16);
        // Front-right wheel
        c.fillRect(x + w - 1, y + 12, 6, 16);
        // Rear-left wheel
        c.fillRect(x - 5, y + h - 28, 6, 18);
        // Rear-right wheel
        c.fillRect(x + w - 1, y + h - 28, 6, 18);

        // Glowing wheel rim rings
        c.fillStyle = underglowColor;
        c.fillRect(x - 4, y + 16, 2, 8);
        c.fillRect(x + w + 2, y + 16, 2, 8);
        c.fillRect(x - 4, y + h - 24, 2, 10);
        c.fillRect(x + w + 2, y + h - 24, 2, 10);

        // 3. Sleek Aerodynamic Supercar Chassis (Metallic Gradient)
        const bodyGrad = c.createLinearGradient(x + w / 2, y, x + w / 2, y + h);
        if (isPlayerCar) {
            // Player: Metallic Teal to Deep Midnight Cyan
            bodyGrad.addColorStop(0, '#e0f7fa');
            bodyGrad.addColorStop(0.2, '#00f0ff');
            bodyGrad.addColorStop(0.65, '#0077b6');
            bodyGrad.addColorStop(1, '#03045e');
        } else {
            // Enemy: Vibrant thematic metallic gradient
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.25, primaryColor);
            bodyGrad.addColorStop(0.75, secondaryColor);
            bodyGrad.addColorStop(1, '#080512');
        }

        c.fillStyle = bodyGrad;
        c.beginPath();
        // Aerodynamic wedge nose
        c.moveTo(x + w * 0.5, y + 1);
        c.lineTo(x + w * 0.82, y + 8);
        // Front aggressive air splitter
        c.lineTo(x + w * 0.94, y + 16);
        // Swept flank line & side air intake
        c.lineTo(x + w * 0.88, y + h * 0.45);
        c.lineTo(x + w * 0.96, y + h - 14);
        // Rear aero diffuser
        c.lineTo(x + w * 0.76, y + h - 10);
        c.lineTo(x + w * 0.5, y + h - 12);
        c.lineTo(x + w * 0.24, y + h - 10);
        c.lineTo(x + w * 0.04, y + h - 14);
        // Left flank line & intake
        c.lineTo(x + w * 0.12, y + h * 0.45);
        c.lineTo(x + w * 0.06, y + 16);
        c.lineTo(x + w * 0.18, y + 8);
        c.closePath();
        c.fill();

        // 4. Specular Metallic Bevel Highlights
        c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + w * 0.25, y + 9);
        c.lineTo(x + w * 0.5, y + 3);
        c.lineTo(x + w * 0.75, y + 9);
        c.stroke();

        // 5. Panoramic Cyber-Cockpit Glass (Polarized Holographic Sheen)
        const canopyGrad = c.createLinearGradient(x + w / 2, y + h * 0.28, x + w / 2, y + h * 0.54);
        canopyGrad.addColorStop(0, '#04020a');
        canopyGrad.addColorStop(0.5, '#1e1136');
        canopyGrad.addColorStop(1, '#05020d');

        c.fillStyle = canopyGrad;
        c.beginPath();
        c.moveTo(x + w * 0.26, y + h * 0.30);
        c.lineTo(x + w * 0.74, y + h * 0.30);
        c.lineTo(x + w * 0.82, y + h * 0.52);
        c.lineTo(x + w * 0.18, y + h * 0.52);
        c.closePath();
        c.fill();

        // Cockpit holographic cyan/violet reflection
        c.fillStyle = 'rgba(0, 240, 255, 0.28)';
        c.beginPath();
        c.moveTo(x + w * 0.28, y + h * 0.32);
        c.lineTo(x + w * 0.50, y + h * 0.32);
        c.lineTo(x + w * 0.44, y + h * 0.50);
        c.lineTo(x + w * 0.22, y + h * 0.50);
        c.closePath();
        c.fill();

        // 6. Glowing Emissive Racing Numbers on the Chassis
        c.save();
        c.shadowColor = underglowColor;
        c.shadowBlur = 8;
        c.font = "900 12px 'Segoe UI', -apple-system, monospace";
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#ffffff';
        c.fillText(racingNumber, x + w * 0.5, y + h * 0.21);
        c.restore();

        // 7. Dual LED Projection Headlights (Yellow/Cyan Beam Projectors)
        c.fillStyle = isPlayerCar ? '#ffffff' : '#fefe33';
        c.shadowColor = isPlayerCar ? '#00f0ff' : '#fefe33';
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(x + w * 0.26, y + 5, 2.5, 0, Math.PI * 2);
        c.arc(x + w * 0.74, y + 5, 2.5, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;

        // 8. Rear Carbon Spoiler Wing & Taillight Ribbon
        c.fillStyle = '#06030c';
        c.fillRect(x - 4, y + h - 10, w + 8, 5);
        c.fillRect(x - 5, y + h - 13, 2, 8);
        c.fillRect(x + w + 3, y + h - 13, 2, 8);

        // Glowing neon taillight bar
        c.fillStyle = '#ff0055';
        c.shadowColor = '#ff0055';
        c.shadowBlur = 8;
        c.fillRect(x + w * 0.15, y + h - 13, w * 0.7, 2);
        c.shadowBlur = 0;

        // 9. Twin Plasma Jet Exhaust Flame Animation
        const flamePulse = 0.8 + Math.random() * 0.4;
        const flameH = (isPlayerCar && gameState.speed > 1 ? 12 : 6) * flamePulse;
        const thrusterGrad = c.createLinearGradient(0, y + h - 8, 0, y + h - 8 + flameH);
        thrusterGrad.addColorStop(0, '#ffffff');
        thrusterGrad.addColorStop(0.3, underglowColor);
        thrusterGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        c.fillStyle = thrusterGrad;
        c.beginPath();
        // Left nozzle flame
        c.moveTo(x + w * 0.28 - 2, y + h - 8);
        c.lineTo(x + w * 0.28, y + h - 8 + flameH);
        c.lineTo(x + w * 0.28 + 2, y + h - 8);
        // Right nozzle flame
        c.moveTo(x + w * 0.72 - 2, y + h - 8);
        c.lineTo(x + w * 0.72, y + h - 8 + flameH);
        c.lineTo(x + w * 0.72 + 2, y + h - 8);
        c.fill();

        c.restore();
    }

    // Backward-compatibility alias for drawCar
    function drawCar(c, x, y, w, h, bodyColor, isPlayerCar) {
        drawFuturisticCar(c, x, y, w, h, isPlayerCar ? playerTheme : { primary: bodyColor, secondary: '#111', underglow: bodyColor, number: '88' }, isPlayerCar);
    }

    // Starlight Energy Core (Collectible Currency)
    function drawCoin(x, y, w, h, pulseScale) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.scale(pulseScale, 1);

        // Radiant Outer Corona Glow
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ffd700';

        // 8-Pointed Cosmic Energy Star
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        const points = 8;
        const outerR = w / 2;
        const innerR = w / 4;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const angle = (i * Math.PI) / points;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Glowing core center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Quantum Void Vortex (Slippery Anomaly Hazard)
    function drawOilSlick(x, y, w, h) {
        ctx.save();
        const now = Date.now();
        ctx.translate(x + w / 2, y + h / 2);

        // Outer Gravitational Distortion Aura
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#9d00ff';

        // Swirling Ethereal Void
        const voidGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, w / 2);
        voidGrad.addColorStop(0, '#04020a');
        voidGrad.addColorStop(0.5, 'rgba(157, 0, 255, 0.7)');
        voidGrad.addColorStop(0.85, 'rgba(255, 0, 127, 0.5)');
        voidGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.fillStyle = voidGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Event Horizon Energy Rings
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.35, h * 0.28, (now * 0.003) % (Math.PI * 2), 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // Prismatic Crystal Hazard Spikes (Traffic Cone Equivalent)
    function drawTrafficCone(x, y, w, h) {
        ctx.save();
        const now = Date.now();
        const pulse = 0.9 + 0.1 * Math.sin(now * 0.005 + x);

        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff007f';

        // Glowing dark crystal base
        ctx.fillStyle = '#180a2a';
        ctx.fillRect(x, y + h - 6, w, 6);

        // Center sharp crystal shard
        const shardGrad = ctx.createLinearGradient(x + w / 2, y + h, x + w / 2, y);
        shardGrad.addColorStop(0, '#ff007f');
        shardGrad.addColorStop(0.5, '#ffffff');
        shardGrad.addColorStop(1, '#ff007f');

        ctx.fillStyle = shardGrad;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h - 6);
        ctx.lineTo(x + w * 0.5, y + (1 - pulse) * 5);
        ctx.lineTo(x + w * 0.85, y + h - 6);
        ctx.closePath();
        ctx.fill();

        // Specular facet line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.5, y + h - 6);
        ctx.stroke();

        ctx.restore();
    }

    // Laser Energy Barricade (Heavy Barrier)
    function drawBarrier(x, y, w, h) {
        ctx.save();
        const now = Date.now();
        const beamPulse = 0.8 + 0.2 * Math.sin(now * 0.015);

        // Chrome Cyber Pylons on Left and Right
        ctx.fillStyle = '#2d1b4d';
        ctx.fillRect(x, y, 10, h);
        ctx.fillRect(x + w - 10, y, 10, h);

        // Pylon glowing neon caps
        ctx.fillStyle = '#ff5500';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff5500';
        ctx.fillRect(x - 1, y - 2, 12, 4);
        ctx.fillRect(x + w - 11, y - 2, 12, 4);

        // High-Voltage Crackling Laser Forcefield
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 4 * beamPulse;
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + h * 0.35);
        ctx.lineTo(x + w - 10, y + h * 0.35);
        ctx.moveTo(x + 10, y + h * 0.65);
        ctx.lineTo(x + w - 10, y + h * 0.65);
        ctx.stroke();

        // White core laser lightning
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + h * 0.5);
        ctx.lineTo(x + w - 10, y + h * 0.5);
        ctx.stroke();

        ctx.restore();
    }

    // Initialize game automatically when DOM is ready
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
}

// Node.js Environment Conditional Module Exports for Testing Harness
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkCollision,
        updateScore,
        levels,
        sectorThemes,
        getTrackCorridor,
        calculateLandingShadow,
        applyPowerUp,
        applySectorVisualTheme,
        gameState,
        calculateCanvasDimensions,
        screenToLogicalCoord,
        DESIGN_WIDTH,
        DESIGN_HEIGHT
    };
}
