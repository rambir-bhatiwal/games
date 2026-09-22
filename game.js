/**
 * COSMIC GATE RUNNER - game.js
 * 
 * High-Speed Pseudo-3D Endless Gate-Runner with Quiz Barrier Mechanics.
 * Designed for 100% compliance with rules.md, featuring:
 * - 3-Lane Track System (Left, Center, Right) with smooth lane shifting
 * - Jump and Slide mechanics with vertical hitbox clearance
 * - Quiz Barrier Gates every 5 seconds with 3-arch physical lane choices
 * - Checkpoint retention system with 3-second invulnerability shield
 * - Parallax backgrounds matching the 3 visual world themes across 10 levels
 * - Web Audio API sound synthesis and BGM integration
 * - Full platform lifecycle hooks (FBInstant & visibilitychange)
 * - Pure helper functions exported for Node.js automated test harness
 */

// --- Global Configuration ---
const DESIGN_WIDTH = 600;
const DESIGN_HEIGHT = 800;

// 3-Lane World X Coordinates
// 3-Lane World X Coordinates
const LANE_X = [-140, 0, 140]; // Lane 0: Left, Lane 1: Center, Lane 2: Right
const TRACK_HALF_WIDTH = 260; // Stretches wide across the bottom edge (520px total width)

/**
 * Pure 3D Perspective Projection Function
 * Projects 3D world space (x3d, y3d, z3d) onto 2D viewport coordinates.
 * True pseudo-3D perspective projection where:
 * - Base of the track MUST begin at the absolute bottom edge of the screen (y = canvas.height)
 * - The horizon (vanishing point) converges near the top third of the screen (y = canvas.height * 0.35 = 280px)
 * - Dynamic perspective scale diminishes smoothly toward vanishing point
 * 
 * @param {number} x3d Lateral offset relative to track center
 * @param {number} y3d Altitude above track surface (jump height)
 * @param {number} z3d Distance from camera (0 = player near plane, 1000 = horizon)
 * @param {number} width Viewport width
 * @param {number} height Viewport height
 * @returns {Object} Screen { x, y, scale }
 */
function project3D(x3d, y3d, z3d, width = DESIGN_WIDTH, height = DESIGN_HEIGHT) {
    const horizonY = height * 0.35; // 280px from top (top third of screen vanishing point)
    const t = Math.min(1.0, z3d / 1000);
    const u = Math.max(0, 1.0 - t);
    const scale = 0.22 + 0.78 * Math.pow(u, 1.5);
    const screenX = (width * 0.5) + (x3d * scale);
    const roadY = horizonY + (height - horizonY) * Math.pow(u, 1.8);
    const screenY = roadY - (y3d * scale * 1.5);
    
    return {
        x: screenX,
        y: screenY,
        scale: scale
    };
}

/**
 * Pure helper function to compute responsive canvas dimensions preserving aspect ratio.
 */
function calculateCanvasDimensions(viewWidth, viewHeight, designWidth = DESIGN_WIDTH, designHeight = DESIGN_HEIGHT) {
    const designRatio = designWidth / designHeight;
    const viewRatio = viewWidth / viewHeight;

    let scale;
    let width, height;

    if (viewRatio > designRatio) {
        // Wider than design aspect ratio -> fit height, letterbox sides
        scale = viewHeight / designHeight;
        width = designWidth * scale;
        height = viewHeight;
    } else {
        // Taller than design aspect ratio -> fit width, letterbox top/bottom
        scale = viewWidth / designWidth;
        width = viewWidth;
        height = designHeight * scale;
    }

    return {
        width,
        height,
        scale
    };
}

/**
 * Pure helper function to convert client screen coordinate to logical coordinate space.
 */
function screenToLogicalCoord(clientX, clientY, rect, designWidth = DESIGN_WIDTH, designHeight = DESIGN_HEIGHT) {
    if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 };
    const x = ((clientX - rect.left) / rect.width) * designWidth;
    const y = ((clientY - rect.top) / rect.height) * designHeight;
    return { x, y };
}

/**
 * Pure Collision Checker in Pseudo-3D Runner Space
 * Validates whether the player collides with an obstacle or gate based on lane, Z-depth,
 * and vertical jump/slide clearances.
 */
function checkRunnerCollision(player, entity) {
    if (!player || !entity) return false;

    // Check Z-axis depth overlap (entity must be in the collision zone near player)
    const zOverlap = Math.abs(entity.z - player.z) <= (entity.depth || 30);
    if (!zOverlap) return false;

    // Check Lane match (player must be in same lane or transitioning across it)
    const laneMatch = Math.abs(player.x3d - LANE_X[entity.lane]) < 65;
    if (!laneMatch) return false;

    // Check vertical avoidance mechanics
    if (entity.type === 'HURDLE') {
        // Low obstacle: Jump over to avoid! (Player jump height must clear obstacle height)
        if (player.jumpY > 28) {
            return false; // Safely jumped over!
        }
        return true; // Tripped over hurdle!
    } 
    else if (entity.type === 'LASER_BAR') {
        // High obstacle: Slide under to avoid!
        if (player.isSliding) {
            return false; // Safely slided underneath!
        }
        return true; // Smacked into overhead laser bar!
    }
    else if (entity.type === 'COIN' || entity.type === 'GIFT') {
        // Collectibles are picked up regardless of slight jump variance
        return true;
    }
    else if (entity.type === 'QUIZ_GATE') {
        // Physical Gate Arch: collision occurs when entering the gate arch plane
        return true;
    }

    return true;
}

const BASE_SPEED_SCALE = 0.70; // Reduce base starting speed by 30% for manageable pacing

// Curated atmospheric background themes for randomized runs
const RUN_PALETTES = [
    { name: 'Deep Crimson', hueShift: 335, overlayTint: 'rgba(255, 15, 60, 0.20)', glowColor: '#ff003c' },
    { name: 'Emerald Nebula', hueShift: 125, overlayTint: 'rgba(0, 255, 128, 0.18)', glowColor: '#00ff7f' },
    { name: 'Ultraviolet Abyss', hueShift: 275, overlayTint: 'rgba(180, 0, 255, 0.20)', glowColor: '#b026ff' },
    { name: 'Solar Amber', hueShift: 45, overlayTint: 'rgba(255, 150, 0, 0.18)', glowColor: '#ffaa00' },
    { name: 'Electric Cyan', hueShift: 190, overlayTint: 'rgba(0, 230, 255, 0.18)', glowColor: '#00f0ff' },
    { name: 'Magenta Cyber', hueShift: 300, overlayTint: 'rgba(255, 0, 180, 0.20)', glowColor: '#ff00b4' }
];

// Bright, highly saturated neon colors for randomized track lines and vertical gate pylons
const SATURATED_NEONS = [
    { name: 'Hot Pink', hex: '#ff007f', rgb: '255, 0, 127' },
    { name: 'Lime Green', hex: '#39ff14', rgb: '57, 255, 20' },
    { name: 'Bright Orange', hex: '#ff6600', rgb: '255, 102, 0' },
    { name: 'Electric Cyan', hex: '#00f0ff', rgb: '0, 240, 255' },
    { name: 'Neon Yellow', hex: '#ffe600', rgb: '255, 230, 0' },
    { name: 'Ultraviolet', hex: '#b026ff', rgb: '176, 38, 255' },
    { name: 'Electric Crimson', hex: '#ff003c', rgb: '255, 0, 60' },
    { name: 'Aqua Marine', hex: '#00ffaa', rgb: '0, 255, 170' }
];

function getRandomNeonPalette() {
    const shuffled = [...SATURATED_NEONS].sort(() => Math.random() - 0.5);
    return {
        outerRail: shuffled[0].hex,
        innerRail: shuffled[1].hex,
        gridLines: `rgba(${shuffled[2].rgb}, 0.16)`,
        runesAndTies: shuffled[2].hex,
        chevrons: shuffled[3].hex,
        gatePylons: shuffled[4].hex,
        gateBeams: shuffled[5].hex,
        gateAccents: shuffled[0].hex
    };
}

function getRandomRunVisualTheme() {
    return RUN_PALETTES[Math.floor(Math.random() * RUN_PALETTES.length)];
}

// Initial Game State definition
let gameState = {
    score: 0,
    stageScore: 0,
    coins: 0,
    lives: 3,
    maxLives: 3,
    levelIndex: 0,
    gatesCleared: 0,
    speed: 6.5,
    distance: 0,
    timeInStage: 0,
    totalTime: 0,
    gameOver: false,
    levelClear: false,
    victory: false,
    isPaused: false,
    currentScreen: 'START', // 'START', 'PLAYING', 'LEVEL_CLEAR', 'GAME_OVER', 'VICTORY'
    gateIntervalTimer: 0, // counts up to 5000ms
    activeQuiz: null, // holds currently approaching quiz challenge
    multiplierTimer: 0,
    speedBoostTimer: 0,
    bulletTimeFactor: 1.0, // Slow-motion multiplier (1.0 = normal, 0.25 = bullet time)
    targetBulletTimeFactor: 1.0,
    pauseTime: 0,
    runVisualTheme: getRandomRunVisualTheme(),
    neonColors: getRandomNeonPalette(),
    lastCheckpoint: {
        levelIndex: 0,
        score: 0,
        coins: 0,
        gatesCleared: 0
    }
};

// Player Runner State
let player = {
    lane: 1, // 0: Left, 1: Center, 2: Right
    x3d: 0, // interpolated lateral position
    targetX3d: 0,
    z: 0, // fixed player plane
    jumpY: 0,
    jumpVy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    invulnerableTimer: 0, // 3000ms on checkpoint respawn
    runCycle: 0
};

// Runner World Entities Lists
let trackObstacles = [];
let trackCollectibles = [];
let activeGates = [];
let runnerParticles = [];

// Parallax Decorative Entities
let bgStars = [];
let bgGears = [];
let bgIslands = [];
let bgWaterfalls = [];

// Reference Background Image (Loaded from image/background.jpeg)
let bgImage = null;
let bgImageLoaded = false;

// Time & Loop Bookkeeping
let lastFrameTime = 0;
let stageStartTime = 0;
let raceStartTime = 0;
let lastObstacleSpawnTime = 0;
let lastCoinSpawnTime = 0;
let shakeIntensity = 0;

// Input tracking
let keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// Touch drag & swipe tracking
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

// Browser Environment Execution Block
if (typeof window !== 'undefined') {
    let canvas, ctx;
    let animationFrameId = null;

    // Initialize Game Engine on DOM Ready
    function initGame() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Setup universal responsiveness
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Preload Reference Background Art
        bgImage = new Image();
        bgImage.onload = () => { 
            bgImageLoaded = true; 
            if (gameState.currentScreen === 'START') {
                renderScene();
            }
        };
        bgImage.onerror = () => { bgImageLoaded = false; };
        bgImage.src = 'image/background.jpeg';

        // Initialize Parallax Environments
        initParallaxWorld();

        // Setup DOM Event Listeners
        setupEventListeners();

        // Setup Platform Lifecycle Handlers (YouTube Playables & FBInstant)
        setupPlatformLifecycles();

        // Game must NOT start automatically on page load: Pause in START screen
        gameState.currentScreen = 'START';
        gameState.gateIntervalTimer = 0;
        gameState.activeQuiz = null;

        // Render static initial scene and display Start Screen overlay
        updateUI();
        renderScene();
        // NOTE: requestAnimationFrame(gameLoop) is intentionally NOT called here
        // The game loop remains paused until the player explicitly initiates the game!
    }

    // Setup User Input & Button Event Listeners
    function setupEventListeners() {
        // Start Screen: Clicking anywhere on overlay or Start button launches the game
        const startOverlay = document.getElementById('start-screen');
        if (startOverlay) {
            startOverlay.addEventListener('click', () => {
                if (gameState.currentScreen === 'START') {
                    if (window.soundEngine) window.soundEngine.init();
                    startRun();
                }
            });
        }

        document.getElementById('start-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) window.soundEngine.init();
            startRun();
        });
        document.getElementById('next-level-btn').addEventListener('click', proceedToNextLevel);
        document.getElementById('retry-btn').addEventListener('click', retryFromCheckpoint);
        document.getElementById('restart-btn').addEventListener('click', restartFromBeginning);
        document.getElementById('resume-btn').addEventListener('click', togglePause);

        // HUD Quick Action Buttons
        document.getElementById('hud-pause-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePause();
        });

        const audioBtn = document.getElementById('hud-audio-btn');
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) {
                const isMuted = window.soundEngine.toggleMute();
                audioBtn.textContent = isMuted ? '🔇' : '🔊';
            }
        });

        // Keyboard Controls
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Touch & Swipe Controls on Canvas
        canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
        canvas.addEventListener('touchend', handleTouchEnd);

        // On-Screen Virtual Touch Buttons
        const touchLeft = document.getElementById('touch-left');
        const touchRight = document.getElementById('touch-right');
        const touchJump = document.getElementById('touch-jump');
        const touchSlide = document.getElementById('touch-slide');

        if (touchLeft) touchLeft.addEventListener('click', () => shiftLane(-1));
        if (touchRight) touchRight.addEventListener('click', () => shiftLane(1));
        if (touchJump) touchJump.addEventListener('click', triggerJump);
        if (touchSlide) touchSlide.addEventListener('click', triggerSlide);
    }

    // Platform Lifecycles (FBInstant & Visibility Change)
    function setupPlatformLifecycles() {
        // Facebook Instant Games SDK Lifecycle
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
                if (window.soundEngine) {
                    window.soundEngine.suspendContext();
                }
            } else {
                if (window.soundEngine && gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                    window.soundEngine.resumeContext();
                }
            }
        });
    }

    // Universal Responsiveness Resizing
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const dims = calculateCanvasDimensions(window.innerWidth, window.innerHeight, DESIGN_WIDTH, DESIGN_HEIGHT);

        canvas.width = DESIGN_WIDTH;
        canvas.height = DESIGN_HEIGHT;
        canvas.style.width = `${dims.width}px`;
        canvas.style.height = `${dims.height}px`;

        container.style.width = `${dims.width}px`;
        container.style.height = `${dims.height}px`;
    }

    // Initialize Parallax Entities (Radial Forward-Motion Starfield, Floating Islands, Rotating Gears)
    function initParallaxWorld() {
        // Forward-Motion Radial Warp Starfield (Driver's POV radiating from vanishing point)
        bgStars = [];
        const starColors = ['#00f0ff', '#ff007f', '#ffd700', '#ffffff', '#00ffaa', '#d28eff'];
        for (let i = 0; i < 180; i++) {
            bgStars.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.pow(Math.random(), 1.5) * 580, // Non-linear distribution, more stars starting near center
                speed: 1.2 + Math.random() * 2.8,
                baseSize: 0.8 + Math.random() * 2.2,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }

        // Floating Islands (Celestial Crystal Realm Theme 1 - above horizon 280px)
        bgIslands = [
            { x: 70, y: 150, w: 90, h: 50, speed: 0.12, crystalColor: '#00f0ff' },
            { x: 530, y: 130, w: 110, h: 58, speed: 0.15, crystalColor: '#ff007f' },
            { x: 130, y: 220, w: 80, h: 42, speed: 0.20, crystalColor: '#9d00ff' },
            { x: 470, y: 230, w: 95, h: 48, speed: 0.22, crystalColor: '#00f0ff' }
        ];

        // Rotating Brass & Verdigris Gears (Clockwork Astral Sanctuary Theme 3 - above horizon)
        bgGears = [
            { x: 90, y: 160, radius: 46, teeth: 12, speed: 0.008, angle: 0, color: '#d4af37' },
            { x: 160, y: 200, radius: 30, teeth: 8, speed: -0.012, angle: 0, color: '#00ffaa' },
            { x: 510, y: 150, radius: 54, teeth: 14, speed: -0.007, angle: 0, color: '#d4af37' },
            { x: 440, y: 200, radius: 34, teeth: 9, speed: 0.011, angle: 0, color: '#00d2ff' }
        ];
    }

    // Keyboard Input Handlers
    function handleKeyDown(e) {
        // Spacebar to start / continue / retry
        if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
            if (gameState.currentScreen === 'START') {
                if (window.soundEngine) window.soundEngine.init();
                startRun();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'LEVEL_CLEAR') {
                proceedToNextLevel();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'GAME_OVER') {
                retryFromCheckpoint();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'VICTORY') {
                restartFromBeginning();
                e.preventDefault();
                return;
            } else if (gameState.currentScreen === 'PLAYING') {
                triggerJump();
                e.preventDefault();
                return;
            }
        }

        // P or Escape to Pause / Resume
        if (e.code === 'KeyP' || e.code === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (gameState.currentScreen === 'PLAYING') {
                togglePause();
                e.preventDefault();
                return;
            }
        }

        // Arrow and WASD Keys for Running Mechanics
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                shiftLane(-1);
                break;
            case 'ArrowRight':
            case 'KeyD':
                shiftLane(1);
                break;
            case 'ArrowUp':
            case 'KeyW':
                triggerJump();
                break;
            case 'ArrowDown':
            case 'KeyS':
                triggerSlide();
                break;
        }
    }

    function handleKeyUp(e) {
        // Released keys bookkeeping if needed
    }

    // Touch and Swipe Event Handlers
    function handleTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }

    function handleTouchMove(e) {
        // Passive tracking
    }

    function handleTouchEnd(e) {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Swipe threshold: at least 30px within 500ms
        if (elapsed < 500) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal Swipe
                if (deltaX > 30) shiftLane(1);
                else if (deltaX < -30) shiftLane(-1);
            } else {
                // Vertical Swipe
                if (deltaY < -30) triggerJump();
                else if (deltaY > 30) triggerSlide();
            }
        }
    }

    // Lane Shifting Action
    function shiftLane(dir) {
        if (gameState.currentScreen !== 'PLAYING' || gameState.isPaused) return;
        const newLane = Math.max(0, Math.min(2, player.lane + dir));
        if (newLane !== player.lane) {
            player.lane = newLane;
            player.targetX3d = LANE_X[newLane];
        }
    }

    // Jump Action
    function triggerJump() {
        if (gameState.currentScreen !== 'PLAYING' || gameState.isPaused) return;
        if (!player.isJumping && !player.isSliding) {
            player.isJumping = true;
            player.jumpVy = 13.5;
            if (window.soundEngine) window.soundEngine.playJump();
        }
    }

    // Slide Action
    function triggerSlide() {
        if (gameState.currentScreen !== 'PLAYING' || gameState.isPaused) return;
        if (!player.isJumping) {
            player.isSliding = true;
            player.slideTimer = 650; // 650ms slide duration
            if (window.soundEngine) window.soundEngine.playSlide();
        }
    }

    // --- GAMEPLAY LIFECYCLE & STATE TRANSITIONS ---

    function startRun() {
        gameState.score = 0;
        gameState.stageScore = 0;
        gameState.coins = 0;
        gameState.lives = 3;
        gameState.levelIndex = 0;
        gameState.gatesCleared = 0;
        gameState.distance = 0;
        gameState.timeInStage = 0;
        gameState.totalTime = 0;
        gameState.gameOver = false;
        gameState.levelClear = false;
        gameState.victory = false;
        gameState.isPaused = false;
        gameState.currentScreen = 'PLAYING';
        gameState.gateIntervalTimer = 0;
        gameState.activeQuiz = null;
        gameState.bulletTimeFactor = 1.0;
        gameState.targetBulletTimeFactor = 1.0;
        gameState.pauseTime = 0;

        // Randomize visual background palette and neon track colors for unique run atmosphere
        gameState.runVisualTheme = getRandomRunVisualTheme();
        gameState.neonColors = getRandomNeonPalette();

        // Hide quiz banner on the starting line
        const quizBanner = document.getElementById('quiz-banner');
        if (quizBanner) quizBanner.classList.add('hidden');

        // Reset Player Position & Timers
        player.lane = 1;
        player.x3d = 0;
        player.targetX3d = 0;
        player.jumpY = 0;
        player.jumpVy = 0;
        player.isJumping = false;
        player.isSliding = false;
        player.slideTimer = 0;
        player.invulnerableTimer = 0;

        // Clear Entities
        trackObstacles = [];
        trackCollectibles = [];
        activeGates = [];
        runnerParticles = [];

        // Save initial checkpoint
        saveCheckpoint();

        // Timing
        stageStartTime = Date.now();
        raceStartTime = Date.now();
        lastFrameTime = Date.now();
        lastObstacleSpawnTime = Date.now();
        lastCoinSpawnTime = Date.now();

        // Audio & HUD
        if (window.soundEngine) {
            window.soundEngine.startBGM();
        }
        updateUI();

        // Start the Main Game Loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function saveCheckpoint() {
        gameState.lastCheckpoint = {
            levelIndex: gameState.levelIndex,
            score: gameState.score,
            coins: gameState.coins,
            gatesCleared: gameState.gatesCleared
        };
    }

    function retryFromCheckpoint() {
        // Restore checkpoint parameters so player progress is preserved
        const cp = gameState.lastCheckpoint;
        gameState.levelIndex = cp.levelIndex;
        gameState.score = cp.score;
        gameState.coins = cp.coins;
        gameState.gatesCleared = cp.gatesCleared;
        gameState.lives = 3; // Replenish shields on checkpoint respawn
        gameState.gameOver = false;
        gameState.currentScreen = 'PLAYING';
        gameState.gateIntervalTimer = 0;
        gameState.activeQuiz = null;

        // Hide quiz banner until the 5s threshold is met
        const quizBanner = document.getElementById('quiz-banner');
        if (quizBanner) quizBanner.classList.add('hidden');

        // Center player with 3-second invulnerability shield!
        player.lane = 1;
        player.x3d = 0;
        player.targetX3d = 0;
        player.jumpY = 0;
        player.jumpVy = 0;
        player.isJumping = false;
        player.isSliding = false;
        player.slideTimer = 0;
        player.invulnerableTimer = 3000; // 3 seconds invulnerability

        // Clear immediate colliding entities
        trackObstacles = [];
        activeGates = [];

        lastFrameTime = Date.now();
        if (window.soundEngine) window.soundEngine.startBGM();
        updateUI();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function restartFromBeginning() {
        startRun();
    }

    function proceedToNextLevel() {
        if (!gameState.levelClear) return;
        
        gameState.levelIndex++;
        gameState.stageScore = 0;
        gameState.gatesCleared = 0;
        gameState.levelClear = false;
        gameState.currentScreen = 'PLAYING';
        gameState.gateIntervalTimer = 0;
        gameState.activeQuiz = null;

        // Hide quiz banner until 5s threshold
        const quizBanner = document.getElementById('quiz-banner');
        if (quizBanner) quizBanner.classList.add('hidden');

        // Replenish player lives and set invulnerability shield
        gameState.lives = Math.min(3, gameState.lives + 1);
        player.lane = 1;
        player.x3d = 0;
        player.targetX3d = 0;
        player.invulnerableTimer = 2500;

        // Clear entities
        trackObstacles = [];
        trackCollectibles = [];
        activeGates = [];

        saveCheckpoint();

        stageStartTime = Date.now();
        lastFrameTime = Date.now();

        if (window.soundEngine) {
            window.soundEngine.startBGM();
            window.soundEngine.playCoin();
        }
        updateUI();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function togglePause() {
        if (gameState.currentScreen !== 'PLAYING') return;
        gameState.isPaused = !gameState.isPaused;

        if (gameState.isPaused) {
            gameState.pauseTime = Date.now();
            if (window.soundEngine) window.soundEngine.suspendContext();
        } else {
            const pauseDuration = Date.now() - (gameState.pauseTime || Date.now());
            lastFrameTime = Date.now();
            lastObstacleSpawnTime += pauseDuration;
            lastCoinSpawnTime += pauseDuration;
            if (window.soundEngine) window.soundEngine.resumeContext();
        }

        updateUI();
    }

    function handlePlayerCrash(reason) {
        // If invulnerable shield is active, ignore collision
        if (player.invulnerableTimer > 0) return;

        shakeIntensity = 10;
        createImpactSparks(player.x3d, 20, '#ff007f');
        if (window.soundEngine) window.soundEngine.playCrash();

        gameState.lives--;

        if (gameState.lives > 0) {
            // Player still has lives: Respawn at current checkpoint with 3s invulnerability!
            player.lane = 1;
            player.targetX3d = 0;
            player.invulnerableTimer = 3000; // 3-second invulnerability shield
            
            // Remove nearby colliding hazards
            trackObstacles = trackObstacles.filter(obs => obs.z > 250 || obs.z < -50);
            activeGates = activeGates.filter(g => g.z > 250 || g.z < -50);
            gameState.activeQuiz = null;
            gameState.gateIntervalTimer = 0;
            gameState.bulletTimeFactor = 1.0;
            gameState.targetBulletTimeFactor = 1.0;
            const quizBanner = document.getElementById('quiz-banner');
            if (quizBanner) quizBanner.classList.add('hidden');
            const timerEl = document.getElementById('quiz-timer');
            if (timerEl) timerEl.classList.remove('slow-mo');
            
            updateUI();
        } else {
            // All lives exhausted -> Trigger Game Over Screen
            gameState.gameOver = true;
            gameState.currentScreen = 'GAME_OVER';
            const quizBanner = document.getElementById('quiz-banner');
            if (quizBanner) quizBanner.classList.add('hidden');
            if (window.soundEngine) window.soundEngine.stopBGM();

            document.getElementById('go-reason').textContent = reason;
            document.getElementById('go-score').textContent = Math.floor(gameState.score).toLocaleString();
            document.getElementById('go-coins').textContent = gameState.coins;
            document.getElementById('go-sector').textContent = `${gameState.levelIndex + 1}`;
            document.getElementById('go-gates').textContent = gameState.gatesCleared;

            updateUI();
        }
    }

    function triggerLevelClear() {
        gameState.levelClear = true;
        gameState.currentScreen = 'LEVEL_CLEAR';
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
            window.soundEngine.playLevelClear();
        }

        const currentLvl = window.LEVELS[gameState.levelIndex];
        document.getElementById('lc-sector-title').textContent = `${currentLvl.name} Complete`;
        document.getElementById('lc-stage-score').textContent = Math.floor(gameState.stageScore).toLocaleString();
        document.getElementById('lc-time').textContent = `${(gameState.timeInStage / 1000).toFixed(1)}s`;
        document.getElementById('lc-gates').textContent = `${gameState.gatesCleared}/${currentLvl.gatesToClear}`;
        document.getElementById('lc-total-score').textContent = Math.floor(gameState.score).toLocaleString();

        updateUI();
    }

    function triggerVictory() {
        gameState.victory = true;
        gameState.currentScreen = 'VICTORY';
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
            window.soundEngine.playVictory();
        }

        document.getElementById('vic-score').textContent = Math.floor(gameState.score).toLocaleString();
        document.getElementById('vic-time').textContent = `${(gameState.totalTime / 1000).toFixed(1)}s`;
        document.getElementById('vic-coins').textContent = gameState.coins;
        document.getElementById('vic-gates').textContent = gameState.gatesCleared;

        updateUI();
    }

    // Update In-Game HUD and Screen Modals
    function updateUI() {
        const hud = document.getElementById('hud');
        const startScreen = document.getElementById('start-screen');
        const levelClearScreen = document.getElementById('level-clear-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const victoryScreen = document.getElementById('victory-screen');
        const pauseScreen = document.getElementById('pause-screen');

        startScreen.classList.add('hidden');
        levelClearScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        hud.classList.add('hidden');

        if (gameState.currentScreen === 'START') {
            startScreen.classList.remove('hidden');
        } else if (gameState.currentScreen === 'PLAYING') {
            hud.classList.remove('hidden');
            if (gameState.isPaused) {
                pauseScreen.classList.remove('hidden');
            }
        } else if (gameState.currentScreen === 'LEVEL_CLEAR') {
            levelClearScreen.classList.remove('hidden');
        } else if (gameState.currentScreen === 'GAME_OVER') {
            gameOverScreen.classList.remove('hidden');
        } else if (gameState.currentScreen === 'VICTORY') {
            victoryScreen.classList.remove('hidden');
        }

        // Update live HUD text values
        document.getElementById('hud-score-val').textContent = Math.floor(gameState.score).toLocaleString();
        document.getElementById('hud-coins-val').textContent = gameState.coins;
        document.getElementById('hud-level-val').textContent = `${gameState.levelIndex + 1}`;

        const currentLvl = window.LEVELS ? window.LEVELS[gameState.levelIndex] : null;
        const maxGates = currentLvl ? currentLvl.gatesToClear : 4;
        document.getElementById('hud-gates-val').textContent = `${gameState.gatesCleared}/${maxGates}`;

        // Update Hearts
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`heart-${i}`);
            if (heart) {
                if (i <= gameState.lives) heart.classList.remove('lost');
                else heart.classList.add('lost');
            }
        }

        // Update Invulnerability Shield Badge
        const invulBadge = document.getElementById('hud-invulnerable');
        if (invulBadge) {
            if (player.invulnerableTimer > 0) {
                invulBadge.classList.remove('hidden');
                invulBadge.textContent = `🛡️ SHIELD ${(player.invulnerableTimer / 1000).toFixed(1)}s`;
            } else {
                invulBadge.classList.add('hidden');
            }
        }

        // Synchronize HUD Pause Button Icon and State
        const pauseBtn = document.getElementById('hud-pause-btn');
        if (pauseBtn) {
            const pauseIcon = pauseBtn.querySelector('.pause-icon') || pauseBtn;
            if (gameState.isPaused) {
                pauseIcon.textContent = '▶';
                pauseBtn.classList.add('paused');
                pauseBtn.title = 'Resume Game (P / Esc)';
            } else {
                pauseIcon.textContent = '||';
                pauseBtn.classList.remove('paused');
                pauseBtn.title = 'Pause Game (P / Esc)';
            }
        }
    }

    // --- CORE SIMULATION ENGINE & LOOP ---

    function gameLoop() {
        const now = Date.now();
        const dt = Math.min(100, now - lastFrameTime);
        lastFrameTime = now;

        if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
            updateSimulation(dt);
        }

        renderScene();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function updateSimulation(dt) {
        const currentLvl = window.LEVELS[gameState.levelIndex];

        // Smooth bullet-time easing toward target rate (decelerating to 25% during gate approach, accelerating back to 100%)
        const btLerp = Math.min(1.0, 0.08 * (dt / 16.67));
        gameState.bulletTimeFactor += (gameState.targetBulletTimeFactor - gameState.bulletTimeFactor) * btLerp;

        // Effective running speed incorporating 30% base speed reduction and bullet-time factor
        const baseRunSpeed = currentLvl.runSpeed * BASE_SPEED_SCALE;
        const effectiveRunSpeed = baseRunSpeed * gameState.bulletTimeFactor;

        // Timers & Score (halted during pause, dilated during bullet-time)
        gameState.timeInStage += dt * gameState.bulletTimeFactor;
        gameState.totalTime += dt * gameState.bulletTimeFactor;
        gameState.distance += effectiveRunSpeed * (dt / 16.67);
        gameState.score += (effectiveRunSpeed * 0.12) * (dt / 16.67);
        gameState.speed = effectiveRunSpeed;

        // Invulnerability and Slide Timers
        if (player.invulnerableTimer > 0) {
            player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
        }
        if (player.slideTimer > 0) {
            player.slideTimer = Math.max(0, player.slideTimer - dt);
            if (player.slideTimer <= 0) player.isSliding = false;
        }

        // Player Jump Physics
        if (player.isJumping) {
            player.jumpY += player.jumpVy * (dt / 16.67);
            player.jumpVy -= 0.85 * (dt / 16.67); // Gravity
            if (player.jumpY <= 0) {
                player.jumpY = 0;
                player.jumpVy = 0;
                player.isJumping = false;
            }
        }

        // Smooth lateral lane transition easing
        player.x3d += (player.targetX3d - player.x3d) * 0.28;
        player.runCycle += 0.2 * (effectiveRunSpeed / (6.5 * BASE_SPEED_SCALE));

        // Dynamic Screenshake Decay
        if (shakeIntensity > 0) {
            shakeIntensity = Math.max(0, shakeIntensity - 0.4);
        }

        // 1. QUIZ BARRIER TIMER ENGINE (TRIGGERS EVERY 5 SECONDS OF ACTIVE RUNNING)
        if (!gameState.activeQuiz) {
            gameState.gateIntervalTimer += dt;
            
            // Only trigger and show question banner when 5000ms active running threshold is met
            if (gameState.gateIntervalTimer >= 5000) {
                gameState.gateIntervalTimer = 0;
                spawnQuizGate();
            }
        } else {
            // While gate is active and approaching, update distance meter & time dilation countdown
            const activeGate = activeGates.find(g => g.type === 'QUIZ_GATE' && !g.resolved);
            if (activeGate) {
                // Countdown timer ticks down at bullet-time rate giving player reading time
                activeGate.timeRemaining = Math.max(0, activeGate.timeRemaining - (dt * gameState.bulletTimeFactor));
                const approachRatio = activeGate.timeRemaining / activeGate.duration;
                activeGate.z = Math.max(0, approachRatio * 1000);

                const quizProgressBar = document.getElementById('quiz-progress');
                const quizTimerLabel = document.getElementById('quiz-timer');
                if (quizProgressBar) quizProgressBar.style.width = `${approachRatio * 100}%`;
                if (quizTimerLabel) {
                    const secs = (activeGate.timeRemaining / 1000).toFixed(1);
                    const isSlowMo = gameState.bulletTimeFactor < 0.6;
                    quizTimerLabel.classList.toggle('slow-mo', isSlowMo);
                    quizTimerLabel.textContent = `GATE IN ${secs}s${isSlowMo ? ' [SLOW-MO]' : ''}`;
                }
            }
        }

        // 2. SPAWN TRACK OBSTACLES & COLLECTIBLES (suppress obstacles during gate challenge so player can focus on gate lane)
        const now = Date.now();
        if (!gameState.activeQuiz && (now - lastObstacleSpawnTime > currentLvl.spawnInterval)) {
            lastObstacleSpawnTime = now;
            spawnTrackObstacle(currentLvl);
        }

        if (now - lastCoinSpawnTime > 1400) {
            lastCoinSpawnTime = now;
            spawnTrackCollectibles();
        }

        // 3. MOVE & UPDATE ENTITIES ALONG Z-AXIS (proportional to effectiveRunSpeed)
        const moveZ = effectiveRunSpeed * 4.2 * (dt / 16.67);

        // Update Track Obstacles (Hurdles & Laser Bars)
        for (let i = trackObstacles.length - 1; i >= 0; i--) {
            const obs = trackObstacles[i];
            obs.z -= moveZ;

            // Collision check with player
            if (!obs.passed && checkRunnerCollision(player, obs)) {
                obs.passed = true;
                handlePlayerCrash(obs.type === 'HURDLE' ? 
                    "Tripped over a high-energy crystal barrier!" : 
                    "Collided head-on with an overhead energy beam!");
            }

            // Remove when passed behind camera
            if (obs.z < -60) {
                trackObstacles.splice(i, 1);
            }
        }

        // Update Track Collectibles (Coins & Mystery Gift Crates)
        for (let i = trackCollectibles.length - 1; i >= 0; i--) {
            const item = trackCollectibles[i];
            item.z -= moveZ;
            item.rotation += 0.05;

            // Collision check
            if (!item.collected && checkRunnerCollision(player, item)) {
                item.collected = true;
                if (item.type === 'COIN') {
                    gameState.coins++;
                    gameState.score += 25;
                    gameState.stageScore += 25;
                    createSparkleBurst(item.x3d, 30, '#ffd700');
                    if (window.soundEngine) window.soundEngine.playCoin();
                } else if (item.type === 'GIFT') {
                    gameState.score += 100;
                    gameState.stageScore += 100;
                    createSparkleBurst(item.x3d, 40, '#00f0ff');
                    if (window.soundEngine) window.soundEngine.playGift();
                }
                trackCollectibles.splice(i, 1);
                continue;
            }

            if (item.z < -60) {
                trackCollectibles.splice(i, 1);
            }
        }

        // Update Quiz Barrier Gates
        for (let i = activeGates.length - 1; i >= 0; i--) {
            const gate = activeGates[i];

            // If gate was resolved, continue moving past the player
            if (gate.resolved) {
                gate.z -= moveZ;
                if (gate.z < -80) {
                    activeGates.splice(i, 1);
                }
                continue;
            }

            // Gate resolution window: when reaching player (z <= 30 or timeRemaining <= 0)
            if (gate.z <= 30 || (gate.timeRemaining !== undefined && gate.timeRemaining <= 0)) {
                gate.resolved = true;
                gameState.targetBulletTimeFactor = 1.0; // Accelerate back to standard running speed
                const timerEl = document.getElementById('quiz-timer');
                if (timerEl) timerEl.classList.remove('slow-mo');
                
                // Check player's lane at gate crossing
                if (player.lane === gate.quiz.correctLane) {
                    // CORRECT LANE!
                    gameState.gatesCleared++;
                    gameState.score += 150;
                    gameState.stageScore += 150;
                    createSparkleBurst(LANE_X[gate.quiz.correctLane], 60, '#00ffaa');
                    if (window.soundEngine) window.soundEngine.playCorrect();

                    // Check stage progression
                    if (gameState.gatesCleared >= currentLvl.gatesToClear) {
                        gameState.activeQuiz = null;
                        gameState.gateIntervalTimer = 0;
                        const quizBanner = document.getElementById('quiz-banner');
                        if (quizBanner) quizBanner.classList.add('hidden');

                        if (gameState.levelIndex >= window.LEVELS.length - 1) {
                            triggerVictory();
                            return;
                        } else {
                            triggerLevelClear();
                            return;
                        }
                    }
                } else {
                    // WRONG LANE!
                    handlePlayerCrash(`Incorrect Gate Choice! The correct answer was: "${gate.quiz.options[gate.quiz.correctLane].text}"`);
                }

                gameState.activeQuiz = null;
                gameState.gateIntervalTimer = 0;
                const quizBanner = document.getElementById('quiz-banner');
                if (quizBanner) quizBanner.classList.add('hidden');
            }
        }

        // Update Particles
        for (let i = runnerParticles.length - 1; i >= 0; i--) {
            const p = runnerParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) runnerParticles.splice(i, 1);
        }

        // Update UI Text
        updateUI();
    }

    // Spawns a 3-Arch Quiz Barrier Gate at z = 1000 with 5-second approach challenge
    function spawnQuizGate() {
        if (typeof window.generateGateQuiz !== 'function') return;
        const quiz = window.generateGateQuiz();
        gameState.activeQuiz = quiz;

        // Engage Bullet-Time: smoothly decelerate to 25% speed giving player time to read
        gameState.targetBulletTimeFactor = 0.25;

        // Unhide and display question on HUD when gate spawns
        const quizBanner = document.getElementById('quiz-banner');
        if (quizBanner) {
            quizBanner.classList.remove('hidden');
        }
        document.getElementById('quiz-category').textContent = quiz.category.toUpperCase();
        document.getElementById('quiz-question').textContent = quiz.question;

        // Populate 3-lane options on HUD banner
        const opt0 = document.getElementById('quiz-opt-0');
        const opt1 = document.getElementById('quiz-opt-1');
        const opt2 = document.getElementById('quiz-opt-2');
        if (opt0 && quiz.options[0]) {
            const span = opt0.querySelector('.opt-text');
            if (span) span.textContent = quiz.options[0].text;
        }
        if (opt1 && quiz.options[1]) {
            const span = opt1.querySelector('.opt-text');
            if (span) span.textContent = quiz.options[1].text;
        }
        if (opt2 && quiz.options[2]) {
            const span = opt2.querySelector('.opt-text');
            if (span) span.textContent = quiz.options[2].text;
        }

        const duration = 5000; // 5.0 seconds gate approach challenge
        activeGates.push({
            type: 'QUIZ_GATE',
            z: 1000,
            depth: 40,
            duration: duration,
            timeRemaining: duration,
            quiz: quiz,
            resolved: false
        });
    }

    // Spawns Hurdles or Laser Bars
    function spawnTrackObstacle(currentLvl) {
        // Random lane
        const lane = Math.floor(Math.random() * 3);
        const type = Math.random() < 0.5 ? 'HURDLE' : 'LASER_BAR';

        trackObstacles.push({
            type: type,
            lane: lane,
            x3d: LANE_X[lane],
            z: 1000,
            depth: 35,
            passed: false
        });
    }

    // Spawns Floating Cosmic Coins or Mystery Gifts
    function spawnTrackCollectibles() {
        const lane = Math.floor(Math.random() * 3);
        const isGift = Math.random() < 0.18;

        trackCollectibles.push({
            type: isGift ? 'GIFT' : 'COIN',
            lane: lane,
            x3d: LANE_X[lane],
            z: 1000,
            depth: 30,
            rotation: 0,
            collected: false
        });
    }

    function createSparkleBurst(x3d, y3d, color) {
        const proj = project3D(x3d, y3d, 20);
        for (let i = 0; i < 22; i++) {
            runnerParticles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 2 + Math.random() * 4,
                color: color,
                life: 25
            });
        }
    }

    function createImpactSparks(x3d, y3d, color) {
        const proj = project3D(x3d, y3d, 10);
        for (let i = 0; i < 30; i++) {
            runnerParticles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: 3 + Math.random() * 5,
                color: color,
                life: 30
            });
        }
    }

    // --- RENDERING PIPELINE (PSEUDO-3D & PARALLAX THEMES) ---

    function renderScene() {
        ctx.save();

        // Apply screenshake
        if (shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            ctx.translate(shakeX, shakeY);
        }

        const currentLvl = window.LEVELS[gameState.levelIndex];
        const palette = currentLvl.palette;

        // 1. Render Layered Parallax Background
        renderParallaxBackground(currentLvl);

        // 2. Render Pseudo-3D Track Surface with Glowing Borders & Runes
        render3DTrack(palette);

        // 3. Render In-Game World Entities (Obstacles, Coins, Gates, Player)
        renderEntities(palette);

        // 4. Render Particle Explosions
        renderParticles();

        // 5. Render Clear In-Canvas "PAUSED" Text Overlay when game is paused
        if (gameState.isPaused) {
            renderPauseOverlay();
        }

        ctx.restore();
    }

    // Render Clear High-Contrast In-Canvas PAUSED Text Overlay
    function renderPauseOverlay() {
        ctx.save();
        // Dark frosted backdrop
        ctx.fillStyle = 'rgba(5, 2, 18, 0.78)';
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

        const cx = DESIGN_WIDTH * 0.5;
        const cy = DESIGN_HEIGHT * 0.45;
        const neonColor = (gameState.neonColors && gameState.neonColors.outerRail) || '#00f0ff';

        // Glowing pause icon (two vertical bars)
        ctx.fillStyle = neonColor;
        ctx.shadowBlur = 24;
        ctx.shadowColor = neonColor;
        ctx.beginPath();
        ctx.roundRect(cx - 26, cy - 64, 16, 42, 4);
        ctx.roundRect(cx + 10, cy - 64, 16, 42, 4);
        ctx.fill();

        // High-contrast PAUSED title text
        ctx.font = '900 42px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 28;
        ctx.shadowColor = neonColor;
        ctx.fillText('PAUSED', cx, cy + 14);

        // Subtitle / resume hint
        ctx.font = '700 13px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.fillText('PRESS P, ESC, OR CLICK TO RESUME', cx, cy + 50);

        ctx.restore();
    }

    // Parallax Background Renderer (Driver's POV Forward-Motion Radial Warp System with Randomized Run Palette)
    function renderParallaxBackground(currentLvl) {
        const palette = currentLvl.palette;
        const horizonY = DESIGN_HEIGHT * 0.35; // 280px (top third of screen)
        const vanishX = DESIGN_WIDTH * 0.5; // 300px (track vanishing point)
        const vanishY = horizonY;
        const runSpeed = (currentLvl.runSpeed || 6.5) * BASE_SPEED_SCALE * (gameState.bulletTimeFactor || 1.0);
        const runTheme = gameState.runVisualTheme || RUN_PALETTES[0];
        const hueShift = runTheme.hueShift || 0;

        // 1-3. Background sky, reference image, and nebulae with randomized hue-shift filter
        ctx.save();
        if (hueShift !== 0) {
            ctx.filter = `hue-rotate(${hueShift}deg)`;
        }

        // Full Viewport Cosmic Atmosphere Gradient (deep space windshield view)
        const fullBgGrad = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
        fullBgGrad.addColorStop(0, palette.skyTop);
        fullBgGrad.addColorStop(0.35, palette.skyBottom);
        fullBgGrad.addColorStop(0.70, palette.skyTop);
        fullBgGrad.addColorStop(1, '#05020d');
        ctx.fillStyle = fullBgGrad;
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

        // Full Viewport Reference Art (background.jpeg) blended across sky
        if (bgImageLoaded && bgImage) {
            ctx.save();
            ctx.globalAlpha = 0.40;
            ctx.drawImage(bgImage, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
            ctx.restore();
        }

        // Swirling Vibrant Nebulae focused around the horizon vanishing point
        ctx.save();
        const nebGrad1 = ctx.createRadialGradient(vanishX - 80, vanishY - 60, 20, vanishX - 80, vanishY - 60, 260);
        nebGrad1.addColorStop(0, palette.nebulaColor1);
        nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebGrad1;
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

        const nebGrad2 = ctx.createRadialGradient(vanishX + 90, vanishY - 40, 30, vanishX + 90, vanishY - 40, 280);
        nebGrad2.addColorStop(0, palette.nebulaColor2);
        nebGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebGrad2;
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
        ctx.restore();

        ctx.restore();

        // 3b. Atmospheric Color Wash Overlay (Shifts each run into deep crimson, emerald green, ultraviolet, etc.)
        if (runTheme.overlayTint) {
            ctx.save();
            ctx.fillStyle = runTheme.overlayTint;
            ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
            ctx.restore();
        }

        // Horizon Singularity Glow at the Vanishing Point
        ctx.save();
        const horizonGlow = ctx.createRadialGradient(vanishX, vanishY, 2, vanishX, vanishY, 140);
        horizonGlow.addColorStop(0, runTheme.glowColor || 'rgba(0, 240, 255, 0.45)');
        horizonGlow.addColorStop(0.3, 'rgba(255, 0, 127, 0.20)');
        horizonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
        ctx.restore();

        // 4. Forward-Motion Radial Warp Speed Starfield (Driver's POV)
        // Stars spawn at the vanishing point (vanishX, vanishY) and scale up accelerating outward
        const isPlaying = gameState.currentScreen === 'PLAYING' && !gameState.isPaused;
        bgStars.forEach(s => {
            if (isPlaying) {
                // Accelerate outward non-linearly with forward running speed
                s.dist += (s.dist * 0.032 + s.speed * 2.0) * (runSpeed / 6.5);
                if (s.dist > 580) {
                    // Respawn near center vanishing point
                    s.dist = Math.random() * 12;
                    s.angle = Math.random() * Math.PI * 2;
                }
            }

            // Calculate current star position radiating from horizon vanishing point
            const currX = vanishX + Math.cos(s.angle) * s.dist;
            const currY = vanishY + Math.sin(s.angle) * s.dist;

            // Motion blur streak tail (streaks point backward toward vanishing point)
            const streakLen = Math.min(s.dist * 0.30, 60 * (runSpeed / 6.5));
            const tailX = vanishX + Math.cos(s.angle) * (s.dist - streakLen);
            const tailY = vanishY + Math.sin(s.angle) * (s.dist - streakLen);

            // Scale dynamically with distance: small at horizon, massive near screen edges
            const size = s.baseSize * (0.35 + (s.dist / 320) * 2.4);
            const alpha = Math.min(1.0, 0.15 + (s.dist / 180));

            ctx.save();
            ctx.strokeStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = size;
            ctx.shadowBlur = 12 * (s.dist / 300);
            ctx.shadowColor = s.color;

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(currX, currY);
            ctx.stroke();

            // Bright star nucleus
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(currX, currY, size * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 5. Moons & Ringed Gas Giants
        if (palette.moons) {
            palette.moons.forEach(m => {
                ctx.save();
                ctx.fillStyle = m.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = m.color;
                ctx.beginPath();
                ctx.arc(m.x * DESIGN_WIDTH, m.y * DESIGN_HEIGHT, m.r, 0, Math.PI * 2);
                ctx.fill();

                if (m.crescent) {
                    ctx.fillStyle = palette.skyTop;
                    ctx.beginPath();
                    ctx.arc(m.x * DESIGN_WIDTH + m.r * 0.45, m.y * DESIGN_HEIGHT - m.r * 0.15, m.r * 0.85, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });
        }

        if (palette.ringedPlanet) {
            const rp = palette.ringedPlanet;
            ctx.save();
            const px = rp.x * DESIGN_WIDTH;
            const py = rp.y * DESIGN_HEIGHT;
            ctx.fillStyle = rp.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = rp.color;
            ctx.beginPath();
            ctx.arc(px, py, rp.r, 0, Math.PI * 2);
            ctx.fill();

            // Orbital Ring
            ctx.strokeStyle = rp.ringColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(px, py, rp.r * 2.2, rp.r * 0.6, Math.PI / 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 6. Theme Midground Features (Flowing naturally down into the abyss)
        if (currentLvl.themeId === 'crystal') {
            // Theme 1: Floating rock islands with glowing cyan waterfalls cascading into the void
            bgIslands.forEach(isl => {
                ctx.save();
                // Floating Island Rock
                ctx.fillStyle = '#1e1136';
                ctx.strokeStyle = palette.crystalColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(isl.x - isl.w / 2, isl.y);
                ctx.lineTo(isl.x + isl.w / 2, isl.y);
                ctx.lineTo(isl.x + isl.w * 0.3, isl.y + isl.h);
                ctx.lineTo(isl.x - isl.w * 0.3, isl.y + isl.h);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Spire Crystals
                ctx.fillStyle = isl.crystalColor;
                ctx.shadowBlur = 12;
                ctx.shadowColor = isl.crystalColor;
                ctx.beginPath();
                ctx.moveTo(isl.x - 8, isl.y);
                ctx.lineTo(isl.x, isl.y - 32);
                ctx.lineTo(isl.x + 8, isl.y);
                ctx.closePath();
                ctx.fill();

                // Cascading Waterfall flows into the void
                ctx.fillStyle = palette.waterfallColor;
                ctx.shadowBlur = 10;
                ctx.shadowColor = palette.crystalColor;
                ctx.fillRect(isl.x - 4, isl.y + 4, 8, DESIGN_HEIGHT - isl.y);
                ctx.restore();
            });
        } 
        else if (currentLvl.themeId === 'molten') {
            // Theme 2: Towering stone watchtowers, massive iron chains, cascading lava waterfalls
            ctx.save();
            // Iron chains connecting clifftops
            ctx.strokeStyle = 'rgba(255, 85, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 180);
            ctx.quadraticCurveTo(DESIGN_WIDTH * 0.5, 260, DESIGN_WIDTH, 180);
            ctx.stroke();

            // Watchtowers on flanks extending down
            ctx.fillStyle = '#220803';
            ctx.fillRect(30, 160, 45, DESIGN_HEIGHT - 160);
            ctx.fillRect(DESIGN_WIDTH - 75, 150, 45, DESIGN_HEIGHT - 150);

            // Glowing Molten Lava Falls flowing down into bottom
            ctx.fillStyle = palette.waterfallColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff5500';
            ctx.fillRect(48, 200, 10, DESIGN_HEIGHT - 200);
            ctx.fillRect(DESIGN_WIDTH - 58, 190, 10, DESIGN_HEIGHT - 190);
            ctx.restore();
        } 
        else if (currentLvl.themeId === 'clockwork') {
            // Theme 3: Giant interlocking brass & verdigris mechanical gears rotating continuously
            bgGears.forEach(g => {
                if (gameState.currentScreen === 'PLAYING' && !gameState.isPaused) {
                    g.angle += g.speed;
                }
                ctx.save();
                ctx.translate(g.x, g.y);
                ctx.rotate(g.angle);
                ctx.fillStyle = g.color;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;

                // Gear Center
                ctx.beginPath();
                ctx.arc(0, 0, g.radius * 0.8, 0, Math.PI * 2);
                ctx.fill();

                // Gear Teeth
                for (let i = 0; i < g.teeth; i++) {
                    const toothAngle = (i * Math.PI * 2) / g.teeth;
                    ctx.save();
                    ctx.rotate(toothAngle);
                    ctx.fillRect(-5, -g.radius, 10, 8);
                    ctx.restore();
                }

                // Inner Hub
                ctx.fillStyle = '#06131c';
                ctx.beginPath();
                ctx.arc(0, 0, g.radius * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });
        }
    }

    // Pseudo-3D Track Renderer (3-Lane Perspective Roadway with Glowing Laser Rails)
    function render3DTrack(palette) {
        const horizonY = DESIGN_HEIGHT * 0.35; // 280px vanishing point (top third of screen)
        const vanishX = DESIGN_WIDTH * 0.5; // 300px center vanishing point
        const bottomY = DESIGN_HEIGHT; // 800px absolute bottom edge of screen

        // 1. Perspective Track Boundary Coordinates
        // Base of track MUST begin at the absolute bottom edge of the screen (y = 800) stretching wide (540px)
        const bottomHalfW = 270;
        const horizonHalfW = 10;
        const bL = { x: vanishX - bottomHalfW, y: bottomY };
        const bR = { x: vanishX + bottomHalfW, y: bottomY };
        const hL = { x: vanishX - horizonHalfW, y: horizonY };
        const hR = { x: vanishX + horizonHalfW, y: horizonY };

        // 2. Dark Metallic Asphalt Road Surface
        const roadGrad = ctx.createLinearGradient(0, horizonY, 0, bottomY);
        roadGrad.addColorStop(0, palette.trackColor);
        roadGrad.addColorStop(0.4, '#120726');
        roadGrad.addColorStop(1, '#05020c');
        ctx.fillStyle = roadGrad;

        ctx.beginPath();
        ctx.moveTo(hL.x, hL.y);
        ctx.lineTo(hR.x, hR.y);
        ctx.lineTo(bR.x, bR.y);
        ctx.lineTo(bL.x, bL.y);
        ctx.closePath();
        ctx.fill();

        // Subtle Cyber Perspective Grid Lines across track (Using randomized neon accent)
        const neon = gameState.neonColors || {
            outerRail: '#00f0ff',
            innerRail: '#ff6600',
            gridLines: 'rgba(0, 240, 255, 0.16)',
            runesAndTies: palette.runesColor,
            chevrons: '#00f0ff'
        };

        ctx.save();
        ctx.strokeStyle = neon.gridLines;
        ctx.lineWidth = 1.2;
        for (let div = -0.33; div <= 0.33; div += 0.33) {
            const topDivX = vanishX + horizonHalfW * div;
            const botDivX = vanishX + bottomHalfW * div;
            ctx.beginPath();
            ctx.moveTo(topDivX, horizonY);
            ctx.lineTo(botDivX, bottomY);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Moving Horizontal Runes & Perspective Ties (Accelerating outward from horizon)
        const segmentCount = 18;
        const cycleProgress = (gameState.distance * 0.04) % 1.0;
        ctx.save();
        for (let i = 0; i < segmentCount; i++) {
            const rawT = (i + cycleProgress) / segmentCount;
            if (rawT > 1.0 || rawT < 0.02) continue;

            // Quadratic perspective curve: accelerates non-linearly toward player at bottom
            const depthFactor = Math.pow(rawT, 2.2);
            const tieY = horizonY + (bottomY - horizonY) * depthFactor;
            const halfW = horizonHalfW + (bottomHalfW - horizonHalfW) * depthFactor;

            const tieAlpha = Math.min(1.0, depthFactor * 1.4);
            const tieLineWidth = 1 + depthFactor * 3.5;

            ctx.strokeStyle = neon.runesAndTies;
            ctx.globalAlpha = tieAlpha * 0.75;
            ctx.lineWidth = tieLineWidth;
            ctx.shadowBlur = 8 * depthFactor;
            ctx.shadowColor = neon.runesAndTies;

            ctx.beginPath();
            ctx.moveTo(vanishX - halfW, tieY);
            ctx.lineTo(vanishX + halfW, tieY);
            ctx.stroke();

            // Center Lane Forward Chevrons (Speed markers rushing forward)
            if (depthFactor > 0.15 && depthFactor < 0.95 && i % 2 === 0) {
                const arrowSize = 6 + depthFactor * 16;
                ctx.strokeStyle = neon.chevrons;
                ctx.lineWidth = 1.5 + depthFactor * 2;
                ctx.shadowBlur = 10 * depthFactor;
                ctx.shadowColor = neon.chevrons;
                ctx.beginPath();
                ctx.moveTo(vanishX - arrowSize * 0.8, tieY + arrowSize * 0.4);
                ctx.lineTo(vanishX, tieY - arrowSize * 0.2);
                ctx.lineTo(vanishX + arrowSize * 0.8, tieY + arrowSize * 0.4);
                ctx.stroke();
            }
        }
        ctx.restore();

        // 4. Lane Divider Dashed Lines (-70 and +70 in world space)
        const laneWorldOffsets = [-70, 70];
        const dashOffset = (gameState.distance * 22) % 40;
        ctx.save();
        ctx.strokeStyle = neon.runesAndTies;
        ctx.shadowBlur = 10;
        ctx.shadowColor = neon.outerRail;

        laneWorldOffsets.forEach(worldX => {
            const farX = vanishX + (worldX / TRACK_HALF_WIDTH) * horizonHalfW;
            const nearX = vanishX + (worldX / TRACK_HALF_WIDTH) * bottomHalfW;

            ctx.lineWidth = 2.5;
            ctx.setLineDash([18, 14]);
            ctx.lineDashOffset = -dashOffset;

            ctx.beginPath();
            ctx.moveTo(farX, horizonY);
            ctx.lineTo(nearX, bottomY);
            ctx.stroke();
        });
        ctx.restore();

        // 5. Glowing Pulsing Laser Rails (Randomized Bright Saturated Neon Rails)
        const trackPulseTime = gameState.isPaused ? (gameState.pauseTime || lastFrameTime) : Date.now();
        const pulse = 0.8 + 0.2 * Math.sin(trackPulseTime * 0.006);
        ctx.save();
        // Layer A: Outer Randomized Saturated Neon Rail
        ctx.strokeStyle = neon.outerRail;
        ctx.lineWidth = 4.5;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = neon.outerRail;
        ctx.beginPath();
        ctx.moveTo(hL.x, hL.y);
        ctx.lineTo(bL.x, bL.y);
        ctx.moveTo(hR.x, hR.y);
        ctx.lineTo(bR.x, bR.y);
        ctx.stroke();

        // Layer B: Inner Contrasting Saturated Neon Core Accent
        ctx.strokeStyle = neon.innerRail;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = neon.innerRail;
        ctx.beginPath();
        ctx.moveTo(hL.x + 3, hL.y);
        ctx.lineTo(bL.x + 12, bL.y);
        ctx.moveTo(hR.x - 3, hR.y);
        ctx.lineTo(bR.x - 12, bR.y);
        ctx.stroke();

        // Layer C: Bright White Laser Energy Beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(hL.x, hL.y);
        ctx.lineTo(bL.x, bL.y);
        ctx.moveTo(hR.x, hR.y);
        ctx.lineTo(bR.x, bR.y);
        ctx.stroke();
        ctx.restore();

        // 6. Horizon Singularity Warp Portal (At the track vanishing point)
        ctx.save();
        const portalGrad = ctx.createRadialGradient(vanishX, horizonY, 2, vanishX, horizonY, 45);
        portalGrad.addColorStop(0, '#ffffff');
        portalGrad.addColorStop(0.2, '#00f0ff');
        portalGrad.addColorStop(0.6, 'rgba(255, 0, 127, 0.6)');
        portalGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(vanishX - 50, horizonY - 25, 100, 50);

        // Horizontal Horizon Laser Flare
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(vanishX - 90, horizonY);
        ctx.lineTo(vanishX + 90, horizonY);
        ctx.stroke();
        ctx.restore();
    }

    // Entities Renderer sorted by Depth (Far to Near)
    function renderEntities(palette) {
        // Collect all renderable entities with depth
        const renderList = [];

        // Track Obstacles
        trackObstacles.forEach(obs => {
            renderList.push({ type: 'OBSTACLE', z: obs.z, data: obs });
        });

        // Collectibles
        trackCollectibles.forEach(item => {
            renderList.push({ type: 'COLLECTIBLE', z: item.z, data: item });
        });

        // Quiz Barrier Gates
        activeGates.forEach(gate => {
            renderList.push({ type: 'GATE', z: gate.z, data: gate });
        });

        // Player Runner
        renderList.push({ type: 'PLAYER', z: player.z, data: player });

        // Sort descending by Z so farthest render first (Painter's Algorithm)
        renderList.sort((a, b) => b.z - a.z);

        // Render sorted list
        renderList.forEach(item => {
            if (item.type === 'OBSTACLE') renderObstacle(item.data, palette);
            else if (item.type === 'COLLECTIBLE') renderCollectible(item.data, palette);
            else if (item.type === 'GATE') renderQuizGate(item.data, palette);
            else if (item.type === 'PLAYER') renderPlayer(item.data, palette);
        });
    }

    // Render Hurdles and Overhead Laser Bars
    function renderObstacle(obs, palette) {
        const proj = project3D(obs.x3d, 0, obs.z);
        if (proj.scale <= 0) return;

        ctx.save();
        if (obs.type === 'HURDLE') {
            // Low Crystal Hurdle (Must Jump Over)
            const w = 90 * proj.scale;
            const h = 32 * proj.scale;

            ctx.fillStyle = palette.crystalColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 14 * proj.scale;
            ctx.shadowColor = palette.crystalColor;

            ctx.beginPath();
            ctx.moveTo(proj.x - w / 2, proj.y);
            ctx.lineTo(proj.x - w * 0.3, proj.y - h);
            ctx.lineTo(proj.x, proj.y - h * 1.3);
            ctx.lineTo(proj.x + w * 0.3, proj.y - h);
            ctx.lineTo(proj.x + w / 2, proj.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Overhead Laser Bar (Must Slide Under)
            const w = 110 * proj.scale;
            const h = 60 * proj.scale;
            const beamY = proj.y - h * 0.8;

            // Support Posts
            ctx.fillStyle = '#2d1538';
            ctx.fillRect(proj.x - w / 2, proj.y - h, 6 * proj.scale, h);
            ctx.fillRect(proj.x + w / 2 - 6 * proj.scale, proj.y - h, 6 * proj.scale, h);

            // Pulsing Laser Forcefield Beam
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 6 * proj.scale;
            ctx.shadowBlur = 18 * proj.scale;
            ctx.shadowColor = '#ff007f';
            ctx.beginPath();
            ctx.moveTo(proj.x - w / 2, beamY);
            ctx.lineTo(proj.x + w / 2, beamY);
            ctx.stroke();

            // White Core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * proj.scale;
            ctx.beginPath();
            ctx.moveTo(proj.x - w / 2, beamY);
            ctx.lineTo(proj.x + w / 2, beamY);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Render Floating Cosmic Coins and Mystery Gifts
    function renderCollectible(item, palette) {
        const proj = project3D(item.x3d, 26, item.z);
        if (proj.scale <= 0) return;

        ctx.save();
        ctx.translate(proj.x, proj.y);

        if (item.type === 'COIN') {
            // Cosmic Coin: Spinning 8-point gold star
            const r = 20 * proj.scale;
            ctx.shadowBlur = 15 * proj.scale;
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle = '#ffd700';

            ctx.scale(Math.cos(item.rotation), 1);
            ctx.beginPath();
            const pts = 8;
            for (let i = 0; i < pts * 2; i++) {
                const radius = (i % 2 === 0) ? r : r * 0.5;
                const a = (i * Math.PI) / pts;
                const px = Math.cos(a) * radius;
                const py = Math.sin(a) * radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            // White Center
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Mystery Gift Box
            const size = 32 * proj.scale;
            ctx.shadowBlur = 18 * proj.scale;
            ctx.shadowColor = '#00f0ff';
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-size / 2, -size / 2, size, size);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * proj.scale;
            ctx.strokeRect(-size / 2, -size / 2, size, size);

            // Question mark text
            ctx.font = `bold ${Math.max(10, Math.floor(18 * proj.scale))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('?', 0, 0);
        }
        ctx.restore();
    }

    // Render 3-Arch Quiz Barrier Gate with Dynamic Scaling, Laser Pylons, and Holographic Answer Panels
    function renderQuizGate(gate, palette) {
        const z = gate.z;
        const gateH = 170; // Gate structure height in 3D world units
        const scale = project3D(0, 0, z).scale;
        if (scale <= 0) return;

        ctx.save();

        const animTime = gameState.isPaused ? (gameState.pauseTime || lastFrameTime) : Date.now();
        const pulse = 0.85 + 0.15 * Math.sin(animTime * 0.008);
        const pylonColor = (gameState.neonColors && gameState.neonColors.gatePylons) || palette.gateArchColor || '#00f0ff';
        const beamColor = (gameState.neonColors && gameState.neonColors.gateBeams) || '#ff007f';
        const crossColor = (gameState.neonColors && gameState.neonColors.gateAccents) || '#00f0ff';

        // 1. Four Towering Vertical Laser Pylons (Demarcating the 3 highway lanes)
        // Lane 0: [-140], Lane 1: [0], Lane 2: [140] -> Pylons at [-210, -70, 70, 210]
        const pylonWorldXs = [-210, -70, 70, 210];

        pylonWorldXs.forEach(pX => {
            const pBase = project3D(pX, 0, z);
            const pTop = project3D(pX, gateH, z);
            const pBeam = project3D(pX, gateH * 1.8, z); // Laser beam shooting high into the cosmos
            const pylonW = Math.max(3, 8 * scale);

            // Vertical Energy Laser Column
            ctx.save();
            ctx.strokeStyle = pylonColor;
            ctx.lineWidth = pylonW;
            ctx.shadowBlur = 22 * scale * pulse;
            ctx.shadowColor = pylonColor;
            ctx.beginPath();
            ctx.moveTo(pBase.x, pBase.y);
            ctx.lineTo(pTop.x, pTop.y);
            ctx.stroke();

            // Laser Beam extending skyward
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = Math.max(1.5, 3.5 * scale);
            ctx.shadowBlur = 16 * scale;
            ctx.shadowColor = beamColor;
            ctx.beginPath();
            ctx.moveTo(pTop.x, pTop.y);
            ctx.lineTo(pBeam.x, pBeam.y);
            ctx.stroke();

            // Pylon Base & Head Emitter Nodes
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 14 * scale;
            ctx.shadowColor = pylonColor;
            ctx.beginPath();
            ctx.arc(pTop.x, pTop.y, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 2. Overhead Truss Crossbeam connecting all 4 pylons across top
        const pLeftTop = project3D(-210, gateH, z);
        const pRightTop = project3D(210, gateH, z);
        ctx.save();
        ctx.strokeStyle = crossColor;
        ctx.lineWidth = Math.max(2, 6 * scale);
        ctx.shadowBlur = 18 * scale;
        ctx.shadowColor = crossColor;
        ctx.beginPath();
        ctx.moveTo(pLeftTop.x, pLeftTop.y);
        ctx.lineTo(pRightTop.x, pRightTop.y);
        ctx.stroke();

        // White core on header crossbeam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.moveTo(pLeftTop.x, pLeftTop.y);
        ctx.lineTo(pRightTop.x, pRightTop.y);
        ctx.stroke();
        ctx.restore();

        // 3. Holographic Forcefield Answer Panels for each lane
        const laneNames = ['◀ LEFT', '▲ CENTER', '▶ RIGHT'];
        const laneColors = ['#00f0ff', '#ffd700', '#ff007f'];
        const laneW = 136 * scale;

        for (let lane = 0; lane < 3; lane++) {
            const laneX = LANE_X[lane];
            const pBase = project3D(laneX, 0, z);
            const pTop = project3D(laneX, gateH, z);
            const archH = Math.abs(pBase.y - pTop.y);
            const panelX = pBase.x - laneW / 2;
            const panelY = pTop.y;
            const isCurrentLane = player.lane === lane;
            const opt = gate.quiz.options[lane];

            ctx.save();

            // Translucent Glassmorphic Forcefield Shield
            const shieldGrad = ctx.createLinearGradient(0, panelY, 0, pBase.y);
            if (isCurrentLane) {
                // Highlighted shield if player is cruising in this lane
                shieldGrad.addColorStop(0, 'rgba(0, 240, 255, 0.32)');
                shieldGrad.addColorStop(0.5, 'rgba(157, 0, 255, 0.28)');
                shieldGrad.addColorStop(1, 'rgba(5, 2, 20, 0.75)');
            } else {
                shieldGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
                shieldGrad.addColorStop(0.5, 'rgba(25, 10, 50, 0.20)');
                shieldGrad.addColorStop(1, 'rgba(5, 2, 20, 0.65)');
            }
            ctx.fillStyle = shieldGrad;
            ctx.fillRect(panelX, panelY, laneW, archH);

            // Shield Frame with Neon Glow
            const frameColor = isCurrentLane ? crossColor : (palette.gateArchColor || pylonColor);
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = Math.max(1.5, (isCurrentLane ? 4 : 2.5) * scale);
            ctx.shadowBlur = (isCurrentLane ? 20 : 12) * scale;
            ctx.shadowColor = frameColor;
            ctx.strokeRect(panelX, panelY, laneW, archH);

            // Corner Tech Brackets on Panel
            const bracketLen = Math.min(16 * scale, laneW * 0.25);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1, 2 * scale);
            // Top-Left
            ctx.beginPath();
            ctx.moveTo(panelX, panelY + bracketLen);
            ctx.lineTo(panelX, panelY);
            ctx.lineTo(panelX + bracketLen, panelY);
            // Top-Right
            ctx.moveTo(panelX + laneW - bracketLen, panelY);
            ctx.lineTo(panelX + laneW, panelY);
            ctx.lineTo(panelX + laneW, panelY + bracketLen);
            // Bottom-Left
            ctx.moveTo(panelX, pBase.y - bracketLen);
            ctx.lineTo(panelX, pBase.y);
            ctx.lineTo(panelX + bracketLen, pBase.y);
            // Bottom-Right
            ctx.moveTo(panelX + laneW - bracketLen, pBase.y);
            ctx.lineTo(panelX + laneW, pBase.y);
            ctx.lineTo(panelX + laneW, pBase.y - bracketLen);
            ctx.stroke();

            // Lane Directional Header Pill Badge
            const badgeW = Math.min(laneW * 0.85, 90 * scale);
            const badgeH = Math.max(12, 22 * scale);
            const badgeX = pBase.x - badgeW / 2;
            const badgeY = panelY + Math.max(4, 8 * scale);

            ctx.fillStyle = 'rgba(10, 5, 25, 0.85)';
            ctx.strokeStyle = laneColors[lane];
            ctx.lineWidth = Math.max(1, 1.8 * scale);
            ctx.shadowBlur = 8 * scale;
            ctx.shadowColor = laneColors[lane];
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * scale);
            ctx.fill();
            ctx.stroke();

            ctx.font = `bold ${Math.max(8, Math.floor(11 * scale))}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = laneColors[lane];
            ctx.shadowBlur = 6 * scale;
            ctx.shadowColor = laneColors[lane];
            ctx.fillText(laneNames[lane], pBase.x, badgeY + badgeH * 0.5);

            // Massive, Crystal-Clear Answer Text Panel
            if (opt && opt.text) {
                const textY = panelY + archH * 0.58;
                const fontSize = Math.max(9, Math.floor(18 * scale));
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // High-contrast drop outline for maximum readability against nebula
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = Math.max(2, 4 * scale);
                ctx.shadowBlur = 0;

                const maxChars = Math.max(5, Math.floor(14 * scale));
                const displayText = opt.text.length > maxChars ? opt.text.substring(0, maxChars) + '..' : opt.text;

                ctx.strokeText(displayText, pBase.x, textY);

                // Bright Glowing Answer Text
                ctx.fillStyle = isCurrentLane ? '#00ffff' : '#ffffff';
                ctx.shadowBlur = 12 * scale;
                ctx.shadowColor = isCurrentLane ? '#00f0ff' : '#ffffff';
                ctx.fillText(displayText, pBase.x, textY);
            }

            ctx.restore();
        }

        ctx.restore();
    }

    // Render Sleek Futuristic Supercar (Anchored near absolute bottom of track)
    function renderPlayer(p, palette) {
        const proj = project3D(p.x3d, p.jumpY, p.z);
        const shadowProj = project3D(p.x3d, 0, p.z);
        const scale = proj.scale;

        ctx.save();

        // 1. Dynamic Neon Underglow & Track Contact Shadow (Cast onto asphalt at screen bottom)
        const isSliding = p.isSliding;
        const isJumping = p.jumpY > 0;
        const jumpFactor = Math.min(1.0, p.jumpY / 120);

        const ugW = (124 * scale) * (1.0 - jumpFactor * 0.35);
        const ugH = (26 * scale) * (1.0 - jumpFactor * 0.45);
        const animTime = gameState.isPaused ? (gameState.pauseTime || lastFrameTime) : Date.now();
        const pulse = 0.85 + 0.15 * Math.sin(animTime * 0.012);

        // Vibrant Neon Cyan & Hot Pink Underglow
        ctx.save();
        const ugGrad = ctx.createRadialGradient(shadowProj.x, shadowProj.y - 6 * scale, 4 * scale, shadowProj.x, shadowProj.y - 6 * scale, ugW * 0.5);
        ugGrad.addColorStop(0, `rgba(0, 240, 255, ${0.9 * pulse * (1.0 - jumpFactor * 0.5)})`);
        ugGrad.addColorStop(0.45, `rgba(255, 0, 127, ${0.5 * pulse * (1.0 - jumpFactor * 0.5)})`);
        ugGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ugGrad;
        ctx.beginPath();
        ctx.ellipse(shadowProj.x, shadowProj.y - 6 * scale, ugW * 0.5, ugH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark Asphalt Contact Shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * (1.0 - jumpFactor * 0.6)})`;
        ctx.beginPath();
        ctx.ellipse(shadowProj.x, shadowProj.y - 4 * scale, (54 * scale) * (1.0 - jumpFactor * 0.4), (12 * scale) * (1.0 - jumpFactor * 0.4), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Position coordinate space anchored near absolute bottom of track
        ctx.translate(proj.x, proj.y);

        // 2. Invulnerability Geodesic Forcefield Sphere (When active upon respawn)
        if (p.invulnerableTimer > 0) {
            const shieldPulse = 1 + 0.06 * Math.sin(animTime * 0.015);
            const r = 58 * scale * shieldPulse;
            ctx.save();
            ctx.shadowBlur = 28 * scale;
            ctx.shadowColor = '#00f0ff';

            const shieldGrad = ctx.createRadialGradient(0, -32 * scale, 8 * scale, 0, -32 * scale, r);
            shieldGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
            shieldGrad.addColorStop(0.7, 'rgba(157, 0, 255, 0.28)');
            shieldGrad.addColorStop(0.92, 'rgba(0, 240, 255, 0.85)');
            shieldGrad.addColorStop(1, '#ffffff');

            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(0, -32 * scale, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5 * scale;
            ctx.stroke();
            ctx.restore();
        }

        // 3. Supercar Dimensions (Wide, aggressive aerodynamic stance)
        const carW = 106 * scale;
        const carH = isSliding ? (36 * scale) : (66 * scale);
        const halfW = carW * 0.5;

        // Ground offset: Anchors the supercar chassis so wheels rest at y = -10 (approx y=790 on screen)
        const baseY = -10 * scale;
        const topY = baseY - carH;

        // 4. Rear Wide Racing Wheels / Anti-Grav Magnetic Hubs
        const wheelW = 16 * scale;
        const wheelH = isSliding ? (18 * scale) : (28 * scale);
        const wheelY = baseY - wheelH;

        ctx.save();
        // Left & Right Tires
        ctx.fillStyle = '#0f0f14';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2 * scale;
        ctx.shadowBlur = 8 * scale;
        ctx.shadowColor = '#00f0ff';

        // Left Wheel
        ctx.beginPath();
        ctx.roundRect(-halfW, wheelY, wheelW, wheelH, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Right Wheel
        ctx.beginPath();
        ctx.roundRect(halfW - wheelW, wheelY, wheelW, wheelH, 4 * scale);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 5. Aerodynamic Rear Diffuser & Exhaust Tunnel
        ctx.save();
        ctx.fillStyle = '#090514';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(-halfW * 0.75, baseY);
        ctx.lineTo(-halfW * 0.65, baseY - 14 * scale);
        ctx.lineTo(halfW * 0.65, baseY - 14 * scale);
        ctx.lineTo(halfW * 0.75, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vertical Diffuser Fins
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5 * scale;
        for (let fx = -20 * scale; fx <= 20 * scale; fx += 13 * scale) {
            ctx.beginPath();
            ctx.moveTo(fx, baseY - 14 * scale);
            ctx.lineTo(fx, baseY);
            ctx.stroke();
        }

        // Center F1 Rain / Telemetry LED (Flashing amber/red)
        const f1Flash = Math.sin(animTime * 0.02) > 0;
        ctx.fillStyle = f1Flash ? '#ff3300' : '#440000';
        ctx.shadowBlur = f1Flash ? 10 * scale : 0;
        ctx.shadowColor = '#ff3300';
        ctx.fillRect(-4 * scale, baseY - 10 * scale, 8 * scale, 5 * scale);
        ctx.restore();

        // 6. Sculpted Metallic Supercar Body Shell (Cyber Teal, Hot Pink, Dark Purple)
        ctx.save();
        const bodyGrad = ctx.createLinearGradient(0, topY, 0, baseY);
        bodyGrad.addColorStop(0, '#00f0ff'); // Electric teal roof
        bodyGrad.addColorStop(0.35, '#7209b7'); // Vibrant magenta/purple mid-body
        bodyGrad.addColorStop(0.75, '#3a0ca3'); // Deep cosmic purple haunches
        bodyGrad.addColorStop(1, '#0c041c'); // Dark metallic shadow

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2 * scale;
        ctx.shadowBlur = 14 * scale;
        ctx.shadowColor = '#00f0ff';

        ctx.beginPath();
        // Aerodynamic wide wedge silhouette
        ctx.moveTo(-halfW * 0.85, baseY - 10 * scale);
        ctx.lineTo(-halfW, baseY - 24 * scale); // Wide rear fender
        ctx.lineTo(-halfW * 0.72, topY + carH * 0.45); // Tapering mid-body
        ctx.lineTo(-halfW * 0.42, topY + carH * 0.15); // Cockpit shoulder
        ctx.lineTo(-halfW * 0.28, topY); // Roof left
        ctx.lineTo(halfW * 0.28, topY); // Roof right
        ctx.lineTo(halfW * 0.42, topY + carH * 0.15); // Cockpit shoulder
        ctx.lineTo(halfW * 0.72, topY + carH * 0.45); // Tapering mid-body
        ctx.lineTo(halfW, baseY - 24 * scale); // Wide rear fender
        ctx.lineTo(halfW * 0.85, baseY - 10 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hot Pink Aerodynamic Crease Lines
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.8 * scale;
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(-halfW * 0.70, baseY - 22 * scale);
        ctx.lineTo(-halfW * 0.35, baseY - 26 * scale);
        ctx.lineTo(-halfW * 0.25, topY + carH * 0.2);
        ctx.moveTo(halfW * 0.70, baseY - 22 * scale);
        ctx.lineTo(halfW * 0.35, baseY - 26 * scale);
        ctx.lineTo(halfW * 0.25, topY + carH * 0.2);
        ctx.stroke();
        ctx.restore();

        // 7. Panoramic Tinted Glass Cockpit Canopy
        if (!isSliding) {
            ctx.save();
            const canopyH = carH * 0.42;
            const canopyW = carW * 0.46;
            const canopyGrad = ctx.createLinearGradient(0, topY, 0, topY + canopyH);
            canopyGrad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
            canopyGrad.addColorStop(0.3, 'rgba(30, 10, 60, 0.95)');
            canopyGrad.addColorStop(1, 'rgba(8, 2, 22, 0.98)');

            ctx.fillStyle = canopyGrad;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5 * scale;
            ctx.shadowBlur = 8 * scale;
            ctx.shadowColor = '#00f0ff';

            ctx.beginPath();
            ctx.moveTo(-canopyW * 0.35, topY + 2 * scale);
            ctx.lineTo(canopyW * 0.35, topY + 2 * scale);
            ctx.lineTo(canopyW * 0.5, topY + canopyH);
            ctx.lineTo(-canopyW * 0.5, topY + canopyH);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit Canopy Glare Line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 1.2 * scale;
            ctx.beginPath();
            ctx.moveTo(-canopyW * 0.22, topY + 4 * scale);
            ctx.lineTo(-canopyW * 0.38, topY + canopyH - 4 * scale);
            ctx.stroke();
            ctx.restore();
        }

        // 8. Elevated GT Rear Aerodynamic Wing / Spoiler
        ctx.save();
        const wingY = topY + (isSliding ? 2 * scale : carH * 0.25);
        const wingW = carW * 0.78;

        // Wing Struts
        ctx.fillStyle = '#100824';
        ctx.fillRect(-wingW * 0.25, wingY, 4 * scale, 12 * scale);
        ctx.fillRect(wingW * 0.25 - 4 * scale, wingY, 4 * scale, 12 * scale);

        // Wing Blade
        const wingGrad = ctx.createLinearGradient(-wingW * 0.5, 0, wingW * 0.5, 0);
        wingGrad.addColorStop(0, '#ff007f');
        wingGrad.addColorStop(0.5, '#00f0ff');
        wingGrad.addColorStop(1, '#ff007f');

        ctx.fillStyle = wingGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2 * scale;
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.roundRect(-wingW * 0.5, wingY - 4 * scale, wingW, 5 * scale, 2 * scale);
        ctx.fill();
        ctx.stroke();

        // Vertical Wing Endplates with Neon Hot Pink LEDs
        ctx.fillStyle = '#ff007f';
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = '#ff007f';
        ctx.fillRect(-wingW * 0.5 - 2 * scale, wingY - 8 * scale, 3 * scale, 12 * scale);
        ctx.fillRect(wingW * 0.5 - 1 * scale, wingY - 8 * scale, 3 * scale, 12 * scale);
        ctx.restore();

        // 9. Glowing Racing Number "#07" on Engine Deck
        ctx.save();
        ctx.font = `bold ${Math.max(8, Math.floor(13 * scale))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = '#00f0ff';
        ctx.fillText('#07', 0, baseY - (isSliding ? 18 : 28) * scale);
        ctx.restore();

        // 10. Twin Plasma Exhaust Thruster Plumes
        const thrusterXs = [-18 * scale, 18 * scale];
        const thrusterY = baseY - 12 * scale;
        const flameFlicker = gameState.isPaused ? 1.0 : (0.8 + Math.random() * 0.45);
        const flameLen = (20 + flameFlicker * 16) * scale * (isJumping ? 1.4 : 1.0);

        thrusterXs.forEach(tx => {
            ctx.save();
            // Thruster Hexagonal Bezel
            ctx.fillStyle = '#06020e';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            ctx.arc(tx, thrusterY, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Outer Hot Magenta & Cyan Plasma Flame
            const flameGrad = ctx.createLinearGradient(0, thrusterY, 0, thrusterY + flameLen);
            flameGrad.addColorStop(0, '#ffffff'); // White-hot core
            flameGrad.addColorStop(0.25, '#00f0ff'); // Electric cyan
            flameGrad.addColorStop(0.7, '#ff007f'); // Hot pink plume
            flameGrad.addColorStop(1, 'rgba(157, 0, 255, 0)');

            ctx.fillStyle = flameGrad;
            ctx.shadowBlur = 18 * scale;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(tx - 4 * scale, thrusterY);
            ctx.lineTo(tx + 4 * scale, thrusterY);
            ctx.lineTo(tx, thrusterY + flameLen);
            ctx.closePath();
            ctx.fill();

            // White Inner Turbine Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(tx, thrusterY + 2 * scale, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Sliding Sparks from underbody skirts
        if (isSliding) {
            ctx.save();
            ctx.fillStyle = '#ffd700';
            ctx.shadowBlur = 10 * scale;
            ctx.shadowColor = '#ffaa00';
            for (let s = 0; s < 6; s++) {
                const sparkX = (Math.random() - 0.5) * carW;
                const sparkY = baseY + (Math.random() - 0.5) * 6 * scale;
                ctx.fillRect(sparkX, sparkY, 3 * scale, 3 * scale);
            }
            ctx.restore();
        }

        ctx.restore();
    }

    // Render Particle Bursts
    function renderParticles() {
        runnerParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 30);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Automatically initialize game on window load
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
}

// Module export for Node.js Automated Testing Harness
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DESIGN_WIDTH,
        DESIGN_HEIGHT,
        LANE_X,
        TRACK_HALF_WIDTH,
        project3D,
        calculateCanvasDimensions,
        screenToLogicalCoord,
        checkRunnerCollision,
        gameState,
        player
    };
}
