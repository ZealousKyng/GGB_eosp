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

const f150Image = new Image();
f150Image.src = 'assets/bucky-f-150-pixilart.png'; // New F-150 truck

// NEW - track the selected car image
let selectedCarImage = carImage; // Start with the default car

// Finish Line image
const finishLine = new Image();
finishLine.src = 'assets/FinishLine.png'; // ~ Link to Finish Line

// & Crushed Obstacle Images
const crushedObstacleImages = {
  'bananas': 'assets/crushedbananas.png',
  'cone': 'assets/crushedCone.png',
  'grandma': 'assets/crushedGrandma.png',
  'stopSign': 'assets/crushedStopSign.png',
  'warningSign': 'assets/crushedWarningSign.png'
};


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

//Timer Constant Default Data
const defaultTimer = 99;
const defaultEndTimer = 37;

// ^ UI Element References
const startScreen = document.getElementById('startScreen'); // Main menu element
const startButton = document.getElementById('startButton');   // Start button element
const optionsButton = document.getElementById('optionsButton');   // Options button element
const highscoresButton = document.getElementById('highscoresButton') // Highscores button element
const highscoresList = document.getElementById('highscoresList') // Highscores display
const backButton = document.getElementById('backButton'); // Button to go back to the main menu from the highscores list
const optionsMenu = document.getElementById('optionsMenu');   // Options menu element
const applyOptionsButton = document.getElementById('applyOptionsButton');     // Apply button element    
const mainButtons = document.getElementById('mainButtons');     // Main menu buttons element
const gameOverScreen = document.getElementById('gameOverScreen');     // Game Over screen element
const scoreDisplay = document.getElementById('score'); // Score that is displayed on the game over screen
const restartButton = document.getElementById('restartButton');     // Restart button element
const mainMenuButton = document.getElementById('mainMenuButton');     // Main menu button element
const difficultySelect = document.getElementById('difficultySelect'); // Difficulty select element
const startLightOverlay = document.getElementById('startLightOverlay');  // Start light overlay element
const highScores = document.getElementById('highScores'); // List of highscores to be displayed in the highscores list


//pause menu button event listeners created by Jackson kraus 4/10/2025 
const pauseButton = document.getElementById('pauseButton'); // Pause button that displays in game
const pauseMenu = document.getElementById('pauseMenu'); // Pause menu element
const resumeButton = document.getElementById('resumeButton'); // Resume button element
const pauseOptionsButton = document.getElementById('pauseOptionsButton'); // Options button in pause menu
const pauseMainMenuButton = document.getElementById('pauseMainMenuButton'); // Main menu button in pause menu
const pauseRestartButton = document.getElementById('pauseRestartButton'); // Restart button in pause menu
//-------------------------------------------------------
const timerDisplay = document.getElementById('timerDisplay'); // Timer display element

const pauseTip = document.createElement('div'); // Create a new div for the pause tip
pauseTip.className = 'pause-tip'; // Add a class for styling

document.getElementById('gameContainer').appendChild(pauseTip); // Append the pause tip to the game container

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
let timeLeft = defaultTimer; //Time left in the game from start
let isFastTimer = false; // Track if we are in the grass lane/fast timer mode.
let endScore = 0; // Initialize score to display on the game over screen
let EndGameInterval; // Timer til the finish Line Spawns
let endTimeLeft = defaultEndTimer; // Time left

// Initilize highscores
try {
  updateScoreList();
}
catch (e) {
  console.error(e);
}


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
  if (selectedCarImage.complete) {
    ctx.drawImage(selectedCarImage, car.x + 40, car.y, car.width, car.height);
  } else {
    selectedCarImage.onload = () => {
      ctx.drawImage(selectedCarImage, car.x + 40, car.y, car.width, car.height);
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
      type: obstacleImages[ImageRNG].src.split('/').pop().replace('.png', ''), // 
      size: Size,    //Determines the size of the obstacles hitbox
      collidable: true
    });
  
    // & Schedule the next obstacle spawn using a random delay between min and max
    // This keeps the game unpredictable and dynamic
    const nextSpawnDelay = spawnDelayMin + Math.random() * (spawnDelayMax - spawnDelayMin);
    obstacleTimer = setTimeout(spawnObstacle, nextSpawnDelay);
}

// ^ Detects collisions between the car and obstacles
// function checkCollision() {
//     for (let obs of obstacles) {
//         let collision = false;
        
//         if (obs.size == "Large") {
//             if (
//                 car.x < obs.x + obs.width &&
//                 car.x + car.width > obs.x &&
//                 car.y < obs.y + obs.height &&
//                 car.y + car.height > obs.y
//             ) {
//                 collision = true;
//                 deductTime(6); // 6 second deduction
//             }

//         } else if (obs.size == "Medimum") {
//             if (
//                 car.x < obs.x + obs.width &&
//                 car.x + car.width - 15 > obs.x &&
//                 car.y < obs.y + obs.height &&
//                 car.y + car.height > obs.y
//             ) {
//                 collision = true;
//                 deductTime(4); // 4 second deduction
//             }
//         } else if (obs.size == "Small") {
//             if (
//                 car.x < obs.x + obs.width &&
//                 car.x + car.width - 25 > obs.x &&
//                 car.y < obs.y + obs.height &&
//                 car.y + car.height > obs.y
//             ) {
//                 collision = true;
//                 deductTime(3); // 3 second deduction Altered to make the game harder (2 was too small) *Change Made By Alex Burns 4/26/25*
//             }
//         } else if (obs.size == "Omega") { //This is exclusively is used by the Finish Line (no height check to ensure cant "Dodge" the line) *Alex Burns 4/22/25*
//             if (
//                 car.x < obs.x + obs.width && 
//                 car.x + car.width > obs.x + obs.width  // Updated collision so the game ends when the car crosses the line *Adjusted by Alex Burns 4/26/25*
//             ) {
//                 endGameFromSuccess();
//             }
//         }
        
        
//         // Remove object if collision occurs.
//         if (collision) {
//           if (crushedObstacleImages[obs.type]) {
//                 const crushedImg = new Image();
//                 crushedImg.src = crushedObstacleImages[obs.type];
//                 obs.image = crushedImg; // Swap to crushed image
//                 obs.isCrushed = true;
//             } else {
//                 obstacles = obstacles.filter(o => o !== obs); // Only remove if not crushable
//             }
//             shakeAmplitude = 50; // Adjust this value to control shake intensity
//             shakeDuration = 50; //Adjust this value to control shake duration
//         }
//     }
// }
function checkCollision() {
  for (let obs of obstacles) {
    if (!obs.collidable) continue;
      let collision = false;
      
      if (obs.size == "Large") {
          if (
              car.x < obs.x + obs.width &&
              car.x + car.width > obs.x &&
              car.y < obs.y + obs.height &&
              car.y + car.height > obs.y
          ) {
              collision = true;
              deductTime(6); // 6 second deduction
          }

      } else if (obs.size == "Medimum") {
          if (
              car.x < obs.x + obs.width &&
              car.x + car.width - 15 > obs.x &&
              car.y < obs.y + obs.height &&
              car.y + car.height > obs.y
          ) {
              collision = true;
              deductTime(4); // 4 second deduction
          }
      } else if (obs.size == "Small") {
          if (
              car.x < obs.x + obs.width &&
              car.x + car.width - 25 > obs.x &&
              car.y < obs.y + obs.height &&
              car.y + car.height > obs.y
          ) {
              collision = true;
              deductTime(3); // 3 second deduction Altered to make the game harder (2 was too small) *Change Made By Alex Burns 4/26/25*
          }
      } else if (obs.size == "Omega") { //This is exclusively is used by the Finish Line (no height check to ensure cant "Dodge" the line) *Alex Burns 4/22/25*
          if (
              car.x < obs.x + obs.width && 
              car.x + car.width > obs.x + obs.width // Updated collision so the game ends when the car crosses the line *Adjusted by Alex Burns 4/26/25*
          ) {
              endGameFromSuccess();
          }
      }
      
      // Handle collision
      if (collision) {
          if (crushedObstacleImages[obs.type]) {
              const crushedImg = new Image();
              crushedImg.src = crushedObstacleImages[obs.type];
              obs.image = crushedImg; // Swap to crushed image
              obs.isCrushed = true;
              obs.collidable = false; 
          } else {
              obstacles = obstacles.filter(o => o !== obs); // Only remove if not crushable
          }
          shakeAmplitude = 30; // Adjust this value to control shake intensity
          shakeDuration = 30; //Adjust this value to control shake duration
          break; 
      }
  }
}


// Spawns the Finish Line that will end the game *Alex Burns*
function spawnFinishLine() {
    var y = laneHeight; // third lanes
    obstacles.push({
        x: canvas.width, // Start just beyond the visible area
        y: y,            // The lane's Y position
        width: 120,       // Width of the obstacle twice the car
        height: 240,      // Height of the obstacle covers all three lanes
        image: finishLine, // The Finish Line
        size: "Omega",   //Determines the size of the obstacles hitbox
        collidable: true
    });
}


// ! Main Game Timer Functions

//Updates the timer displayed on the screen.   - Jericho McGowan 4/19/2025
function timerDisplayUpdate() {
  timerDisplay.textContent = `${timeLeft}`; // Updates the timer display 
  if (timeLeft <= 0) { // If the timer reaches 0 then end the game 
    endGameForTimer(); // Calls the end game function  
  }
  
  // Reset timer color to white if not in grass. Flashes red in grass 
  if (!isFastTimer) {
    timerDisplay.style.color = 'white';
  }
}

//Function to use to end the game when time runs out.
function endGameForTimer() {
  if (!gameRunning) return; // Prevent multiple calls
  gameRunning = false;
  gamePaused = false;
  pauseButton.style.display = 'none'; // Hide the pause button
  clearTimeout(obstacleTimer);
  clearInterval(timerInterval); 
  clearInterval(EndGameInterval);
  gameOverScreen.style.display = 'flex';
}

//Function to start the timer. - Jericho McGowan 4/19/2025
function startTimer() 
{
  isFastTimer = false; // Reset to normal speed 
  timerInterval = setInterval(() => 
  {
    if (!gamePaused && timeLeft > 0) 
    {  
      timeLeft--;
      timerDisplayUpdate();
    }
  }, 1000); //Initial update every 1000ms - Jericho McGowan 4/19/2025
}

//Function to start the End Game timer.
//*End game timer created by Alex Burns*
function startEndGameTimer() {
    EndGameInterval = setInterval(() => {
        if (!gamePaused && endTimeLeft > 0) {
            endTimeLeft--;
        }
        if (!gamePaused && endTimeLeft <= 0) {
            // Once time has ended then spawn a finish Line that will end the game that must be
            // temporarly will end the game imeditaly
            spawnFinishLine();
            clearInterval(EndGameInterval); // clears the interval ensuring another Finish line will not spawn again in normal gameplay
        }
    }, 1000); //Update every 1000ms (1 second)
}
 // This Function Will end the game using the EGT
function endGameFromSuccess(){
    if (!gameRunning) return; // Prevent multiple calls

    gameRunning = false;
    gamePaused = false;
    pauseButton.style.display = 'none'; // Hide the pause button
    clearTimeout(obstacleTimer);
    clearInterval(timerInterval);
    clearInterval(EndGameInterval);
    endScore = timeLeft * 10; // Calculate score based on time left
    scoreDisplay.innerHTML = "Score: " + endScore; // Append new score to scoreDisplay
    try {
      saveScore(endScore);
      }
    catch (e) {
      console.error(e);
    }
    gameOverScreen.style.display = 'flex';
}

//Deducts time when an obstacle is hit. Parameter is the amount of time in seconds you want deducted.
function deductTime(deduction) 
{
  timeLeft -= deduction;
  if (timeLeft <= 0) //No negative time allowed.
  {
    timeLeft = 0;
  }
  
  // Show points deduction - Jericho McGowan 4/19/2025
  const pointsDisplay = document.getElementById('pointsDeduction');
  
  // Reset any existing timeout - Jericho McGowan 4/19/2025
  if (pointsDisplay.timeoutId) {
    clearTimeout(pointsDisplay.timeoutId);
  }
  
  pointsDisplay.textContent = `-${deduction}`;
  pointsDisplay.style.opacity = '1';
  
  // Hide after 1 second - Jericho McGowan 4/19/2025
  pointsDisplay.timeoutId = setTimeout(() => {
    pointsDisplay.style.opacity = '0';
  }, 1000);
  
  timerDisplayUpdate();
}

//Pauses the timer upon being called
function pauseTimer() 
{
    clearInterval(timerInterval); // Stop the timer
    clearInterval(EndGameInterval); // Stop the EOG timer
}

//Resume the timer after unpausing the game
function resumeTimer() 
{
    startTimer(); // Restart the timer
    startEndGameTimer();
}

// Starting animation
// * - NIC
function showStartLightSequence() {
  let sequence = [
    { text: "Ready", color: "red" },
    { text: "Set", color: "orange" },
    { text: "Go!", color: "lime" }
  ];

  //Initializing index to step through lights
  let index = 0;
  startLightOverlay.style.display = 'block';

  const step = () => {
    if (index < sequence.length) {
      startLightOverlay.textContent = sequence[index].text;
      startLightOverlay.style.color = sequence[index].color;
      index++;
      setTimeout(step, 700); // Time per light
    } else {
      startLightOverlay.style.display = 'none';
      startGameAfterLight(); // Actually start the game here
    }
  };

  step(); // Start sequence
}

// Simple game start function calls
// * - NIC
function startGameAfterLight() {
  gameRunning = true;
  timeLeft = defaultTimer;
  endTimeLeft = defaultEndTimer;
  timerDisplay.style.display = 'block'; // Show the timer
  pauseButton.style.display = 'block' ; // Show the pause button
  timerDisplay.style.color = 'white'; // Reset color to white
  timerDisplay.classList.remove('grass-effect'); // Remove any grass effect
  timerDisplayUpdate();
  startTimer();
  startEndGameTimer();
  spawnObstacle();
  gameLoop();
}

// ^ Main Game Loop
let shakeAmplitude = 0;  // Amplitude of the shake
let shakeDuration = 0; // Duration of the shake
let shakeTimer = 0;  // Timer to reset shakeDuration value


function gameLoop() {
  if (!gameRunning) return;
  if (gamePaused) return;
  // Move the lane dividers for road movement effect
  laneDashOffset += obstacleSpeed;

  // Check lane position and update timer interval - Jericho McGowan 4/19/2025
  if (car.lane === 0 || car.lane === 4) {
    // If in grass lane and not already in fast mode - Jericho McGowan 4/19/2025
    if (!isFastTimer) {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!gamePaused && timeLeft > 0) {
          timeLeft--;
          timerDisplayUpdate();
        }
      }, 500); // 500ms interval for grass lane - Jericho McGowan 4/19/2025
      isFastTimer = true;
      timerDisplay.classList.add('grass-effect');
      // Immediately decrease timer when entering grass lane
      if (!gamePaused && timeLeft > 0) {
        timeLeft--;
        timerDisplayUpdate();
      }
    }
  } else {
    // If in road lane and in fast mode
    if (isFastTimer) {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!gamePaused && timeLeft > 0) {
          timeLeft--;
          timerDisplayUpdate();
        }
      }, 1000);
      isFastTimer = false; // Reset to normal speed
      timerDisplay.classList.remove('grass-effect');
      // Immediately update timer when leaving grass lane
      if (!gamePaused && timeLeft > 0) {
        timeLeft--;
        timerDisplayUpdate();
      }
    }
  }

  // Smooth car movement between lanes
  const smoothing = 0.1;
  car.y += (car.targetY - car.y) * smoothing;

  // Apply shake if active
  let offsetX = 0;
  let offsetY = 0;
  if (shakeAmplitude > 0) {
    offsetX = (Math.random() - 0.5) * shakeAmplitude;
    offsetY = (Math.random() - 0.5) * shakeAmplitude;
    shakeTimer--;
  if (shakeTimer <= 0) {
    shakeAmplitude = 0;
    shakeTimer = shakeDuration;
  }
}

  // Clear and redraw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(offsetX, offsetY); // Apply shake effect
  drawLanes();
  drawObstacles();
  drawCar();
  updateObstacles();
  checkCollision();
  ctx.resetTransform(); //Reset transform for shake effect


  requestAnimationFrame(gameLoop); // Continue the loop
}

// Gets the highscores from the local storage. Return none if error.
function getHighScores() {
  try{
    let scores = JSON.parse(localStorage.getItem('localScores'));
    // If scores == null, return an empty array
    if (scores == null) {
      return [];
    }
    return scores;
  }
  catch (e) {
    console.error(e);
    return []; // Return empty array on error
  }
}

// Saves a new score to local storage
function saveScore(score) {
  let currentScores = getHighScores();
  currentScores.push(score);
  localStorage.setItem('localScores', JSON.stringify(currentScores)); // Save updated score list
  updateScoreList(); // Refresh leaderboard
}

// Updates the displayed list of scores
function updateScoreList() {
  let scores = getHighScores();
  scores.sort((a,b) => b - a); // Sort scores by highest first
  scores = scores.slice(0, 5); // Limit to 5 scores
  let stringBuild = "";
  for (let i = 0; i < scores.length; i++) {
    stringBuild += (i + 1) + ". " + scores[i] + "<br>";
  }
  highScores.innerHTML = stringBuild;
}


// ! Input Handling --------------------------------------------

// ^ Handle W/S key presses for lane switching and pauseing game 

// Enhanced keyboard input handler with support for both WASD and arrow keys
document.addEventListener('keydown', e => {
  // Handle pause/resume with Escape key created by Jackson Kraus 4/10/2025
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

// ^ Touch controls
// * - Noah
// Touch controls implemented to work by tapping on each "lane" to change lane car is in
canvas.addEventListener('touchstart', e => {
  // Get touch coordinates
  const touch = e.touches[0]; // First touch input (tap) used only
  const y = touch.clientY; // Vertical coordinate relative to viewport

  // Determine lane based on touch position - divids touch input "y" by lane height to determine
  let lane = Math.floor(y / laneHeight);

  // Update car's lane
  car.lane = lane;

  // Calculate new Y position
  car.targetY = laneHeight * car.lane + (laneHeight - 40) / 2;
});

// ! UI Button Event Listeners

// ^ Start the game from the main menu
startButton.addEventListener('click', () => {
  // Reset car to middle lane before starting - Jericho McGowan 4/28/2025
  car.lane = 2; 
  const centerY = laneHeight * 2 + (laneHeight - 40) / 2;
  car.y = centerY;
  car.targetY = centerY;
  // Force redraw  - Jericho McGowan 4/28/2025
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  drawLanes(); // Redraw the background lanes
  drawCar();   // Redraw the car in its new, centered position
  startScreen.style.display = 'none';
  showStartLightSequence(); // Trigger traffic light sequence
});
// ^ Show options menu  
optionsButton.addEventListener('click', () => {
  mainButtons.style.display = 'none';
  optionsMenu.style.display = 'flex';
});

// ^ Show highscores list
highscoresButton.addEventListener('click', () => {
  mainButtons.style.display = 'none';
  highscoresList.style.display = 'flex';
});

// ^ Go back to main menu from highscores list
backButton.addEventListener('click', () => {
  highscoresList.style.display = 'none';
  startScreen.style.display = 'flex'; //  Show main menu
  mainButtons.style.display = 'flex'; // Show main buttons
});

// ^ Apply selected options
// * - NIC
applyOptionsButton.addEventListener('click', () => {
  const selectedDifficulty = difficultySelect.value;

  //Presets for difficulty level
  if (selectedDifficulty === 'easy') { //adjusted Difficluty levels to be consitiant, harder, and the speed faster *edited by Alex Burns 4/26/25*
    obstacleSpeed = 2;
    spawnDelayMin = 800;
    spawnDelayMax = 2000;
  } else if (selectedDifficulty === 'medium') {
    obstacleSpeed = 6;
    spawnDelayMin = 600;
    spawnDelayMax = 1600;
  } else if (selectedDifficulty === 'hard') {
    obstacleSpeed = 8;
    spawnDelayMin = 400;
    spawnDelayMax = 1200;
  }

  // Handle Car Selection
  const selectedCarValue = document.querySelector('input[name="carChoice"]:checked').value;

  if (selectedCarValue === 'carPixel') {
    selectedCarImage = carImage;
  } else if (selectedCarValue === 'f150') {
    selectedCarImage = f150Image;
  }

  optionsMenu.style.display = 'none';
  startScreen.style.display = 'flex'; //  Show main menu
  mainButtons.style.display = 'flex'; // Show main buttons
});


// ^ Restart the game from the Game Over screen
restartButton.addEventListener('click', () => {
  // Reset everything
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  timeLeft = defaultTimer; // Reset timer
  endTimeLeft = defaultEndTimer; //Reset End Of Game Timer
  timerDisplayUpdate(); // Update display
  gameOverScreen.style.display = 'none';
  pauseButton.style.display = 'block'; // Show the pause button
  pauseButton.textContent = "Pause"; // Reset button text
  gameRunning = true;
  startTimer(); // Start the timer
  startEndGameTimer();
  spawnObstacle();
  gameLoop();
});
 // Pause the game from the game screen
 // created by Jackson Kraus 4/27/2025
pauseButton.addEventListener('click', () => {
  if (gameRunning && !gamePaused) {
    pauseGame();
  }
});

// ^ Go back to main menu from Game Over screen
mainMenuButton.addEventListener('click', () => {
  // Resets everything
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  clearInterval(timerInterval); // Clear the timer interval
  clearInterval(EndGameInterval); // clears the EOG timer
  timeLeft = defaultTimer; // Reset timer
  endTimeLeft = defaultEndTimer; //Reset end game timer
  timerDisplay.style.display = 'none'; // Hide the timer
  pauseButton.style.display = 'none'; // Hide the pause button
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
  pauseButton.style.display = 'none'; // Hide the pause button
    
}
// ^ Resume the game from the pause menu
function resumeGame() {
  if (!gamePaused) return;
  
  pauseMenu.style.display = 'none';
  pauseButton.style.display = 'block'; // Show the pause button
  gamePaused = false;
  spawnObstacle(); // Restart obstacle spawning
  resumeTimer(); // Resume the timer
  requestAnimationFrame(gameLoop); // Restart the game loop
  pauseButton.textContent = "Pause"; //change the pause button back to pause
}


// Add pause menu button event listeners
resumeButton.addEventListener('click', resumeGame);

pauseMainMenuButton.addEventListener('click', () => {
  gamePaused = false; // Reset pause state
  gameRunning = false; // Stop the game loop
  pauseMenu.style.display = 'none';// Hide the pause menu
  pauseButton.style.display = 'none';// Hide the pause button
  startScreen.style.display = 'flex'; // Show the main menu
  mainButtons.style.display = 'flex'; //  Added this to ensure buttons show
  timerDisplay.style.display = 'none'; // Hide the timer
});


//  event listener for restart button in pause menu
pauseRestartButton.addEventListener('click', () => { //created by Jackson Kraus 4/10/2025
  // Reset game state
  obstacles = [];
  car.lane = 2;
  car.y = laneHeight * 2 + (laneHeight - 40) / 2;
  car.targetY = car.y;
  
  // Hide pause menu
  pauseMenu.style.display = 'none';
  
  // Reset pause state
  gamePaused = false;
  
  pauseButton.style.display = 'block';
  pauseButton.textContent = "Pause";

  // Start game fresh
  gameRunning = true;
  timeLeft = defaultTimer;
  endTimeLeft = defaultEndTimer;
  timerDisplayUpdate();
  startTimer();
  startEndGameTimer();
  spawnObstacle();
  gameLoop();
});

// ^ Not implemented overlay button event listener this is just a placeholder for now and is for the settings menu
// created by Jackson Kraus 4/10/2025
pauseOptionsButton.addEventListener('click', () => {
  pauseMenu.style.display = 'none';
  notImplementedOverlay.style.display = 'flex';  
  inPauseSettings = true; // Set the flag to indicate we're in pause settings
});

// Add click event for return to pause menu button
// created by Jackson Kraus 4/10/2025
returnToPauseButton.addEventListener('click', () => {
  notImplementedOverlay.style.display = 'none';
  pauseMenu.style.display = 'flex';
  inPauseSettings = false; // Clear the flag when returning to pause menu
});

// ! Initial Draws (for when the page loads)
drawLanes();
drawCar();
