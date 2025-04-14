// ^ Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ^ Layout Constants
const grassHeight = 30; // Height of the grass at top and bottom
const totalRoadHeight = canvas.height - grassHeight * 2; // Road area between the grass
const laneHeight = totalRoadHeight / 3; // Height of each of the 3 lanes

// ^ Image Assets
// & Car image
const carImage = new Image();
carImage.src = 'assets/carPixel.png'; // ~ Link to car png

// & Obstacle images (randomized per obstacle)
const obstacleImages = 
[
  'assets/cone.png', // ~ Links to obstacle pngs
  'assets/stopSign.png',
  'assets/warningSign.png',
  'assets/grandma.png',
  'assets/bananas.png'
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// ^ UI Element References
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const optionsButton = document.getElementById('optionsButton');
const optionsMenu = document.getElementById('optionsMenu');
const applyOptionsButton = document.getElementById('applyOptionsButton');
const speedInput = document.getElementById('speedInput');
const spawnInput = document.getElementById('spawnInput');
const spawnMaxInput = document.getElementById('spawnMaxInput');
const mainButtons = document.getElementById('mainButtons');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const difficultyButton = document.getElementById('difficultyButton');
const difficultyMenu = document.getElementById('difficultyMenu');
const easyButton = document.getElementById('easyButton');
const mediumButton = document.getElementById('mediumButton');
const hardButton = document.getElementById('hardButton');

// ^ Game State
const car = {
  x: 50, // Horizontal position
  y: grassHeight + laneHeight + (laneHeight - 40) / 2, // Initial vertical position
  width: 60,
  height: 40,
  lane: 1, // Starts in the middle lane
  targetY: grassHeight + laneHeight + (laneHeight - 40) / 2 // For smooth lane change
};

let obstacles = [];           // Active obstacles on screen
let gameRunning = false;      // Whether the game is currently running
let obstacleTimer;            // Timer for obstacle spawning

// ^ Configurable Options
let obstacleSpeed = 5;        // Speed of obstacles
let spawnDelayMin = 800;      // Minimum time between spawns
let spawnDelayMax = 2000;     // Maximum time between spawns
let laneDashOffset = 0;       // Used to animate lane lines


// ! Drawing Functions -----------------------------------------------

// ^ Draws the road, grass, and animated dashed lane dividers
function drawLanes() {
  ctx.fillStyle = '#444'; // Road color (grey)
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //& Draw top and bottom grass
  ctx.fillStyle = '#009c41'; // Grass color (green)
  ctx.fillRect(0, 0, canvas.width, grassHeight);
  ctx.fillRect(0, canvas.height - grassHeight, canvas.width, grassHeight);

  //& Dashed horizontal lane dividers
  ctx.strokeStyle = '#aaa'; // Divider color (Light Grey)
  ctx.lineWidth = 2;
  ctx.setLineDash([40, 65]); // ! Format [Dash length, space length]
  ctx.lineDashOffset = laneDashOffset;

  //& This loop draws those 2 dashed lines between the lanes.
  for (let i = 1; i < 3; i++) {

    // Calculate the Y position for the current lane divider
    const y = grassHeight + i * laneHeight;

    // Begin a new drawing path for the dashed divider line
    ctx.beginPath();

    // Start the line on the left edge of the canvas, at the calculated Y
    ctx.moveTo(0, y);

    //  Draw a line horizontally across to the right edge of the canvas
    ctx.lineTo(canvas.width, y);

    // Actually draw the line using the current stroke style (set earlier)
    ctx.stroke();
  }

  ctx.setLineDash([]); // Reset for future drawing
}

// ^ Draws the car (image version)
function drawCar() {
  if (carImage.complete) {
    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);
  } else {
    // Wait for the image to load before drawing
    carImage.onload = () => {
      ctx.drawImage(carImage, car.x, car.y, car.width, car.height);
    };
  }
}

// ^ Draws all active obstacles
function drawObstacles() {
  for (let obs of obstacles) {
    if (obs.image && obs.image.complete) {
      ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = 'yellow';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  }
}

// ^ Moves obstacles to the left and removes off-screen ones
function updateObstacles() {
  for (let obs of obstacles) {
    obs.x -= obstacleSpeed;
  }
  obstacles = obstacles.filter(obs => obs.x + obs.width > 0); // Remove when fully off-screen
}

// ^ Creates a new obstacle at a random lane
function spawnObstacle() {

    //& Randomly choose one of the 3 lanes: 0, 1, or 2
    const lane = Math.floor(Math.random() * 3);
  
    //& Calculate the vertical (Y) position based on the selected lane
    //  This places the obstacle centered vertically inside its lane
    const y = grassHeight + lane * laneHeight + (laneHeight - 40) / 2;
  
    //& Select a random image from the obstacleImages array (cone, stop sign, warning sign)
    const randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  
    //& Create a new obstacle object and add it to the obstacles array
    // Starts just off the right side of the canvas, ready to move left
    obstacles.push({
      x: canvas.width, // Start just beyond the visible area
      y: y,            // The lane's Y position
      width: 60,       // Width of the obstacle (same as car)
      height: 40,      // Height of the obstacle (same as car)
      image: randomImage // One of the 3 obstacle images
    });
  
    // & Schedule the next obstacle spawn using a random delay between min and max
    // This keeps the game unpredictable and dynamic
    const nextSpawnDelay = spawnDelayMin + Math.random() * (spawnDelayMax - spawnDelayMin);
    obstacleTimer = setTimeout(spawnObstacle, nextSpawnDelay);
}

// ^ Detects collisions between the car and obstacles
function checkCollision() {
  for (let obs of obstacles) {
    if (
      car.x < obs.x + obs.width &&
      car.x + car.width > obs.x &&
      car.y < obs.y + obs.height &&
      car.y + car.height > obs.y
    ) {
      //  Collision happened — stop game and show Game Over screen
      gameRunning = false;
      clearTimeout(obstacleTimer);
      gameOverScreen.style.display = 'flex';
    }
  }
}

// ^ Main Game Loop
function gameLoop() {
  if (!gameRunning) return;

  // Move the lane dividers for road movement effect
  laneDashOffset += obstacleSpeed;

  // Smooth car movement between lanes
  const smoothing = 0.1;
  car.y += (car.targetY - car.y) * smoothing;

  // Clear and redraw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLanes();
  drawCar();
  drawObstacles();
  updateObstacles();
  checkCollision();

  requestAnimationFrame(gameLoop); // Continue the loop
}

// ! Input Handling --------------------------------------------

// ^ Handle W/S key presses for lane switching
document.addEventListener('keydown', e => {
  if (!gameRunning) return;
  if (e.key === 'w' && car.lane > 0) {
    car.lane--;
  } else if (e.key === 's' && car.lane < 2) {
    car.lane++;
  }

  // Set the new vertical target based on the lane
  car.targetY = grassHeight + car.lane * laneHeight + (laneHeight - 40) / 2;
});

// ! UI Button Event Listeners

// ^ Start the game from the main menu
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameRunning = true;
  spawnObstacle();
  gameLoop();
});

// ^ Show options menu
optionsButton.addEventListener('click', () => {
  mainButtons.style.display = 'none';
  optionsMenu.style.display = 'flex';
});

// ^ Show difficulty options menu
difficultyButton.addEventListener('click', () => {
  mainButtons.style.display = 'none';
  optionsMenu.style.display = 'none';
  difficultyMenu.style.display = 'flex';
});

// ^ Apply selected options
applyOptionsButton.addEventListener('click', () => {
  obstacleSpeed = parseInt(speedInput.value);
  spawnDelayMin = parseInt(spawnInput.value);
  spawnDelayMax = parseInt(spawnMaxInput.value);

  optionsMenu.style.display = 'none';
  mainButtons.style.display = 'flex';
});

// ^ Restart the game from the Game Over screen
restartButton.addEventListener('click', () => {
  // Reset everything
  obstacles = [];
  car.lane = 1;
  car.y = grassHeight + laneHeight + (laneHeight - 40) / 2;
  car.targetY = car.y;

  gameOverScreen.style.display = 'none';
  gameRunning = true;

  spawnObstacle();
  gameLoop();
});

// ^ Go back to main menu from Game Over screen
mainMenuButton.addEventListener('click', () => {
  // Resets everything
  obstacles = [];
  car.lane = 1;
  car.y = grassHeight + laneHeight + (laneHeight - 40) / 2;
  car.targetY = car.y;

  gameOverScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

// ! Initial Draws (for when the page loads)
drawLanes();
drawCar();
