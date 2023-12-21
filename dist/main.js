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
    const coffset = orientation === "v" ? 1 : 0;

    for (let i = 0; i < length; i++) {
      if (shipGrid[r][c] !== null) {
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

  function shipPlacerProxy(number, length, coordinates, orientation) {
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
    const newShip = ship(length);
    player.playerBoard.addShip(newShip, coordinates, orientation);

    console.log(player.playerBoard.shipGrid);
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
          console.log("p1 country added " + p1Country);
        } else if (element.classList[1] === "p2") {
          p2Country = element.id;
          console.log("p2 country added " + p2Country);
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

  function shipScreen(player0bj) {
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
    // hold reference to the grid elements
    // activate event listener for each of the grid items
    // create method for checking the coordinate space on a hover event
    // create method for adding the ship to the location on the click event.
  }
  function shipRandomizer(playerObj) {
    let shipArr = [...playerObj.ships];
    let player;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNySUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYOztBQUVBOztBQUVBOzs7Ozs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjLE1BQU0sV0FBVyxhQUFhO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7Ozs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsY0FBYztBQUNsQztBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCLGNBQWM7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCO0FBQ3RCLHNCQUFzQjs7QUFFdEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDOU9BO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzIGZvciBjcHUgcGxheWVyIHdpbGwgYmUgcGxhY2VkIGluIHBsYXllci50ZXN0LmpzXG4vLyBoaXQgYm9vbCBtaWdodCBub3QgcGxheSBhIHJvbGUsIHJlbWVtYmVyIHRvIGRlbGV0ZSBpZiBubyByb2xlLlxuY29uc3QgY3B1UGxheWVyID0gKCkgPT4ge1xuICBsZXQgc3RhdGUgPSBcInJhbmRvbVwiO1xuICBsZXQgaGl0ID0gZmFsc2U7XG4gIGxldCBzdHJlYWsgPSBmYWxzZTtcbiAgbGV0IGhpdEFyciA9IFtdO1xuICBsZXQgcHVyc3VpdEF4aXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJhbmRvbUNvb3JkID0gW107XG5cbiAgICByYW5kb21Db29yZC5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIHJldHVybiByYW5kb21Db29yZDtcbiAgfVxuXG4gIC8vIHdpbGwgbmVlZCB0byBpbXBsZW1lbnQgdGhlIGxlZ2FsIG1vdmUgLT4gZGVwZW5kZW5jeSBpbmplY3Rpb24gZnJvbSBnYW1lYm9hcmQgc2NyaXB0XG4gIGZ1bmN0aW9uIGFkamFjZW50TW92ZSgpIHtcbiAgICAvLyB3aWxsIHJldHVybiBjb29yZGluYXRlIGluIGVpdGhlciBzYW1lIHJvdyBvciBjb2x1bW4gYXMgbGFzdEhpdFxuICAgIGNvbnN0IFtsYXN0SGl0XSA9IGhpdEFycjtcbiAgICBsZXQgYWRqYWNlbnRTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG4gICAgLy8gcmFuZG9tbHkgY2hvb3NlIGVpdGhlciByb3cgb3IgY29sdW1uIHRvIGNoYW5nZVxuICAgIGNvbnN0IGF4aXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAvLyAwIC0+IC0xIHdpbGwgYmUgYWRkZWQgfHwgMSAtPiAxIHdpbGwgYmUgYWRkZWRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBhZGphY2VudFN0cmlrZVtheGlzXSArPSBvZmZzZXRWYWx1ZTtcblxuICAgIHJldHVybiBhZGphY2VudFN0cmlrZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRJbmxpbmUobGFzdEhpdCkge1xuICAgIC8vIHdpbGwgbmVlZCB0byBndWVzcyBuZXh0IG9uZSB1bnRpbCB5b3UgaGF2ZSBhIGxlZ2FsIG9uZSB0aGF0IGhhc250IGJlZW4gdXNlZCB5ZXRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBcImhcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzFdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9IGVsc2UgaWYgKHB1cnN1aXRBeGlzID09PSBcInZcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzBdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmxpbmVNb3ZlKCkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtjMSwgYzJdID0gaGl0QXJyO1xuICAgICAgaWYgKGMxWzBdID09PSBjMlswXSAmJiBjMVsxXSAhPT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfSBlbHNlIGlmIChjMVswXSAhPT0gYzJbMF0gJiYgYzFbMV0gPT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFycltoaXRBcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgLy8gY29uZGl0aW9uIGlmIHRoZSBsYXN0IHN0cmlrZSB3YXMgYSBtaXNzIHRoZW4gc3RhcnQgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGxpc3RcbiAgICAgIC8vIHRha2UgdGhlIGxhc3Qga25vd24gaGl0IGFuZCBhZGQgdG8gaXRcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbmV4dE1vdmUoKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgbW9kZSA9IFwicmFuZG9tXCI7XG4gICAgICBoaXRBcnIgPSBbXTtcbiAgICAgIHB1cnN1aXRBeGlzID0gbnVsbDtcbiAgICB9XG4gICAgaGl0QXJyLnB1c2goY29vcmRpbmF0ZSk7XG4gICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgIHN0YXRlID0gXCJhZGphY2VudFwiO1xuICAgIH0gZWxzZSBpZiAoaGl0QXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICAvLyByZXBvcnQgbWlzcyBmdW5jdGlvbj9cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcblxuLy8gYXR0YWNrIG9uIHBsYXllciBjbGFzcyBhY2NlcHRzIGEgY29vcmRpbmF0ZSBwYWlyLiBob3cgdGhhdCBwYWlyIGdldHMgZm9ybXVsYXRlZCBkb2VzIG5vdCBtYXR0ZXJcbi8vIGhhdmUgYSBnZW5lcmFsIG5leHRNb3ZlIGZ1bmN0aW9uIHRoYXQgd2lsbCBpbnRlbGxpZ2VudGx5IGRldGVybWluZSB3aGF0IGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkXG4vLyBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgaGl0cy5cbi8vIHRoZSBpbmZvcm1hdGlvbiB5b3Ugd291bGQgbmVlZCByZWNvcmQgd2hlbiB5b3UgaGF2ZSB0d28gaGl0cy4gaWYgeW91IGhhdmUgdHdvIGhpdHMgeW91IG5lZWQgdG8gZmlndXJlIG91dCB0aGUgb3JpZW50YXRpb24gb2YgdGhhdCBzaGlwIGFuZCByZXBlYXRlZGx5IChsb29wKSBzdHJpa2UgaW5saW5lIHVudGlsIHRoZXJlIGlzIGEgc3VuayBzaGlwLlxuLy9cbi8vIGNvbmNsdXNpb246IHRoZXJlIGRlZmluaXRlbHkgbmVlZHMgdG8gYmUgYSB3YXkgZm9yIHRoZSBnYW1lYm9hcmQgdG8gY29tbXVuaWNhdGUgYmFjayB0byB0aGUgY3B1IHNjcmlwdC5cbi8vXG4vLyBjYWxsYmFjayBmbnMgdGhhdCBjaGVjayBvbiBlYWNoIG1vdmU/IG9yIGlzIGl0IGZlZCB0byB0aGUgY3B1IHNjcmlwdCBieSB0aGUgZ2FtZWxvb3A/XG4iLCJjb25zdCBnYW1lQm9hcmQgPSAoKSA9PiB7XG4gIGxldCBzaGlwcyA9IFtdO1xuICBmdW5jdGlvbiBncmlkTWFrZXIoKSB7XG4gICAgZ3JpZCA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBncmlkW2ldID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgZ3JpZFtpXVtqXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmlkO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZXIgZm9yIHRoZSBncmlkXG4gIGxldCBzaGlwR3JpZCA9IGdyaWRNYWtlcigpO1xuICBsZXQgYXR0YWNrc1JlY2VpdmVkID0gZ3JpZE1ha2VyKCk7XG5cbiAgZnVuY3Rpb24gc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBsZXQgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGxldCBjID0gY29vcmRpbmF0ZXNbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJ2XCIgPyAxIDogMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByICs9IHJvZmZzZXQ7XG4gICAgICBjICs9IGNvZmZzZXQ7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvZmZzZXQpIHtcbiAgICBsZXQgY3VycmVudCA9IGNvb3JkaW5hdGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBHcmlkW2N1cnJlbnRbMF1dW2N1cnJlbnRbMV1dID0gc2hpcDtcbiAgICAgIGN1cnJlbnRbMF0gKz0gb2Zmc2V0WzBdO1xuICAgICAgY3VycmVudFsxXSArPSBvZmZzZXRbMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2hpcChzaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICBjb25zdCByb3cgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjb2x1bW4gPSBjb29yZGluYXRlc1sxXTtcbiAgICBzaGlwcy5wdXNoKHNoaXApO1xuXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIFwiaFwiKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFswLCAxXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcmllbnRhdGlvbiA9PT0gXCJ2XCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBcImhcIikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMSwgMF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcblxuICAgIHJldHVybiBzdHJpa2VTcXVhcmUgPT09IG51bGwgPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcblxuICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2hpcCA9IHNoaXBHcmlkW3JdW2NdO1xuICAgICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMTtcbiAgICAgIGNvbnN0IGhpdFJlcG9ydCA9IHNoaXAuaGl0KCk7XG5cbiAgICAgIGlmIChzaGlwLmlzU3VuaygpID09PSB0cnVlKSB7XG4gICAgICAgIHNoaXBzID0gc2hpcHMuZmlsdGVyKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQgIT09IHNoaXA7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBzZW5kIHNpZ25hbCB0byBjaGVjayBpZiB0aGVyZSBhcmUgYW55IHJlbWFpbmluZyBzaGlwcz8gb3JcbiAgICAgICAgLy8ganVzdCBhIGZ1bmN0aW9uIHRoYXQgcmVwb3J0cyBpZiB0aGVyZSBhcmUgc2hpcHMgcmVtYWluaW5nLlxuICAgICAgICByZXR1cm4gYCR7c2hpcC50eXBlfSBoYXMgYmVlbiBzdW5rYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoaXRSZXBvcnQ7XG4gICAgfVxuICAgIC8vIHJlY29yZCB0aGUgbWlzc1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIFwibWlzc1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcHNSZW1haW5pbmcoKSB7XG4gICAgcmV0dXJuIHNoaXBzLmxlbmd0aCA+IDAgPyBzaGlwcy5sZW5ndGggOiBcIkFsbCBzaGlwcyBoYXZlIHN1bmtcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2hpcEdyaWQsXG4gICAgYXR0YWNrc1JlY2VpdmVkLFxuICAgIHNoaXBzLFxuICAgIHNoaXBGaXRzLFxuICAgIGFkZFNoaXAsXG4gICAgY2FuU3RyaWtlLFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgc2hpcHNSZW1haW5pbmcsXG4gIH07XG59O1xuXG4vL1xuLy9cbi8vbWFrZSBzdXJlIG5vdCB0byBsZWF2ZSB0aGlzIGdsb2JhbCB2YXJpYWJsZSFcbi8vXG4vL1xuXG5jb25zdCB0ZXN0ID0gZ2FtZUJvYXJkKCk7XG50ZXN0LmNhblN0cmlrZShbMSwgMl0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVCb2FyZDtcbiIsIi8vIGluZGV4IGhvdXNlcyB0aGUgZHJpdmVyIGNvZGUgaW5jbHVkaW5nIHRoZSBnYW1lIGxvb3BcbmNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcbmNvbnN0IGdhbWVCb2FyZCA9IHJlcXVpcmUoXCIuL2dhbWVib2FyZFwiKTtcbmNvbnN0IHNoaXAgPSByZXF1aXJlKFwiLi9zaGlwXCIpO1xuY29uc3QgY3B1ID0gcmVxdWlyZShcIi4vY3B1UGxheWVyXCIpO1xuY29uc3QgdWlTY3JpcHQgPSByZXF1aXJlKFwiLi91aVwiKTtcblxuY29uc3QgZ2FtZU1vZHVsZSA9ICgpID0+IHtcbiAgLy8gdGVtcG9yYXJ5IGluaXRpYWxpemVycyB0aGF0IHdpbGwgYmUgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBhc3NpZ24gZ2FtZSBlbGVtZW50c1xuICAvLyB0aGUgZ2FtZSBpbml0aWFsaXplciB3aWxsIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGJ1aWxkIHRoZSBwbGF5ZXIgZWxlbWVudCBmb3IgY3B1XG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgcGxheWVyQ2xhc3MuaXNDUFUgPSB0cnVlO1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIHdoaWxlIChwbGF5ZXJDbGFzcy5jYW5TdHJpa2UobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyaWtlUmVzdWx0ID0gcGxheWVyQ2xhc3MuYXR0YWNrKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0ICE9PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRIaXQobmV4dFN0cmlrZSk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9IGVsc2UgaWYgKHN0cmlrZVJlc3VsdCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0TWlzcygpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgYXR0YWNrLFxuICAgICAgaXNDUFU6IHBsYXllckNsYXNzLmlzQ1BVLFxuICAgICAgcGxheWVyQm9hcmQ6IHBsYXllckNsYXNzLnBsYXllckJvYXJkLFxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGxheWVySW5pdGlhbGl6ZXIocGxheWVyT2JqKSB7XG4gICAgY29uc3QgaXNDUFUgPSBwbGF5ZXJPYmoucGxheWVyID09PSBcInBlcnNvblwiID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgaWYgKHBsYXllck9iai5udW1iZXIgPT09IDEpIHtcbiAgICAgIHBsYXllcjEgPSBwbGF5ZXIocGxheWVyT2JqLmNvdW50cnksIGdhbWVCb2FyZCgpLCBpc0NQVSk7XG4gICAgICBjb25zb2xlLmxvZyhcInRoaXMgb25lIHAxXCIpO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyT2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllcjEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGF5ZXIyID0gcGxheWVyKHBsYXllck9iai5jb3VudHJ5LCBnYW1lQm9hcmQoKSwgaXNDUFUpO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyMik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFBsYWNlclByb3h5KG51bWJlciwgbGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICAvLyB3aWxsIG1ha2UgYW5kIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgcGxheWVyID0gbnVtYmVyID09PSAxID8gcGxheWVyMSA6IHBsYXllcjI7XG4gICAgLy8gZmlyc3QgY2hlY2sgdGhlIGNvb3JkaW5hdGVzXG4gICAgLy8gdGhlbiBtYWtlIHRoZSBzaGlwXG4gICAgLy8gdGhlbiBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IGNhbkZpdCA9IHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwRml0cyhcbiAgICAgIGxlbmd0aCxcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZyhcInRoZSBjb29yZGluYXRlcyBzZW50IGZpdDogXCIgKyBjYW5GaXQgKyBcIiBcIiArIG9yaWVudGF0aW9uKTtcbiAgICBpZiAoIWNhbkZpdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBuZXdTaGlwID0gc2hpcChsZW5ndGgpO1xuICAgIHBsYXllci5wbGF5ZXJCb2FyZC5hZGRTaGlwKG5ld1NoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG5cbiAgICBjb25zb2xlLmxvZyhwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEdyaWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIGdhbWVJbml0aWFsaXplcigpIHtcbiAgICAvLyB0aGlzIHdpbGwgYWRkIHRoZSBzaGlwcyB0byB0aGUgYm9hcmQ7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG4gIGxldCBwbGF5ZXIxID0gdW5kZWZpbmVkO1xuICBsZXQgcGxheWVyMiA9IHVuZGVmaW5lZDtcbiAgY29uc29sZS5sb2cocGxheWVyMSk7XG4gIGNvbnN0IGNwdUFJID0gY3B1KCk7XG4gIGNvbnN0IHNsb29wUDEgPSBzaGlwKDIpO1xuICBjb25zdCBmcmlnYXRlUDEgPSBzaGlwKDQpO1xuICBjb25zdCBzbG9vcFAyID0gc2hpcCgyKTtcbiAgY29uc3QgZnJpZ2F0ZVAyID0gc2hpcCg0KTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIGNvbnN0IHAxID0gcGxheWVyKFwiRGtcIiwgZ2FtZUJvYXJkKCkpO1xuICBsZXQgcDIgPSBjcHVQbGF5ZXJXcmFwcGVyKFxuICAgIHBsYXllcihcIlVLXCIsIGdhbWVCb2FyZCgpLCB0cnVlKSxcbiAgICBjcHVBSSxcbiAgICBwMS5wbGF5ZXJCb2FyZCxcbiAgKTtcbiAgbGV0IGN1cnJlbnRQbGF5ZXIgPSBwMTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAxLCBbMiwgNF0sIFwiaFwiKTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAxLCBbNiwgNF0sIFwiaFwiKTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChmcmlnYXRlUDEsIFszLCAyXSwgXCJ2XCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDIsIFsyLCA0XSwgXCJoXCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDIsIFs4LCA0XSwgXCJoXCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKGZyaWdhdGVQMiwgWzEsIDJdLCBcInZcIik7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gIH1cbiAgLy8gZ2FtZUxvb3AgaXMgY2FsbGVkIGJ5IGV2ZW50IGhhbmRsZXIgb24gVUkgaW50ZXJhY3Rpb24gLW9yLSBieSByZWN1cnNpb24gd2hlbiBpdHMgY3B1IHR1cm5cbiAgZnVuY3Rpb24gZ2FtZUxvb3AoY29vcmRpbmF0ZXMgPSBcIlwiKSB7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwMSkge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcDEuYXR0YWNrKGNvb3JkaW5hdGVzLCBwMi5wbGF5ZXJCb2FyZCk7XG4gICAgICBpZiAoaXNOYU4ocDIucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSkpIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcDI7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwMikge1xuICAgICAgY29uc3Qgc3RyaWtlID0gcDIuYXR0YWNrKGNvb3JkaW5hdGVzLCBwMS5wbGF5ZXJCb2FyZCk7XG4gICAgICBpZiAocDEucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKSA9PT0gMCkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHAxKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwMTtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRQbGF5ZXIuaXNDUFUgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBnYW1lTG9vcCgpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpc0dhbWVPdmVyKCkge1xuICAgIHJldHVybiBnYW1lT3ZlcjtcbiAgfVxuICByZXR1cm4geyBnYW1lTG9vcCwgaXNHYW1lT3ZlciB9O1xufTtcbmdhbWVNb2R1bGUoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZU1vZHVsZTtcbiIsIi8vIHRoaXMgd2lsbCBkZW1vbnN0cmF0ZSBkZXBlbmRlbmN5IGluamVjdGlvbiB3aXRoIHRoZSBuZWVkZWQgbWV0aG9kcyBmb3IgdGhlIHBsYXllciBib2FyZCBhbmQgZW5lbXkgYm9hcmQgcmVmXG5cbmNvbnN0IHBsYXllciA9IChuYXRpb25hbGl0eSwgYm9hcmRGbiwgaXNDUFUgPSBcImZhbHNlXCIpID0+IHtcbiAgY29uc3QgcGxheWVyQm9hcmQgPSBib2FyZEZuO1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IG5hdGlvbmFsaXR5LCBwbGF5ZXJCb2FyZCwgY2FuU3RyaWtlLCBhdHRhY2ssIGlzQ1BVIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXllcjtcblxuLy8gdGhlIGF0dGFjayBmbiBhcyBvZiBub3cgZG9lcyBub3Qgd29yayB3ZWxsIHdpdGggY3B1IHBsYXllciBiZWNhdXNlIGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gcmVnZW5lcmF0ZSBhbm90aGVyIG1vdmUgd2l0aG91dCBsZWF2aW5nIGl0cyBjdXJyZW50IHNjb3BlXG4iLCIvLyBzaGlwcyBzaG91bGQgaGF2ZSB0aGUgY2hvaWNlIG9mOlxuLy8gNSBtYW4tby13YXJcbi8vIDQgZnJpZ2F0ZVxuLy8gMyB4IDMgc2Nob29uZXJcbi8vIDIgeCAyIHBhdHJvbCBzbG9vcFxuY29uc3Qgc2hpcCA9IChsZW5ndGgpID0+IHtcbiAgbGV0IHR5cGUgPSBcIlwiO1xuICBsZXQgZGFtYWdlID0gMDtcblxuICBzd2l0Y2ggKGxlbmd0aCkge1xuICAgIGNhc2UgMjpcbiAgICAgIHR5cGUgPSBcIlBhdHJvbCBTbG9vcFwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgdHlwZSA9IFwiU2Nob29uZXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIHR5cGUgPSBcIkZyaWdhdGVcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNTpcbiAgICAgIHR5cGUgPSBcIk1hbi1vLVdhclwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNoaXAgdHlwZSBleGNlcHRpb246IGxlbmd0aCBtdXN0IGJlIDEtNVwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpdCgpIHtcbiAgICBkYW1hZ2UrKztcbiAgICByZXR1cm4gYCR7dHlwZX0gd2FzIGhpdC4gJHtoaXRwb2ludHMoKX0gaGl0cG9pbnRzIHJlbWFpbmluZ2A7XG4gIH1cbiAgZnVuY3Rpb24gaXNTdW5rKCkge1xuICAgIHJldHVybiBkYW1hZ2UgPj0gbGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIGhpdHBvaW50cygpIHtcbiAgICByZXR1cm4gbGVuZ3RoIC0gZGFtYWdlO1xuICB9XG4gIHJldHVybiB7IHR5cGUsIGxlbmd0aCwgZGFtYWdlLCBoaXRwb2ludHMsIGhpdCwgaXNTdW5rIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaXA7XG4iLCJjb25zdCB1c2VySW50ZXJmYWNlID0gKHNoaXBNYWtlclByb3h5LCBwbGF5ZXJJbml0U2NyaXB0LCBnYW1lSW5pdFNjcmlwdCkgPT4ge1xuICBjb25zdCBwYWdlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYWdlQ29udGFpbmVyXCIpO1xuICBsZXQgcDFDb3VudHJ5ID0gXCJcIjtcbiAgbGV0IHAyQ291bnRyeSA9IFwiXCI7XG5cbiAgZnVuY3Rpb24gaW5pdENvdW50cnlTZWxlY3QoKSB7XG4gICAgY29uc3Qgbm9kZUxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNvdW50cnlCb3hcIik7XG4gICAgbm9kZUxpc3QuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDFcIikge1xuICAgICAgICAgIHAxQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJwMSBjb3VudHJ5IGFkZGVkIFwiICsgcDFDb3VudHJ5KTtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInAyIGNvdW50cnkgYWRkZWQgXCIgKyBwMkNvdW50cnkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBzdGFydFNjcmVlbihnYW1lU2NyaXB0Rm4pIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPkJhdHRsZXNoaXA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllclNlbGVjdENvbnRcIj5cbiAgICAgICAgICAgICAgICAgPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJwbGF5ZXJGb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAxXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAxXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDFcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDJcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMlwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG5Db250XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkJlZ2luPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJGb3JtXCIpO1xuICAgIGluaXRDb3VudHJ5U2VsZWN0KCk7XG4gICAgcGxheWVyRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBwbGF5ZXJzID0gcE9iakluaXRpYWxpemVyKFxuICAgICAgICBnYW1lU2NyaXB0Rm4sXG4gICAgICAgIFwiLnBsYXllckZvcm1cIixcbiAgICAgICAgXCJzZWxlY3RwMVwiLFxuICAgICAgICBcInNlbGVjdHAyXCIsXG4gICAgICApO1xuXG4gICAgICBwbGF5ZXJzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICBzaGlwU2NyZWVuKGVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgc2hpcFJhbmRvbWl6ZXIoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gdHJpZ2dlciB0aGUgbmV4dCBzY3JlZW5cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCBjb29yZGluYXRlcyA9IFtdO1xuXG4gICAgY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICBjb25zb2xlLmxvZyhcInJhbmRvbSBjb29yZDogXCIgKyBjb29yZGluYXRlcyk7XG5cbiAgICByZXR1cm4gY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllcjBiaikge1xuICAgIC8vIGdldCByZWZlcmVuY2UgdG8gdGhlIHBhZ2UgY29udGFpbmVyIGFuZCBjbGVhciB0aGUgcGFnZS5cbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidHh0XCI+XG4gICAgICAgICAgICAgICAgICBQbGFjZSB5b3VyIHNoaXBzIVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICBgO1xuICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuXG4gICAgLy8gY2hhbmdlIGluZm8gcGVyIHRoZSBwbGF5ZXIgb2JqXG5cbiAgICAvLyBzdG9yZSB0aGUgaHRtbCBmb3IgdGhlIHNoaXAgcGxhY2VtZW50XG4gICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZ3JpZENvbnRcIik7XG4gICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgY29uc3QgZ3JpZFNpemUgPSAxMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JpZFNpemU7IGkrKykge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHJvdy5jbGFzc0xpc3QuYWRkKFwicm93Q29udFwiKTtcbiAgICAgIGdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQocm93KTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJjZWxsXCIpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgIGNlbGwuZGF0YXNldC5jID0gajtcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKGNlbGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBzeXN0ZW0gZm9yIFVJIHRvIGNvb3JkaW5hdGVzXG4gICAgLy8gaG9sZCByZWZlcmVuY2UgdG8gdGhlIGdyaWQgZWxlbWVudHNcbiAgICAvLyBhY3RpdmF0ZSBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBvZiB0aGUgZ3JpZCBpdGVtc1xuICAgIC8vIGNyZWF0ZSBtZXRob2QgZm9yIGNoZWNraW5nIHRoZSBjb29yZGluYXRlIHNwYWNlIG9uIGEgaG92ZXIgZXZlbnRcbiAgICAvLyBjcmVhdGUgbWV0aG9kIGZvciBhZGRpbmcgdGhlIHNoaXAgdG8gdGhlIGxvY2F0aW9uIG9uIHRoZSBjbGljayBldmVudC5cbiAgfVxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuICAgIGxldCBwbGF5ZXI7XG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IGNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHNoaXBNYWtlclByb3h5IHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihnYW1lU2NyaXB0Rm4sIGZvcm1DbHNzTm1lLCBwMXNlbGVjdGlkLCBwMnNlbGVjdGlkKSB7XG4gICAgLy8gYnVpbGQgdGhlIG9iaiBhbmQgZXhwb3J0IHRvXG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNsc3NObWUpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDFzZWxlY3RpZCk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMnNlbGVjdGlkKTtcbiAgICBsZXQgcGxheWVycyA9IFtdO1xuXG4gICAgY29uc3QgbWFub3dhciA9IDU7XG4gICAgY29uc3QgZnJpZ2F0ZSA9IDQ7XG4gICAgY29uc3Qgc2Nob29uZXIgPSAzO1xuICAgIGNvbnN0IHNsb29wID0gMjtcblxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW1xuICAgICAgICBtYW5vd2FyLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzbG9vcCxcbiAgICAgICAgc2xvb3AsXG4gICAgICBdLFxuICAgIH07XG5cbiAgICBjb25zdCBwbGF5ZXIxID0geyAuLi5wbGF5ZXJvYmogfTtcbiAgICBjb25zdCBwbGF5ZXIyID0geyAuLi5wbGF5ZXJvYmogfTtcblxuICAgIHBsYXllcjEucGxheWVyID0gZHJvcGRvd25maWVsZDEudmFsdWU7XG4gICAgcGxheWVyMS5udW1iZXIgPSAxO1xuICAgIHBsYXllcjEuY291bnRyeSA9IHAxQ291bnRyeTtcblxuICAgIHBsYXllcjIucGxheWVyID0gZHJvcGRvd25maWVsZDIudmFsdWU7XG4gICAgcGxheWVyMi5udW1iZXIgPSAyO1xuICAgIHBsYXllcjIuY291bnRyeSA9IHAyQ291bnRyeTtcblxuICAgIHBsYXllcnMucHVzaChwbGF5ZXIxLCBwbGF5ZXIyKTtcblxuICAgIHJldHVybiBwbGF5ZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gVUl0b0Nvb3JkKCkge31cbiAgZnVuY3Rpb24gc2VuZE1vdmUoKSB7fVxuICBmdW5jdGlvbiBjaGVja1NwYWNlKGNvb3JkaW5hdGVzKSB7fVxuICBzdGFydFNjcmVlbigpO1xuICByZXR1cm4geyBwT2JqSW5pdGlhbGl6ZXIsIHNlbmRNb3ZlIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZXJJbnRlcmZhY2U7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=