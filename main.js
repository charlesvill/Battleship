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
    // call ui strikescreen for current player if its a person
    while (gameOver === false) {
      if (!currentPlayer.isCpu) {
        const coord = await ui.strikeScreen(currentPlayer.number);
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

    // will initialize the game loop fn that will call ui for strike screens
    // cpu turns will be handled by gameloop automatically
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  let player1 = undefined;
  let player2 = undefined;
  ui.startScreen();
  const cpuAI = cpu();

  let gameOver = false;
  //  const player1 = player("Dk", gameBoard());
  //  let player2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    player1.playerBoard,
  //  );
  let currentPlayer = player1;

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
/***/ ((module) => {

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
          </div>
      </div>
     `;
      pageContainer.innerHTML = "";
      pageContainer.innerHTML = htmlContent;

      // necessary globals for methods in ship select
      const gridContainer = document.querySelector(".gridCont");
      const gridSize = 10;
      let dragShipLength = 0;
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
        const shipDragHandler = (e) => {
          dragShipLength = Number(e.currentTarget.dataset.index);

          const clone = ship.cloneNode(true);
          dragShip = ship;
          // Set the offset for the drag image
          const offsetX = 20; // Set your desired offset value
          e.dataTransfer.setDragImage(clone, 0, 0);
          ship.classList.add("dragging");
        };

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNuS0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWMsTUFBTSxXQUFXLGFBQWE7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7Ozs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFD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VztBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsNERBQTRELGFBQWE7QUFDekU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUMvZEE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvY3B1UGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMgZm9yIGNwdSBwbGF5ZXIgd2lsbCBiZSBwbGFjZWQgaW4gcGxheWVyLnRlc3QuanNcbi8vIGhpdCBib29sIG1pZ2h0IG5vdCBwbGF5IGEgcm9sZSwgcmVtZW1iZXIgdG8gZGVsZXRlIGlmIG5vIHJvbGUuXG5jb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgLy8gd2lsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbGVnYWwgbW92ZSAtPiBkZXBlbmRlbmN5IGluamVjdGlvbiBmcm9tIGdhbWVib2FyZCBzY3JpcHRcbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgLy8gd2lsbCBuZWVkIHRvIGd1ZXNzIG5leHQgb25lIHVudGlsIHlvdSBoYXZlIGEgbGVnYWwgb25lIHRoYXQgaGFzbnQgYmVlbiB1c2VkIHlldFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGxldCBpbmxpbmVTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG5cbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IFwiaFwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH0gZWxzZSBpZiAocHVyc3VpdEF4aXMgPT09IFwidlwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMF0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlubGluZU1vdmUoKSB7XG4gICAgLy8gZmluZHMgdGhlIGF4aXMgYnkgY29tcGFyaW5nIGhpdHMgYW5kIGNhbGxzIGFuIGlubGluZSBndWVzc1xuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgW2MxLCBjMl0gPSBoaXRBcnI7XG4gICAgICBpZiAoYzFbMF0gPT09IGMyWzBdICYmIGMxWzFdICE9PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwiaFwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9IGVsc2UgaWYgKGMxWzBdICE9PSBjMlswXSAmJiBjMVsxXSA9PT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcInZcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RyZWFrID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbMF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBtb2RlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH1cbiAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCkge1xuICAgIHN0cmVhayA9IGZhbHNlO1xuICB9XG4gIC8vIHJlcG9ydCBtaXNzIGZ1bmN0aW9uP1xuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuXG4vLyBhdHRhY2sgb24gcGxheWVyIGNsYXNzIGFjY2VwdHMgYSBjb29yZGluYXRlIHBhaXIuIGhvdyB0aGF0IHBhaXIgZ2V0cyBmb3JtdWxhdGVkIGRvZXMgbm90IG1hdHRlclxuLy8gaGF2ZSBhIGdlbmVyYWwgbmV4dE1vdmUgZnVuY3Rpb24gdGhhdCB3aWxsIGludGVsbGlnZW50bHkgZGV0ZXJtaW5lIHdoYXQgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWRcbi8vIGFjY29yZGluZyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiBoaXRzLlxuLy8gdGhlIGluZm9ybWF0aW9uIHlvdSB3b3VsZCBuZWVkIHJlY29yZCB3aGVuIHlvdSBoYXZlIHR3byBoaXRzLiBpZiB5b3UgaGF2ZSB0d28gaGl0cyB5b3UgbmVlZCB0byBmaWd1cmUgb3V0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGF0IHNoaXAgYW5kIHJlcGVhdGVkbHkgKGxvb3ApIHN0cmlrZSBpbmxpbmUgdW50aWwgdGhlcmUgaXMgYSBzdW5rIHNoaXAuXG4vL1xuLy8gY29uY2x1c2lvbjogdGhlcmUgZGVmaW5pdGVseSBuZWVkcyB0byBiZSBhIHdheSBmb3IgdGhlIGdhbWVib2FyZCB0byBjb21tdW5pY2F0ZSBiYWNrIHRvIHRoZSBjcHUgc2NyaXB0LlxuLy9cbi8vIGNhbGxiYWNrIGZucyB0aGF0IGNoZWNrIG9uIGVhY2ggbW92ZT8gb3IgaXMgaXQgZmVkIHRvIHRoZSBjcHUgc2NyaXB0IGJ5IHRoZSBnYW1lbG9vcD9cbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGNvcHlDb29yZCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgbGV0IHIgPSBjb3B5Q29vcmRbMF07XG4gICAgbGV0IGMgPSBjb3B5Q29vcmRbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNoaXBmaXQgbGVuZ3RoIHVuZGVmaW5lZFwiKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMCwgMV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBzaGlwIGRpZCBub3QgZml0XCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3JpZW50YXRpb24gPT09IFwidlwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzEsIDBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCBbciwgY10gPSBjb29yZGluYXRlcztcbiAgICBjb25zdCBzdHJpa2VTcXVhcmUgPSBhdHRhY2tzUmVjZWl2ZWRbcl1bY107XG5cbiAgICByZXR1cm4gc3RyaWtlU3F1YXJlID09PSBudWxsID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcykge1xuICAgIGNvbnN0IHIgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjID0gY29vcmRpbmF0ZXNbMV07XG5cbiAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHNoaXAgPSBzaGlwR3JpZFtyXVtjXTtcbiAgICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDE7XG4gICAgICBjb25zdCBoaXRSZXBvcnQgPSBzaGlwLmhpdCgpO1xuXG4gICAgICBpZiAoc2hpcC5pc1N1bmsoKSA9PT0gdHJ1ZSkge1xuICAgICAgICBzaGlwcyA9IHNoaXBzLmZpbHRlcigoZWxlbWVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50ICE9PSBzaGlwO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gZnVuY3Rpb24gdGhhdCByZXBvcnRzIGlmIHRoZXJlIGFyZSBzaGlwcyByZW1haW5pbmcuXG4gICAgICAgIHJldHVybiBgJHtzaGlwLnR5cGV9IGhhcyBiZWVuIHN1bmtgO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpdFJlcG9ydDtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMDtcbiAgICByZXR1cm4gXCJtaXNzXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwc1JlbWFpbmluZygpIHtcbiAgICByZXR1cm4gc2hpcHMubGVuZ3RoID4gMCA/IHNoaXBzLmxlbmd0aCA6IFwiQWxsIHNoaXBzIGhhdmUgc3Vua1wiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzaGlwR3JpZCxcbiAgICBhdHRhY2tzUmVjZWl2ZWQsXG4gICAgc2hpcHMsXG4gICAgc2hpcEZpdHMsXG4gICAgYWRkU2hpcCxcbiAgICBjYW5TdHJpa2UsXG4gICAgcmVjZWl2ZUF0dGFjayxcbiAgICBzaGlwc1JlbWFpbmluZyxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2FtZUJvYXJkO1xuIiwiLy8gaW5kZXggaG91c2VzIHRoZSBkcml2ZXIgY29kZSBpbmNsdWRpbmcgdGhlIGdhbWUgbG9vcFxuY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuY29uc3QgZ2FtZUJvYXJkID0gcmVxdWlyZShcIi4vZ2FtZWJvYXJkXCIpO1xuY29uc3Qgc2hpcCA9IHJlcXVpcmUoXCIuL3NoaXBcIik7XG5jb25zdCBjcHUgPSByZXF1aXJlKFwiLi9jcHVQbGF5ZXJcIik7XG5jb25zdCB1aVNjcmlwdCA9IHJlcXVpcmUoXCIuL3VpXCIpO1xuXG5jb25zdCBnYW1lTW9kdWxlID0gKCkgPT4ge1xuICAvLyB0ZW1wb3JhcnkgaW5pdGlhbGl6ZXJzIHRoYXQgd2lsbCBiZSB3cmFwcGVkIGluIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGFzc2lnbiBnYW1lIGVsZW1lbnRzXG4gIC8vIHRoZSBnYW1lIGluaXRpYWxpemVyIHdpbGwgdXNlIHRoaXMgZnVuY3Rpb24gZm9yIGNvbm5lY3RpbmcgY3B1IEFJIHRvIG90aGVyIGZ1bmN0aW9uc1xuICBjb25zdCBjcHVQbGF5ZXJXcmFwcGVyID0gKHBsYXllckNsYXNzLCBjcHVBSSwgZW5lbXlCb2FyZCkgPT4ge1xuICAgIC8vIHRoaXMgd3JhcHBlciB3aWxsIG5lZWQgdG8gYmUgcmVmYWN0b3JlZCBhZnRlciBjaGFuZ2VzIHRvIHBsYXllciBjbGFzc1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIHdoaWxlIChwbGF5ZXJDbGFzcy5jYW5TdHJpa2UobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyaWtlUmVzdWx0ID0gcGxheWVyQ2xhc3MuYXR0YWNrKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0ICE9PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRIaXQobmV4dFN0cmlrZSk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9IGVsc2UgaWYgKHN0cmlrZVJlc3VsdCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0TWlzcygpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgLi4ucGxheWVyQ2xhc3MucGxheWVyT2JqLFxuICAgICAgYXR0YWNrLFxuICAgICAgcGxheWVyQm9hcmQ6IHBsYXllckNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgaXNDUFU6IHBsYXllckNsYXNzLmlzQ1BVLFxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGxheWVySW5pdGlhbGl6ZXIocGxheWVyT2JqKSB7XG4gICAgaWYgKHBsYXllck9iai5udW1iZXIgPT09IDEpIHtcbiAgICAgIHBsYXllcjEgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGxheWVyMiA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBQbGFjZXJQcm94eShcbiAgICBudW1iZXIsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGNoZWNrb25seSA9IGZhbHNlLFxuICApIHtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsIHx8IGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB3aWxsIG1ha2UgYW5kIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgcGxheWVyID0gbnVtYmVyID09PSAxID8gcGxheWVyMSA6IHBsYXllcjI7XG4gICAgLy8gZmlyc3QgY2hlY2sgdGhlIGNvb3JkaW5hdGVzXG4gICAgLy8gdGhlbiBtYWtlIHRoZSBzaGlwXG4gICAgLy8gdGhlbiBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IGNhbkZpdCA9IHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwRml0cyhcbiAgICAgIGxlbmd0aCxcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgKTtcbiAgICBpZiAoIWNhbkZpdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrb25seSkge1xuICAgICAgY29uc3QgbmV3U2hpcCA9IHNoaXAobGVuZ3RoKTtcbiAgICAgIHBsYXllci5wbGF5ZXJCb2FyZC5hZGRTaGlwKG5ld1NoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEdyaWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gZ2FtZUxvb3AoKSB7XG4gICAgLy8gd2hpbGUgZ2FtZSBpcyBub3Qgb3ZlclxuICAgIC8vIGNhbGwgdWkgc3RyaWtlc2NyZWVuIGZvciBjdXJyZW50IHBsYXllciBpZiBpdHMgYSBwZXJzb25cbiAgICB3aGlsZSAoZ2FtZU92ZXIgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoIWN1cnJlbnRQbGF5ZXIuaXNDcHUpIHtcbiAgICAgICAgY29uc3QgY29vcmQgPSBhd2FpdCB1aS5zdHJpa2VTY3JlZW4oY3VycmVudFBsYXllci5udW1iZXIpO1xuICAgICAgICBnYW1lVHVybihjb29yZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnYW1lVHVybigpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBjYWxsIHVpIGZuIHRoYXQgd2lsbCBlbmQgdGhlIGdhbWVcbiAgICAvLyB1aSBzaG91bGQgYWxsb3cgdGhlbSB0byByZXNldCB0aGUgZ2FtZS5cbiAgICAvLyBjYWxsIGluZGV4IGZuIHRoYXQgd2lsbCB0aGUgZ2FtZVxuICB9XG5cbiAgZnVuY3Rpb24gZ2FtZUluaXRpYWxpemVyKCkge1xuICAgIC8vIGFmdGVyIGFkZGluZyB0aGUgc2hpcHMgLCBpdCB3aWxsIG5lZWQgdG8gY2hlY2sgd2hvIGlzIGNwdSBhbmQgaW5pdGlhbGl6ZSB0aGUgY3B1d3JhcHBlclxuXG4gICAgaWYgKHBsYXllcjEuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjEgfTtcbiAgICAgIHBsYXllcjEgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIyLnBsYXllckJvYXJkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllcjIuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjIgfTtcbiAgICAgIHBsYXllcjIgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIyLnBsYXllckJvYXJkKTtcbiAgICB9XG5cbiAgICAvLyB3aWxsIGluaXRpYWxpemUgdGhlIGdhbWUgbG9vcCBmbiB0aGF0IHdpbGwgY2FsbCB1aSBmb3Igc3RyaWtlIHNjcmVlbnNcbiAgICAvLyBjcHUgdHVybnMgd2lsbCBiZSBoYW5kbGVkIGJ5IGdhbWVsb29wIGF1dG9tYXRpY2FsbHlcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcblxuICAvLyB0aGlzIGluaXRpYWxpemVzIGJ1dCB0aGUgZ2FtZSBsb29wIHBpY2tzIGJhY2sgdXAgd2hlbiB1aSBzY3JpcHQgY2FsbHMgZ2FtZWluaXRpYWxpemVyO1xuICBsZXQgcGxheWVyMSA9IHVuZGVmaW5lZDtcbiAgbGV0IHBsYXllcjIgPSB1bmRlZmluZWQ7XG4gIHVpLnN0YXJ0U2NyZWVuKCk7XG4gIGNvbnN0IGNwdUFJID0gY3B1KCk7XG5cbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIC8vICBjb25zdCBwbGF5ZXIxID0gcGxheWVyKFwiRGtcIiwgZ2FtZUJvYXJkKCkpO1xuICAvLyAgbGV0IHBsYXllcjIgPSBjcHVQbGF5ZXJXcmFwcGVyKFxuICAvLyAgICBwbGF5ZXIoXCJVS1wiLCBnYW1lQm9hcmQoKSwgdHJ1ZSksXG4gIC8vICAgIGNwdUFJLFxuICAvLyAgICBwbGF5ZXIxLnBsYXllckJvYXJkLFxuICAvLyAgKTtcbiAgbGV0IGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG4gIC8vIGdhbWVUdXJuIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVUdXJuKGNvb3JkaW5hdGVzID0gXCJcIikge1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFBsYXllciA9PT0gcGxheWVyMSkge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcGxheWVyMS5hdHRhY2soY29vcmRpbmF0ZXMsIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgICAgLy8gcmV0dXJuIHZhbHVlIGFueXRoaW5nIG90aGVyIHRoYW4gbnVtID0gcGxheWVyIGxvc2VzXG4gICAgICBpZiAoaXNOYU4ocGxheWVyMi5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpKSkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHBsYXllcjEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjI7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIyKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwbGF5ZXIyLmF0dGFjayhjb29yZGluYXRlcywgcGxheWVyMS5wbGF5ZXJCb2FyZCk7XG4gICAgICAvLyBjaGVjayB0aGlzIGxpbmUgZm9yIGVycm9ycywgdGhpcyB3YXMgcmVmYWN0b3JlZCBkaWZmZXJlbnRseVxuICAgICAgaWYgKGlzTmFOKHBsYXllcjEucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSkpIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwbGF5ZXIxKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFBsYXllci5pc0NQVSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGdhbWVUdXJuKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzR2FtZU92ZXIoKSB7XG4gICAgcmV0dXJuIGdhbWVPdmVyO1xuICB9XG4gIHJldHVybiB7IGdhbWVUdXJuLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKHBsYXllck9iaiwgYm9hcmRGbikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG4gIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGlmIChjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpKSB7XG4gICAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIFwidHJ5IGFub3RoZXIgYXR0YWNrXCI7XG4gIH1cblxuICByZXR1cm4geyAuLi5wbGF5ZXJPYmosIHBsYXllckJvYXJkLCBjYW5TdHJpa2UsIGF0dGFjaywgaXNDUFUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxheWVyO1xuXG4vLyB0aGUgYXR0YWNrIGZuIGFzIG9mIG5vdyBkb2VzIG5vdCB3b3JrIHdlbGwgd2l0aCBjcHUgcGxheWVyIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byByZWdlbmVyYXRlIGFub3RoZXIgbW92ZSB3aXRob3V0IGxlYXZpbmcgaXRzIGN1cnJlbnQgc2NvcGVcbiIsIi8vIHNoaXBzIHNob3VsZCBoYXZlIHRoZSBjaG9pY2Ugb2Y6XG4vLyA1IG1hbi1vLXdhclxuLy8gNCBmcmlnYXRlXG4vLyAzIHggMyBzY2hvb25lclxuLy8gMiB4IDIgcGF0cm9sIHNsb29wXG5jb25zdCBzaGlwID0gKGxlbmd0aCkgPT4ge1xuICBsZXQgdHlwZSA9IFwiXCI7XG4gIGxldCBkYW1hZ2UgPSAwO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIHJldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHsgdHlwZSwgbGVuZ3RoLCBkYW1hZ2UsIGhpdHBvaW50cywgaGl0LCBpc1N1bmsgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICAvLyBwbGF5ZXIgaXMgZWl0aGVyIFwiY3B1XCIgb3IgXCJwZXJzb25cIlxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW1xuICAgICAgICBtYW5vd2FyLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzbG9vcCxcbiAgICAgICAgc2xvb3AsXG4gICAgICBdLFxuICAgIH07XG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IFtdO1xuXG4gICAgcmFuY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuXG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIHJhbmNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIC8vIG5lZWQgYXN5bmMgZnVuY3Rpb24gdG8gd2FpdCBmb3IgZWFjaCBwbGF5ZXIgc2hpcCBzZWxlY3Rpb24gdG8gYmUgcmVzb2x2ZWQgYmVmb3JlIG1vdmluZyBvbiB0byB0aGUgbmV4dCBvbmVcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIC8vIGNsZWFyIHBhZ2UgY29udGFpbmVyIGFuZCBwb3B1bGF0ZSB3aXRoIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IG1hblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgZnJpZ1wiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIzXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzY2hvb25cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2xvb3BcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgZHJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuICAgICAgY29uc29sZS5sb2coYHRoZSBjdXJyZW50IHBsYXllciBpczogJHtwbGF5ZXJPYmoubnVtYmVyfWApO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dDb250XCIpO1xuICAgICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LmMgPSBqO1xuICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY3ljbGUgc2hpcCBwbGFjZW1lbnQgb3JpZW50YXRpb24sIGluaXRpYWxpemVkIHRvIFwiaFwiXG4gICAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgICBvcmllbnRhdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIkhvcml6b250YWxcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGdyaWRTaGFkZXIgPSAoXG4gICAgICAgIGNvb3JkLFxuICAgICAgICBsZW5ndGgsXG4gICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgcGxhY2VkID0gZmFsc2UsXG4gICAgICApID0+IHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ciA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgICAgICBjb25zdCBvZmZzZXRjID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgICAgIGxldCBhZGRlZENsYXNzID0gXCJcIjtcblxuICAgICAgICAvLyAzIHNoYWRpbmcgcG9zc2libGl0aWVzIGZpdHMvbm9maXRzL3BsYWNlZFxuICAgICAgICBpZiAocGxhY2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkZWRDbGFzcyA9IFwicGxhY2VkXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkZWRDbGFzcyA9IGRyYWdGaXRzID09PSB0cnVlID8gXCJmaXRzXCIgOiBcIm5vdEZpdHNcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb29yZCA9IFsuLi5jb29yZF07XG4gICAgICAgIGxldCBjZWxsQ29sbGVjdGlvbiA9IFtdO1xuXG4gICAgICAgIC8vIHNoYWRlIGVhY2ggY2VsbCByZXByZXNlbnRpbmcgc2hpcCBsZW5ndGhcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgIGBbZGF0YS1yPVwiJHtjdXJyZW50Q29vcmRbMF19XCJdW2RhdGEtYz1cIiR7Y3VycmVudENvb3JkWzFdfVwiXWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjZWxsQ29sbGVjdGlvbi5wdXNoKGN1cnJlbnRDZWxsKTtcblxuICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChgJHthZGRlZENsYXNzfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudENvb3JkWzBdICs9IG9mZnNldHI7XG4gICAgICAgICAgY3VycmVudENvb3JkWzFdICs9IG9mZnNldGM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWZ0ZXIgc2hhZGUsIGRyYWdsZWF2ZSBoYW5kbGVyIHRvIGNsZWFyIHNoYWRpbmcgd2hlbiBub3QgcGxhY2VkXG4gICAgICAgIGNvbnN0IGZpcnN0Q2VsbCA9IGNlbGxDb2xsZWN0aW9uWzBdO1xuICAgICAgICBpZiAoZmlyc3RDZWxsID09PSBudWxsIHx8IGZpcnN0Q2VsbCA9PT0gdW5kZWZpbmVkIHx8IHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmaXJzdENlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBjZWxsQ29sbGVjdGlvbi5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBsZWF2ZVNjcmVlbigpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2VsbFwiKTtcbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGUgb24gYSBkcmFnb3ZlciBldmVudFxuICAgICAgLy8gY2hlY2tzIGlmIHRoZSBzaGlwIGRyYWdnZWQgd2lsbCBmaXRcbiAgICAgIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAgICAgY29uc3QgZHJhZ092ZXJIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZ1NoaXBMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtb3VzZW92ZXJcIik7XG5cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coYGNvb3JkIHBvc3Qgc2hpcG1ha2VyOiAke2Nvb3JkfWApO1xuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3IgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBub3QgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibW91c2VvdmVyXCIpO1xuICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICAgIHNoaXBJTUcuY2xhc3NMaXN0LmFkZChcInNoaXBJTUdcIik7XG4gICAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgY29uc3Qgc2hpcERyYWdIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG5cbiAgICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgY29uc3QgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKHBsYWNlZCkge1xuICAgICAgICAgICAgICBncmlkU2hhZGVyKGNvb3JkLCBkcmFnU2hpcExlbmd0aCwgb3JpZW50YXRpb24sIGRyYWdGaXRzLCB0cnVlKTtcblxuICAgICAgICAgICAgICBsZXQgcmVtYWluaW5nU2hpcHMgPSBcIlwiO1xuXG4gICAgICAgICAgICAgIHN3aXRjaCAoZHJhZ1NoaXBMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IG1vd0NvdW50O1xuICAgICAgICAgICAgICAgICAgbW93Q291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBmcmlnQ291bnQ7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNjaG9vbkNvdW50O1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzbG9vcENvdW50O1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogaW52YWxpZCBzaGlwIGxlbmd0aCBpbiBkcmFnU2hpcFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyAtPSAxO1xuXG4gICAgICAgICAgICAgIGlmIChyZW1haW5pbmdTaGlwcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZGVwbGV0ZWRcIik7XG4gICAgICAgICAgICAgICAgc2hpcC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIHNoaXBEcmFnSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgc2hpcC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBtb3dDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBmcmlnQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2Nob29uQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2xvb3BDb3VudCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIG5leHRCdG4udGV4dENvbnRlbnQgPSBcIk5leHRcIjtcbiAgICAgICAgICAgIHBhZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQobmV4dEJ0bik7XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcInRoZXJlIHNob3VsZCBiZSBzb21lIHJlc29sdmluZyBvZiBwcm9taXNlcyBoYXBwZW5pbmcgcmlnaHQgbm93XCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgYXN5bmMgZnVuY3Rpb24gc3RyaWtlU2NyZWVuKHBsYXllck51bWJlcikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYHRoaXMgaXMgYmVpbmcgY2FsbGVkIGZyb20gc3RyaWtlIHNjcmVlbiBmb3IgcGxheWVyICR7cGxheWVyTnVtYmVyfWAsXG4gICAgKTtcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBzdGFydFNjcmVlbigpIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPkJhdHRsZXNoaXA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllclNlbGVjdENvbnRcIj5cbiAgICAgICAgICAgICAgICAgPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJwbGF5ZXJGb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAxXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAxXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDFcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDJcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMlwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG5Db250XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkJlZ2luPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJGb3JtXCIpO1xuICAgIGluaXRDb3VudHJ5U2VsZWN0KCk7XG4gICAgcGxheWVyRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBwbGF5ZXJzID0gcE9iakluaXRpYWxpemVyKFwiLnBsYXllckZvcm1cIiwgXCJzZWxlY3RwMVwiLCBcInNlbGVjdHAyXCIpO1xuICAgICAgLy8gcGxheWVyb2JqIHNlbnQgYmFjayB0byBleHRlbmQgZnVuY3Rpb25hbGl0eSB3aXRoIHBsYXllciBzY3JpcHRcbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHBsYXllcnMpIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC5wbGF5ZXIgPT09IFwicGVyc29uXCIpIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBhd2FpdCBzaGlwU2NyZWVuKGVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgc2hpcFJhbmRvbWl6ZXIoZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKTtcbiAgICAgIC8vIGluZGV4IGdsb2JhbCB2YXJpYWJsZXMgc2hvdWxkIGJlIHBvcHVsYXRlZCB3aXRoIGJvdGggcGxheWVyc1xuICAgICAgLy8gY2FsbCB0byBjb250aW51ZSBnYW1lIHNob3VsZCBoYXZlIGluZGV4IGFjY2Vzc2luZyBnbG9iYWwgcGxheWVyXG4gICAgICAvLyBvYmpzIGFuZCBzaG91bGQgd29yayBmaW5lLiBidXQgaXQgaXMga2luZGEgc2xvcHB5XG4gICAgICAvLyB0aGlzIHBhc3NlcyBvdmVyIGNvbnRyb2wgYmFjayB0byB0aGUgaW5kZXggc2NyaXB0LlxuICAgICAgZ2FtZUluaXRTY3JpcHQoKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4geyBzdGFydFNjcmVlbiwgcE9iakluaXRpYWxpemVyLCBzdHJpa2VTY3JlZW4gfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXNlckludGVyZmFjZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==