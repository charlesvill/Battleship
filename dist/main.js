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
  // the game initializer will use this function to build the player element for cpu
  const cpuPlayerWrapper = (playerClass, cpuAI, enemyBoard) => {
    playerClass.isCPU = true;
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
      attack,
      isCPU: playerClass.isCPU,
      playerBoard: playerClass.playerBoard,
    };
  };

  function playerInitializer(playerObj) {
    const isCPU = playerObj.player === "person" ? false : true;

    if (playerObj.number === 1) {
      player1 = player(playerObj.country, gameBoard(), isCPU);
    } else {
      player2 = player(playerObj.country, gameBoard(), isCPU);
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

  function gameInitializer() {
    // this will add the ships to the board;
    // after adding the ships , it will need to check who is cpu and initialize the cpuwrapper
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);
  ui.startScreen();
  let player1 = undefined;
  let player2 = undefined;
  const cpuAI = cpu();
  //  const sloopP1 = ship(2);
  //  const frigateP1 = ship(4);
  //  const sloopP2 = ship(2);
  //  const frigateP2 = ship(4);
  let gameOver = false;
  //  const p1 = player("Dk", gameBoard());
  //  let p2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    p1.playerBoard,
  //  );
  // let currentPlayer = p1;
  //  p1.playerBoard.addShip(sloopP1, [2, 4], "h");
  //  p1.playerBoard.addShip(sloopP1, [6, 4], "h");
  //  p1.playerBoard.addShip(frigateP1, [3, 2], "v");
  //  p2.playerBoard.addShip(sloopP2, [2, 4], "h");
  //  p2.playerBoard.addShip(sloopP2, [8, 4], "h");
  //  p2.playerBoard.addShip(frigateP2, [1, 2], "v");

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
  }
  // gameLoop is called by event handler on UI interaction -or- by recursion when its cpu turn
  function gameLoop(coordinates = "") {
    if (gameOver) {
      return endGame();
    }

    if (currentPlayer === p1) {
      const strike = p1.attack(coordinates, p2.playerBoard);
      if (isNaN(p2.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p2;
    } else if (currentPlayer === p2) {
      const strike = p2.attack(coordinates, p1.playerBoard);
      if (p1.playerBoard.shipsRemaining() === 0) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p1;
    }
    if (currentPlayer.isCPU === true) {
      return gameLoop();
    }
  }
  function isGameOver() {
    return gameOver;
  }
  return { gameLoop, isGameOver };
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

const player = (nationality, boardFn, isCPU = "false") => {
  const playerBoard = boardFn;

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

  return { nationality, playerBoard, canStrike, attack, isCPU };
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
  function pObjInitializer(gameScriptFn, formClssNme, p1selectid, p2selectid) {
    const playerForm = document.querySelector(formClssNme);
    const dropdownfield1 = document.getElementById(p1selectid);
    const dropdownfield2 = document.getElementById(p2selectid);
    let players = [];

    const manowar = 5;
    const frigate = 4;
    const schooner = 3;
    const sloop = 2;

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
          console.log(`coord before proxy: ${coord}`);
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
            console.log(`coord before placing is : ${coord}`);
            const placed = shipMakerProxy(
              playerObj.number,
              dragShipLength,
              coord,
              orientation,
              false,
            );

            console.log(`coord after placing is : ${coord}`);
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
  async function startScreen(gameScriptFn) {
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
    playerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const players = pObjInitializer(
        gameScriptFn,
        ".playerForm",
        "selectp1",
        "selectp2",
      );
      async function processPlayers(players) {
        for (const element of players) {
          if (element.player === "person") {
            playerInitScript(element);
            console.log("player screen being opened");
            await shipScreen(element);
          } else {
            playerInitScript(element);
            shipRandomizer(element);
          }
        }
      }
      processPlayers(players);
    });
  }
  return { startScreen, pObjInitializer };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUM1SUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYOztBQUVBOztBQUVBOzs7Ozs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjLE1BQU0sV0FBVyxhQUFhO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7Ozs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixzQkFBc0I7O0FBRXRCO0FBQ0E7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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUM1ZEE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvY3B1UGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMgZm9yIGNwdSBwbGF5ZXIgd2lsbCBiZSBwbGFjZWQgaW4gcGxheWVyLnRlc3QuanNcbi8vIGhpdCBib29sIG1pZ2h0IG5vdCBwbGF5IGEgcm9sZSwgcmVtZW1iZXIgdG8gZGVsZXRlIGlmIG5vIHJvbGUuXG5jb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgLy8gd2lsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbGVnYWwgbW92ZSAtPiBkZXBlbmRlbmN5IGluamVjdGlvbiBmcm9tIGdhbWVib2FyZCBzY3JpcHRcbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgLy8gd2lsbCBuZWVkIHRvIGd1ZXNzIG5leHQgb25lIHVudGlsIHlvdSBoYXZlIGEgbGVnYWwgb25lIHRoYXQgaGFzbnQgYmVlbiB1c2VkIHlldFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGxldCBpbmxpbmVTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG5cbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IFwiaFwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH0gZWxzZSBpZiAocHVyc3VpdEF4aXMgPT09IFwidlwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMF0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlubGluZU1vdmUoKSB7XG4gICAgLy8gZmluZHMgdGhlIGF4aXMgYnkgY29tcGFyaW5nIGhpdHMgYW5kIGNhbGxzIGFuIGlubGluZSBndWVzc1xuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgW2MxLCBjMl0gPSBoaXRBcnI7XG4gICAgICBpZiAoYzFbMF0gPT09IGMyWzBdICYmIGMxWzFdICE9PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwiaFwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9IGVsc2UgaWYgKGMxWzBdICE9PSBjMlswXSAmJiBjMVsxXSA9PT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcInZcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RyZWFrID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbMF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBtb2RlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH1cbiAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCkge1xuICAgIHN0cmVhayA9IGZhbHNlO1xuICB9XG4gIC8vIHJlcG9ydCBtaXNzIGZ1bmN0aW9uP1xuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuXG4vLyBhdHRhY2sgb24gcGxheWVyIGNsYXNzIGFjY2VwdHMgYSBjb29yZGluYXRlIHBhaXIuIGhvdyB0aGF0IHBhaXIgZ2V0cyBmb3JtdWxhdGVkIGRvZXMgbm90IG1hdHRlclxuLy8gaGF2ZSBhIGdlbmVyYWwgbmV4dE1vdmUgZnVuY3Rpb24gdGhhdCB3aWxsIGludGVsbGlnZW50bHkgZGV0ZXJtaW5lIHdoYXQgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWRcbi8vIGFjY29yZGluZyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiBoaXRzLlxuLy8gdGhlIGluZm9ybWF0aW9uIHlvdSB3b3VsZCBuZWVkIHJlY29yZCB3aGVuIHlvdSBoYXZlIHR3byBoaXRzLiBpZiB5b3UgaGF2ZSB0d28gaGl0cyB5b3UgbmVlZCB0byBmaWd1cmUgb3V0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGF0IHNoaXAgYW5kIHJlcGVhdGVkbHkgKGxvb3ApIHN0cmlrZSBpbmxpbmUgdW50aWwgdGhlcmUgaXMgYSBzdW5rIHNoaXAuXG4vL1xuLy8gY29uY2x1c2lvbjogdGhlcmUgZGVmaW5pdGVseSBuZWVkcyB0byBiZSBhIHdheSBmb3IgdGhlIGdhbWVib2FyZCB0byBjb21tdW5pY2F0ZSBiYWNrIHRvIHRoZSBjcHUgc2NyaXB0LlxuLy9cbi8vIGNhbGxiYWNrIGZucyB0aGF0IGNoZWNrIG9uIGVhY2ggbW92ZT8gb3IgaXMgaXQgZmVkIHRvIHRoZSBjcHUgc2NyaXB0IGJ5IHRoZSBnYW1lbG9vcD9cbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGNvcHlDb29yZCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgbGV0IHIgPSBjb3B5Q29vcmRbMF07XG4gICAgbGV0IGMgPSBjb3B5Q29vcmRbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNoaXBmaXQgbGVuZ3RoIHVuZGVmaW5lZFwiKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMCwgMV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBzaGlwIGRpZCBub3QgZml0XCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3JpZW50YXRpb24gPT09IFwidlwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzEsIDBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCBbciwgY10gPSBjb29yZGluYXRlcztcbiAgICBjb25zdCBzdHJpa2VTcXVhcmUgPSBhdHRhY2tzUmVjZWl2ZWRbcl1bY107XG5cbiAgICByZXR1cm4gc3RyaWtlU3F1YXJlID09PSBudWxsID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcykge1xuICAgIGNvbnN0IHIgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjID0gY29vcmRpbmF0ZXNbMV07XG5cbiAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHNoaXAgPSBzaGlwR3JpZFtyXVtjXTtcbiAgICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDE7XG4gICAgICBjb25zdCBoaXRSZXBvcnQgPSBzaGlwLmhpdCgpO1xuXG4gICAgICBpZiAoc2hpcC5pc1N1bmsoKSA9PT0gdHJ1ZSkge1xuICAgICAgICBzaGlwcyA9IHNoaXBzLmZpbHRlcigoZWxlbWVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50ICE9PSBzaGlwO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gZnVuY3Rpb24gdGhhdCByZXBvcnRzIGlmIHRoZXJlIGFyZSBzaGlwcyByZW1haW5pbmcuXG4gICAgICAgIHJldHVybiBgJHtzaGlwLnR5cGV9IGhhcyBiZWVuIHN1bmtgO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpdFJlcG9ydDtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMDtcbiAgICByZXR1cm4gXCJtaXNzXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwc1JlbWFpbmluZygpIHtcbiAgICByZXR1cm4gc2hpcHMubGVuZ3RoID4gMCA/IHNoaXBzLmxlbmd0aCA6IFwiQWxsIHNoaXBzIGhhdmUgc3Vua1wiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzaGlwR3JpZCxcbiAgICBhdHRhY2tzUmVjZWl2ZWQsXG4gICAgc2hpcHMsXG4gICAgc2hpcEZpdHMsXG4gICAgYWRkU2hpcCxcbiAgICBjYW5TdHJpa2UsXG4gICAgcmVjZWl2ZUF0dGFjayxcbiAgICBzaGlwc1JlbWFpbmluZyxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2FtZUJvYXJkO1xuIiwiLy8gaW5kZXggaG91c2VzIHRoZSBkcml2ZXIgY29kZSBpbmNsdWRpbmcgdGhlIGdhbWUgbG9vcFxuY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuY29uc3QgZ2FtZUJvYXJkID0gcmVxdWlyZShcIi4vZ2FtZWJvYXJkXCIpO1xuY29uc3Qgc2hpcCA9IHJlcXVpcmUoXCIuL3NoaXBcIik7XG5jb25zdCBjcHUgPSByZXF1aXJlKFwiLi9jcHVQbGF5ZXJcIik7XG5jb25zdCB1aVNjcmlwdCA9IHJlcXVpcmUoXCIuL3VpXCIpO1xuXG5jb25zdCBnYW1lTW9kdWxlID0gKCkgPT4ge1xuICAvLyB0ZW1wb3JhcnkgaW5pdGlhbGl6ZXJzIHRoYXQgd2lsbCBiZSB3cmFwcGVkIGluIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGFzc2lnbiBnYW1lIGVsZW1lbnRzXG4gIC8vIHRoZSBnYW1lIGluaXRpYWxpemVyIHdpbGwgdXNlIHRoaXMgZnVuY3Rpb24gdG8gYnVpbGQgdGhlIHBsYXllciBlbGVtZW50IGZvciBjcHVcbiAgY29uc3QgY3B1UGxheWVyV3JhcHBlciA9IChwbGF5ZXJDbGFzcywgY3B1QUksIGVuZW15Qm9hcmQpID0+IHtcbiAgICBwbGF5ZXJDbGFzcy5pc0NQVSA9IHRydWU7XG4gICAgZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgbGV0IG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG5cbiAgICAgIGlmIChzdHJpa2VSZXN1bHQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBhdHRhY2ssXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwbGF5ZXJJbml0aWFsaXplcihwbGF5ZXJPYmopIHtcbiAgICBjb25zdCBpc0NQVSA9IHBsYXllck9iai5wbGF5ZXIgPT09IFwicGVyc29uXCIgPyBmYWxzZSA6IHRydWU7XG5cbiAgICBpZiAocGxheWVyT2JqLm51bWJlciA9PT0gMSkge1xuICAgICAgcGxheWVyMSA9IHBsYXllcihwbGF5ZXJPYmouY291bnRyeSwgZ2FtZUJvYXJkKCksIGlzQ1BVKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGxheWVyMiA9IHBsYXllcihwbGF5ZXJPYmouY291bnRyeSwgZ2FtZUJvYXJkKCksIGlzQ1BVKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUGxhY2VyUHJveHkoXG4gICAgbnVtYmVyLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBjaGVja29ubHkgPSBmYWxzZSxcbiAgKSB7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCB8fCBsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gd2lsbCBtYWtlIGFuZCBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IHBsYXllciA9IG51bWJlciA9PT0gMSA/IHBsYXllcjEgOiBwbGF5ZXIyO1xuICAgIC8vIGZpcnN0IGNoZWNrIHRoZSBjb29yZGluYXRlc1xuICAgIC8vIHRoZW4gbWFrZSB0aGUgc2hpcFxuICAgIC8vIHRoZW4gcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBjYW5GaXQgPSBwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEZpdHMoXG4gICAgICBsZW5ndGgsXG4gICAgICBjb29yZGluYXRlcyxcbiAgICAgIG9yaWVudGF0aW9uLFxuICAgICk7XG4gICAgaWYgKCFjYW5GaXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFjaGVja29ubHkpIHtcbiAgICAgIGNvbnN0IG5ld1NoaXAgPSBzaGlwKGxlbmd0aCk7XG4gICAgICBwbGF5ZXIucGxheWVyQm9hcmQuYWRkU2hpcChuZXdTaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyLnBsYXllckJvYXJkLnNoaXBHcmlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdhbWVJbml0aWFsaXplcigpIHtcbiAgICAvLyB0aGlzIHdpbGwgYWRkIHRoZSBzaGlwcyB0byB0aGUgYm9hcmQ7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG4gIHVpLnN0YXJ0U2NyZWVuKCk7XG4gIGxldCBwbGF5ZXIxID0gdW5kZWZpbmVkO1xuICBsZXQgcGxheWVyMiA9IHVuZGVmaW5lZDtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgLy8gIGNvbnN0IHNsb29wUDEgPSBzaGlwKDIpO1xuICAvLyAgY29uc3QgZnJpZ2F0ZVAxID0gc2hpcCg0KTtcbiAgLy8gIGNvbnN0IHNsb29wUDIgPSBzaGlwKDIpO1xuICAvLyAgY29uc3QgZnJpZ2F0ZVAyID0gc2hpcCg0KTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIC8vICBjb25zdCBwMSA9IHBsYXllcihcIkRrXCIsIGdhbWVCb2FyZCgpKTtcbiAgLy8gIGxldCBwMiA9IGNwdVBsYXllcldyYXBwZXIoXG4gIC8vICAgIHBsYXllcihcIlVLXCIsIGdhbWVCb2FyZCgpLCB0cnVlKSxcbiAgLy8gICAgY3B1QUksXG4gIC8vICAgIHAxLnBsYXllckJvYXJkLFxuICAvLyAgKTtcbiAgLy8gbGV0IGN1cnJlbnRQbGF5ZXIgPSBwMTtcbiAgLy8gIHAxLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMSwgWzIsIDRdLCBcImhcIik7XG4gIC8vICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDEsIFs2LCA0XSwgXCJoXCIpO1xuICAvLyAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChmcmlnYXRlUDEsIFszLCAyXSwgXCJ2XCIpO1xuICAvLyAgcDIucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAyLCBbMiwgNF0sIFwiaFwiKTtcbiAgLy8gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMiwgWzgsIDRdLCBcImhcIik7XG4gIC8vICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKGZyaWdhdGVQMiwgWzEsIDJdLCBcInZcIik7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gIH1cbiAgLy8gZ2FtZUxvb3AgaXMgY2FsbGVkIGJ5IGV2ZW50IGhhbmRsZXIgb24gVUkgaW50ZXJhY3Rpb24gLW9yLSBieSByZWN1cnNpb24gd2hlbiBpdHMgY3B1IHR1cm5cbiAgZnVuY3Rpb24gZ2FtZUxvb3AoY29vcmRpbmF0ZXMgPSBcIlwiKSB7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwMSkge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcDEuYXR0YWNrKGNvb3JkaW5hdGVzLCBwMi5wbGF5ZXJCb2FyZCk7XG4gICAgICBpZiAoaXNOYU4ocDIucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSkpIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcDI7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwMikge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcDIuYXR0YWNrKGNvb3JkaW5hdGVzLCBwMS5wbGF5ZXJCb2FyZCk7XG4gICAgICBpZiAocDEucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSA9PT0gMCkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHAxKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwMTtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRQbGF5ZXIuaXNDUFUgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBnYW1lTG9vcCgpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpc0dhbWVPdmVyKCkge1xuICAgIHJldHVybiBnYW1lT3ZlcjtcbiAgfVxuICByZXR1cm4geyBnYW1lTG9vcCwgaXNHYW1lT3ZlciB9O1xufTtcbmdhbWVNb2R1bGUoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZU1vZHVsZTtcbiIsIi8vIHRoaXMgd2lsbCBkZW1vbnN0cmF0ZSBkZXBlbmRlbmN5IGluamVjdGlvbiB3aXRoIHRoZSBuZWVkZWQgbWV0aG9kcyBmb3IgdGhlIHBsYXllciBib2FyZCBhbmQgZW5lbXkgYm9hcmQgcmVmXG5cbmNvbnN0IHBsYXllciA9IChuYXRpb25hbGl0eSwgYm9hcmRGbiwgaXNDUFUgPSBcImZhbHNlXCIpID0+IHtcbiAgY29uc3QgcGxheWVyQm9hcmQgPSBib2FyZEZuO1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IG5hdGlvbmFsaXR5LCBwbGF5ZXJCb2FyZCwgY2FuU3RyaWtlLCBhdHRhY2ssIGlzQ1BVIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXllcjtcblxuLy8gdGhlIGF0dGFjayBmbiBhcyBvZiBub3cgZG9lcyBub3Qgd29yayB3ZWxsIHdpdGggY3B1IHBsYXllciBiZWNhdXNlIGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gcmVnZW5lcmF0ZSBhbm90aGVyIG1vdmUgd2l0aG91dCBsZWF2aW5nIGl0cyBjdXJyZW50IHNjb3BlXG4iLCIvLyBzaGlwcyBzaG91bGQgaGF2ZSB0aGUgY2hvaWNlIG9mOlxuLy8gNSBtYW4tby13YXJcbi8vIDQgZnJpZ2F0ZVxuLy8gMyB4IDMgc2Nob29uZXJcbi8vIDIgeCAyIHBhdHJvbCBzbG9vcFxuY29uc3Qgc2hpcCA9IChsZW5ndGgpID0+IHtcbiAgbGV0IHR5cGUgPSBcIlwiO1xuICBsZXQgZGFtYWdlID0gMDtcblxuICBzd2l0Y2ggKGxlbmd0aCkge1xuICAgIGNhc2UgMjpcbiAgICAgIHR5cGUgPSBcIlBhdHJvbCBTbG9vcFwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgdHlwZSA9IFwiU2Nob29uZXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIHR5cGUgPSBcIkZyaWdhdGVcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNTpcbiAgICAgIHR5cGUgPSBcIk1hbi1vLVdhclwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNoaXAgdHlwZSBleGNlcHRpb246IGxlbmd0aCBtdXN0IGJlIDEtNVwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpdCgpIHtcbiAgICBkYW1hZ2UrKztcbiAgICByZXR1cm4gYCR7dHlwZX0gd2FzIGhpdC4gJHtoaXRwb2ludHMoKX0gaGl0cG9pbnRzIHJlbWFpbmluZ2A7XG4gIH1cbiAgZnVuY3Rpb24gaXNTdW5rKCkge1xuICAgIHJldHVybiBkYW1hZ2UgPj0gbGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIGhpdHBvaW50cygpIHtcbiAgICByZXR1cm4gbGVuZ3RoIC0gZGFtYWdlO1xuICB9XG4gIHJldHVybiB7IHR5cGUsIGxlbmd0aCwgZGFtYWdlLCBoaXRwb2ludHMsIGhpdCwgaXNTdW5rIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaXA7XG4iLCJjb25zdCB1c2VySW50ZXJmYWNlID0gKHNoaXBNYWtlclByb3h5LCBwbGF5ZXJJbml0U2NyaXB0LCBnYW1lSW5pdFNjcmlwdCkgPT4ge1xuICBjb25zdCBwYWdlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYWdlQ29udGFpbmVyXCIpO1xuICBsZXQgcDFDb3VudHJ5ID0gXCJcIjtcbiAgbGV0IHAyQ291bnRyeSA9IFwiXCI7XG5cbiAgZnVuY3Rpb24gaW5pdENvdW50cnlTZWxlY3QoKSB7XG4gICAgY29uc3Qgbm9kZUxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNvdW50cnlCb3hcIik7XG4gICAgbm9kZUxpc3QuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDFcIikge1xuICAgICAgICAgIHAxQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDJcIikge1xuICAgICAgICAgIHAyQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYnVpbGRzIGEgcGxheWVyb2JqIHRoYXQgY29udGFpbnMgaW5mb3JtYXRpb24gdG8gaW5pdGlhbGl6ZSB0aGUgZ2FtZVxuICBmdW5jdGlvbiBwT2JqSW5pdGlhbGl6ZXIoZ2FtZVNjcmlwdEZuLCBmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICBjb25zdCBwbGF5ZXJvYmogPSB7XG4gICAgICBwbGF5ZXI6IHVuZGVmaW5lZCxcbiAgICAgIG51bWJlcjogdW5kZWZpbmVkLFxuICAgICAgY291bnRyeTogdW5kZWZpbmVkLFxuICAgICAgc2hpcHM6IFtcbiAgICAgICAgbWFub3dhcixcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2xvb3AsXG4gICAgICAgIHNsb29wLFxuICAgICAgXSxcbiAgICB9O1xuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21Db29yZCgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuY29vcmRpbmF0ZXMgPSBbXTtcblxuICAgIHJhbmNvb3JkaW5hdGVzLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmNvb3JkaW5hdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKSB7XG4gICAgbGV0IHNoaXBBcnIgPSBbLi4ucGxheWVyT2JqLnNoaXBzXTtcblxuICAgIHNoaXBBcnIuZm9yRWFjaCgoc2hpcExlbmd0aCkgPT4ge1xuICAgICAgbGV0IHBsYWNlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKCFwbGFjZWQpIHtcbiAgICAgICAgLy8gcmFuZG9tIGRpcmVjdGlvbiBvZiBzaGlwIHBsYWNlbWVudFxuICAgICAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IHJhbmRvbUNvb3JkKCk7XG4gICAgICAgIGNvbnN0IHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgICAgICBjb25zdCBheGlzID0gcmFuZG9tID09PSAwID8gXCJoXCIgOiBcInZcIjtcblxuICAgICAgICAvLyByZXR1cm5zIGZhbHNlIGlmIHdhcyBub3QgYWJsZSB0byBwbGFjZSBzaGlwIGF0IHJhbmRvbSBzcG90LCB0cnlzIGFnYWluXG4gICAgICAgIHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgc2hpcExlbmd0aCxcbiAgICAgICAgICByYW5jb29yZGluYXRlcyxcbiAgICAgICAgICBheGlzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2hpcFNjcmVlbihwbGF5ZXJPYmopIHtcbiAgICAvLyBuZWVkIGFzeW5jIGZ1bmN0aW9uIHRvIHdhaXQgZm9yIGVhY2ggcGxheWVyIHNoaXAgc2VsZWN0aW9uIHRvIGJlIHJlc29sdmVkIGJlZm9yZSBtb3Zpbmcgb24gdG8gdGhlIG5leHQgb25lXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyBjbGVhciBwYWdlIGNvbnRhaW5lciBhbmQgcG9wdWxhdGUgd2l0aCBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2hpcFNjcmVlbkNvbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keUNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdyaWRDb250XCI+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwRGlzcGxheUNvbnRcIj5cbiAgICAgICAgICAgICAgICAgIHRoaXMgd2lsbCBiZSBhbGwgYm9hdHMgbGlzdGVkIGFuZCBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRhdGEtaW5kZXg9XCI1XCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBtYW5cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cblxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjRcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IGZyaWdcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiM1wiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2Nob29uXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiAgZGF0YS1pbmRleD1cIjJcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IHNsb29wXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvcmllbnRhdGlvbkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIm9yaWVudGF0aW9uQnRuXCIgZGF0YS1vcmllbnRhdGlvbj1cImhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEhvcml6b250YWxcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0eHRcIj5cbiAgICAgICAgICAgICAgICAgIFBsYWNlIHlvdXIgc2hpcHMhXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgIGA7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuXG4gICAgICAvLyBuZWNlc3NhcnkgZ2xvYmFscyBmb3IgbWV0aG9kcyBpbiBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZ3JpZENvbnRcIik7XG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgbGV0IGRyYWdTaGlwTGVuZ3RoID0gMDtcbiAgICAgIGxldCBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkcmFnRml0cyA9IGZhbHNlO1xuICAgICAgbGV0IG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICBsZXQgY29vcmQgPSBbXTtcbiAgICAgIGxldCBtb3dDb3VudCA9IDE7XG4gICAgICBsZXQgZnJpZ0NvdW50ID0gMjtcbiAgICAgIGxldCBzY2hvb25Db3VudCA9IDM7XG4gICAgICBsZXQgc2xvb3BDb3VudCA9IDI7XG4gICAgICBsZXQgZGVwbGV0ZWRTaGlwID0gbnVsbDtcbiAgICAgIGNvbnNvbGUubG9nKGB0aGUgY3VycmVudCBwbGF5ZXIgaXM6ICR7cGxheWVyT2JqLm51bWJlcn1gKTtcblxuICAgICAgbGV0IHNoaXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5zaGlwXCIpO1xuICAgICAgbGV0IHNoaXBDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBCb3hcIik7XG4gICAgICBsZXQgcGxheWVyTmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyTmFtZVwiKTtcbiAgICAgIGxldCBtYW5Db3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50Lm1hblwiKTtcbiAgICAgIGxldCBmcmlnQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5mcmlnXCIpO1xuICAgICAgbGV0IHNjaG9vbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQuc2Nob29uXCIpO1xuICAgICAgbGV0IHNsb29wQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zbG9vcFwiKTtcblxuICAgICAgcGxheWVyTmFtZS50ZXh0Q29udGVudCA9IGBQbGF5ZXIgJHtwbGF5ZXJPYmoubnVtYmVyfWA7XG4gICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgIC8vIGJ1aWxkIHRoZSB2aXN1YWwgZ3JpZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncmlkU2l6ZTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHJvdy5jbGFzc0xpc3QuYWRkKFwicm93Q29udFwiKTtcbiAgICAgICAgZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChyb3cpO1xuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3JpZFNpemU7IGorKykge1xuICAgICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcImNlbGxcIik7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LnIgPSBpO1xuICAgICAgICAgIGNlbGwuZGF0YXNldC5jID0gajtcbiAgICAgICAgICByb3cuYXBwZW5kQ2hpbGQoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGN5Y2xlIHNoaXAgcGxhY2VtZW50IG9yaWVudGF0aW9uLCBpbml0aWFsaXplZCB0byBcImhcIlxuICAgICAgY29uc3Qgb3JpZW50YXRpb25CdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLm9yaWVudGF0aW9uQnRuXCIpO1xuICAgICAgb3JpZW50YXRpb25CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIlZlcnRpY2FsXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJIb3Jpem9udGFsXCI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBncmlkU2hhZGVyID0gKFxuICAgICAgICBjb29yZCxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgIHBsYWNlZCA9IGZhbHNlLFxuICAgICAgKSA9PiB7XG4gICAgICAgIGNvbnN0IG9mZnNldHIgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0YyA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgICAgICBsZXQgYWRkZWRDbGFzcyA9IFwiXCI7XG5cbiAgICAgICAgLy8gMyBzaGFkaW5nIHBvc3NpYmxpdGllcyBmaXRzL25vZml0cy9wbGFjZWRcbiAgICAgICAgaWYgKHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGFkZGVkQ2xhc3MgPSBcInBsYWNlZFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZGVkQ2xhc3MgPSBkcmFnRml0cyA9PT0gdHJ1ZSA/IFwiZml0c1wiIDogXCJub3RGaXRzXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50Q29vcmQgPSBbLi4uY29vcmRdO1xuICAgICAgICBsZXQgY2VsbENvbGxlY3Rpb24gPSBbXTtcblxuICAgICAgICAvLyBzaGFkZSBlYWNoIGNlbGwgcmVwcmVzZW50aW5nIHNoaXAgbGVuZ3RoXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICBgW2RhdGEtcj1cIiR7Y3VycmVudENvb3JkWzBdfVwiXVtkYXRhLWM9XCIke2N1cnJlbnRDb29yZFsxXX1cIl1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY2VsbENvbGxlY3Rpb24ucHVzaChjdXJyZW50Q2VsbCk7XG5cbiAgICAgICAgICBpZiAoY3VycmVudENlbGwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnRDb29yZFswXSArPSBvZmZzZXRyO1xuICAgICAgICAgIGN1cnJlbnRDb29yZFsxXSArPSBvZmZzZXRjO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFmdGVyIHNoYWRlLCBkcmFnbGVhdmUgaGFuZGxlciB0byBjbGVhciBzaGFkaW5nIHdoZW4gbm90IHBsYWNlZFxuICAgICAgICBjb25zdCBmaXJzdENlbGwgPSBjZWxsQ29sbGVjdGlvblswXTtcbiAgICAgICAgaWYgKGZpcnN0Q2VsbCA9PT0gbnVsbCB8fCBmaXJzdENlbGwgPT09IHVuZGVmaW5lZCB8fCBwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZmlyc3RDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgY2VsbENvbGxlY3Rpb24uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGAke2FkZGVkQ2xhc3N9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gbGVhdmVTY3JlZW4oKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICAvLyB0cmFuc2xhdGVzIFVJIGNlbGwgdG8gYSBjb29yZGluYXRlIG9uIGEgZHJhZ292ZXIgZXZlbnRcbiAgICAgIC8vIGNoZWNrcyBpZiB0aGUgc2hpcCBkcmFnZ2VkIHdpbGwgZml0XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNvbnN0IGRyYWdPdmVySGFuZGxlciA9IChlKSA9PiB7XG4gICAgICAgICAgaWYgKGRyYWdTaGlwTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwibW91c2VvdmVyXCIpO1xuXG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBjb29yZCBiZWZvcmUgcHJveHk6ICR7Y29vcmR9YCk7XG4gICAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coYGNvb3JkIHBvc3Qgc2hpcG1ha2VyOiAke2Nvb3JkfWApO1xuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3IgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBub3QgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibW91c2VvdmVyXCIpO1xuICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICAgIHNoaXBJTUcuY2xhc3NMaXN0LmFkZChcInNoaXBJTUdcIik7XG4gICAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgY29uc3Qgc2hpcERyYWdIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG5cbiAgICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGNvb3JkIGJlZm9yZSBwbGFjaW5nIGlzIDogJHtjb29yZH1gKTtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBjb29yZCBhZnRlciBwbGFjaW5nIGlzIDogJHtjb29yZH1gKTtcbiAgICAgICAgICAgIGlmIChwbGFjZWQpIHtcbiAgICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NoaXBzID0gXCJcIjtcblxuICAgICAgICAgICAgICBzd2l0Y2ggKGRyYWdTaGlwTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBtb3dDb3VudDtcbiAgICAgICAgICAgICAgICAgIG1vd0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gZnJpZ0NvdW50O1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke2ZyaWdDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzY2hvb25Db3VudDtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2xvb3BDb3VudDtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IGludmFsaWQgc2hpcCBsZW5ndGggaW4gZHJhZ1NoaXBcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgLT0gMTtcblxuICAgICAgICAgICAgICBpZiAocmVtYWluaW5nU2hpcHMgPD0gMCkge1xuICAgICAgICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRlcGxldGVkXCIpO1xuICAgICAgICAgICAgICAgIHNoaXAucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBzaGlwRHJhZ0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHNoaXAuZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZHJhZ1NoaXAgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgZHJhZ1NoaXBMZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbW93Q291bnQgPD0gMCAmJlxuICAgICAgICAgICAgZnJpZ0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNjaG9vbkNvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNsb29wQ291bnQgPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJOZXh0XCI7XG4gICAgICAgICAgICBwYWdlQ29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRCdG4pO1xuXG4gICAgICAgICAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgXCJ0aGVyZSBzaG91bGQgYmUgc29tZSByZXNvbHZpbmcgb2YgcHJvbWlzZXMgaGFwcGVuaW5nIHJpZ2h0IG5vd1wiLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2NyZWVuKGdhbWVTY3JpcHRGbikge1xuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+QmF0dGxlc2hpcDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyU2VsZWN0Q29udFwiPlxuICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249XCJcIiBjbGFzcz1cInBsYXllckZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDFcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDFcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMVwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMlwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAyXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+QmVnaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllckZvcm1cIik7XG4gICAgaW5pdENvdW50cnlTZWxlY3QoKTtcbiAgICBwbGF5ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBwT2JqSW5pdGlhbGl6ZXIoXG4gICAgICAgIGdhbWVTY3JpcHRGbixcbiAgICAgICAgXCIucGxheWVyRm9ybVwiLFxuICAgICAgICBcInNlbGVjdHAxXCIsXG4gICAgICAgIFwic2VsZWN0cDJcIixcbiAgICAgICk7XG4gICAgICBhc3luYyBmdW5jdGlvbiBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwbGF5ZXJzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwbGF5ZXIgc2NyZWVuIGJlaW5nIG9wZW5lZFwiKTtcbiAgICAgICAgICAgIGF3YWl0IHNoaXBTY3JlZW4oZWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBzaGlwUmFuZG9taXplcihlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7IHN0YXJ0U2NyZWVuLCBwT2JqSW5pdGlhbGl6ZXIgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXNlckludGVyZmFjZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==