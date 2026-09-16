// potential intro screen
// encounter starts
// player and pokemon sprites pan across screen, pokemon is dim, textbox is dark
// pokemon animation not necessary, text scroll not necessary
// need flashing interaction indicator
// ball, bait, rock animation
// ball shake, pokemon reaction animation
// text reaction
// return to default text

let gamePhase = "intro";
let introTimer = 0;

let playerX = 700;
let pokemonX = -200;
let introOverlayAlpha = 255;

let pName = "";
let pBaseCatch = 0;
let pBaseFlee = 0;
let pCurrentCatch = 0;
let pCurrentFlee = 0;
let pBaitTurns = 0;
let pRockTurns = 0;

let safariBalls = 30;
let turnCount = 1;
let isGameOver = false;
let gameMessage = "";

let ballButton;
let rockButton;
let baitButton;
let runButton;

// For externalized data
function preload() {
  // externalDatabase = loadJSON("pokemon.json")
}

function setup() {
  createCanvas(500, 800);

  // Test pokemon data
  let mockData = { name: "Tauros", baseCatchRate: 45, baseFleeRate: 90 };
  startEncounter(mockData);

  ballButton = new Button(250, 575, 225, 150, "BALL", "ball", 200, 0, 0, 250, 575);
  baitButton = new Button(60, 765, 175, 170, "BAIT", "bait", 255, 165, 0, 65, 750);
  rockButton = new Button(440, 765, 175, 170, "ROCK", "rock", 0, 128, 0, 435, 750);
  runButton = new Button(250, 780, 160, 160, "RUN", "run", 0, 0, 200, 250, 760);
}

function draw() {
  background(0, 210, 140);

  if (gamePhase === "intro") {
    introTimer += 1;

    if (introTimer <= 120) {
      playerX = map(introTimer, 0, 120, 700, 150);
      pokemonX = map(introTimer, 0, 120, -200, 375);
      introOverlayAlpha = map(introTimer, 110, 120, 255, 0);
    } else if (introTimer)

    if (introTimer >= 120) {
      gamePhase = "battle";
    }
  } else if (gamePhase === "battle") {
    // battle behavior 
    playerX = 150;
    pokemonX = 375;
  }

  ballButton.display();
  baitButton.display();
  rockButton.display();
  runButton.display();

  // Player ground
  fill(0, 100, 0);
  ellipse(playerX, 280, 320, 90);

  // Pokemon ground
  ellipse(pokemonX, 150, 240, 70);

  // Textbox
  stroke(0);
  strokeWeight(5);
  fill(255);
  rectMode(CENTER);
  rect(250, 340, 495, 120, 10);

  // Textbox text
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textSize(20);
  text(gameMessage, 20, 300);

  if (introOverlayAlpha > 0) {
    rectMode(CENTER);
    fill(0, 0, 0, introOverlayAlpha);
    stroke(0, introOverlayAlpha);
    strokeWeight(5);
    rect(250, 340, 495, 120, 10);
  }
}

// Button functionality
function mousePressed() {
  if (gamePhase === "intro") {
    return;
  }

  if (ballButton.isMouseOver()) {
    playTurn(ballButton.action);
  }
  if (rockButton.isMouseOver()) {
    playTurn(rockButton.action);
  }
  if (baitButton.isMouseOver()) {
    playTurn(baitButton.action);
  }
  if (runButton.isMouseOver()) {
    playTurn(runButton.action);
  }
}

function startEncounter(pokemonData) {
  pName = pokemonData.name;
  pBaseCatch = pokemonData.baseCatchRate;
  pBaseFlee = pokemonData.baseFleeRate;

  pCurrentCatch = pBaseCatch;
  pCurrentFlee = pBaseFlee;

  pBaitTurns = 0;
  pRockTurns = 0;
  safariBalls = 30;
  turnCount = 1;
  isGameOver = false;

  // play animation
  gamePhase = "intro";
  introTimer = 0;
  introOverlayAlpha = 255;

  gameMessage = "A wild " + pName + " appeared!";
}

function playTurn(playerAction) {
  // If Game Over, don't do anything
  if (isGameOver === true) {
    return;
  }

  // Actions
  if (playerAction === "ball") {
    safariBalls -= 1;
    let catchRoll = floor(random(0, 256));

    if (catchRoll <= pCurrentCatch) {
      gameMessage = "Success! You caught " + pName + "!";
      isGameOver = true;
      return;
    } else {
      gameMessage = "Oh no! The Safari Ball broke open.";
    }
  } 
  else if (playerAction === "bait") {
    pRockTurns = 0;
    pBaitTurns = floor(random(2, 7));
    pCurrentCatch = floor(pBaseCatch / 2);
    pCurrentFlee = floor(pBaseFlee / 2);
    gameMessage = "You threw bait! " + pName + " is eating happily.";
  } 
  else if (playerAction === "rock") {
    pRockTurns = 0;
    pBaitTurns = floor(random(2, 7));
    pCurrentCatch = pBaseCatch * 2;
    pCurrentFlee = pBaseFlee * 2;
    gameMessage = "You threw a rock! " + pName + " is highly annoyed.";
  } 
  else if (playerAction === "run") {
    gameMessage = "You fled from the encounter safely.";
    isGameOver = true;
    return;
  }

  if (safariBalls <= 0) {
    gameMessage = "Out of Safari Balls! Game Over.";
    isGameOver = true;
    return;
  }

  let fleeRoll = floor(random(0, 256));
  if (fleeRoll <= (pCurrentFlee * 0.4)) {
    gameMessage = pName + " fled!"
    isGameOver = true;
    return;
  }

  if (pBaitTurns > 0) {
    pBaitTurns -= 1;
    if (pBaitTurns === 0) {
      pCurrentCatch = pBaseCatch;
      pCurrentFlee = pBaseFlee;
      gameMessage = pName + " stopped eating.";
    }
  }

  if (pRockTurns > 0) {
    pRockTurns -= 1;
    if (pMudTurns === 0) {
      pCurrentCatch = pBaseCatch;
      pCurrentFlee = pBaseFlee;
      gameMessage = pName + " calmed down.";
    }
  }

  turnCount += 1;
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
    if (mouseX >= this.x - this.w / 2 && mouseX <= this.x + this.w / 2 && 
      mouseY >= this.y - this.h / 2 && mouseY <= this.y + this.h / 2) {
        return true;
    }
    return false;
  }
}