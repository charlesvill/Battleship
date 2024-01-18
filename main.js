/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/cpuPlayer.js":
/*!**************************!*\
  !*** ./src/cpuPlayer.js ***!
  \**************************/
/***/ ((module) => {

// tests for cpu player will be placed in player.test.js
// hit bool might not play a role, remember to delete if no role.
const cpuPlayer = () => {
  let state = "random";
  let hit = false;
  let streak = false;
  let hitArr = [];
  let pursuitAxis = null;

  function randomMove() {
    const max = 10;
    const cCoord = Math.floor(Math.random() * max);
    const rCoord = Math.floor(Math.random() * max);
    const randomCoord = [];

    randomCoord.push(cCoord, rCoord);

    return randomCoord;
  }

  // will need to implement the legal move -> dependency injection from gameboard script
  function adjacentMove() {
    // will return coordinate in either same row or column as lastHit
    const [lastHit] = hitArr;
    let adjacentStrike = [...lastHit];
    // randomly choose either row or column to change
    const axis = Math.floor(Math.random() * 2);
    // 0 -> -1 will be added || 1 -> 1 will be added
    const binaryOffset = Math.floor(Math.random() * 2);
    const offsetValue = binaryOffset === 0 ? -1 : 1;
    adjacentStrike[axis] += offsetValue;

    return adjacentStrike;
  }

  function getNextInline(lastHit) {
    // will need to guess next one until you have a legal one that hasnt been used yet
    const binaryOffset = Math.floor(Math.random() * 2);
    const offsetValue = binaryOffset === 0 ? -1 : 1;
    let inlineStrike = [...lastHit];

    if (pursuitAxis === "h") {
      inlineStrike[1] += offsetValue;
      return inlineStrike;
    } else if (pursuitAxis === "v") {
      inlineStrike[0] += offsetValue;
      return inlineStrike;
    }
  }

  function inlineMove() {
    // finds the axis by comparing hits and calls an inline guess
    if (pursuitAxis === null) {
      const [c1, c2] = hitArr;
      if (c1[0] === c2[0] && c1[1] !== c2[1]) {
        pursuitAxis = "h";
        return getNextInline(c2);
      } else if (c1[0] !== c2[0] && c1[1] === c2[1]) {
        pursuitAxis = "v";
        return getNextInline(c2);
      }
    } else {
      if (streak === false) {
        return getNextInline(hitArr[0]);
      }
      return getNextInline(hitArr[hitArr.length - 1]);
      // condition if the last strike was a miss then start from the front of the list
      // take the last known hit and add to it
    }
  }
  function nextMove() {
    switch (state) {
      case "random":
        return randomMove();
        break;
      case "adjacent":
        return adjacentMove();
        break;
      case "inline":
        return inlineMove();
        break;
      default:
        return "Error condition exception: nextMove";
    }
  }
  function reportHit(coordinate, isSunk) {
    streak = true;
    if (isSunk === true) {
      hit = false;
      mode = "random";
      hitArr = [];
      pursuitAxis = null;
    }
    hitArr.push(coordinate);
    if (hitArr.length === 1) {
      state = "adjacent";
    } else if (hitArr.length > 1) {
      state = "inline";
    }
  }
  function reportMiss() {
    streak = false;
  }
  // report miss function?
  return {
    randomMove,
    adjacentMove,
    inlineMove,
    nextMove,
    reportHit,
    reportMiss,
    hitArr,
  };
};
module.exports = cpuPlayer;

// attack on player class accepts a coordinate pair. how that pair gets formulated does not matter
// have a general nextMove function that will intelligently determine what function will be called
// according to the current state of hits.
// the information you would need record when you have two hits. if you have two hits you need to figure out the orientation of that ship and repeatedly (loop) strike inline until there is a sunk ship.
//
// conclusion: there definitely needs to be a way for the gameboard to communicate back to the cpu script.
//
// callback fns that check on each move? or is it fed to the cpu script by the gameloop?


/***/ }),

/***/ "./src/gameboard.js":
/*!**************************!*\
  !*** ./src/gameboard.js ***!
  \**************************/
/***/ ((module) => {

const gameBoard = () => {
  let ships = [];
  function gridMaker() {
    grid = [];

    for (let i = 0; i < 10; i++) {
      grid[i] = [];
      for (let j = 0; j < 10; j++) {
        grid[i][j] = null;
      }
    }
    return grid;
  }

  // initializer for the grid
  let shipGrid = gridMaker();
  let attacksReceived = gridMaker();

  function shipFits(length, coordinates, orientation) {
    const copyCoord = [...coordinates];
    let r = copyCoord[0];
    let c = copyCoord[1];
    const roffset = orientation === "h" ? 0 : 1;
    const coffset = orientation === "h" ? 1 : 0;
    if (length === undefined) {
      throw new Error("shipfit length undefined");
    }

    for (let i = 0; i < length; i++) {
      try {
        if (shipGrid[r][c] !== null) {
          return false;
        }
      } catch (error) {
        return false;
      }
      r += roffset;
      c += coffset;
    }
    return true;
  }

  function pushtoGrid(ship, length, coordinates, offset) {
    let current = [...coordinates];
    for (let i = 0; i < length; i++) {
      shipGrid[current[0]][current[1]] = ship;
      current[0] += offset[0];
      current[1] += offset[1];
    }
  }

  function addShip(ship, coordinates, orientation) {
    const length = ship.length;
    ships.push(ship);

    if (orientation === "h") {
      if (shipFits(length, coordinates, orientation)) {
        pushtoGrid(ship, length, coordinates, [0, 1]);
      } else {
        console.error("error: ship did not fit");
      }
    } else if (orientation === "v") {
      if (shipFits(length, coordinates, orientation)) {
        pushtoGrid(ship, length, coordinates, [1, 0]);
      } else {
        console.error("error: ship did not fit");
      }
    }
  }

  function canStrike(coordinates) {
    const [r, c] = coordinates;
    const strikeSquare = attacksReceived[r][c];

    return strikeSquare === null ? true : false;
  }

  function receiveAttack(coordinates) {
    const r = coordinates[0];
    const c = coordinates[1];

    if (shipGrid[r][c] !== null) {
      const ship = shipGrid[r][c];
      attacksReceived[r][c] = 1;
      const hitReport = ship.hit();

      if (ship.isSunk() === true) {
        ships = ships.filter((element) => {
          return element !== ship;
        });
        // function that reports if there are ships remaining.
        return `${ship.type} has been sunk`;
      }
      return hitReport;
    }
    // record the miss
    attacksReceived[r][c] = 0;
    return "miss";
  }

  function shipsRemaining() {
    return ships.length > 0 ? ships.length : "All ships have sunk";
  }

  return {
    shipGrid,
    attacksReceived,
    ships,
    shipFits,
    addShip,
    canStrike,
    receiveAttack,
    shipsRemaining,
  };
};

module.exports = gameBoard;


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// index houses the driver code including the game loop
const player = __webpack_require__(/*! ./player */ "./src/player.js");
const gameBoard = __webpack_require__(/*! ./gameboard */ "./src/gameboard.js");
const ship = __webpack_require__(/*! ./ship */ "./src/ship.js");
const cpu = __webpack_require__(/*! ./cpuPlayer */ "./src/cpuPlayer.js");
const uiScript = __webpack_require__(/*! ./ui */ "./src/ui.js");

const gameModule = () => {
  // temporary initializers that will be wrapped in a function that will assign game elements
  // the game initializer will use this function for connecting cpu AI to other functions
  const cpuPlayerWrapper = (playerClass, cpuAI, enemyBoard) => {
    // this wrapper will need to be refactored after changes to player class
    function attack() {
      let nextStrike = cpuAI.nextMove();
      while (playerClass.canStrike(nextStrike, enemyBoard) === false) {
        nextStrike = cpuAI.nextMove();
      }
      const strikeResult = playerClass.attack(nextStrike, enemyBoard);

      if (strikeResult !== "miss") {
        cpuAI.reportHit(nextStrike);
        return strikeResult;
      } else if (strikeResult === "miss") {
        cpuAI.reportMiss();
        return strikeResult;
      }
    }
    return {
      ...playerClass.playerObj,
      attack,
      playerBoard: playerClass.playerBoard,
      isCPU: playerClass.isCPU,
    };
  };

  function playerInitializer(playerObj) {
    if (playerObj.number === 1) {
      player1 = player(playerObj, gameBoard());
      console.dir(player1);
    } else {
      player2 = player(playerObj, gameBoard());
      console.dir(player2);
    }
  }

  function shipPlacerProxy(
    number,
    length,
    coordinates,
    orientation,
    checkonly = false,
  ) {
    if (length === undefined || length === null || length === 0) {
      return;
    }
    // will make and place the ship
    const player = number === 1 ? player1 : player2;
    // first check the coordinates
    // then make the ship
    // then place the ship
    const canFit = player.playerBoard.shipFits(
      length,
      coordinates,
      orientation,
    );
    if (!canFit) {
      return false;
    }
    if (!checkonly) {
      const newShip = ship(length);
      player.playerBoard.addShip(newShip, coordinates, orientation);
      console.log(player.playerBoard.shipGrid);
    }

    return true;
  }

  async function gameLoop() {
    // while game is not over
    console.log("greetings from gameloop");
    console.dir(currentPlayer);
    // call ui strikescreen for current player if its a person
    while (gameOver === false) {
      if (!currentPlayer.isCpu) {
        const coord = await ui.strikeScreen(currentPlayer.number);
        console.log(`coordinates to strike are: ${coord}`);
        gameTurn(coord);
      } else {
        gameTurn();
      }
    }
    // call ui fn that will end the game
    // ui should allow them to reset the game.
    // call index fn that will the game
  }

  function gameInitializer() {
    // after adding the ships , it will need to check who is cpu and initialize the cpuwrapper

    if (player1.isCPU) {
      const copy = { ...player1 };
      player1 = cpuPlayerWrapper(copy, cpuAI, player2.playerBoard);
    }
    if (player2.isCPU) {
      const copy = { ...player2 };
      player2 = cpuPlayerWrapper(copy, cpuAI, player2.playerBoard);
    }

    currentPlayer = player1;
    console.log(currentPlayer);
    gameLoop();

    // will initialize the game loop fn that will call ui for strike screens
    // cpu turns will be handled by gameloop automatically
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  let player1 = undefined;
  let player2 = undefined;
  let currentPlayer = undefined;
  const cpuAI = cpu();
  let gameOver = false;
  ui.startScreen();

  //  const player1 = player("Dk", gameBoard());
  //  let player2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    player1.playerBoard,
  //  );

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
  }
  // gameTurn is called by event handler on UI interaction -or- by recursion when its cpu turn
  function gameTurn(coordinates = "") {
    if (gameOver) {
      return endGame();
    }

    if (currentPlayer === player1) {
      const strike = player1.attack(coordinates, player2.playerBoard);
      // return value anything other than num = player loses
      if (isNaN(player2.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(player1);
      }
      currentPlayer = player2;
    } else if (currentPlayer === player2) {
      const strike = player2.attack(coordinates, player1.playerBoard);
      // check this line for errors, this was refactored differently
      if (isNaN(player1.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(player1);
      }
      currentPlayer = player1;
    }
    if (currentPlayer.isCPU === true) {
      return gameTurn();
    }
  }
  function isGameOver() {
    return gameOver;
  }
  return { gameTurn, isGameOver };
};
gameModule();
module.exports = gameModule;


/***/ }),

/***/ "./src/player.js":
/*!***********************!*\
  !*** ./src/player.js ***!
  \***********************/
/***/ ((module) => {

// this will demonstrate dependency injection with the needed methods for the player board and enemy board ref

const player = (playerObj, boardFn) => {
  const playerBoard = boardFn;
  const isCPU = playerObj.player === "person" ? false : true;

  function canStrike(coordinates, enemyBoard) {
    return enemyBoard.canStrike(coordinates);
  }

  function attack(coordinates, enemyBoard) {
    // will need code here for determining legal move
    if (canStrike(coordinates, enemyBoard)) {
      return enemyBoard.receiveAttack(coordinates);
    }
    return "try another attack";
  }

  return { ...playerObj, playerBoard, canStrike, attack, isCPU };
};

module.exports = player;

// the attack fn as of now does not work well with cpu player because it needs to be able to regenerate another move without leaving its current scope


/***/ }),

/***/ "./src/ship.js":
/*!*********************!*\
  !*** ./src/ship.js ***!
  \*********************/
/***/ ((module) => {

// ships should have the choice of:
// 5 man-o-war
// 4 frigate
// 3 x 3 schooner
// 2 x 2 patrol sloop
const ship = (length) => {
  let type = "";
  let damage = 0;

  switch (length) {
    case 2:
      type = "Patrol Sloop";
      break;
    case 3:
      type = "Schooner";
      break;
    case 4:
      type = "Frigate";
      break;
    case 5:
      type = "Man-o-War";
      break;
    default:
      throw new Error("Ship type exception: length must be 1-5");
  }

  function hit() {
    damage++;
    return `${type} was hit. ${hitpoints()} hitpoints remaining`;
  }
  function isSunk() {
    return damage >= length ? true : false;
  }
  function hitpoints() {
    return length - damage;
  }
  return { type, length, damage, hitpoints, hit, isSunk };
};

module.exports = ship;


/***/ }),

/***/ "./src/ui.js":
/*!*******************!*\
  !*** ./src/ui.js ***!
  \*******************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const player = __webpack_require__(/*! ./player */ "./src/player.js");

const userInterface = (shipMakerProxy, playerInitScript, gameInitScript) => {
  const pageContainer = document.querySelector(".pageContainer");
  let p1Country = "";
  let p2Country = "";

  function initCountrySelect() {
    const nodeList = document.querySelectorAll(".countryBox");
    nodeList.forEach((element) => {
      element.addEventListener("click", () => {
        if (element.classList[1] === "p1") {
          p1Country = element.id;
        } else if (element.classList[1] === "p2") {
          p2Country = element.id;
        }
      });
    });
  }

  // builds a playerobj that contains information to initialize the game
  function pObjInitializer(formClssNme, p1selectid, p2selectid) {
    const playerForm = document.querySelector(formClssNme);
    const dropdownfield1 = document.getElementById(p1selectid);
    const dropdownfield2 = document.getElementById(p2selectid);
    let players = [];

    const manowar = 5;
    const frigate = 4;
    const schooner = 3;
    const sloop = 2;

    // player is either "cpu" or "person"
    const playerobj = {
      player: undefined,
      number: undefined,
      country: undefined,
      ships: [
        manowar,
        frigate,
        frigate,
        schooner,
        schooner,
        schooner,
        sloop,
        sloop,
      ],
    };
    const player1 = { ...playerobj };
    const player2 = { ...playerobj };

    player1.player = dropdownfield1.value;
    player1.number = 1;
    player1.country = p1Country;

    player2.player = dropdownfield2.value;
    player2.number = 2;
    player2.country = p2Country;

    players.push(player1, player2);

    return players;
  }

  function randomCoord() {
    const max = 10;
    const cCoord = Math.floor(Math.random() * max);
    const rCoord = Math.floor(Math.random() * max);
    const rancoordinates = [];

    rancoordinates.push(cCoord, rCoord);

    return rancoordinates;
  }

  function shipRandomizer(playerObj) {
    let shipArr = [...playerObj.ships];

    shipArr.forEach((shipLength) => {
      let placed = false;
      while (!placed) {
        // random direction of ship placement
        const rancoordinates = randomCoord();
        const random = Math.floor(Math.random() * 2);
        const axis = random === 0 ? "h" : "v";

        // returns false if was not able to place ship at random spot, trys again
        placed = shipMakerProxy(
          playerObj.number,
          shipLength,
          rancoordinates,
          axis,
        );
      }
    });
    console.dir(playerObj);
  }

  async function shipScreen(playerObj) {
    // need async function to wait for each player ship selection to be resolved before moving on to the next one
    return new Promise((resolve) => {
      // clear page container and populate with ship select
      const htmlContent = `
      <div class="shipScreenCont">
          <div class="headerCont">
              <div class="playerName">
              </div>
          </div>
          <div class="bodyCont">
              <div class="gridCont">

              </div>
              <div class="shipDisplayCont">
                  this will be all boats listed and interactable
                <div class="shipBox">
                    <div class="ship" data-index="5" draggable="true"></div>
                    <span class="shipCount man" draggable="false"></span>

                </div>
                <div class="shipBox">
                    <div class="ship" data-index="4" draggable="true"></div>
                    <span class="shipCount frig" draggable="false"></span>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="3" draggable="true"></div>
                    <span class="shipCount schoon" draggable="false"></span>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="2" draggable="true"></div>
                    <span class="shipCount sloop" draggable="false"></span>
                </div>

                  <div class="orientationCont">
                    <button class="orientationBtn" data-orientation="h">
                        Horizontal
                    </button>
                </div>
              </div>
          </div>
          <div class="footerCont">
              <div class="txt">
                  Place your ships!
              </div>
              <button class="randomBtn">
                  Randomize
              </button>
          </div>
      </div>
     `;
      pageContainer.innerHTML = "";
      pageContainer.innerHTML = htmlContent;
      console.log("dom finished loading");

      // necessary globals for methods in ship select
      const gridContainer = document.querySelector(".gridCont");
      const gridSize = 10;
      let aragShipLength = 0;
      let dragShip = undefined;
      let dragFits = false;
      let orientation = "h";
      let coord = [];
      let mowCount = 1;
      let frigCount = 2;
      let schoonCount = 3;
      let sloopCount = 2;
      let depletedShip = null;
      console.log(`the current player is: ${playerObj.number}`);

      let ships = document.querySelectorAll(".ship");
      let shipContainer = document.querySelector(".shipBox");
      let playerName = document.querySelector(".playerName");
      let manCountBox = document.querySelector(".shipCount.man");
      let frigCountBox = document.querySelector(".shipCount.frig");
      let schoonCountBox = document.querySelector(".shipCount.schoon");
      let sloopCountBox = document.querySelector(".shipCount.sloop");

      playerName.textContent = `Player ${playerObj.number}`;
      manCountBox.textContent = `x ${mowCount}`;
      frigCountBox.textContent = `x ${frigCount}`;
      schoonCountBox.textContent = `x ${schoonCount}`;
      sloopCountBox.textContent = `x ${sloopCount}`;
      // build the visual grid
      for (let i = 0; i < gridSize; i++) {
        const row = document.createElement("div");
        row.classList.add("rowCont");
        gridContainer.appendChild(row);

        for (let j = 0; j < gridSize; j++) {
          const cell = document.createElement("div");
          cell.classList.add("cell");
          cell.dataset.r = i;
          cell.dataset.c = j;
          row.appendChild(cell);
        }
      }
      // cycle ship placement orientation, initialized to "h"
      const orientationBtn = document.querySelector(".orientationBtn");
      orientationBtn.addEventListener("click", (e) => {
        if (orientation === "h") {
          e.currentTarget.dataset.orientation = "v";
          orientation = "v";
          orientationBtn.textContent = "Vertical";
        } else {
          e.currentTarget.dataset.orientation = "h";
          orientation = "h";
          orientationBtn.textContent = "Horizontal";
        }
      });

      function shipDragHandler(e) {
        dragShipLength = Number(e.currentTarget.dataset.index);

        const clone = ship.cloneNode(true);
        dragShip = ship;
        // Set the offset for the drag image
        const offsetX = 20; // Set your desired offset value
        e.dataTransfer.setDragImage(clone, 0, 0);
        ship.classList.add("dragging");
      }
      function randomBtnFn() {
        console.log(playerObj);
        shipRandomizer(playerObj);
        resolve();
      }

      const randomBtn = document.querySelector(".randomBtn");

      console.log(randomBtn);
      randomBtn.addEventListener("click", () => {
        randomBtnFn();
      });

      const gridShader = (
        coord,
        length,
        orientation,
        dragFits,
        placed = false,
      ) => {
        const offsetr = orientation === "h" ? 0 : 1;
        const offsetc = orientation === "h" ? 1 : 0;
        let addedClass = "";

        // 3 shading possiblities fits/nofits/placed
        if (placed === true) {
          addedClass = "placed";
        } else {
          addedClass = dragFits === true ? "fits" : "notFits";
        }

        const currentCoord = [...coord];
        let cellCollection = [];

        // shade each cell representing ship length
        for (let i = 0; i < length; i++) {
          const currentCell = document.querySelector(
            `[data-r="${currentCoord[0]}"][data-c="${currentCoord[1]}"]`,
          );
          cellCollection.push(currentCell);

          if (currentCell !== null) {
            currentCell.classList.add(`${addedClass}`);
          } else {
            continue;
          }
          currentCoord[0] += offsetr;
          currentCoord[1] += offsetc;
        }
        // after shade, dragleave handler to clear shading when not placed
        const firstCell = cellCollection[0];
        if (firstCell === null || firstCell === undefined || placed === true) {
          return;
        }
        firstCell.addEventListener("dragleave", (e) => {
          e.preventDefault();
          cellCollection.forEach((element) => {
            if (element !== null) {
              element.classList.remove(`${addedClass}`);
            }
          });
        });
      };

      function leaveScreen() {
        return;
      }

      const cells = document.querySelectorAll(".cell");
      // translates UI cell to a coordinate on a dragover event
      // checks if the ship dragged will fit
      cells.forEach((cell) => {
        const dragOverHandler = (e) => {
          if (dragShipLength === undefined) {
            return;
          }
          e.preventDefault();

          cell.classList.add("mouseover");

          const r = Number(e.currentTarget.dataset.r);
          const c = Number(e.currentTarget.dataset.c);
          coord = [r, c];
          dragFits = shipMakerProxy(
            playerObj.number,
            dragShipLength,
            coord,
            orientation,
            true,
          );
          console.log(`coord post shipmaker: ${coord}`);
          if (dragFits) {
            // add classname for fits
            gridShader(coord, dragShipLength, orientation, dragFits, false);
          } else {
            // add classname for not fits
            gridShader(coord, dragShipLength, orientation, dragFits, false);
          }
          coordCalculated = true;
          cell.removeEventListener("dragover", dragOverHandler);
        };

        cell.addEventListener("dragover", dragOverHandler);
        cell.addEventListener("dragleave", (e) => {
          coordCalculated = false;
          cell.classList.remove("mouseover");
          cell.addEventListener("dragover", dragOverHandler);
        });
      });

      const shipIMG = new Image();
      shipIMG.src = "./images/sailboat.png";
      shipIMG.classList.add("shipIMG");
      shipIMG.style.width = "1rem";

      ships.forEach((ship) => {
        ship.addEventListener("dragstart", shipDragHandler);

        ship.addEventListener("dragend", () => {
          ship.classList.remove("dragging");

          if (dragFits) {
            const placed = shipMakerProxy(
              playerObj.number,
              dragShipLength,
              coord,
              orientation,
              false,
            );

            if (placed) {
              gridShader(coord, dragShipLength, orientation, dragFits, true);

              let remainingShips = "";

              switch (dragShipLength) {
                case 5:
                  remainingShips = mowCount;
                  mowCount -= 1;
                  manCountBox.textContent = `x ${mowCount}`;
                  break;
                case 4:
                  remainingShips = frigCount;
                  frigCount -= 1;
                  frigCountBox.textContent = `x ${frigCount}`;
                  break;
                case 3:
                  remainingShips = schoonCount;
                  schoonCount -= 1;
                  schoonCountBox.textContent = `x ${schoonCount}`;
                  break;
                case 2:
                  remainingShips = sloopCount;
                  sloopCount -= 1;
                  sloopCountBox.textContent = `x ${sloopCount}`;
                  break;
                default:
                  console.error("error: invalid ship length in dragShip");
              }
              remainingShips -= 1;

              if (remainingShips <= 0) {
                ship.classList.add("depleted");
                ship.removeEventListener("dragstart", shipDragHandler);
                ship.draggable = false;
              }
            }
          }
          dragShip = undefined;
          dragShipLength = undefined;
          if (
            mowCount <= 0 &&
            frigCount <= 0 &&
            schoonCount <= 0 &&
            sloopCount <= 0
          ) {
            const nextBtn = document.createElement("button");
            nextBtn.textContent = "Next";
            pageContainer.appendChild(nextBtn);

            nextBtn.addEventListener("click", () => {
              resolve();
              console.log(
                "there should be some resolving of promises happening right now",
              );
            });
          }
        });
      });
    });
  }
  async function strikeScreen(playerNumber) {
    console.log(
      `this is being called from strike screen for player ${playerNumber}`,
    );
  }
  async function startScreen() {
    const htmlContent = `
      <div class="title">Battleship</div>
              <div class="playerSelectCont">
                 <form action="" class="playerForm">
                      <div class="pSelect p1">
                          <div class="countryName p1"></div>
                          <div class="pTxt p1">Player 1</div>
                          <div class="selectDropdown p1">
                              <select id="selectp1" name="select">
                                  <option value="person" selected>Player</option>
                                  <option value="cpu">CPU</option>
                              </select>
                          </div>
                          <div class="countrySelectCont p1">
                              <div class="countryBox p1" id="Germany">DE</div>
                              <div class="countryBox p1" id="Denmark">DK</div>
                              <div class="countryBox p1" id="UK">UK</div>
                              <div class="countryBox p1" id="Portugal">PT</div>
                              <div class="countryBox p1" id="Spain">PT</div>
                              <div class="countryBox p1" id="Italy">PT</div>
                              <div class="countryBox p1" id="French">PT</div>
                              <div class="countryBox p1" id="Dutch">PT</div>
                          </div>
                      </div>
                      <div class="pSelect p2">
                          <div class="countryName p2"></div>
                          <div class="pTxt p2">Player 1</div>
                          <div class="selectDropdown p2">
                              <select id="selectp2" name="select">
                                  <option value="person" selected>Player</option>
                                  <option value="cpu">CPU</option>
                              </select>
                          </div>
                          <div class="countrySelectCont p2">
                              <div class="countryBox p2" id="Germany">DE</div>
                              <div class="countryBox p2" id="Denmark">DK</div>
                              <div class="countryBox p2" id="UK">UK</div>
                              <div class="countryBox p2" id="Portugal">PT</div>
                              <div class="countryBox p2" id="Spain">PT</div>
                              <div class="countryBox p2" id="Italy">PT</div>
                              <div class="countryBox p2" id="French">PT</div>
                              <div class="countryBox p2" id="Dutch">PT</div>
                          </div>
                      </div>
                      <div class="btnCont">
                          <button type="submit">Begin</button>
                      </div>
                 </form>

              </div>
              <div class="footer">
              </div>
      `;
    pageContainer.innerHTML = htmlContent;
    const playerForm = document.querySelector(".playerForm");
    initCountrySelect();
    playerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const players = pObjInitializer(".playerForm", "selectp1", "selectp2");
      // playerobj sent back to extend functionality with player script
      async function processPlayers(players) {
        for (const element of players) {
          if (element.player === "person") {
            playerInitScript(element);
            await shipScreen(element);
          } else {
            playerInitScript(element);
            shipRandomizer(element);
          }
        }
      }
      await processPlayers(players);
      // index global variables should be populated with both players
      // call to continue game should have index accessing global player
      // objs and should work fine. but it is kinda sloppy
      // this passes over control back to the index script.
      gameInitScript();
    });
  }
  return { startScreen, pObjInitializer, strikeScreen };
};

module.exports = userInterface;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9jcHVQbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9nYW1lYm9hcmQuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3BsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3NoaXAuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy91aS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cyBmb3IgY3B1IHBsYXllciB3aWxsIGJlIHBsYWNlZCBpbiBwbGF5ZXIudGVzdC5qc1xuLy8gaGl0IGJvb2wgbWlnaHQgbm90IHBsYXkgYSByb2xlLCByZW1lbWJlciB0byBkZWxldGUgaWYgbm8gcm9sZS5cbmNvbnN0IGNwdVBsYXllciA9ICgpID0+IHtcbiAgbGV0IHN0YXRlID0gXCJyYW5kb21cIjtcbiAgbGV0IGhpdCA9IGZhbHNlO1xuICBsZXQgc3RyZWFrID0gZmFsc2U7XG4gIGxldCBoaXRBcnIgPSBbXTtcbiAgbGV0IHB1cnN1aXRBeGlzID0gbnVsbDtcblxuICBmdW5jdGlvbiByYW5kb21Nb3ZlKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5kb21Db29yZCA9IFtdO1xuXG4gICAgcmFuZG9tQ29vcmQucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuZG9tQ29vcmQ7XG4gIH1cblxuICAvLyB3aWxsIG5lZWQgdG8gaW1wbGVtZW50IHRoZSBsZWdhbCBtb3ZlIC0+IGRlcGVuZGVuY3kgaW5qZWN0aW9uIGZyb20gZ2FtZWJvYXJkIHNjcmlwdFxuICBmdW5jdGlvbiBhZGphY2VudE1vdmUoKSB7XG4gICAgLy8gd2lsbCByZXR1cm4gY29vcmRpbmF0ZSBpbiBlaXRoZXIgc2FtZSByb3cgb3IgY29sdW1uIGFzIGxhc3RIaXRcbiAgICBjb25zdCBbbGFzdEhpdF0gPSBoaXRBcnI7XG4gICAgbGV0IGFkamFjZW50U3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuICAgIC8vIHJhbmRvbWx5IGNob29zZSBlaXRoZXIgcm93IG9yIGNvbHVtbiB0byBjaGFuZ2VcbiAgICBjb25zdCBheGlzID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgLy8gMCAtPiAtMSB3aWxsIGJlIGFkZGVkIHx8IDEgLT4gMSB3aWxsIGJlIGFkZGVkXG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgYWRqYWNlbnRTdHJpa2VbYXhpc10gKz0gb2Zmc2V0VmFsdWU7XG5cbiAgICByZXR1cm4gYWRqYWNlbnRTdHJpa2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0SW5saW5lKGxhc3RIaXQpIHtcbiAgICAvLyB3aWxsIG5lZWQgdG8gZ3Vlc3MgbmV4dCBvbmUgdW50aWwgeW91IGhhdmUgYSBsZWdhbCBvbmUgdGhhdCBoYXNudCBiZWVuIHVzZWQgeWV0XG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgbGV0IGlubGluZVN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcblxuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJoXCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVsxXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfSBlbHNlIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJ2XCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZSgpIHtcbiAgICAvLyBmaW5kcyB0aGUgYXhpcyBieSBjb21wYXJpbmcgaGl0cyBhbmQgY2FsbHMgYW4gaW5saW5lIGd1ZXNzXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBudWxsKSB7XG4gICAgICBjb25zdCBbYzEsIGMyXSA9IGhpdEFycjtcbiAgICAgIGlmIChjMVswXSA9PT0gYzJbMF0gJiYgYzFbMV0gIT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJoXCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH0gZWxzZSBpZiAoYzFbMF0gIT09IGMyWzBdICYmIGMxWzFdID09PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwidlwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdHJlYWsgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFyclswXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbaGl0QXJyLmxlbmd0aCAtIDFdKTtcbiAgICAgIC8vIGNvbmRpdGlvbiBpZiB0aGUgbGFzdCBzdHJpa2Ugd2FzIGEgbWlzcyB0aGVuIHN0YXJ0IGZyb20gdGhlIGZyb250IG9mIHRoZSBsaXN0XG4gICAgICAvLyB0YWtlIHRoZSBsYXN0IGtub3duIGhpdCBhbmQgYWRkIHRvIGl0XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG5leHRNb3ZlKCkge1xuICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgIGNhc2UgXCJyYW5kb21cIjpcbiAgICAgICAgcmV0dXJuIHJhbmRvbU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRqYWNlbnRcIjpcbiAgICAgICAgcmV0dXJuIGFkamFjZW50TW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpbmxpbmVcIjpcbiAgICAgICAgcmV0dXJuIGlubGluZU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gXCJFcnJvciBjb25kaXRpb24gZXhjZXB0aW9uOiBuZXh0TW92ZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRIaXQoY29vcmRpbmF0ZSwgaXNTdW5rKSB7XG4gICAgc3RyZWFrID0gdHJ1ZTtcbiAgICBpZiAoaXNTdW5rID09PSB0cnVlKSB7XG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSBcInJhbmRvbVwiO1xuICAgICAgaGl0QXJyID0gW107XG4gICAgICBwdXJzdWl0QXhpcyA9IG51bGw7XG4gICAgfVxuICAgIGhpdEFyci5wdXNoKGNvb3JkaW5hdGUpO1xuICAgIGlmIChoaXRBcnIubGVuZ3RoID09PSAxKSB7XG4gICAgICBzdGF0ZSA9IFwiYWRqYWNlbnRcIjtcbiAgICB9IGVsc2UgaWYgKGhpdEFyci5sZW5ndGggPiAxKSB7XG4gICAgICBzdGF0ZSA9IFwiaW5saW5lXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydE1pc3MoKSB7XG4gICAgc3RyZWFrID0gZmFsc2U7XG4gIH1cbiAgLy8gcmVwb3J0IG1pc3MgZnVuY3Rpb24/XG4gIHJldHVybiB7XG4gICAgcmFuZG9tTW92ZSxcbiAgICBhZGphY2VudE1vdmUsXG4gICAgaW5saW5lTW92ZSxcbiAgICBuZXh0TW92ZSxcbiAgICByZXBvcnRIaXQsXG4gICAgcmVwb3J0TWlzcyxcbiAgICBoaXRBcnIsXG4gIH07XG59O1xubW9kdWxlLmV4cG9ydHMgPSBjcHVQbGF5ZXI7XG5cbi8vIGF0dGFjayBvbiBwbGF5ZXIgY2xhc3MgYWNjZXB0cyBhIGNvb3JkaW5hdGUgcGFpci4gaG93IHRoYXQgcGFpciBnZXRzIGZvcm11bGF0ZWQgZG9lcyBub3QgbWF0dGVyXG4vLyBoYXZlIGEgZ2VuZXJhbCBuZXh0TW92ZSBmdW5jdGlvbiB0aGF0IHdpbGwgaW50ZWxsaWdlbnRseSBkZXRlcm1pbmUgd2hhdCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZFxuLy8gYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIGhpdHMuXG4vLyB0aGUgaW5mb3JtYXRpb24geW91IHdvdWxkIG5lZWQgcmVjb3JkIHdoZW4geW91IGhhdmUgdHdvIGhpdHMuIGlmIHlvdSBoYXZlIHR3byBoaXRzIHlvdSBuZWVkIHRvIGZpZ3VyZSBvdXQgdGhlIG9yaWVudGF0aW9uIG9mIHRoYXQgc2hpcCBhbmQgcmVwZWF0ZWRseSAobG9vcCkgc3RyaWtlIGlubGluZSB1bnRpbCB0aGVyZSBpcyBhIHN1bmsgc2hpcC5cbi8vXG4vLyBjb25jbHVzaW9uOiB0aGVyZSBkZWZpbml0ZWx5IG5lZWRzIHRvIGJlIGEgd2F5IGZvciB0aGUgZ2FtZWJvYXJkIHRvIGNvbW11bmljYXRlIGJhY2sgdG8gdGhlIGNwdSBzY3JpcHQuXG4vL1xuLy8gY2FsbGJhY2sgZm5zIHRoYXQgY2hlY2sgb24gZWFjaCBtb3ZlPyBvciBpcyBpdCBmZWQgdG8gdGhlIGNwdSBzY3JpcHQgYnkgdGhlIGdhbWVsb29wP1xuIiwiY29uc3QgZ2FtZUJvYXJkID0gKCkgPT4ge1xuICBsZXQgc2hpcHMgPSBbXTtcbiAgZnVuY3Rpb24gZ3JpZE1ha2VyKCkge1xuICAgIGdyaWQgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZ3JpZFtpXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGdyaWRbaV1bal0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JpZDtcbiAgfVxuXG4gIC8vIGluaXRpYWxpemVyIGZvciB0aGUgZ3JpZFxuICBsZXQgc2hpcEdyaWQgPSBncmlkTWFrZXIoKTtcbiAgbGV0IGF0dGFja3NSZWNlaXZlZCA9IGdyaWRNYWtlcigpO1xuXG4gIGZ1bmN0aW9uIHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgY29weUNvb3JkID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBsZXQgciA9IGNvcHlDb29yZFswXTtcbiAgICBsZXQgYyA9IGNvcHlDb29yZFsxXTtcbiAgICBjb25zdCByb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3QgY29mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2hpcGZpdCBsZW5ndGggdW5kZWZpbmVkXCIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgciArPSByb2Zmc2V0O1xuICAgICAgYyArPSBjb2Zmc2V0O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgb2Zmc2V0KSB7XG4gICAgbGV0IGN1cnJlbnQgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBHcmlkW2N1cnJlbnRbMF1dW2N1cnJlbnRbMV1dID0gc2hpcDtcbiAgICAgIGN1cnJlbnRbMF0gKz0gb2Zmc2V0WzBdO1xuICAgICAgY3VycmVudFsxXSArPSBvZmZzZXRbMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2hpcChzaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICBzaGlwcy5wdXNoKHNoaXApO1xuXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFswLCAxXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcmllbnRhdGlvbiA9PT0gXCJ2XCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMSwgMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBzaGlwIGRpZCBub3QgZml0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcblxuICAgIHJldHVybiBzdHJpa2VTcXVhcmUgPT09IG51bGwgPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcblxuICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2hpcCA9IHNoaXBHcmlkW3JdW2NdO1xuICAgICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMTtcbiAgICAgIGNvbnN0IGhpdFJlcG9ydCA9IHNoaXAuaGl0KCk7XG5cbiAgICAgIGlmIChzaGlwLmlzU3VuaygpID09PSB0cnVlKSB7XG4gICAgICAgIHNoaXBzID0gc2hpcHMuZmlsdGVyKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQgIT09IHNoaXA7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBmdW5jdGlvbiB0aGF0IHJlcG9ydHMgaWYgdGhlcmUgYXJlIHNoaXBzIHJlbWFpbmluZy5cbiAgICAgICAgcmV0dXJuIGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGl0UmVwb3J0O1xuICAgIH1cbiAgICAvLyByZWNvcmQgdGhlIG1pc3NcbiAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAwO1xuICAgIHJldHVybiBcIm1pc3NcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgY29ubmVjdGluZyBjcHUgQUkgdG8gb3RoZXIgZnVuY3Rpb25zXG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgLy8gdGhpcyB3cmFwcGVyIHdpbGwgbmVlZCB0byBiZSByZWZhY3RvcmVkIGFmdGVyIGNoYW5nZXMgdG8gcGxheWVyIGNsYXNzXG4gICAgZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgbGV0IG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG5cbiAgICAgIGlmIChzdHJpa2VSZXN1bHQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAuLi5wbGF5ZXJDbGFzcy5wbGF5ZXJPYmosXG4gICAgICBhdHRhY2ssXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwbGF5ZXJJbml0aWFsaXplcihwbGF5ZXJPYmopIHtcbiAgICBpZiAocGxheWVyT2JqLm51bWJlciA9PT0gMSkge1xuICAgICAgcGxheWVyMSA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGF5ZXIyID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFBsYWNlclByb3h5KFxuICAgIG51bWJlcixcbiAgICBsZW5ndGgsXG4gICAgY29vcmRpbmF0ZXMsXG4gICAgb3JpZW50YXRpb24sXG4gICAgY2hlY2tvbmx5ID0gZmFsc2UsXG4gICkge1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPT09IG51bGwgfHwgbGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHdpbGwgbWFrZSBhbmQgcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBwbGF5ZXIgPSBudW1iZXIgPT09IDEgPyBwbGF5ZXIxIDogcGxheWVyMjtcbiAgICAvLyBmaXJzdCBjaGVjayB0aGUgY29vcmRpbmF0ZXNcbiAgICAvLyB0aGVuIG1ha2UgdGhlIHNoaXBcbiAgICAvLyB0aGVuIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgY2FuRml0ID0gcGxheWVyLnBsYXllckJvYXJkLnNoaXBGaXRzKFxuICAgICAgbGVuZ3RoLFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICApO1xuICAgIGlmICghY2FuRml0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghY2hlY2tvbmx5KSB7XG4gICAgICBjb25zdCBuZXdTaGlwID0gc2hpcChsZW5ndGgpO1xuICAgICAgcGxheWVyLnBsYXllckJvYXJkLmFkZFNoaXAobmV3U2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwR3JpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBnYW1lTG9vcCgpIHtcbiAgICAvLyB3aGlsZSBnYW1lIGlzIG5vdCBvdmVyXG4gICAgY29uc29sZS5sb2coXCJncmVldGluZ3MgZnJvbSBnYW1lbG9vcFwiKTtcbiAgICBjb25zb2xlLmRpcihjdXJyZW50UGxheWVyKTtcbiAgICAvLyBjYWxsIHVpIHN0cmlrZXNjcmVlbiBmb3IgY3VycmVudCBwbGF5ZXIgaWYgaXRzIGEgcGVyc29uXG4gICAgd2hpbGUgKGdhbWVPdmVyID09PSBmYWxzZSkge1xuICAgICAgaWYgKCFjdXJyZW50UGxheWVyLmlzQ3B1KSB7XG4gICAgICAgIGNvbnN0IGNvb3JkID0gYXdhaXQgdWkuc3RyaWtlU2NyZWVuKGN1cnJlbnRQbGF5ZXIubnVtYmVyKTtcbiAgICAgICAgY29uc29sZS5sb2coYGNvb3JkaW5hdGVzIHRvIHN0cmlrZSBhcmU6ICR7Y29vcmR9YCk7XG4gICAgICAgIGdhbWVUdXJuKGNvb3JkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdhbWVUdXJuKCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGNhbGwgdWkgZm4gdGhhdCB3aWxsIGVuZCB0aGUgZ2FtZVxuICAgIC8vIHVpIHNob3VsZCBhbGxvdyB0aGVtIHRvIHJlc2V0IHRoZSBnYW1lLlxuICAgIC8vIGNhbGwgaW5kZXggZm4gdGhhdCB3aWxsIHRoZSBnYW1lXG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG5cbiAgICBpZiAocGxheWVyMS5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMSB9O1xuICAgICAgcGxheWVyMSA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyMi5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMiB9O1xuICAgICAgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgIH1cblxuICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgIGNvbnNvbGUubG9nKGN1cnJlbnRQbGF5ZXIpO1xuICAgIGdhbWVMb29wKCk7XG5cbiAgICAvLyB3aWxsIGluaXRpYWxpemUgdGhlIGdhbWUgbG9vcCBmbiB0aGF0IHdpbGwgY2FsbCB1aSBmb3Igc3RyaWtlIHNjcmVlbnNcbiAgICAvLyBjcHUgdHVybnMgd2lsbCBiZSBoYW5kbGVkIGJ5IGdhbWVsb29wIGF1dG9tYXRpY2FsbHlcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcblxuICAvLyB0aGlzIGluaXRpYWxpemVzIGJ1dCB0aGUgZ2FtZSBsb29wIHBpY2tzIGJhY2sgdXAgd2hlbiB1aSBzY3JpcHQgY2FsbHMgZ2FtZWluaXRpYWxpemVyO1xuICBsZXQgcGxheWVyMSA9IHVuZGVmaW5lZDtcbiAgbGV0IHBsYXllcjIgPSB1bmRlZmluZWQ7XG4gIGxldCBjdXJyZW50UGxheWVyID0gdW5kZWZpbmVkO1xuICBjb25zdCBjcHVBSSA9IGNwdSgpO1xuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgdWkuc3RhcnRTY3JlZW4oKTtcblxuICAvLyAgY29uc3QgcGxheWVyMSA9IHBsYXllcihcIkRrXCIsIGdhbWVCb2FyZCgpKTtcbiAgLy8gIGxldCBwbGF5ZXIyID0gY3B1UGxheWVyV3JhcHBlcihcbiAgLy8gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAvLyAgICBjcHVBSSxcbiAgLy8gICAgcGxheWVyMS5wbGF5ZXJCb2FyZCxcbiAgLy8gICk7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gIH1cbiAgLy8gZ2FtZVR1cm4gaXMgY2FsbGVkIGJ5IGV2ZW50IGhhbmRsZXIgb24gVUkgaW50ZXJhY3Rpb24gLW9yLSBieSByZWN1cnNpb24gd2hlbiBpdHMgY3B1IHR1cm5cbiAgZnVuY3Rpb24gZ2FtZVR1cm4oY29vcmRpbmF0ZXMgPSBcIlwiKSB7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwbGF5ZXIxLmF0dGFjayhjb29yZGluYXRlcywgcGxheWVyMi5wbGF5ZXJCb2FyZCk7XG4gICAgICAvLyByZXR1cm4gdmFsdWUgYW55dGhpbmcgb3RoZXIgdGhhbiBudW0gPSBwbGF5ZXIgbG9zZXNcbiAgICAgIGlmIChpc05hTihwbGF5ZXIyLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkpKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocGxheWVyMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMjtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjIpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHBsYXllcjIuYXR0YWNrKGNvb3JkaW5hdGVzLCBwbGF5ZXIxLnBsYXllckJvYXJkKTtcbiAgICAgIC8vIGNoZWNrIHRoaXMgbGluZSBmb3IgZXJyb3JzLCB0aGlzIHdhcyByZWZhY3RvcmVkIGRpZmZlcmVudGx5XG4gICAgICBpZiAoaXNOYU4ocGxheWVyMS5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpKSkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHBsYXllcjEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjE7XG4gICAgfVxuICAgIGlmIChjdXJyZW50UGxheWVyLmlzQ1BVID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZ2FtZVR1cm4oKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNHYW1lT3ZlcigpIHtcbiAgICByZXR1cm4gZ2FtZU92ZXI7XG4gIH1cbiAgcmV0dXJuIHsgZ2FtZVR1cm4sIGlzR2FtZU92ZXIgfTtcbn07XG5nYW1lTW9kdWxlKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVNb2R1bGU7XG4iLCIvLyB0aGlzIHdpbGwgZGVtb25zdHJhdGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gd2l0aCB0aGUgbmVlZGVkIG1ldGhvZHMgZm9yIHRoZSBwbGF5ZXIgYm9hcmQgYW5kIGVuZW15IGJvYXJkIHJlZlxuXG5jb25zdCBwbGF5ZXIgPSAocGxheWVyT2JqLCBib2FyZEZuKSA9PiB7XG4gIGNvbnN0IHBsYXllckJvYXJkID0gYm9hcmRGbjtcbiAgY29uc3QgaXNDUFUgPSBwbGF5ZXJPYmoucGxheWVyID09PSBcInBlcnNvblwiID8gZmFsc2UgOiB0cnVlO1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IC4uLnBsYXllck9iaiwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG5cbi8vIHRoZSBhdHRhY2sgZm4gYXMgb2Ygbm93IGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIGNwdSBwbGF5ZXIgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHJlZ2VuZXJhdGUgYW5vdGhlciBtb3ZlIHdpdGhvdXQgbGVhdmluZyBpdHMgY3VycmVudCBzY29wZVxuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG5cbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDI6XG4gICAgICB0eXBlID0gXCJQYXRyb2wgU2xvb3BcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHR5cGUgPSBcIlNjaG9vbmVyXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICB0eXBlID0gXCJGcmlnYXRlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICB0eXBlID0gXCJNYW4tby1XYXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaGlwIHR5cGUgZXhjZXB0aW9uOiBsZW5ndGggbXVzdCBiZSAxLTVcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoaXQoKSB7XG4gICAgZGFtYWdlKys7XG4gICAgcmV0dXJuIGAke3R5cGV9IHdhcyBoaXQuICR7aGl0cG9pbnRzKCl9IGhpdHBvaW50cyByZW1haW5pbmdgO1xuICB9XG4gIGZ1bmN0aW9uIGlzU3VuaygpIHtcbiAgICByZXR1cm4gZGFtYWdlID49IGxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBoaXRwb2ludHMoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCAtIGRhbWFnZTtcbiAgfVxuICByZXR1cm4geyB0eXBlLCBsZW5ndGgsIGRhbWFnZSwgaGl0cG9pbnRzLCBoaXQsIGlzU3VuayB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGlwO1xuIiwiY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuXG5jb25zdCB1c2VySW50ZXJmYWNlID0gKHNoaXBNYWtlclByb3h5LCBwbGF5ZXJJbml0U2NyaXB0LCBnYW1lSW5pdFNjcmlwdCkgPT4ge1xuICBjb25zdCBwYWdlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYWdlQ29udGFpbmVyXCIpO1xuICBsZXQgcDFDb3VudHJ5ID0gXCJcIjtcbiAgbGV0IHAyQ291bnRyeSA9IFwiXCI7XG5cbiAgZnVuY3Rpb24gaW5pdENvdW50cnlTZWxlY3QoKSB7XG4gICAgY29uc3Qgbm9kZUxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNvdW50cnlCb3hcIik7XG4gICAgbm9kZUxpc3QuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDFcIikge1xuICAgICAgICAgIHAxQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDJcIikge1xuICAgICAgICAgIHAyQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYnVpbGRzIGEgcGxheWVyb2JqIHRoYXQgY29udGFpbnMgaW5mb3JtYXRpb24gdG8gaW5pdGlhbGl6ZSB0aGUgZ2FtZVxuICBmdW5jdGlvbiBwT2JqSW5pdGlhbGl6ZXIoZm9ybUNsc3NObWUsIHAxc2VsZWN0aWQsIHAyc2VsZWN0aWQpIHtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ2xzc05tZSk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMXNlbGVjdGlkKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAyc2VsZWN0aWQpO1xuICAgIGxldCBwbGF5ZXJzID0gW107XG5cbiAgICBjb25zdCBtYW5vd2FyID0gNTtcbiAgICBjb25zdCBmcmlnYXRlID0gNDtcbiAgICBjb25zdCBzY2hvb25lciA9IDM7XG4gICAgY29uc3Qgc2xvb3AgPSAyO1xuXG4gICAgLy8gcGxheWVyIGlzIGVpdGhlciBcImNwdVwiIG9yIFwicGVyc29uXCJcbiAgICBjb25zdCBwbGF5ZXJvYmogPSB7XG4gICAgICBwbGF5ZXI6IHVuZGVmaW5lZCxcbiAgICAgIG51bWJlcjogdW5kZWZpbmVkLFxuICAgICAgY291bnRyeTogdW5kZWZpbmVkLFxuICAgICAgc2hpcHM6IFtcbiAgICAgICAgbWFub3dhcixcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2xvb3AsXG4gICAgICAgIHNsb29wLFxuICAgICAgXSxcbiAgICB9O1xuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21Db29yZCgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuY29vcmRpbmF0ZXMgPSBbXTtcblxuICAgIHJhbmNvb3JkaW5hdGVzLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmNvb3JkaW5hdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKSB7XG4gICAgbGV0IHNoaXBBcnIgPSBbLi4ucGxheWVyT2JqLnNoaXBzXTtcblxuICAgIHNoaXBBcnIuZm9yRWFjaCgoc2hpcExlbmd0aCkgPT4ge1xuICAgICAgbGV0IHBsYWNlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKCFwbGFjZWQpIHtcbiAgICAgICAgLy8gcmFuZG9tIGRpcmVjdGlvbiBvZiBzaGlwIHBsYWNlbWVudFxuICAgICAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IHJhbmRvbUNvb3JkKCk7XG4gICAgICAgIGNvbnN0IHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgICAgICBjb25zdCBheGlzID0gcmFuZG9tID09PSAwID8gXCJoXCIgOiBcInZcIjtcblxuICAgICAgICAvLyByZXR1cm5zIGZhbHNlIGlmIHdhcyBub3QgYWJsZSB0byBwbGFjZSBzaGlwIGF0IHJhbmRvbSBzcG90LCB0cnlzIGFnYWluXG4gICAgICAgIHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgc2hpcExlbmd0aCxcbiAgICAgICAgICByYW5jb29yZGluYXRlcyxcbiAgICAgICAgICBheGlzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnNvbGUuZGlyKHBsYXllck9iaik7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIC8vIG5lZWQgYXN5bmMgZnVuY3Rpb24gdG8gd2FpdCBmb3IgZWFjaCBwbGF5ZXIgc2hpcCBzZWxlY3Rpb24gdG8gYmUgcmVzb2x2ZWQgYmVmb3JlIG1vdmluZyBvbiB0byB0aGUgbmV4dCBvbmVcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIC8vIGNsZWFyIHBhZ2UgY29udGFpbmVyIGFuZCBwb3B1bGF0ZSB3aXRoIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IG1hblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgZnJpZ1wiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIzXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzY2hvb25cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2xvb3BcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJyYW5kb21CdG5cIj5cbiAgICAgICAgICAgICAgICAgIFJhbmRvbWl6ZVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICBgO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICAgIGNvbnNvbGUubG9nKFwiZG9tIGZpbmlzaGVkIGxvYWRpbmdcIik7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgYXJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuICAgICAgY29uc29sZS5sb2coYHRoZSBjdXJyZW50IHBsYXllciBpczogJHtwbGF5ZXJPYmoubnVtYmVyfWApO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dDb250XCIpO1xuICAgICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LmMgPSBqO1xuICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY3ljbGUgc2hpcCBwbGFjZW1lbnQgb3JpZW50YXRpb24sIGluaXRpYWxpemVkIHRvIFwiaFwiXG4gICAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgICBvcmllbnRhdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIkhvcml6b250YWxcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHNoaXBEcmFnSGFuZGxlcihlKSB7XG4gICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmluZGV4KTtcblxuICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBkcmFnU2hpcCA9IHNoaXA7XG4gICAgICAgIC8vIFNldCB0aGUgb2Zmc2V0IGZvciB0aGUgZHJhZyBpbWFnZVxuICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERyYWdJbWFnZShjbG9uZSwgMCwgMCk7XG4gICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRyYWdnaW5nXCIpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmFuZG9tQnRuRm4oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHBsYXllck9iaik7XG4gICAgICAgIHNoaXBSYW5kb21pemVyKHBsYXllck9iaik7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmFuZG9tQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5yYW5kb21CdG5cIik7XG5cbiAgICAgIGNvbnNvbGUubG9nKHJhbmRvbUJ0bik7XG4gICAgICByYW5kb21CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgcmFuZG9tQnRuRm4oKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBncmlkU2hhZGVyID0gKFxuICAgICAgICBjb29yZCxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgIHBsYWNlZCA9IGZhbHNlLFxuICAgICAgKSA9PiB7XG4gICAgICAgIGNvbnN0IG9mZnNldHIgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0YyA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgICAgICBsZXQgYWRkZWRDbGFzcyA9IFwiXCI7XG5cbiAgICAgICAgLy8gMyBzaGFkaW5nIHBvc3NpYmxpdGllcyBmaXRzL25vZml0cy9wbGFjZWRcbiAgICAgICAgaWYgKHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGFkZGVkQ2xhc3MgPSBcInBsYWNlZFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZGVkQ2xhc3MgPSBkcmFnRml0cyA9PT0gdHJ1ZSA/IFwiZml0c1wiIDogXCJub3RGaXRzXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50Q29vcmQgPSBbLi4uY29vcmRdO1xuICAgICAgICBsZXQgY2VsbENvbGxlY3Rpb24gPSBbXTtcblxuICAgICAgICAvLyBzaGFkZSBlYWNoIGNlbGwgcmVwcmVzZW50aW5nIHNoaXAgbGVuZ3RoXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICBgW2RhdGEtcj1cIiR7Y3VycmVudENvb3JkWzBdfVwiXVtkYXRhLWM9XCIke2N1cnJlbnRDb29yZFsxXX1cIl1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY2VsbENvbGxlY3Rpb24ucHVzaChjdXJyZW50Q2VsbCk7XG5cbiAgICAgICAgICBpZiAoY3VycmVudENlbGwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnRDb29yZFswXSArPSBvZmZzZXRyO1xuICAgICAgICAgIGN1cnJlbnRDb29yZFsxXSArPSBvZmZzZXRjO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFmdGVyIHNoYWRlLCBkcmFnbGVhdmUgaGFuZGxlciB0byBjbGVhciBzaGFkaW5nIHdoZW4gbm90IHBsYWNlZFxuICAgICAgICBjb25zdCBmaXJzdENlbGwgPSBjZWxsQ29sbGVjdGlvblswXTtcbiAgICAgICAgaWYgKGZpcnN0Q2VsbCA9PT0gbnVsbCB8fCBmaXJzdENlbGwgPT09IHVuZGVmaW5lZCB8fCBwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZmlyc3RDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgY2VsbENvbGxlY3Rpb24uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGAke2FkZGVkQ2xhc3N9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gbGVhdmVTY3JlZW4oKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICAvLyB0cmFuc2xhdGVzIFVJIGNlbGwgdG8gYSBjb29yZGluYXRlIG9uIGEgZHJhZ292ZXIgZXZlbnRcbiAgICAgIC8vIGNoZWNrcyBpZiB0aGUgc2hpcCBkcmFnZ2VkIHdpbGwgZml0XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNvbnN0IGRyYWdPdmVySGFuZGxlciA9IChlKSA9PiB7XG4gICAgICAgICAgaWYgKGRyYWdTaGlwTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwibW91c2VvdmVyXCIpO1xuXG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIGRyYWdGaXRzID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBjb29yZCBwb3N0IHNoaXBtYWtlcjogJHtjb29yZH1gKTtcbiAgICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAgIC8vIGFkZCBjbGFzc25hbWUgZm9yIGZpdHNcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoY29vcmQsIGRyYWdTaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgZHJhZ0ZpdHMsIGZhbHNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3Igbm90IGZpdHNcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoY29vcmQsIGRyYWdTaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgZHJhZ0ZpdHMsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm1vdXNlb3ZlclwiKTtcbiAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzaGlwSU1HID0gbmV3IEltYWdlKCk7XG4gICAgICBzaGlwSU1HLnNyYyA9IFwiLi9pbWFnZXMvc2FpbGJvYXQucG5nXCI7XG4gICAgICBzaGlwSU1HLmNsYXNzTGlzdC5hZGQoXCJzaGlwSU1HXCIpO1xuICAgICAgc2hpcElNRy5zdHlsZS53aWR0aCA9IFwiMXJlbVwiO1xuXG4gICAgICBzaGlwcy5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBzaGlwRHJhZ0hhbmRsZXIpO1xuXG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LnJlbW92ZShcImRyYWdnaW5nXCIpO1xuXG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAocGxhY2VkKSB7XG4gICAgICAgICAgICAgIGdyaWRTaGFkZXIoY29vcmQsIGRyYWdTaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgZHJhZ0ZpdHMsIHRydWUpO1xuXG4gICAgICAgICAgICAgIGxldCByZW1haW5pbmdTaGlwcyA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgc3dpdGNoIChkcmFnU2hpcExlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gbW93Q291bnQ7XG4gICAgICAgICAgICAgICAgICBtb3dDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgbWFuQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke21vd0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IGZyaWdDb3VudDtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2Nob29uQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3NjaG9vbkNvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNsb29wQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzbG9vcENvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBpbnZhbGlkIHNoaXAgbGVuZ3RoIGluIGRyYWdTaGlwXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzIC09IDE7XG5cbiAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ1NoaXBzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkZXBsZXRlZFwiKTtcbiAgICAgICAgICAgICAgICBzaGlwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBzaGlwLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG1vd0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIGZyaWdDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBzY2hvb25Db3VudCA8PSAwICYmXG4gICAgICAgICAgICBzbG9vcENvdW50IDw9IDBcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgbmV4dEJ0bi50ZXh0Q29udGVudCA9IFwiTmV4dFwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFwidGhlcmUgc2hvdWxkIGJlIHNvbWUgcmVzb2x2aW5nIG9mIHByb21pc2VzIGhhcHBlbmluZyByaWdodCBub3dcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBzdHJpa2VTY3JlZW4ocGxheWVyTnVtYmVyKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgdGhpcyBpcyBiZWluZyBjYWxsZWQgZnJvbSBzdHJpa2Ugc2NyZWVuIGZvciBwbGF5ZXIgJHtwbGF5ZXJOdW1iZXJ9YCxcbiAgICApO1xuICB9XG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2NyZWVuKCkge1xuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+QmF0dGxlc2hpcDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyU2VsZWN0Q29udFwiPlxuICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249XCJcIiBjbGFzcz1cInBsYXllckZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDFcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDFcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMVwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMlwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAyXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+QmVnaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllckZvcm1cIik7XG4gICAgaW5pdENvdW50cnlTZWxlY3QoKTtcbiAgICBwbGF5ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBwT2JqSW5pdGlhbGl6ZXIoXCIucGxheWVyRm9ybVwiLCBcInNlbGVjdHAxXCIsIFwic2VsZWN0cDJcIik7XG4gICAgICAvLyBwbGF5ZXJvYmogc2VudCBiYWNrIHRvIGV4dGVuZCBmdW5jdGlvbmFsaXR5IHdpdGggcGxheWVyIHNjcmlwdFxuICAgICAgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1BsYXllcnMocGxheWVycykge1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcGxheWVycykge1xuICAgICAgICAgIGlmIChlbGVtZW50LnBsYXllciA9PT0gXCJwZXJzb25cIikge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIGF3YWl0IHNoaXBTY3JlZW4oZWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBzaGlwUmFuZG9taXplcihlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpO1xuICAgICAgLy8gaW5kZXggZ2xvYmFsIHZhcmlhYmxlcyBzaG91bGQgYmUgcG9wdWxhdGVkIHdpdGggYm90aCBwbGF5ZXJzXG4gICAgICAvLyBjYWxsIHRvIGNvbnRpbnVlIGdhbWUgc2hvdWxkIGhhdmUgaW5kZXggYWNjZXNzaW5nIGdsb2JhbCBwbGF5ZXJcbiAgICAgIC8vIG9ianMgYW5kIHNob3VsZCB3b3JrIGZpbmUuIGJ1dCBpdCBpcyBraW5kYSBzbG9wcHlcbiAgICAgIC8vIHRoaXMgcGFzc2VzIG92ZXIgY29udHJvbCBiYWNrIHRvIHRoZSBpbmRleCBzY3JpcHQuXG4gICAgICBnYW1lSW5pdFNjcmlwdCgpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7IHN0YXJ0U2NyZWVuLCBwT2JqSW5pdGlhbGl6ZXIsIHN0cmlrZVNjcmVlbiB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c2VySW50ZXJmYWNlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9