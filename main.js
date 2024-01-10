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
    let r = coordinates[0];
    let c = coordinates[1];
    const roffset = orientation === "h" ? 0 : 1;
    const coffset = orientation === "v" ? 0 : 1;
    if (length === undefined) {
      throw new Error("shipfit length undefined");
    }

    for (let i = 0; i < length; i++) {
      try {
        console.log(shipGrid[r][c]);
        console.log("coordinates checked: " + r + c);
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
    let current = coordinates;
    for (let i = 0; i < length; i++) {
      shipGrid[current[0]][current[1]] = ship;
      current[0] += offset[0];
      current[1] += offset[1];
    }
  }

  function addShip(ship, coordinates, orientation) {
    const length = ship.length;
    const row = coordinates[0];
    const column = coordinates[1];
    ships.push(ship);

    if (orientation === "h") {
      if (shipFits(length, coordinates, "h")) {
        pushtoGrid(ship, length, coordinates, [0, 1]);
      }
    } else if (orientation === "v") {
      if (shipFits(length, coordinates, "h")) {
        pushtoGrid(ship, length, coordinates, [1, 0]);
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
        // send signal to check if there are any remaining ships? or
        // just a function that reports if there are ships remaining.
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

//
//
//make sure not to leave this global variable!
//
//

const test = gameBoard();
test.canStrike([1, 2]);

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
      console.log("this one p1");
      console.log(playerObj);
      console.log(player1);
    } else {
      player2 = player(playerObj.country, gameBoard(), isCPU);
      console.log(player2);
    }
  }

  function shipPlacerProxy(
    number,
    length,
    coordinates,
    orientation,
    checkonly = false,
  ) {
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
    console.log("the coordinates sent fit: " + canFit + " " + orientation);
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
  let player1 = undefined;
  let player2 = undefined;
  console.log(player1);
  const cpuAI = cpu();
  const sloopP1 = ship(2);
  const frigateP1 = ship(4);
  const sloopP2 = ship(2);
  const frigateP2 = ship(4);
  let gameOver = false;
  const p1 = player("Dk", gameBoard());
  let p2 = cpuPlayerWrapper(
    player("UK", gameBoard(), true),
    cpuAI,
    p1.playerBoard,
  );
  let currentPlayer = p1;
  p1.playerBoard.addShip(sloopP1, [2, 4], "h");
  p1.playerBoard.addShip(sloopP1, [6, 4], "h");
  p1.playerBoard.addShip(frigateP1, [3, 2], "v");
  p2.playerBoard.addShip(sloopP2, [2, 4], "h");
  p2.playerBoard.addShip(sloopP2, [8, 4], "h");
  p2.playerBoard.addShip(frigateP2, [1, 2], "v");

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
  function startScreen(gameScriptFn) {
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

      players.forEach((element) => {
        if (element.player === "person") {
          playerInitScript(element);
          shipScreen(element);
        } else {
          playerInitScript(element);
          shipRandomizer(element);
        }
      });
      // trigger the next screen
    });
  }

  function randomCoord() {
    const max = 10;
    const cCoord = Math.floor(Math.random() * max);
    const rCoord = Math.floor(Math.random() * max);
    const coordinates = [];

    coordinates.push(cCoord, rCoord);

    console.log("random coord: " + coordinates);

    return coordinates;
  }

  function shipScreen(playerObj) {
    // get reference to the page container and clear the page.
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
                </div>
                <div class="shipBox">
                    <div class="ship" data-index="4" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="3" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="2" draggable="true"></div>
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

    // change info per the player obj

    // store the html for the ship placement
    const gridContainer = document.querySelector(".gridCont");
    // build the visual grid
    const gridSize = 10;
    let dragShipLength = 0;
    let dragShip = undefined;
    let dragFits = false;
    let coordinates = undefined;
    let orientation = "";

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
    // create system for UI to coordinates
    const orientationBtn = document.querySelector(".orientationBtn");
    orientationBtn.addEventListener("click", (e) => {
      orientation = e.currentTarget.dataset.orientation;
      if (orientation === "h") {
        e.currentTarget.dataset.orientation = "v";
        orientationBtn.textContent = "Vertical";
      } else {
        e.currentTarget.dataset.orientation = "h";
        orientationBtn.textContent = "Horizontal";
      }
    });
    // hold reference to the grid elements
    // activate event listener for each of the grid items
    let r = undefined;
    let c = undefined;
    let coord = [];
    let ships = document.querySelectorAll(".ship");
    let shipContainer = document.querySelector(".shipBox");

    const cells = document.querySelectorAll(".cell");

    cells.forEach((cell) => {
      const dragOverHandler = (e) => {
        e.preventDefault();

        cell.classList.add("mouseover");

        r = Number(e.currentTarget.dataset.r);
        c = Number(e.currentTarget.dataset.c);
        coord = [r, c];
        const orientBox = document.querySelector(".orientationBtn");
        const shipOrientation = orientBox.dataset.orientation;
        console.log(shipOrientation);
        console.log(coord);
        dragFits = shipMakerProxy(
          playerObj.number,
          dragShipLength,
          coord,
          shipOrientation,
          true,
        );
        if (dragFits) {
          // add classname for fits
          coordinates = coord;
          cell.classList.add("fits");
          cell.classList.remove("notFits");
        } else {
          // add classname for not fits
          cell.classList.add("notFits");
          cell.classList.remove("fits");
        }
        coordCalculated = true;
        cell.removeEventListener("dragover", dragOverHandler);
      };

      cell.addEventListener("dragover", dragOverHandler);
      cell.addEventListener("dragleave", (e) => {
        coordCalculated = false;
        cell.classList.remove("mouseover");
        cell.classList.remove("notFits");
        cell.classList.remove("fits");
        cell.addEventListener("dragover", dragOverHandler);
      });
    });

    const shipIMG = new Image();
    shipIMG.src = "./images/sailboat.png";
    shipIMG.classList.add("shipIMG");
    shipIMG.style.width = "1rem";

    ships.forEach((ship) => {
      ship.addEventListener("dragstart", (e) => {
        const clone = ship.cloneNode(true);
        dragShipLength = Number(e.currentTarget.dataset.index);
        console.log("length: " + dragShipLength);
        dragShip = ship;

        // Set the offset for the drag image
        const offsetX = 20; // Set your desired offset value
        e.dataTransfer.setDragImage(clone, 0, 0);
        ship.classList.add("dragging");
      });

      ship.addEventListener("dragend", () => {
        ship.classList.remove("dragging");

        if (dragFits) {
          const placed = shipMakerProxy(
            playerObj.number,
            dragShipLength,
            coord,
            orientation,
          );
          if (placed) {
            console.log("a ship was placed ");
            // temp until visual indicator of placed ship
          }
        }
        dragShip = undefined;
      });
    });

    // create method for checking the coordinate space on a hover event
    // create method for adding the ship to the location on the click event.
  }

  function shipRandomizer(playerObj) {
    let shipArr = [...playerObj.ships];

    shipArr.forEach((shipLength) => {
      let placed = false;
      while (!placed) {
        // random direction of ship placement
        const coordinates = randomCoord();
        const random = Math.floor(Math.random() * 2);
        const axis = random === 0 ? "h" : "v";

        // shipMakerProxy returns false if was not able to place ship at random spot, trys again
        placed = shipMakerProxy(
          playerObj.number,
          shipLength,
          coordinates,
          axis,
        );
      }
    });
  }

  // builds a playerobj that contains information to initialize the game
  function pObjInitializer(gameScriptFn, formClssNme, p1selectid, p2selectid) {
    // build the obj and export to
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

  function UItoCoord() {}
  function sendMove() {}
  function checkSpace(coordinates) {}
  startScreen();
  return { pObjInitializer, sendMove };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQzNIQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsUUFBUTtBQUM1QjtBQUNBLHNCQUFzQixRQUFRO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW9CLFlBQVk7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0IsWUFBWTtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBa0IsV0FBVztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7O0FDN0hBO0FBQ0EsZUFBZSxtQkFBTyxDQUFDLGlDQUFVO0FBQ2pDLGtCQUFrQixtQkFBTyxDQUFDLHVDQUFhO0FBQ3ZDLGFBQWEsbUJBQU8sQ0FBQyw2QkFBUTtBQUM3QixZQUFZLG1CQUFPLENBQUMsdUNBQWE7QUFDakMsaUJBQWlCLG1CQUFPLENBQUMseUJBQU07O0FBRS9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDOUlBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTs7QUFFQTs7Ozs7Ozs7Ozs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYyxNQUFNLFdBQVcsYUFBYTtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTs7Ozs7Ozs7Ozs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsY0FBYztBQUNsQztBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCLGNBQWM7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0I7QUFDdEIsc0JBQXNCOztBQUV0QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUN2V0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvY3B1UGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMgZm9yIGNwdSBwbGF5ZXIgd2lsbCBiZSBwbGFjZWQgaW4gcGxheWVyLnRlc3QuanNcbi8vIGhpdCBib29sIG1pZ2h0IG5vdCBwbGF5IGEgcm9sZSwgcmVtZW1iZXIgdG8gZGVsZXRlIGlmIG5vIHJvbGUuXG5jb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgLy8gd2lsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbGVnYWwgbW92ZSAtPiBkZXBlbmRlbmN5IGluamVjdGlvbiBmcm9tIGdhbWVib2FyZCBzY3JpcHRcbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgLy8gd2lsbCBuZWVkIHRvIGd1ZXNzIG5leHQgb25lIHVudGlsIHlvdSBoYXZlIGEgbGVnYWwgb25lIHRoYXQgaGFzbnQgYmVlbiB1c2VkIHlldFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGxldCBpbmxpbmVTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG5cbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IFwiaFwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH0gZWxzZSBpZiAocHVyc3VpdEF4aXMgPT09IFwidlwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMF0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlubGluZU1vdmUoKSB7XG4gICAgLy8gZmluZHMgdGhlIGF4aXMgYnkgY29tcGFyaW5nIGhpdHMgYW5kIGNhbGxzIGFuIGlubGluZSBndWVzc1xuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgW2MxLCBjMl0gPSBoaXRBcnI7XG4gICAgICBpZiAoYzFbMF0gPT09IGMyWzBdICYmIGMxWzFdICE9PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwiaFwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9IGVsc2UgaWYgKGMxWzBdICE9PSBjMlswXSAmJiBjMVsxXSA9PT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcInZcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RyZWFrID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbMF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBtb2RlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH1cbiAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCkge1xuICAgIHN0cmVhayA9IGZhbHNlO1xuICB9XG4gIC8vIHJlcG9ydCBtaXNzIGZ1bmN0aW9uP1xuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuXG4vLyBhdHRhY2sgb24gcGxheWVyIGNsYXNzIGFjY2VwdHMgYSBjb29yZGluYXRlIHBhaXIuIGhvdyB0aGF0IHBhaXIgZ2V0cyBmb3JtdWxhdGVkIGRvZXMgbm90IG1hdHRlclxuLy8gaGF2ZSBhIGdlbmVyYWwgbmV4dE1vdmUgZnVuY3Rpb24gdGhhdCB3aWxsIGludGVsbGlnZW50bHkgZGV0ZXJtaW5lIHdoYXQgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWRcbi8vIGFjY29yZGluZyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiBoaXRzLlxuLy8gdGhlIGluZm9ybWF0aW9uIHlvdSB3b3VsZCBuZWVkIHJlY29yZCB3aGVuIHlvdSBoYXZlIHR3byBoaXRzLiBpZiB5b3UgaGF2ZSB0d28gaGl0cyB5b3UgbmVlZCB0byBmaWd1cmUgb3V0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGF0IHNoaXAgYW5kIHJlcGVhdGVkbHkgKGxvb3ApIHN0cmlrZSBpbmxpbmUgdW50aWwgdGhlcmUgaXMgYSBzdW5rIHNoaXAuXG4vL1xuLy8gY29uY2x1c2lvbjogdGhlcmUgZGVmaW5pdGVseSBuZWVkcyB0byBiZSBhIHdheSBmb3IgdGhlIGdhbWVib2FyZCB0byBjb21tdW5pY2F0ZSBiYWNrIHRvIHRoZSBjcHUgc2NyaXB0LlxuLy9cbi8vIGNhbGxiYWNrIGZucyB0aGF0IGNoZWNrIG9uIGVhY2ggbW92ZT8gb3IgaXMgaXQgZmVkIHRvIHRoZSBjcHUgc2NyaXB0IGJ5IHRoZSBnYW1lbG9vcD9cbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGxldCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgbGV0IGMgPSBjb29yZGluYXRlc1sxXTtcbiAgICBjb25zdCByb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3QgY29mZnNldCA9IG9yaWVudGF0aW9uID09PSBcInZcIiA/IDAgOiAxO1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2hpcGZpdCBsZW5ndGggdW5kZWZpbmVkXCIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHNoaXBHcmlkW3JdW2NdKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjb29yZGluYXRlcyBjaGVja2VkOiBcIiArIHIgKyBjKTtcbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByICs9IHJvZmZzZXQ7XG4gICAgICBjICs9IGNvZmZzZXQ7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvZmZzZXQpIHtcbiAgICBsZXQgY3VycmVudCA9IGNvb3JkaW5hdGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBHcmlkW2N1cnJlbnRbMF1dW2N1cnJlbnRbMV1dID0gc2hpcDtcbiAgICAgIGN1cnJlbnRbMF0gKz0gb2Zmc2V0WzBdO1xuICAgICAgY3VycmVudFsxXSArPSBvZmZzZXRbMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2hpcChzaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICBjb25zdCByb3cgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjb2x1bW4gPSBjb29yZGluYXRlc1sxXTtcbiAgICBzaGlwcy5wdXNoKHNoaXApO1xuXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIFwiaFwiKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFswLCAxXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcmllbnRhdGlvbiA9PT0gXCJ2XCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBcImhcIikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMSwgMF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcblxuICAgIHJldHVybiBzdHJpa2VTcXVhcmUgPT09IG51bGwgPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcblxuICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2hpcCA9IHNoaXBHcmlkW3JdW2NdO1xuICAgICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMTtcbiAgICAgIGNvbnN0IGhpdFJlcG9ydCA9IHNoaXAuaGl0KCk7XG5cbiAgICAgIGlmIChzaGlwLmlzU3VuaygpID09PSB0cnVlKSB7XG4gICAgICAgIHNoaXBzID0gc2hpcHMuZmlsdGVyKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQgIT09IHNoaXA7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBzZW5kIHNpZ25hbCB0byBjaGVjayBpZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBzaGlwcz8gb3JcbiAgICAgICAgLy8ganVzdCBhIGZ1bmN0aW9uIHRoYXQgcmVwb3J0cyBpZiB0aGVyZSBhcmUgc2hpcHMgcmVtYWluaW5nLlxuICAgICAgICByZXR1cm4gYCR7c2hpcC50eXBlfSBoYXMgYmVlbiBzdW5rYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoaXRSZXBvcnQ7XG4gICAgfVxuICAgIC8vIHJlY29yZCB0aGUgbWlzc1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIFwibWlzc1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcHNSZW1haW5pbmcoKSB7XG4gICAgcmV0dXJuIHNoaXBzLmxlbmd0aCA+IDAgPyBzaGlwcy5sZW5ndGggOiBcIkFsbCBzaGlwcyBoYXZlIHN1bmtcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2hpcEdyaWQsXG4gICAgYXR0YWNrc1JlY2VpdmVkLFxuICAgIHNoaXBzLFxuICAgIHNoaXBGaXRzLFxuICAgIGFkZFNoaXAsXG4gICAgY2FuU3RyaWtlLFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgc2hpcHNSZW1haW5pbmcsXG4gIH07XG59O1xuXG4vL1xuLy9cbi8vbWFrZSBzdXJlIG5vdCB0byBsZWF2ZSB0aGlzIGdsb2JhbCB2YXJpYWJsZSFcbi8vXG4vL1xuXG5jb25zdCB0ZXN0ID0gZ2FtZUJvYXJkKCk7XG50ZXN0LmNhblN0cmlrZShbMSwgMl0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVCb2FyZDtcbiIsIi8vIGluZGV4IGhvdXNlcyB0aGUgZHJpdmVyIGNvZGUgaW5jbHVkaW5nIHRoZSBnYW1lIGxvb3BcbmNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcbmNvbnN0IGdhbWVCb2FyZCA9IHJlcXVpcmUoXCIuL2dhbWVib2FyZFwiKTtcbmNvbnN0IHNoaXAgPSByZXF1aXJlKFwiLi9zaGlwXCIpO1xuY29uc3QgY3B1ID0gcmVxdWlyZShcIi4vY3B1UGxheWVyXCIpO1xuY29uc3QgdWlTY3JpcHQgPSByZXF1aXJlKFwiLi91aVwiKTtcblxuY29uc3QgZ2FtZU1vZHVsZSA9ICgpID0+IHtcbiAgLy8gdGVtcG9yYXJ5IGluaXRpYWxpemVycyB0aGF0IHdpbGwgYmUgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBhc3NpZ24gZ2FtZSBlbGVtZW50c1xuICAvLyB0aGUgZ2FtZSBpbml0aWFsaXplciB3aWxsIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGJ1aWxkIHRoZSBwbGF5ZXIgZWxlbWVudCBmb3IgY3B1XG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgcGxheWVyQ2xhc3MuaXNDUFUgPSB0cnVlO1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIHdoaWxlIChwbGF5ZXJDbGFzcy5jYW5TdHJpa2UobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyaWtlUmVzdWx0ID0gcGxheWVyQ2xhc3MuYXR0YWNrKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0ICE9PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRIaXQobmV4dFN0cmlrZSk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9IGVsc2UgaWYgKHN0cmlrZVJlc3VsdCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0TWlzcygpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgYXR0YWNrLFxuICAgICAgaXNDUFU6IHBsYXllckNsYXNzLmlzQ1BVLFxuICAgICAgcGxheWVyQm9hcmQ6IHBsYXllckNsYXNzLnBsYXllckJvYXJkLFxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGxheWVySW5pdGlhbGl6ZXIocGxheWVyT2JqKSB7XG4gICAgY29uc3QgaXNDUFUgPSBwbGF5ZXJPYmoucGxheWVyID09PSBcInBlcnNvblwiID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgaWYgKHBsYXllck9iai5udW1iZXIgPT09IDEpIHtcbiAgICAgIHBsYXllcjEgPSBwbGF5ZXIocGxheWVyT2JqLmNvdW50cnksIGdhbWVCb2FyZCgpLCBpc0NQVSk7XG4gICAgICBjb25zb2xlLmxvZyhcInRoaXMgb25lIHAxXCIpO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyT2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllcjEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGF5ZXIyID0gcGxheWVyKHBsYXllck9iai5jb3VudHJ5LCBnYW1lQm9hcmQoKSwgaXNDUFUpO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyMik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFBsYWNlclByb3h5KFxuICAgIG51bWJlcixcbiAgICBsZW5ndGgsXG4gICAgY29vcmRpbmF0ZXMsXG4gICAgb3JpZW50YXRpb24sXG4gICAgY2hlY2tvbmx5ID0gZmFsc2UsXG4gICkge1xuICAgIC8vIHdpbGwgbWFrZSBhbmQgcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBwbGF5ZXIgPSBudW1iZXIgPT09IDEgPyBwbGF5ZXIxIDogcGxheWVyMjtcbiAgICAvLyBmaXJzdCBjaGVjayB0aGUgY29vcmRpbmF0ZXNcbiAgICAvLyB0aGVuIG1ha2UgdGhlIHNoaXBcbiAgICAvLyB0aGVuIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgY2FuRml0ID0gcGxheWVyLnBsYXllckJvYXJkLnNoaXBGaXRzKFxuICAgICAgbGVuZ3RoLFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFwidGhlIGNvb3JkaW5hdGVzIHNlbnQgZml0OiBcIiArIGNhbkZpdCArIFwiIFwiICsgb3JpZW50YXRpb24pO1xuICAgIGlmICghY2FuRml0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghY2hlY2tvbmx5KSB7XG4gICAgICBjb25zdCBuZXdTaGlwID0gc2hpcChsZW5ndGgpO1xuICAgICAgcGxheWVyLnBsYXllckJvYXJkLmFkZFNoaXAobmV3U2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwR3JpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgLy8gdGhpcyB3aWxsIGFkZCB0aGUgc2hpcHMgdG8gdGhlIGJvYXJkO1xuICAgIC8vIGFmdGVyIGFkZGluZyB0aGUgc2hpcHMgLCBpdCB3aWxsIG5lZWQgdG8gY2hlY2sgd2hvIGlzIGNwdSBhbmQgaW5pdGlhbGl6ZSB0aGUgY3B1d3JhcHBlclxuICB9XG5cbiAgY29uc3QgdWkgPSB1aVNjcmlwdChzaGlwUGxhY2VyUHJveHksIHBsYXllckluaXRpYWxpemVyLCBnYW1lSW5pdGlhbGl6ZXIpO1xuICBsZXQgcGxheWVyMSA9IHVuZGVmaW5lZDtcbiAgbGV0IHBsYXllcjIgPSB1bmRlZmluZWQ7XG4gIGNvbnNvbGUubG9nKHBsYXllcjEpO1xuICBjb25zdCBjcHVBSSA9IGNwdSgpO1xuICBjb25zdCBzbG9vcFAxID0gc2hpcCgyKTtcbiAgY29uc3QgZnJpZ2F0ZVAxID0gc2hpcCg0KTtcbiAgY29uc3Qgc2xvb3BQMiA9IHNoaXAoMik7XG4gIGNvbnN0IGZyaWdhdGVQMiA9IHNoaXAoNCk7XG4gIGxldCBnYW1lT3ZlciA9IGZhbHNlO1xuICBjb25zdCBwMSA9IHBsYXllcihcIkRrXCIsIGdhbWVCb2FyZCgpKTtcbiAgbGV0IHAyID0gY3B1UGxheWVyV3JhcHBlcihcbiAgICBwbGF5ZXIoXCJVS1wiLCBnYW1lQm9hcmQoKSwgdHJ1ZSksXG4gICAgY3B1QUksXG4gICAgcDEucGxheWVyQm9hcmQsXG4gICk7XG4gIGxldCBjdXJyZW50UGxheWVyID0gcDE7XG4gIHAxLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMSwgWzIsIDRdLCBcImhcIik7XG4gIHAxLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMSwgWzYsIDRdLCBcImhcIik7XG4gIHAxLnBsYXllckJvYXJkLmFkZFNoaXAoZnJpZ2F0ZVAxLCBbMywgMl0sIFwidlwiKTtcbiAgcDIucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAyLCBbMiwgNF0sIFwiaFwiKTtcbiAgcDIucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAyLCBbOCwgNF0sIFwiaFwiKTtcbiAgcDIucGxheWVyQm9hcmQuYWRkU2hpcChmcmlnYXRlUDIsIFsxLCAyXSwgXCJ2XCIpO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG4gIC8vIGdhbWVMb29wIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVMb29wKGNvb3JkaW5hdGVzID0gXCJcIikge1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFBsYXllciA9PT0gcDEpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHAxLmF0dGFjayhjb29yZGluYXRlcywgcDIucGxheWVyQm9hcmQpO1xuICAgICAgaWYgKGlzTmFOKHAyLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkpKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocDEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHAyO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudFBsYXllciA9PT0gcDIpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHAyLmF0dGFjayhjb29yZGluYXRlcywgcDEucGxheWVyQm9hcmQpO1xuICAgICAgaWYgKHAxLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkgPT09IDApIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcDE7XG4gICAgfVxuICAgIGlmIChjdXJyZW50UGxheWVyLmlzQ1BVID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZ2FtZUxvb3AoKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNHYW1lT3ZlcigpIHtcbiAgICByZXR1cm4gZ2FtZU92ZXI7XG4gIH1cbiAgcmV0dXJuIHsgZ2FtZUxvb3AsIGlzR2FtZU92ZXIgfTtcbn07XG5nYW1lTW9kdWxlKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVNb2R1bGU7XG4iLCIvLyB0aGlzIHdpbGwgZGVtb25zdHJhdGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gd2l0aCB0aGUgbmVlZGVkIG1ldGhvZHMgZm9yIHRoZSBwbGF5ZXIgYm9hcmQgYW5kIGVuZW15IGJvYXJkIHJlZlxuXG5jb25zdCBwbGF5ZXIgPSAobmF0aW9uYWxpdHksIGJvYXJkRm4sIGlzQ1BVID0gXCJmYWxzZVwiKSA9PiB7XG4gIGNvbnN0IHBsYXllckJvYXJkID0gYm9hcmRGbjtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGlmIChjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpKSB7XG4gICAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIFwidHJ5IGFub3RoZXIgYXR0YWNrXCI7XG4gIH1cblxuICByZXR1cm4geyBuYXRpb25hbGl0eSwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG5cbi8vIHRoZSBhdHRhY2sgZm4gYXMgb2Ygbm93IGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIGNwdSBwbGF5ZXIgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHJlZ2VuZXJhdGUgYW5vdGhlciBtb3ZlIHdpdGhvdXQgbGVhdmluZyBpdHMgY3VycmVudCBzY29wZVxuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG5cbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDI6XG4gICAgICB0eXBlID0gXCJQYXRyb2wgU2xvb3BcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHR5cGUgPSBcIlNjaG9vbmVyXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICB0eXBlID0gXCJGcmlnYXRlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICB0eXBlID0gXCJNYW4tby1XYXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaGlwIHR5cGUgZXhjZXB0aW9uOiBsZW5ndGggbXVzdCBiZSAxLTVcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoaXQoKSB7XG4gICAgZGFtYWdlKys7XG4gICAgcmV0dXJuIGAke3R5cGV9IHdhcyBoaXQuICR7aGl0cG9pbnRzKCl9IGhpdHBvaW50cyByZW1haW5pbmdgO1xuICB9XG4gIGZ1bmN0aW9uIGlzU3VuaygpIHtcbiAgICByZXR1cm4gZGFtYWdlID49IGxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBoaXRwb2ludHMoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCAtIGRhbWFnZTtcbiAgfVxuICByZXR1cm4geyB0eXBlLCBsZW5ndGgsIGRhbWFnZSwgaGl0cG9pbnRzLCBoaXQsIGlzU3VuayB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGlwO1xuIiwiY29uc3QgdXNlckludGVyZmFjZSA9IChzaGlwTWFrZXJQcm94eSwgcGxheWVySW5pdFNjcmlwdCwgZ2FtZUluaXRTY3JpcHQpID0+IHtcbiAgY29uc3QgcGFnZUNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGFnZUNvbnRhaW5lclwiKTtcbiAgbGV0IHAxQ291bnRyeSA9IFwiXCI7XG4gIGxldCBwMkNvdW50cnkgPSBcIlwiO1xuXG4gIGZ1bmN0aW9uIGluaXRDb3VudHJ5U2VsZWN0KCkge1xuICAgIGNvbnN0IG5vZGVMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jb3VudHJ5Qm94XCIpO1xuICAgIG5vZGVMaXN0LmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAxXCIpIHtcbiAgICAgICAgICBwMUNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAyXCIpIHtcbiAgICAgICAgICBwMkNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBzdGFydFNjcmVlbihnYW1lU2NyaXB0Rm4pIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPkJhdHRsZXNoaXA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllclNlbGVjdENvbnRcIj5cbiAgICAgICAgICAgICAgICAgPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJwbGF5ZXJGb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAxXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAxXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDFcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDJcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMlwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG5Db250XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkJlZ2luPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJGb3JtXCIpO1xuICAgIGluaXRDb3VudHJ5U2VsZWN0KCk7XG4gICAgcGxheWVyRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBwbGF5ZXJzID0gcE9iakluaXRpYWxpemVyKFxuICAgICAgICBnYW1lU2NyaXB0Rm4sXG4gICAgICAgIFwiLnBsYXllckZvcm1cIixcbiAgICAgICAgXCJzZWxlY3RwMVwiLFxuICAgICAgICBcInNlbGVjdHAyXCIsXG4gICAgICApO1xuXG4gICAgICBwbGF5ZXJzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICBzaGlwU2NyZWVuKGVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgc2hpcFJhbmRvbWl6ZXIoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gdHJpZ2dlciB0aGUgbmV4dCBzY3JlZW5cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCBjb29yZGluYXRlcyA9IFtdO1xuXG4gICAgY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICBjb25zb2xlLmxvZyhcInJhbmRvbSBjb29yZDogXCIgKyBjb29yZGluYXRlcyk7XG5cbiAgICByZXR1cm4gY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIC8vIGdldCByZWZlcmVuY2UgdG8gdGhlIHBhZ2UgY29udGFpbmVyIGFuZCBjbGVhciB0aGUgcGFnZS5cbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiM1wiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcblxuICAgIC8vIGNoYW5nZSBpbmZvIHBlciB0aGUgcGxheWVyIG9ialxuXG4gICAgLy8gc3RvcmUgdGhlIGh0bWwgZm9yIHRoZSBzaGlwIHBsYWNlbWVudFxuICAgIGNvbnN0IGdyaWRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmdyaWRDb250XCIpO1xuICAgIC8vIGJ1aWxkIHRoZSB2aXN1YWwgZ3JpZFxuICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgbGV0IGRyYWdTaGlwTGVuZ3RoID0gMDtcbiAgICBsZXQgZHJhZ1NoaXAgPSB1bmRlZmluZWQ7XG4gICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgbGV0IGNvb3JkaW5hdGVzID0gdW5kZWZpbmVkO1xuICAgIGxldCBvcmllbnRhdGlvbiA9IFwiXCI7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICByb3cuY2xhc3NMaXN0LmFkZChcInJvd0NvbnRcIik7XG4gICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3JpZFNpemU7IGorKykge1xuICAgICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LnIgPSBpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuYyA9IGo7XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gY3JlYXRlIHN5c3RlbSBmb3IgVUkgdG8gY29vcmRpbmF0ZXNcbiAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgb3JpZW50YXRpb25CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBvcmllbnRhdGlvbiA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJIb3Jpem9udGFsXCI7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gaG9sZCByZWZlcmVuY2UgdG8gdGhlIGdyaWQgZWxlbWVudHNcbiAgICAvLyBhY3RpdmF0ZSBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBvZiB0aGUgZ3JpZCBpdGVtc1xuICAgIGxldCByID0gdW5kZWZpbmVkO1xuICAgIGxldCBjID0gdW5kZWZpbmVkO1xuICAgIGxldCBjb29yZCA9IFtdO1xuICAgIGxldCBzaGlwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc2hpcFwiKTtcbiAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcblxuICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuXG4gICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgY29uc3QgZHJhZ092ZXJIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcIm1vdXNlb3ZlclwiKTtcblxuICAgICAgICByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICBjb29yZCA9IFtyLCBjXTtcbiAgICAgICAgY29uc3Qgb3JpZW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5vcmllbnRhdGlvbkJ0blwiKTtcbiAgICAgICAgY29uc3Qgc2hpcE9yaWVudGF0aW9uID0gb3JpZW50Qm94LmRhdGFzZXQub3JpZW50YXRpb247XG4gICAgICAgIGNvbnNvbGUubG9nKHNoaXBPcmllbnRhdGlvbik7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvb3JkKTtcbiAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgIHNoaXBPcmllbnRhdGlvbixcbiAgICAgICAgICB0cnVlLFxuICAgICAgICApO1xuICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBmaXRzXG4gICAgICAgICAgY29vcmRpbmF0ZXMgPSBjb29yZDtcbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJmaXRzXCIpO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm5vdEZpdHNcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3Igbm90IGZpdHNcbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJub3RGaXRzXCIpO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcImZpdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgY2VsbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgIH07XG5cbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm1vdXNlb3ZlclwiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibm90Rml0c1wiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwiZml0c1wiKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2hpcElNRyA9IG5ldyBJbWFnZSgpO1xuICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICBzaGlwSU1HLmNsYXNzTGlzdC5hZGQoXCJzaGlwSU1HXCIpO1xuICAgIHNoaXBJTUcuc3R5bGUud2lkdGggPSBcIjFyZW1cIjtcblxuICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibGVuZ3RoOiBcIiArIGRyYWdTaGlwTGVuZ3RoKTtcbiAgICAgICAgZHJhZ1NoaXAgPSBzaGlwO1xuXG4gICAgICAgIC8vIFNldCB0aGUgb2Zmc2V0IGZvciB0aGUgZHJhZyBpbWFnZVxuICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERyYWdJbWFnZShjbG9uZSwgMCwgMCk7XG4gICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRyYWdnaW5nXCIpO1xuICAgICAgfSk7XG5cbiAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICBjb25zdCBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAocGxhY2VkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImEgc2hpcCB3YXMgcGxhY2VkIFwiKTtcbiAgICAgICAgICAgIC8vIHRlbXAgdW50aWwgdmlzdWFsIGluZGljYXRvciBvZiBwbGFjZWQgc2hpcFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gY3JlYXRlIG1ldGhvZCBmb3IgY2hlY2tpbmcgdGhlIGNvb3JkaW5hdGUgc3BhY2Ugb24gYSBob3ZlciBldmVudFxuICAgIC8vIGNyZWF0ZSBtZXRob2QgZm9yIGFkZGluZyB0aGUgc2hpcCB0byB0aGUgbG9jYXRpb24gb24gdGhlIGNsaWNrIGV2ZW50LlxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKSB7XG4gICAgbGV0IHNoaXBBcnIgPSBbLi4ucGxheWVyT2JqLnNoaXBzXTtcblxuICAgIHNoaXBBcnIuZm9yRWFjaCgoc2hpcExlbmd0aCkgPT4ge1xuICAgICAgbGV0IHBsYWNlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKCFwbGFjZWQpIHtcbiAgICAgICAgLy8gcmFuZG9tIGRpcmVjdGlvbiBvZiBzaGlwIHBsYWNlbWVudFxuICAgICAgICBjb25zdCBjb29yZGluYXRlcyA9IHJhbmRvbUNvb3JkKCk7XG4gICAgICAgIGNvbnN0IHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgICAgICBjb25zdCBheGlzID0gcmFuZG9tID09PSAwID8gXCJoXCIgOiBcInZcIjtcblxuICAgICAgICAvLyBzaGlwTWFrZXJQcm94eSByZXR1cm5zIGZhbHNlIGlmIHdhcyBub3QgYWJsZSB0byBwbGFjZSBzaGlwIGF0IHJhbmRvbSBzcG90LCB0cnlzIGFnYWluXG4gICAgICAgIHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgc2hpcExlbmd0aCxcbiAgICAgICAgICBjb29yZGluYXRlcyxcbiAgICAgICAgICBheGlzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gYnVpbGRzIGEgcGxheWVyb2JqIHRoYXQgY29udGFpbnMgaW5mb3JtYXRpb24gdG8gaW5pdGlhbGl6ZSB0aGUgZ2FtZVxuICBmdW5jdGlvbiBwT2JqSW5pdGlhbGl6ZXIoZ2FtZVNjcmlwdEZuLCBmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIC8vIGJ1aWxkIHRoZSBvYmogYW5kIGV4cG9ydCB0b1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICBjb25zdCBwbGF5ZXJvYmogPSB7XG4gICAgICBwbGF5ZXI6IHVuZGVmaW5lZCxcbiAgICAgIG51bWJlcjogdW5kZWZpbmVkLFxuICAgICAgY291bnRyeTogdW5kZWZpbmVkLFxuICAgICAgc2hpcHM6IFtcbiAgICAgICAgbWFub3dhcixcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgZnJpZ2F0ZSxcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2xvb3AsXG4gICAgICAgIHNsb29wLFxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIFVJdG9Db29yZCgpIHt9XG4gIGZ1bmN0aW9uIHNlbmRNb3ZlKCkge31cbiAgZnVuY3Rpb24gY2hlY2tTcGFjZShjb29yZGluYXRlcykge31cbiAgc3RhcnRTY3JlZW4oKTtcbiAgcmV0dXJuIHsgcE9iakluaXRpYWxpemVyLCBzZW5kTW92ZSB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c2VySW50ZXJmYWNlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9