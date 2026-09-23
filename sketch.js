let pokemonData;

// Sprites
let trainerImg, pokemonImg, ballImg, baitImg, rockImg;

// Intro animation timing
let introStage1End = 120;
let introStage2End = 140;
let introTotalEnd = 180;

// Player positioning
let playerStartX = 700;
let playerTargetX = 150;
let playerFloorY = 280;
let trainerW = 150;
let trainerH = 150;
let trainerOffsetY = 210;

// Pokemon positioning
let pokemonStartX = -200;
let pokemonTargetX = 375;
let pokemonFloorY = 175;
let pokemonW = 150;
let pokemonH = 150;
let pokemonOffsetY = 130;

// HUD positioning and dimensions
let hudSlideSpeed = 20;
let hudInfoStartX = -225;
let hudInfoTargetX = 80;
let hudInfoY = 70;
let hudBallStartX = 725;
let hudBallTargetX = 420;
let hudBallY = 230;
let hudBoxW = 225;
let hudBoxH = 60;
let hpBarW = 80;
let hpBarH = 8;

// Textbox positioning
let textBoxW = 495;
let textBoxH = 120;
let mainTextBoxY = 340;
let textOffsetY = 300;

// Game state
let gamePhase = "intro";
let introTimer = 0;
let activeAnimDuration = 0;

let playerX = playerStartX;
let pokemonX = pokemonStartX;
let pokemonInfo = hudInfoStartX;
let safariBallCount = hudBallStartX;

// Bottom screen inactive overlay
let maxInputAlpha = 200;
let introOverlayAlpha = 255;
let inputOverlayAlpha = maxInputAlpha;

// Active Pokemon stats
let pName = "";
let pLevel = 1;
let pBaseCatch = 0;
let pBaseFlee = 0;
let pCurrentCatch = 0;
let pCurrentFlee = 0;
let pBaitTurns = 0;
let pRockTurns = 0;

let safariBalls = 30;
let turnCount = 1;
let isGameOver = false;

// Message system
let gameMessage = "";
let messageTimer = 0;
let messagePhase = "default";
let messageStaticTime = 150;

let pendingFlee = false;
let pendingStatusMessage = "";

let msgWildAppeared = "";
let msgDefaultPrompt = "What will you throw?";
let msgBallBroke = "Oh no! The Safari Ball broke open.";
let msgCatchSuccess = "";
let msgBaitThrew = "";
let msgRockThrew = "";
let msgRunSuccess = "You fled from the encounter safely.";
let msgOutOfBalls = "Out of Safari Balls! Game Over.";
let msgWatching = "";
let msgEating = "";
let msgAngry = "";
let msgCalmed = " calmed down.";
let msgStoppedEating = " stopped eating.";

// In-Battle animations
// Item Throwing
let isThrowing = false;
let throwTimer = 0;
let throwTotalFrames = 40;
let throwStartX = 0;
let throwStartY = 0;
let throwTargetX = 0;
let throwTargetY = 0;
let throwArcHeight = 120;
let currentThrowItem = "";

// Ball shakes
let isShakingBall = false;
let shakeTimer = 0;
let totalShakesNeeded = 3;
let currentShakesDone = 0;
let shakeOffset = 0;
let catchResultSuccess = false;
let pokemonCaptured = false;

let ballAnimState = "midair_pause";
let ballCurrentY = 0;
let ballGroundY = 0;
let ballPhaseTimer = 0;
let ballDropTimer = 0;
let ballDropDuration = 12;

// UI buttons
let ballButton;
let rockButton;
let baitButton;
let runButton;

// Load external image assets and Pokemon data
function preload() {
  pokemonData = loadJSON("pokemon.json")

  trainerImg = loadImage("assets/trainer.png");
  // pokemonImg = loadImage("assets/")
  ballImg = loadImage("assets/ball.png");
  baitImg = loadImage("assets/bait.png");
  rockImg = loadImage("assets/rock.png");
}

function setup() {
  createCanvas(500, 800);

  // Convert Pokemon JSON list to array
  let pokemonList = Object.values(pokemonData);

  // Pick weighted random entry
  let wildPokemon = getRandomWeightedPokemon(pokemonList);

  // Start encounter sequence
  startEncounter(wildPokemon);

  // Fallback graphics
  let defaultPlaceholder = createGraphics(24, 24);
  defaultPlaceholder.background(150);

  if (!ballImg) ballImg = defaultPlaceholder;
  if (!baitImg) baitImg = defaultPlaceholder;
  if (!rockImg) rockImg = defaultPlaceholder;

  // Test pokemon data
  // let mockData = { name: "Tauros", baseCatchRate: 255, baseFleeRate: 90, animDuration: 90, minLevel: 25, maxLevel: 35 };
  // startEncounter(mockData);

  // Initialize UI buttons
  ballButton = new Button(250, 575, 225, 150, "BALL", "ball", 200, 0, 0, 250, 575);
  baitButton = new Button(60, 765, 175, 170, "BAIT", "bait", 255, 165, 0, 65, 750);
  rockButton = new Button(440, 765, 175, 170, "ROCK", "rock", 0, 128, 0, 435, 750);
  runButton = new Button(250, 780, 160, 160, "RUN", "run", 0, 0, 200, 250, 760);
}

function draw() {
  background(0, 210, 140);

  // Update logic and timers
  updatePhases();

  ballButton.display();
  baitButton.display();
  rockButton.display();
  runButton.display();

  // Render elements in layer order
  drawGroundAndSprites();
  drawThrowAndBallAnimations();
  drawHUD();
  drawOverlays();
}

// Button functionality
function mousePressed() {
  // Prevent button interaction during intro, ending, or messages
  if (gamePhase === "intro" || isGameOver || messagePhase !== "default") {
    return;
  }

  if (ballButton.isMouseOver()) startThrow("ball");
  if (rockButton.isMouseOver()) startThrow("rock");
  if (baitButton.isMouseOver()) startThrow("bait");
  if (runButton.isMouseOver()) playTurn("run");
}

// Sequence, transition, and battle phase
function updatePhases() {
  // Dynamic intro length for variable Pokemon animation length
  let animPhaseEnd = introStage1End + activeAnimDuration;
  let ballHUDStart = animPhaseEnd + 30;
  let totalIntroEnd = ballHUDStart + hudSlideSpeed;

  if (gamePhase === "intro") {
    introTimer += 1;
    inputOverlayAlpha = maxInputAlpha;

    // 1. Player and Pokemon slide in from offscreen
    if (introTimer <= introStage1End) {
      playerX = map(introTimer, 0, introStage1End, playerStartX, playerTargetX);
      pokemonX = map(introTimer, 0, introStage1End, pokemonStartX, pokemonTargetX);

      // Pokemon initially shows grey, then reveals
      introOverlayAlpha = map(introTimer, 110, introStage1End, 255, 0);

      pokemonInfo = hudInfoStartX;
      safariBallCount = hudBallStartX;
      inputOverlayAlpha = maxInputAlpha;
      gameMessage = "";
    }
    // 2. Pokemon HUD slides in
    else if (introTimer > introStage1End && introTimer <= animPhaseEnd) {
      playerX = playerTargetX;
      pokemonX = pokemonTargetX;
      introOverlayAlpha = 0;
      safariBallCount = hudBallStartX;
      inputOverlayAlpha = maxInputAlpha;
      gameMessage = "";

      let infoHudStageEnd = introStage1End + hudSlideSpeed;
      pokemonInfo = map(introTimer, introStage1End, infoHudStageEnd, hudInfoStartX, hudInfoTargetX, true);
    }
    // 3. "Wild X appeared!" + Safari Ball count slides in
    else if (introTimer > animPhaseEnd && introTimer <= totalIntroEnd) {
      playerX = playerTargetX;
      pokemonX = pokemonTargetX;
      introOverlayAlpha = 0;
      pokemonInfo = hudInfoTargetX;
      inputOverlayAlpha = maxInputAlpha;

      gameMessage = msgWildAppeared;
      safariBallCount = map(introTimer, ballHUDStart, totalIntroEnd, hudBallStartX, hudBallTargetX, true);
    }
    // When intro finishes, change to battle phase
    if (introTimer >= totalIntroEnd) {
      gamePhase = "battle";
      messagePhase = "reaction";
      messageTimer = messageStaticTime;
    }
  }
  else if (gamePhase === "battle") {
    playerX = playerTargetX;
    pokemonX = pokemonTargetX;
    pokemonInfo = hudInfoTargetX;
    safariBallCount = hudBallTargetX;
    introOverlayAlpha = 0;

    // Remove input overlay only when waiting for player input
    if (messagePhase === "default" && !isThrowing && !isShakingBall) {
      inputOverlayAlpha = 0;
    } else {
      inputOverlayAlpha = maxInputAlpha;
    }

    // Progression timer for dialogue
    if (messageTimer > 0) {
      messageTimer--;
    } else {
      // Various responses depending on result of turn
      if (messagePhase === "feedback") {
        if (isGameOver) {
          messagePhase = "end";
        }
        else if (pendingFlee) {
          messagePhase = "end";
          gameMessage = pName + " fled!";
          isGameOver = true;
        } else {
          messagePhase = "reaction";
          messageTimer = messageStaticTime;

          if (pendingStatusMessage !== "") {
            gameMessage = pendingStatusMessage;
            pendingStatusMessage = "";
          }
          else if (pBaitTurns > 0) {
            gameMessage = msgEating;
          }
          else if (pRockTurns > 0) {
            gameMessage = msgAngry;
          }
          else {
            gameMessage = msgWatching;
          }
        }
      }
      // Return to default turn dialogue
      else if (messagePhase === "reaction") {
        messagePhase = "default";
        gameMessage = msgDefaultPrompt;
      }
    }
  }
}

// Calculate total weight sum across all Pokemon entries
function getTotalWeight(list) {
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    total += list[i].weight || 1; // Default to 1 if weight is omitted
  }
  return total;
}

// Select an item based on weighted probability
function getRandomWeightedPokemon(list) {
  let totalWeight = getTotalWeight(list);
  let roll = random(0, totalWeight);
  let currentSum = 0;

  for (let i = 0; i < list.length; i++) {
    currentSum += list[i].weight || 1;
    if (roll < currentSum) {
      return list[i];
    }
  }

  return list[0]; // Fallback
}

// Reset stats and initialize variables for new wild encounter
function startEncounter(pokemonData) {
  pName = pokemonData.name;
  pBaseCatch = pokemonData.baseCatchRate;
  pBaseFlee = pokemonData.baseFleeRate;

  if (pokemonData.image) {
    pokemonImg = loadImage(pokemonData.image);
  } else {
    pokemonImg = null;
  }

  // Determine level within species range
  let minLvl = pokemonData.minLevel || 30;
  let maxLvl = pokemonData.maxLevel || minLvl;
  pLevel = floor(random(minLvl, maxLvl + 1));

  // Dialogue
  msgWildAppeared = "A wild " + pName + " appeared!";
  msgBaitThrew = "You threw bait!"
  msgRockThrew = "You threw a rock!"
  msgWatching = pName + " is watching carefully!";
  msgEating = pName + " is eating happily!";
  msgAngry = pName + " is angry!";
  msgCatchSuccess = "Success! You caught " + pName + "!";

  // Reset catch/flee rates to base
  pCurrentCatch = pBaseCatch;
  pCurrentFlee = pBaseFlee;

  pBaitTurns = 0;
  pRockTurns = 0;
  safariBalls = 30;
  turnCount = 1;
  isGameOver = false;
  pendingFlee = false;
  pendingStatusMessage = "";

  // Reset phase and positions for intro animation
  gamePhase = "intro";
  introTimer = 0;
  introOverlayAlpha = 255;
  inputOverlayAlpha = maxInputAlpha;

  playerX = playerStartX;
  pokemonX = pokemonStartX;
  pokemonInfo = hudInfoStartX;
  safariBallCount = hudBallStartX;

  activeAnimDuration = pokemonData.animDuration;

  messagePhase = "default";
  messageTimer = 0;
  gameMessage = "";
}

// Process player choices
function playTurn(playerAction) {
  // If Game Over, don't do anything
  if (isGameOver) return;

  pendingFlee = false;
  pendingStatusMessage = "";

  // Actions
  if (playerAction === "ball") {
    safariBalls -= 1;

    // Catch Algorithm based on mainline Pokemon -- 4 independent probability checks
    let checksPassed = 0;
    for (let i = 0; i < 4; i++) {
      let roll = floor(random(0, 256));
      if (roll <= pCurrentCatch) {
        checksPassed++
      } else {
        // Break out on first failed check
        break;
      }
    }

    // If all 4 checks pass, catch succeeds
    if (checksPassed === 4) {
      catchResultSuccess = true;
      totalShakesNeeded = 3;
    } else {
      catchResultSuccess = false;
      // Partial passes determine number of shakes before breaking out
      totalShakesNeeded = checksPassed;
    }

    isShakingBall = true;

    // Start catch animation starting from Poke ball mid-air after colliding with Pokemon
    ballAnimState = "midair_pause";
    ballCurrentY = throwTargetY;
    ballGroundY = pokemonOffsetY + 25;

    ballPhaseTimer = 0;
    currentShakesDone = 0;
    shakeOffset = 0;
    return;

  }
  else if (playerAction === "bait") {
    // Bait makes Pokemon easier to catch, harder to flee, lasts 2-6 turns
    pRockTurns = 0;
    pBaitTurns = floor(random(2, 7));
    pCurrentCatch = floor(pBaseCatch / 2); // Halves catch rate
    pCurrentFlee = floor(pBaseFlee / 2);  // Halves flee rate
  }
  else if (playerAction === "rock") {
    // Rock makes Pokemon easier to catch, twice as likely to flee
    pBaitTurns = 0;
    pRockTurns = floor(random(2, 7));
    pCurrentCatch = pBaseCatch * 2; // Doubles catch rate
    pCurrentFlee = pBaseFlee * 2; // Doubles flee rate
  }
  else if (playerAction === "run") {
    gameMessage = msgRunSuccess;
    isGameOver = true;
    messagePhase = "feedback";
    messageTimer = messageStaticTime;
    return;
  }

  resolveTurnEnd();
}

// Turn end and flee logic
function resolveTurnEnd() {
  // Check safari ball count
  if (safariBalls <= 0 && !isGameOver) {
    gameMessage = msgOutOfBalls;
    isGameOver = true;
    messagePhase = "feedback"
    messageTimer = messageStaticTime;
    return;
  }

  // Calculate flee probability
  let fleeRoll = floor(random(0, 256));
  if (fleeRoll <= (pCurrentFlee * 0.4)) {
    pendingFlee = true;
  }

  // Decrement bait turns
  if (pBaitTurns > 0) {
    pBaitTurns -= 1;
    if (pBaitTurns === 0) {
      pCurrentCatch = pBaseCatch;
      pCurrentFlee = pBaseFlee;
      pendingStatusMessage = pName + msgStoppedEating;
    }
  }

  // Decrement rock turns
  if (pRockTurns > 0) {
    pRockTurns -= 1;
    if (pRockTurns === 0) {
      pCurrentCatch = pBaseCatch;
      pCurrentFlee = pBaseFlee;
      pendingStatusMessage = pName + msgCalmed;
    }
  }

  turnCount += 1;

  messagePhase = "feedback";
  messageTimer = messageStaticTime;
}

// Throw animation setup
function startThrow(itemType) {
  currentThrowItem = itemType;
  isThrowing = true;
  throwTimer = 0;

  msgBaitThrew = "You threw Bait at the " + pName + "!";
  msgRockThrew = "You threw a Rock at the " + pName + "!";

  // Throw from player position
  throwStartX = playerX;
  throwStartY = trainerOffsetY - (trainerH * 0.2);

  throwTargetX = pokemonX;

  // Aim for upper part of Pokemon sprite compared to other items
  if (itemType === "ball") {
    throwTargetY = pokemonOffsetY - (pokemonH * 0.25);
  } else {
    throwTargetY = pokemonOffsetY;
  }

  if (itemType === "ball") {
    gameMessage = "You used one Safari Ball!";
  } else if (itemType === "bait") {
    gameMessage = msgBaitThrew;
  } else if (itemType === "rock") {
    gameMessage = msgRockThrew;
  }
}

// Throw arc calculation
function drawThrowingItem() {
  // Time across the animation
  let t = throwTimer / throwTotalFrames;

  // Lerp across X axis over t time
  let currX = lerp(throwStartX, throwTargetX, t);

  // Lerp across Y axis along with parabolic arc
  let currY = lerp(throwStartY, throwTargetY, t) - sin(t * PI) * throwArcHeight;

  let activeSprite;
  if (currentThrowItem === "ball") activeSprite = ballImg;
  else if (currentThrowItem === "bait") activeSprite = baitImg;
  else if (currentThrowItem === "rock") activeSprite = rockImg;

  if (activeSprite) {
    push();
    imageMode(CENTER);
    translate(currX, currY);

    // Ball spins in midair
    if (currentThrowItem === "ball") {
      rotate(t * TWO_PI * 3);
    }

    image(activeSprite, 0, 0, 24, 24);
    pop();
  }
}

// Ball capture and shake animation states
function updateBallShake() {
  push();
  imageMode(CENTER);

  ballPhaseTimer++;

  // Ball contacts Pokemon and pauses midair while Pokemon goes inside
  if (ballAnimState === "midair_pause") {
    if (ballPhaseTimer >= 60 && !pokemonCaptured) {
      pokemonCaptured = true;
    }
    if (ballPhaseTimer >= 120) {
      ballAnimState = "drop";
      ballPhaseTimer = 0;
    }
    image(ballImg, pokemonX, throwTargetY, 24, 24);
  }

  // Ball drops to ground
  else if (ballAnimState === "drop") {
    let dropDuration = 10;
    let progress = min(ballPhaseTimer / dropDuration, 1.0);
    ballCurrentY = lerp(throwTargetY, ballGroundY, progress);

    if (progress >= 1.0) {
      ballAnimState = "ground_pause";
      ballPhaseTimer = 0;
    }
    image(ballImg, pokemonX, ballCurrentY, 24, 24);
  }

  // Pause on landing before shake animations
  else if (ballAnimState === "ground_pause") {
    if (ballPhaseTimer >= 60) {
      if (totalShakesNeeded === 0) {
        isShakingBall = false;
        pokemonCaptured = false;
        gameMessage = msgBallBroke;
        resolveTurnEnd();
      } else {
        ballAnimState = "shake";
        ballPhaseTimer = 0;
      }
    }
    image(ballImg, pokemonX, ballGroundY, 24, 24);
  }

  // Shake animation
  else if (ballAnimState === "shake") {
    let shakeDuration = 12;
    if (ballPhaseTimer <= shakeDuration) {
      shakeOffset = sin((ballPhaseTimer / shakeDuration) * TWO_PI) * 6;
    } else {
      shakeOffset = 0;
      currentShakesDone++;
      ballAnimState = "post_shake_pause";
      ballPhaseTimer = 0;
    }
    image(ballImg, pokemonX + shakeOffset, ballGroundY, 24, 24);
  }

  // Delay between shakes/breakout
  else if (ballAnimState === "post_shake_pause") {
    shakeOffset = 0;

    if (ballPhaseTimer >= 60) {
      if (currentShakesDone >= totalShakesNeeded) {
        isShakingBall = false;

        if (catchResultSuccess) {
          gameMessage = msgCatchSuccess;
          isGameOver = true;
          messagePhase = "feedback";
          messageTimer = messageStaticTime;
        } else {
          pokemonCaptured = false; // Re-appear on breakout
          gameMessage = msgBallBroke;
          resolveTurnEnd();
        }
      } else {
        ballAnimState = "shake";
        ballPhaseTimer = 0;
      }
    }
    image(ballImg, pokemonX, ballGroundY, 24, 24);
  }

  pop();
}

// Render player, pokemon, and background bases
function drawGroundAndSprites() {
  // Player ground
  fill(0, 100, 0);
  ellipse(playerX, playerFloorY, 320, 90);

  // Pokemon ground
  ellipse(pokemonX, pokemonFloorY, 240, 70);

  // Pokemon sprite
  if (!pokemonCaptured) {
    if (pokemonImg) {
      push();
      imageMode(CENTER);
      // Tint gray during opening phase
      if (gamePhase === "intro" && introTimer <= introStage1End) {
        tint(50);
      } else {
        noTint();
      }
      image(pokemonImg, pokemonX, pokemonOffsetY, pokemonW, pokemonH);
      pop();
    } else {
      // Fallback placeholder
      rectMode(CENTER);
      if (gamePhase === "intro" && introTimer <= introStage1End) {
        fill(50);
      } else {
        fill(230, 130, 40);
      }
      rect(pokemonX, pokemonOffsetY, pokemonW, pokemonH);
    }
  }

  // Trainer sprite
  if (trainerImg) {
    push();
    imageMode(CENTER);
    image(trainerImg, playerX, trainerOffsetY, trainerW, trainerH);
    pop();
  } else {
    rectMode(CENTER);
    fill(50, 50, 200);
    rect(playerX, trainerOffsetY, trainerW, trainerH);
  }
}

// Throwing/ball shake animations
function drawThrowAndBallAnimations() {
  if (isThrowing) {
    throwTimer++;
    drawThrowingItem();

    // Play turn out after throwing
    if (throwTimer >= throwTotalFrames) {
      isThrowing = false;
      playTurn(currentThrowItem);
    }
  }

  if (isShakingBall) {
    updateBallShake();
  } else if (pokemonCaptured && catchResultSuccess) {
    // Dim ball sprite on successful capture
    push();
    imageMode(CENTER);
    tint(150);
    image(ballImg, pokemonX, ballGroundY, 24, 24);
    pop();
  }
}

// Render text boxes, health bars, and ball counter
function drawHUD() {
  // Main Textbox
  stroke(0);
  strokeWeight(5);
  fill(255);
  rectMode(CENTER);
  rect(width / 2, mainTextBoxY, textBoxW, textBoxH, 10);

  // Main Textbox text
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textSize(20);
  text(gameMessage, 20, textOffsetY);

  // Pokemon Info
  stroke(0);
  strokeWeight(2);
  fill(255);
  rectMode(CENTER);
  rect(pokemonInfo, hudInfoY, hudBoxW, hudBoxH, 10);

  // Name and Lvl
  noStroke();
  fill(0);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(pName, pokemonInfo - hudBoxW / 2 + 40, hudInfoY - 10);
  textAlign(RIGHT, CENTER);
  textSize(16);
  text("Lv" + pLevel, pokemonInfo + hudBoxW / 2 - 15, hudInfoY - 8);

  // HP Bar
  let hpBarX = pokemonInfo - hudBoxW / 2 + 45;
  let hpBarY = hudInfoY + 12;

  fill(0);
  textAlign(LEFT, CENTER);
  textSize(12);
  text("HP", hpBarX + 62, hpBarY + 1);
  
  rectMode(CORNER);
  stroke(0);
  strokeWeight(2);
  fill(80);
  rect(hpBarX + hudBoxW / 2 - 30, hpBarY - hpBarH / 2, hpBarW, hpBarH);

  noStroke();
  fill(0, 200, 80);
  rect(hpBarX + hudBoxW / 2 - 30, hpBarY - hpBarH / 2, hpBarW, hpBarH);

  // Safari Ball Count
  stroke(0);
  rectMode(CENTER);
  strokeWeight(2);
  fill(255);
  rect(safariBallCount, hudBallY, hudBoxW, hudBoxH, 10);

  noStroke();
  fill(0);
  textAlign(LEFT, CENTER);
  textSize(18);
  text("SAFARI BALLS\nLeft: " + safariBalls, safariBallCount - hudBoxW / 2 + 10, hudBallY + 1);

  // Interaction indicator triangle
  if (gamePhase === "battle" && !isGameOver && messagePhase === "default") {
    if (floor(frameCount / 20) % 2 === 0) {
      fill(200, 0, 0);
      noStroke();
      triangle(465, 375, 480, 375, 472, 385);
    }
  }
}

// Screen dim overlay
function drawOverlays() {
if (introOverlayAlpha > 0) {
    rectMode(CENTER);
    fill(0, 0, 0, introOverlayAlpha);
    stroke(0, introOverlayAlpha);
    strokeWeight(5);
    rect(width / 2, mainTextBoxY, textBoxW, textBoxH, 10);
  }

  // Bottom screen overlay to disable buttons during turn process
  if (inputOverlayAlpha > 0) {
    rectMode(CORNER);
    fill(40, 40, 40, inputOverlayAlpha);
    noStroke();
    rect(0, 400, width, height - 400);
  }
}

class Button {
  constructor(x, y, w, h, label, action, r, g, b, textX, textY) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.action = action;
    this.r = r;
    this.g = g;
    this.b = b;
    this.textX = textX;
    this.textY = textY;
  }

  display() {
    stroke(0);
    strokeWeight(3);

    if (this.isMouseOver()) {
      fill(this.r - 50, this.g - 50, this.b - 50);
    } else {
      fill(this.r, this.g, this.b);
    }

    ellipse(this.x, this.y, this.w, this.h);

    noStroke();
    fill(255);
    textSize(22);
    textAlign(CENTER, CENTER);
    text(this.label, this.textX, this.textY);
  }

  isMouseOver() {
    if (inputOverlayAlpha > 0 || gamePhase === "intro" || isGameOver) {
      return false;
    }

    if (mouseX >= this.x - this.w / 2 && mouseX <= this.x + this.w / 2 &&
      mouseY >= this.y - this.h / 2 && mouseY <= this.y + this.h / 2) {
      return true;
    }
    return false;
  }
}