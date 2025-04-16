// ^ Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ^ Layout Constants
const numberOfLanes = 5;
const laneHeight = canvas.height / numberOfLanes;

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

const pauseMenu = document.getElementById('pauseMenu');
const resumeButton = document.getElementById('resumeButton');
const pauseOptionsButton = document.getElementById('pauseOptionsButton');
const pauseMainMenuButton = document.getElementById('pauseMainMenuButton');
const pauseRestartButton = document.getElementById('pauseRestartButton');

const timerDisplay = document.getElementById('timerDisplay');

const pauseTip = document.createElement('div');
pauseTip.className = 'pause-tip';
pauseTip.textContent = 'Press ESC to pause the game';
document.getElementById('gameContainer').appendChild(pauseTip);

const notImplementedOverlay = document.getElementById('notImplementedOverlay');
const returnToPauseButton = document.getElementById('returnToPauseButton');

// ^ Game State
const car = {
  x: 50, // Horizontal position
  y: laneHeight * 2 + (laneHeight - 40) / 2, // Initial vertical position
  width: 60,
  height: 40,
  lane: 2, // Starts in the middle lane
  targetY: laneHeight * 2 + (laneHeight - 40) / 2 // For smooth lane change
};

let obstacles = [];           // Active obstacles on screen
let gameRunning = false;      // Whether the game is currently running
let obstacleTimer;            // Timer for obstacle spawning
let gamePaused = false;         // Whether the game is currently paused
let inPauseSettings = false; // Whether the game is in pause settings menu

let obstacleSpeed = 5;        // Speed of obstacles
let spawnDelayMin = 800;      // Minimum time between spawns
let spawnDelayMax = 2000;     // Maximum time between spawns
let laneDashOffset = 0;       // Used to animate lane lines

let timerInterval; //Timer for game timer
let timeLeft = 99; //Time left in the game from start


// ! Drawing Functions -----------------------------------------------

// ^ Draws the road, grass, and animated dashed lane dividers
function drawLanes() {
  ctx.fillStyle = '#444'; // Road color (grey)
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //& Draw top and bottom grass
  ctx.fillStyle = '#009c41'; // Grass color (green)
  ctx.fillRect(0, 0, canvas.width, laneHeight);
  ctx.fillRect(0, canvas.height - laneHeight, canvas.width, laneHeight);

  //& Dashed horizontal lane dividers
  ctx.strokeStyle = '#aaa'; // Divider color (Light Grey)
  ctx.lineWidth = 2;
  ctx.setLineDash([40, 65]); // ! Format [Dash length, space length]
  ctx.lineDashOffset = laneDashOffset;

  //& This loop draws those 2 dashed lines between the lanes.
  for (let i = 2; i <= 3; i++) {

    // Calculate the Y position for the current lane divider
    const y = laneHeight * i;

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
    const lane = Math.floor(Math.random() * 3) + 1; // Only middle 3 lanes
  
    //& Calculate the vertical (Y) position based on the selected lane
    //  This places the obstacle centered vertically inside its lane
    const y = lane * laneHeight + (laneHeight - 40) / 2;
    // Turning this is into a varible saves a huge headarche later
    const ImageRNG = Math.floor(Math.random() * obstacleImages.length);

    //& Select a random image from the obstacleImages array (cone, stop sign, warning sign, grandma, bananas)
    const randomImage = obstacleImages[ImageRNG];

    //& Based on the random image alters hitbox of the obstacle into three tiers for easier updates, a default 60 in case of failure.
    let Size = "Large";
  
    // changes the hitbox depending on the obstacles image, number in the array, split into "Medimum","Small", and "Large" as the default
    //& the problem with this system is if we add more obstacles we will need to update this list else it will be considered "Large"
    if (ImageRNG === 0) {
        Size = "Medimum";
    } else if (ImageRNG === 1 || ImageRNG === 2) {
        Size = "Small";
    } else {
        Size = "Large";
    }
    // *I would have loved to simply compare the randomised image to one of the images in the array, but doing so is painful so this was the more elegent option* (Editors note by Alex Burns)
    //& Create a new obstacle object and add it to the obstacles array
    // Starts just off the right side of the canvas, ready to move left
    obstacles.push({
      x: canvas.width, // Start just beyond the visible area
      y: y,            // The lane's Y position
      width: 60,       // Width of the obstacle (same as car)
      height: 40,      // Height of the obstacle (same as car)
      image: randomImage, // One of the 5 obstacle images
      size: Size    //Determines the size of the obstacles hitbox
    });
  
    // & Schedule the next obstacle spawn using a random delay between min and max
    // This keeps the game unpredictable and dynamic
    const nextSpawnDelay = spawnDelayMin + Math.random() * (spawnDelayMax - spawnDelayMin);
    obstacleTimer = setTimeout(spawnObstacle, nextSpawnDelay);
}

// ^ Detects collisions between the car and obstacles
function checkCollision() {
    for (let obs of obstacles) {
        let collision = false;
        
        if (obs.size == "Large") {
            if (
                car.x < obs.x + obs.width &&
                car.x + car.width > obs.x &&
                car.y < obs.y + obs.height &&
                car.y + car.height > obs.y
            ) {
                collision = true;
                deductTime(6); // 6 seconds for large obstacles
            }
            
        } else if (obs.size == "Medimum") {
            if (
                car.x < obs.x + obs.width &&
                car.x + car.width -15 > obs.x &&
                car.y < obs.y + obs.height &&
                car.y + car.height > obs.y
            ) {
                collision = true;
                deductTime(4); // 4 seconds for medium obstacles
            }
        } else if (obs.size == "Small") {
            if (
                car.x < obs.x + obs.width &&
                car.x + car.width -25 > obs.x &&
                car.y < obs.y + obs.height &&
                car.y + car.height > obs.y
            ) {
                collision = true;
                deductTime(2); // 2 seconds for small obstacles
            }
        }
        
        // If collision occurred, remove the obstacle
        if (collision) {
            obstacles = obstacles.filter(o => o !== obs);
        }
    }
}

// ! Main Game Timer Functions

//Updates the timer displayed
function timerDisplayUpdate() {
  timerDisplay.textContent = `${timeLeft}`;
  if (timeLeft <= 0) {
    endGameForTimer();
  }
}

//Function to use to end the game when time runs out.
function endGameForTimer() {
  if (!gameRunning) return; // Prevent multiple calls
  gameRunning = false;
  gamePaused = false;
  clearTimeout(obstacleTimer);
  clearInterval(timerInterval); 
  gameOverScreen.style.display = 'flex';
}

//Function to start the timer.
function startTimer() 
{
  timerInterval = setInterval(() => 
  {
    if (!gamePaused && timeLeft > 0) 
    {  
      timeLeft--;
      timerDisplayUpdate();
    }
  }, 1000); //Update every 1000ms (1 second)
}

//Deducts time when an obstacle is hit. Parameter is the amount of time in seconds you want deducted.
function deductTime(deduction) 
{
  timeLeft -= deduction;
  if (timeLeft <= 0) //No negative time allowed.
  {
    timeLeft = 0;
  }
  timerDisplayUpdate();
}

//Pauses the timer upon being called
function pauseTimer() 
{
  clearInterval(timerInterval); // Stop the timer
}

//Resume the timer after unpausing the game
function resumeTimer() 
{
  startTimer(); // Restart the timer
}


// ^ Main Game Loop
function gameLoop() {
  if (!gameRunning) return;
  if (gamePaused) return;
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

// ^ Handle W/S key presses for lane switching and pauseing game 

// Enhanced keyboard input handler with support for both WASD and arrow keys
document.addEventListener('keydown', e => {
  // Handle pause/resume with Escape key
  if (e.key === 'Escape' && gameRunning) {
    if (inPauseSettings) {
      return; // Ignore Escape key press
    }
    if (gamePaused) { // Resume the game
      resumeGame();
    } else { // Pause the game
      pauseGame();
    }
    return; // Prevent default behavior
  }
  
  // Don't process movement input if game isn't running or is paused
  if (!gameRunning || gamePaused) return;
  
  // Move up with W or Up Arrow
  if ((e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && car.lane > 0) {
    car.lane--;
    e.preventDefault(); // Prevent default browser behavior
  } 
  // Move down with S or Down Arrow
  else if ((e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') && car.lane < numberOfLanes - 1) {
    car.lane++;
    e.preventDefault(); // Prevent default browser behavior
  }
  
  // Calculate new target Y position for smooth animation
  car.targetY = laneHeight * car.lane + (laneHeight - 40) / 2;
});

// ! UI Button Event Listeners

// ^ Start the game from the main menu
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameRunning = true;
  timeLeft = 99; // Reset timer
  timerDisplayUpdate(); // Update display
  startTimer(); // Start the timer
  spawnObstacle();
  gameLoop();
});

// ^ Show options menu
optionsButton.addEventListener('click', () => {
  mainButtons.style.display = 'none';
  optionsMenu.style.display = 'flex';
});

// ^ Apply selected options
applyOptionsButton.addEventListener('click', () => {
  obstacleSpeed = parseInt(speedInput.value);
  spawnDelayMin = parseInt(spawnInput.value);
  spawnDelayMax = parseInt(spawnMaxInput.value);

  optionsMenu.style.display = 'none';
  
  if (gamePaused) {
    pauseMenu.style.display = 'flex';
  } else {
    mainButtons.style.display = 'flex';
  }
  
});

// ^ Restart the game from the Game Over screen
restartButton.addEventListener('click', () => {
  // Reset everything
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  timeLeft = 99; // Reset timer
  timerDisplayUpdate(); // Update display

  gameOverScreen.style.display = 'none';
  gameRunning = true;

  startTimer(); // Start the timer
  spawnObstacle();
  gameLoop();
});

// ^ Go back to main menu from Game Over screen
mainMenuButton.addEventListener('click', () => {
  // Resets everything
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  clearInterval(timerInterval); // Clear the timer interval
  timeLeft = 99; // Reset timer
  timerDisplayUpdate(); // Update display

  gameOverScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

function pauseGame() {
  if (!gameRunning || gamePaused) return;
  
  gamePaused = true;
  clearTimeout(obstacleTimer); // Stop spawning obstacles
  pauseTimer(); // Pause the timer
  pauseMenu.style.display = 'flex';
}
// ^ Resume the game from the pause menu
function resumeGame() {
  if (!gamePaused) return;
  
  pauseMenu.style.display = 'none';
  gamePaused = false;
  spawnObstacle(); // Restart obstacle spawning
  resumeTimer(); // Resume the timer
  requestAnimationFrame(gameLoop); // Restart the game loop
}


// Add pause menu button event listeners
resumeButton.addEventListener('click', resumeGame);

pauseMainMenuButton.addEventListener('click', () => {
  // Reset game state
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  gamePaused = false;
  gameRunning = false;
  
  pauseMenu.style.display = 'none';
  startScreen.style.display = 'flex';
});

//  event listener for restart button in pause menu
pauseRestartButton.addEventListener('click', () => {
  // Reset game state
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  
  // Hide pause menu
  pauseMenu.style.display = 'none';
  
  // Reset pause state
  gamePaused = false;
  
  // Start game fresh
  gameRunning = true;
  spawnObstacle();
  gameLoop();
});

// ^ Not implemented overlay button event listener this is just a placeholder for now and is for the settings menu
pauseOptionsButton.addEventListener('click', () => {
  pauseMenu.style.display = 'none';
  notImplementedOverlay.style.display = 'flex';
  inPauseSettings = true; // Set the flag to indicate we're in pause settings
});

// Add click event for return to pause menu button
returnToPauseButton.addEventListener('click', () => {
  notImplementedOverlay.style.display = 'none';
  pauseMenu.style.display = 'flex';
  inPauseSettings = false; // Clear the flag when returning to pause menu
});

// ! Initial Draws (for when the page loads)
drawLanes();
drawCar();
