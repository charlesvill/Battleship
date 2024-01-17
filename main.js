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

  //

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

  function gameLoop() {
    // while game is not over
    // call ui strikescreen for current player if its a person
  }

  function gameInitializer() {
    // after adding the ships , it will need to check who is cpu and initialize the cpuwrapper
    // reassigning the player variable with cpu cpuPlayerWrapper
    // will initialize the game loop fn that will call ui for strike screens
    // cpu turns will be handled by gameloop automatically
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  ui.startScreen();
  const cpuAI = cpu();

  let gameOver = false;
  //  const p1 = player("Dk", gameBoard());
  //  let p2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    p1.playerBoard,
  //  );
  // let currentPlayer = p1;

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
  }
  // gameTurn is called by event handler on UI interaction -or- by recursion when its cpu turn
  function gameTurn(coordinates = "") {
    if (gameOver) {
      return endGame();
    }

    if (currentPlayer === p1) {
      const strike = p1.attack(coordinates, p2.playerBoard);
      // return value anything other than num = player loses
      if (isNaN(p2.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p2;
    } else if (currentPlayer === p2) {
      const strike = p2.attack(coordinates, p1.playerBoard);
      // check this line for errors, this was refactored differently
      if (isNaN(p1.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p1;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUMvSUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWMsTUFBTSxXQUFXLGFBQWE7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7Ozs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEIsc0JBQXNC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QTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDMWRBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzIGZvciBjcHUgcGxheWVyIHdpbGwgYmUgcGxhY2VkIGluIHBsYXllci50ZXN0LmpzXG4vLyBoaXQgYm9vbCBtaWdodCBub3QgcGxheSBhIHJvbGUsIHJlbWVtYmVyIHRvIGRlbGV0ZSBpZiBubyByb2xlLlxuY29uc3QgY3B1UGxheWVyID0gKCkgPT4ge1xuICBsZXQgc3RhdGUgPSBcInJhbmRvbVwiO1xuICBsZXQgaGl0ID0gZmFsc2U7XG4gIGxldCBzdHJlYWsgPSBmYWxzZTtcbiAgbGV0IGhpdEFyciA9IFtdO1xuICBsZXQgcHVyc3VpdEF4aXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJhbmRvbUNvb3JkID0gW107XG5cbiAgICByYW5kb21Db29yZC5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIHJldHVybiByYW5kb21Db29yZDtcbiAgfVxuXG4gIC8vIHdpbGwgbmVlZCB0byBpbXBsZW1lbnQgdGhlIGxlZ2FsIG1vdmUgLT4gZGVwZW5kZW5jeSBpbmplY3Rpb24gZnJvbSBnYW1lYm9hcmQgc2NyaXB0XG4gIGZ1bmN0aW9uIGFkamFjZW50TW92ZSgpIHtcbiAgICAvLyB3aWxsIHJldHVybiBjb29yZGluYXRlIGluIGVpdGhlciBzYW1lIHJvdyBvciBjb2x1bW4gYXMgbGFzdEhpdFxuICAgIGNvbnN0IFtsYXN0SGl0XSA9IGhpdEFycjtcbiAgICBsZXQgYWRqYWNlbnRTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG4gICAgLy8gcmFuZG9tbHkgY2hvb3NlIGVpdGhlciByb3cgb3IgY29sdW1uIHRvIGNoYW5nZVxuICAgIGNvbnN0IGF4aXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAvLyAwIC0+IC0xIHdpbGwgYmUgYWRkZWQgfHwgMSAtPiAxIHdpbGwgYmUgYWRkZWRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBhZGphY2VudFN0cmlrZVtheGlzXSArPSBvZmZzZXRWYWx1ZTtcblxuICAgIHJldHVybiBhZGphY2VudFN0cmlrZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRJbmxpbmUobGFzdEhpdCkge1xuICAgIC8vIHdpbGwgbmVlZCB0byBndWVzcyBuZXh0IG9uZSB1bnRpbCB5b3UgaGF2ZSBhIGxlZ2FsIG9uZSB0aGF0IGhhc250IGJlZW4gdXNlZCB5ZXRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBcImhcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzFdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9IGVsc2UgaWYgKHB1cnN1aXRBeGlzID09PSBcInZcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzBdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmxpbmVNb3ZlKCkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtjMSwgYzJdID0gaGl0QXJyO1xuICAgICAgaWYgKGMxWzBdID09PSBjMlswXSAmJiBjMVsxXSAhPT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfSBlbHNlIGlmIChjMVswXSAhPT0gYzJbMF0gJiYgYzFbMV0gPT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFycltoaXRBcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgLy8gY29uZGl0aW9uIGlmIHRoZSBsYXN0IHN0cmlrZSB3YXMgYSBtaXNzIHRoZW4gc3RhcnQgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGxpc3RcbiAgICAgIC8vIHRha2UgdGhlIGxhc3Qga25vd24gaGl0IGFuZCBhZGQgdG8gaXRcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbmV4dE1vdmUoKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgbW9kZSA9IFwicmFuZG9tXCI7XG4gICAgICBoaXRBcnIgPSBbXTtcbiAgICAgIHB1cnN1aXRBeGlzID0gbnVsbDtcbiAgICB9XG4gICAgaGl0QXJyLnB1c2goY29vcmRpbmF0ZSk7XG4gICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgIHN0YXRlID0gXCJhZGphY2VudFwiO1xuICAgIH0gZWxzZSBpZiAoaGl0QXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICAvLyByZXBvcnQgbWlzcyBmdW5jdGlvbj9cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcblxuLy8gYXR0YWNrIG9uIHBsYXllciBjbGFzcyBhY2NlcHRzIGEgY29vcmRpbmF0ZSBwYWlyLiBob3cgdGhhdCBwYWlyIGdldHMgZm9ybXVsYXRlZCBkb2VzIG5vdCBtYXR0ZXJcbi8vIGhhdmUgYSBnZW5lcmFsIG5leHRNb3ZlIGZ1bmN0aW9uIHRoYXQgd2lsbCBpbnRlbGxpZ2VudGx5IGRldGVybWluZSB3aGF0IGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkXG4vLyBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgaGl0cy5cbi8vIHRoZSBpbmZvcm1hdGlvbiB5b3Ugd291bGQgbmVlZCByZWNvcmQgd2hlbiB5b3UgaGF2ZSB0d28gaGl0cy4gaWYgeW91IGhhdmUgdHdvIGhpdHMgeW91IG5lZWQgdG8gZmlndXJlIG91dCB0aGUgb3JpZW50YXRpb24gb2YgdGhhdCBzaGlwIGFuZCByZXBlYXRlZGx5IChsb29wKSBzdHJpa2UgaW5saW5lIHVudGlsIHRoZXJlIGlzIGEgc3VuayBzaGlwLlxuLy9cbi8vIGNvbmNsdXNpb246IHRoZXJlIGRlZmluaXRlbHkgbmVlZHMgdG8gYmUgYSB3YXkgZm9yIHRoZSBnYW1lYm9hcmQgdG8gY29tbXVuaWNhdGUgYmFjayB0byB0aGUgY3B1IHNjcmlwdC5cbi8vXG4vLyBjYWxsYmFjayBmbnMgdGhhdCBjaGVjayBvbiBlYWNoIG1vdmU/IG9yIGlzIGl0IGZlZCB0byB0aGUgY3B1IHNjcmlwdCBieSB0aGUgZ2FtZWxvb3A/XG4iLCJjb25zdCBnYW1lQm9hcmQgPSAoKSA9PiB7XG4gIGxldCBzaGlwcyA9IFtdO1xuICBmdW5jdGlvbiBncmlkTWFrZXIoKSB7XG4gICAgZ3JpZCA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBncmlkW2ldID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgZ3JpZFtpXVtqXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmlkO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZXIgZm9yIHRoZSBncmlkXG4gIGxldCBzaGlwR3JpZCA9IGdyaWRNYWtlcigpO1xuICBsZXQgYXR0YWNrc1JlY2VpdmVkID0gZ3JpZE1ha2VyKCk7XG5cbiAgZnVuY3Rpb24gc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBjb3B5Q29vcmQgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIGxldCByID0gY29weUNvb3JkWzBdO1xuICAgIGxldCBjID0gY29weUNvb3JkWzFdO1xuICAgIGNvbnN0IHJvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBjb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzaGlwZml0IGxlbmd0aCB1bmRlZmluZWRcIik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByICs9IHJvZmZzZXQ7XG4gICAgICBjICs9IGNvZmZzZXQ7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvZmZzZXQpIHtcbiAgICBsZXQgY3VycmVudCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2hpcEdyaWRbY3VycmVudFswXV1bY3VycmVudFsxXV0gPSBzaGlwO1xuICAgICAgY3VycmVudFswXSArPSBvZmZzZXRbMF07XG4gICAgICBjdXJyZW50WzFdICs9IG9mZnNldFsxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTaGlwKHNoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgIHNoaXBzLnB1c2goc2hpcCk7XG5cbiAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzAsIDFdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9yaWVudGF0aW9uID09PSBcInZcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFsxLCAwXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuXG4gICAgcmV0dXJuIHN0cmlrZVNxdWFyZSA9PT0gbnVsbCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgYyA9IGNvb3JkaW5hdGVzWzFdO1xuXG4gICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgY29uc3QgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcblxuICAgICAgaWYgKHNoaXAuaXNTdW5rKCkgPT09IHRydWUpIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGZ1bmN0aW9uIHRoYXQgcmVwb3J0cyBpZiB0aGVyZSBhcmUgc2hpcHMgcmVtYWluaW5nLlxuICAgICAgICByZXR1cm4gYCR7c2hpcC50eXBlfSBoYXMgYmVlbiBzdW5rYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoaXRSZXBvcnQ7XG4gICAgfVxuICAgIC8vIHJlY29yZCB0aGUgbWlzc1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIFwibWlzc1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcHNSZW1haW5pbmcoKSB7XG4gICAgcmV0dXJuIHNoaXBzLmxlbmd0aCA+IDAgPyBzaGlwcy5sZW5ndGggOiBcIkFsbCBzaGlwcyBoYXZlIHN1bmtcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2hpcEdyaWQsXG4gICAgYXR0YWNrc1JlY2VpdmVkLFxuICAgIHNoaXBzLFxuICAgIHNoaXBGaXRzLFxuICAgIGFkZFNoaXAsXG4gICAgY2FuU3RyaWtlLFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgc2hpcHNSZW1haW5pbmcsXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVCb2FyZDtcbiIsIi8vIGluZGV4IGhvdXNlcyB0aGUgZHJpdmVyIGNvZGUgaW5jbHVkaW5nIHRoZSBnYW1lIGxvb3BcbmNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcbmNvbnN0IGdhbWVCb2FyZCA9IHJlcXVpcmUoXCIuL2dhbWVib2FyZFwiKTtcbmNvbnN0IHNoaXAgPSByZXF1aXJlKFwiLi9zaGlwXCIpO1xuY29uc3QgY3B1ID0gcmVxdWlyZShcIi4vY3B1UGxheWVyXCIpO1xuY29uc3QgdWlTY3JpcHQgPSByZXF1aXJlKFwiLi91aVwiKTtcblxuY29uc3QgZ2FtZU1vZHVsZSA9ICgpID0+IHtcbiAgLy8gdGVtcG9yYXJ5IGluaXRpYWxpemVycyB0aGF0IHdpbGwgYmUgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBhc3NpZ24gZ2FtZSBlbGVtZW50c1xuICAvLyB0aGUgZ2FtZSBpbml0aWFsaXplciB3aWxsIHVzZSB0aGlzIGZ1bmN0aW9uIGZvciBjb25uZWN0aW5nIGNwdSBBSSB0byBvdGhlciBmdW5jdGlvbnNcbiAgY29uc3QgY3B1UGxheWVyV3JhcHBlciA9IChwbGF5ZXJDbGFzcywgY3B1QUksIGVuZW15Qm9hcmQpID0+IHtcbiAgICAvLyB0aGlzIHdyYXBwZXIgd2lsbCBuZWVkIHRvIGJlIHJlZmFjdG9yZWQgYWZ0ZXIgY2hhbmdlcyB0byBwbGF5ZXIgY2xhc3NcbiAgICBwbGF5ZXJDbGFzcy5pc0NQVSA9IHRydWU7XG4gICAgZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgbGV0IG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG5cbiAgICAgIGlmIChzdHJpa2VSZXN1bHQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBhdHRhY2ssXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgfTtcbiAgfTtcblxuICAvL1xuXG4gIGZ1bmN0aW9uIHBsYXllckluaXRpYWxpemVyKHBsYXllck9iaikge1xuICAgIGlmIChwbGF5ZXJPYmoubnVtYmVyID09PSAxKSB7XG4gICAgICBwbGF5ZXIxID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXllcjIgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUGxhY2VyUHJveHkoXG4gICAgbnVtYmVyLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBjaGVja29ubHkgPSBmYWxzZSxcbiAgKSB7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCB8fCBsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gd2lsbCBtYWtlIGFuZCBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IHBsYXllciA9IG51bWJlciA9PT0gMSA/IHBsYXllcjEgOiBwbGF5ZXIyO1xuICAgIC8vIGZpcnN0IGNoZWNrIHRoZSBjb29yZGluYXRlc1xuICAgIC8vIHRoZW4gbWFrZSB0aGUgc2hpcFxuICAgIC8vIHRoZW4gcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBjYW5GaXQgPSBwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEZpdHMoXG4gICAgICBsZW5ndGgsXG4gICAgICBjb29yZGluYXRlcyxcbiAgICAgIG9yaWVudGF0aW9uLFxuICAgICk7XG4gICAgaWYgKCFjYW5GaXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFjaGVja29ubHkpIHtcbiAgICAgIGNvbnN0IG5ld1NoaXAgPSBzaGlwKGxlbmd0aCk7XG4gICAgICBwbGF5ZXIucGxheWVyQm9hcmQuYWRkU2hpcChuZXdTaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyLnBsYXllckJvYXJkLnNoaXBHcmlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIC8vIHdoaWxlIGdhbWUgaXMgbm90IG92ZXJcbiAgICAvLyBjYWxsIHVpIHN0cmlrZXNjcmVlbiBmb3IgY3VycmVudCBwbGF5ZXIgaWYgaXRzIGEgcGVyc29uXG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG4gICAgLy8gcmVhc3NpZ25pbmcgdGhlIHBsYXllciB2YXJpYWJsZSB3aXRoIGNwdSBjcHVQbGF5ZXJXcmFwcGVyXG4gICAgLy8gd2lsbCBpbml0aWFsaXplIHRoZSBnYW1lIGxvb3AgZm4gdGhhdCB3aWxsIGNhbGwgdWkgZm9yIHN0cmlrZSBzY3JlZW5zXG4gICAgLy8gY3B1IHR1cm5zIHdpbGwgYmUgaGFuZGxlZCBieSBnYW1lbG9vcCBhdXRvbWF0aWNhbGx5XG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG5cbiAgLy8gdGhpcyBpbml0aWFsaXplcyBidXQgdGhlIGdhbWUgbG9vcCBwaWNrcyBiYWNrIHVwIHdoZW4gdWkgc2NyaXB0IGNhbGxzIGdhbWVpbml0aWFsaXplcjtcbiAgdWkuc3RhcnRTY3JlZW4oKTtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcblxuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgLy8gIGNvbnN0IHAxID0gcGxheWVyKFwiRGtcIiwgZ2FtZUJvYXJkKCkpO1xuICAvLyAgbGV0IHAyID0gY3B1UGxheWVyV3JhcHBlcihcbiAgLy8gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAvLyAgICBjcHVBSSxcbiAgLy8gICAgcDEucGxheWVyQm9hcmQsXG4gIC8vICApO1xuICAvLyBsZXQgY3VycmVudFBsYXllciA9IHAxO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG4gIC8vIGdhbWVUdXJuIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVUdXJuKGNvb3JkaW5hdGVzID0gXCJcIikge1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFBsYXllciA9PT0gcDEpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHAxLmF0dGFjayhjb29yZGluYXRlcywgcDIucGxheWVyQm9hcmQpO1xuICAgICAgLy8gcmV0dXJuIHZhbHVlIGFueXRoaW5nIG90aGVyIHRoYW4gbnVtID0gcGxheWVyIGxvc2VzXG4gICAgICBpZiAoaXNOYU4ocDIucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSkpIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcDI7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwMikge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcDIuYXR0YWNrKGNvb3JkaW5hdGVzLCBwMS5wbGF5ZXJCb2FyZCk7XG4gICAgICAvLyBjaGVjayB0aGlzIGxpbmUgZm9yIGVycm9ycywgdGhpcyB3YXMgcmVmYWN0b3JlZCBkaWZmZXJlbnRseVxuICAgICAgaWYgKGlzTmFOKHAxLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkpKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocDEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHAxO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFBsYXllci5pc0NQVSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGdhbWVUdXJuKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzR2FtZU92ZXIoKSB7XG4gICAgcmV0dXJuIGdhbWVPdmVyO1xuICB9XG4gIHJldHVybiB7IGdhbWVUdXJuLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKHBsYXllck9iaiwgYm9hcmRGbikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG4gIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGlmIChjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpKSB7XG4gICAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIFwidHJ5IGFub3RoZXIgYXR0YWNrXCI7XG4gIH1cblxuICByZXR1cm4geyAuLi5wbGF5ZXJPYmosIHBsYXllckJvYXJkLCBjYW5TdHJpa2UsIGF0dGFjaywgaXNDUFUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxheWVyO1xuXG4vLyB0aGUgYXR0YWNrIGZuIGFzIG9mIG5vdyBkb2VzIG5vdCB3b3JrIHdlbGwgd2l0aCBjcHUgcGxheWVyIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byByZWdlbmVyYXRlIGFub3RoZXIgbW92ZSB3aXRob3V0IGxlYXZpbmcgaXRzIGN1cnJlbnQgc2NvcGVcbiIsIi8vIHNoaXBzIHNob3VsZCBoYXZlIHRoZSBjaG9pY2Ugb2Y6XG4vLyA1IG1hbi1vLXdhclxuLy8gNCBmcmlnYXRlXG4vLyAzIHggMyBzY2hvb25lclxuLy8gMiB4IDIgcGF0cm9sIHNsb29wXG5jb25zdCBzaGlwID0gKGxlbmd0aCkgPT4ge1xuICBsZXQgdHlwZSA9IFwiXCI7XG4gIGxldCBkYW1hZ2UgPSAwO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIHJldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHsgdHlwZSwgbGVuZ3RoLCBkYW1hZ2UsIGhpdHBvaW50cywgaGl0LCBpc1N1bmsgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICAvLyBwbGF5ZXIgaXMgZWl0aGVyIFwiY3B1XCIgb3IgXCJwZXJzb25cIlxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW1xuICAgICAgICBtYW5vd2FyLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzbG9vcCxcbiAgICAgICAgc2xvb3AsXG4gICAgICBdLFxuICAgIH07XG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IFtdO1xuXG4gICAgcmFuY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuXG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIHJhbmNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIC8vIG5lZWQgYXN5bmMgZnVuY3Rpb24gdG8gd2FpdCBmb3IgZWFjaCBwbGF5ZXIgc2hpcCBzZWxlY3Rpb24gdG8gYmUgcmVzb2x2ZWQgYmVmb3JlIG1vdmluZyBvbiB0byB0aGUgbmV4dCBvbmVcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIC8vIGNsZWFyIHBhZ2UgY29udGFpbmVyIGFuZCBwb3B1bGF0ZSB3aXRoIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IG1hblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgZnJpZ1wiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIzXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzY2hvb25cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2xvb3BcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgZHJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuICAgICAgY29uc29sZS5sb2coYHRoZSBjdXJyZW50IHBsYXllciBpczogJHtwbGF5ZXJPYmoubnVtYmVyfWApO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dDb250XCIpO1xuICAgICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LmMgPSBqO1xuICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY3ljbGUgc2hpcCBwbGFjZW1lbnQgb3JpZW50YXRpb24sIGluaXRpYWxpemVkIHRvIFwiaFwiXG4gICAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgICBvcmllbnRhdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIkhvcml6b250YWxcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGdyaWRTaGFkZXIgPSAoXG4gICAgICAgIGNvb3JkLFxuICAgICAgICBsZW5ndGgsXG4gICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgcGxhY2VkID0gZmFsc2UsXG4gICAgICApID0+IHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ciA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgICAgICBjb25zdCBvZmZzZXRjID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgICAgIGxldCBhZGRlZENsYXNzID0gXCJcIjtcblxuICAgICAgICAvLyAzIHNoYWRpbmcgcG9zc2libGl0aWVzIGZpdHMvbm9maXRzL3BsYWNlZFxuICAgICAgICBpZiAocGxhY2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkZWRDbGFzcyA9IFwicGxhY2VkXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkZWRDbGFzcyA9IGRyYWdGaXRzID09PSB0cnVlID8gXCJmaXRzXCIgOiBcIm5vdEZpdHNcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb29yZCA9IFsuLi5jb29yZF07XG4gICAgICAgIGxldCBjZWxsQ29sbGVjdGlvbiA9IFtdO1xuXG4gICAgICAgIC8vIHNoYWRlIGVhY2ggY2VsbCByZXByZXNlbnRpbmcgc2hpcCBsZW5ndGhcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgIGBbZGF0YS1yPVwiJHtjdXJyZW50Q29vcmRbMF19XCJdW2RhdGEtYz1cIiR7Y3VycmVudENvb3JkWzFdfVwiXWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjZWxsQ29sbGVjdGlvbi5wdXNoKGN1cnJlbnRDZWxsKTtcblxuICAgICAgICAgIGlmIChjdXJyZW50Q2VsbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChgJHthZGRlZENsYXNzfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudENvb3JkWzBdICs9IG9mZnNldHI7XG4gICAgICAgICAgY3VycmVudENvb3JkWzFdICs9IG9mZnNldGM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWZ0ZXIgc2hhZGUsIGRyYWdsZWF2ZSBoYW5kbGVyIHRvIGNsZWFyIHNoYWRpbmcgd2hlbiBub3QgcGxhY2VkXG4gICAgICAgIGNvbnN0IGZpcnN0Q2VsbCA9IGNlbGxDb2xsZWN0aW9uWzBdO1xuICAgICAgICBpZiAoZmlyc3RDZWxsID09PSBudWxsIHx8IGZpcnN0Q2VsbCA9PT0gdW5kZWZpbmVkIHx8IHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmaXJzdENlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBjZWxsQ29sbGVjdGlvbi5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBsZWF2ZVNjcmVlbigpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2VsbFwiKTtcbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGUgb24gYSBkcmFnb3ZlciBldmVudFxuICAgICAgLy8gY2hlY2tzIGlmIHRoZSBzaGlwIGRyYWdnZWQgd2lsbCBmaXRcbiAgICAgIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAgICAgY29uc3QgZHJhZ092ZXJIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZ1NoaXBMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtb3VzZW92ZXJcIik7XG5cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coYGNvb3JkIHBvc3Qgc2hpcG1ha2VyOiAke2Nvb3JkfWApO1xuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3IgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBub3QgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgZHJhZ1NoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBkcmFnRml0cywgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibW91c2VvdmVyXCIpO1xuICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICAgIHNoaXBJTUcuY2xhc3NMaXN0LmFkZChcInNoaXBJTUdcIik7XG4gICAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgY29uc3Qgc2hpcERyYWdIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG5cbiAgICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgY29uc3QgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKHBsYWNlZCkge1xuICAgICAgICAgICAgICBncmlkU2hhZGVyKGNvb3JkLCBkcmFnU2hpcExlbmd0aCwgb3JpZW50YXRpb24sIGRyYWdGaXRzLCB0cnVlKTtcblxuICAgICAgICAgICAgICBsZXQgcmVtYWluaW5nU2hpcHMgPSBcIlwiO1xuXG4gICAgICAgICAgICAgIHN3aXRjaCAoZHJhZ1NoaXBMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IG1vd0NvdW50O1xuICAgICAgICAgICAgICAgICAgbW93Q291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBmcmlnQ291bnQ7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNjaG9vbkNvdW50O1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzbG9vcENvdW50O1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogaW52YWxpZCBzaGlwIGxlbmd0aCBpbiBkcmFnU2hpcFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyAtPSAxO1xuXG4gICAgICAgICAgICAgIGlmIChyZW1haW5pbmdTaGlwcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZGVwbGV0ZWRcIik7XG4gICAgICAgICAgICAgICAgc2hpcC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIHNoaXBEcmFnSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgc2hpcC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBtb3dDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBmcmlnQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2Nob29uQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2xvb3BDb3VudCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIG5leHRCdG4udGV4dENvbnRlbnQgPSBcIk5leHRcIjtcbiAgICAgICAgICAgIHBhZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQobmV4dEJ0bik7XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcInRoZXJlIHNob3VsZCBiZSBzb21lIHJlc29sdmluZyBvZiBwcm9taXNlcyBoYXBwZW5pbmcgcmlnaHQgbm93XCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgYXN5bmMgZnVuY3Rpb24gc3RhcnRTY3JlZW4oKSB7XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5CYXR0bGVzaGlwPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJTZWxlY3RDb250XCI+XG4gICAgICAgICAgICAgICAgIDxmb3JtIGFjdGlvbj1cIlwiIGNsYXNzPVwicGxheWVyRm9ybVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMVwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAxXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAyXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDJcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5CZWdpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyRm9ybVwiKTtcbiAgICBpbml0Q291bnRyeVNlbGVjdCgpO1xuICAgIHBsYXllckZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgcGxheWVycyA9IHBPYmpJbml0aWFsaXplcihcIi5wbGF5ZXJGb3JtXCIsIFwic2VsZWN0cDFcIiwgXCJzZWxlY3RwMlwiKTtcbiAgICAgIC8vIHBsYXllcm9iaiBzZW50IGJhY2sgdG8gZXh0ZW5kIGZ1bmN0aW9uYWxpdHkgd2l0aCBwbGF5ZXIgc2NyaXB0XG4gICAgICBhc3luYyBmdW5jdGlvbiBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwbGF5ZXJzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgYXdhaXQgc2hpcFNjcmVlbihlbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIHNoaXBSYW5kb21pemVyKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcHJvY2Vzc1BsYXllcnMocGxheWVycyk7XG4gICAgICAvLyBpbmRleCBnbG9iYWwgdmFyaWFibGVzIHNob3VsZCBiZSBwb3B1bGF0ZWQgd2l0aCBib3RoIHBsYXllcnNcbiAgICAgIC8vIGNhbGwgdG8gY29udGludWUgZ2FtZSBzaG91bGQgaGF2ZSBpbmRleCBhY2Nlc3NpbmcgZ2xvYmFsIHBsYXllclxuICAgICAgLy8gb2JqcyBhbmQgc2hvdWxkIHdvcmsgZmluZS4gYnV0IGl0IGlzIGtpbmRhIHNsb3BweVxuICAgICAgLy8gdGhpcyBwYXNzZXMgb3ZlciBjb250cm9sIGJhY2sgdG8gdGhlIGluZGV4IHNjcmlwdC5cbiAgICAgIGdhbWVJbml0U2NyaXB0KCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHsgc3RhcnRTY3JlZW4sIHBPYmpJbml0aWFsaXplciB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c2VySW50ZXJmYWNlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9