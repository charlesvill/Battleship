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
          // shipScreen(element);
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

  function shipScreen(player0bj) {}
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

  function shipPos(playerArr) {
    // pass through the array of objects and shift each one and call a different function depending on if its a cpu or a person and route
    let newPlayerArr = [];
    while (playerArr.length > 0) {
      const current = playerArr.shift();

      if (current.player === "person") {
        let tmpObj = shipScreen(current.player);
        newPlayerArr.push(tmpObj);
      } else {
        let tmpObj = shipRandomizer(current.player);
        newPlayerArr.push(tmpObj);
      }
    }

    // call the game init fn passing the new player array
    // call fn that goes to the actual play screen
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNySUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYOztBQUVBOztBQUVBOzs7Ozs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjLE1BQU0sV0FBVyxhQUFhO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7Ozs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0I7QUFDdEIsc0JBQXNCOztBQUV0QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUM1TUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvY3B1UGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMgZm9yIGNwdSBwbGF5ZXIgd2lsbCBiZSBwbGFjZWQgaW4gcGxheWVyLnRlc3QuanNcbi8vIGhpdCBib29sIG1pZ2h0IG5vdCBwbGF5IGEgcm9sZSwgcmVtZW1iZXIgdG8gZGVsZXRlIGlmIG5vIHJvbGUuXG5jb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgLy8gd2lsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbGVnYWwgbW92ZSAtPiBkZXBlbmRlbmN5IGluamVjdGlvbiBmcm9tIGdhbWVib2FyZCBzY3JpcHRcbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgLy8gd2lsbCBuZWVkIHRvIGd1ZXNzIG5leHQgb25lIHVudGlsIHlvdSBoYXZlIGEgbGVnYWwgb25lIHRoYXQgaGFzbnQgYmVlbiB1c2VkIHlldFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGxldCBpbmxpbmVTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG5cbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IFwiaFwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH0gZWxzZSBpZiAocHVyc3VpdEF4aXMgPT09IFwidlwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMF0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlubGluZU1vdmUoKSB7XG4gICAgLy8gZmluZHMgdGhlIGF4aXMgYnkgY29tcGFyaW5nIGhpdHMgYW5kIGNhbGxzIGFuIGlubGluZSBndWVzc1xuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgW2MxLCBjMl0gPSBoaXRBcnI7XG4gICAgICBpZiAoYzFbMF0gPT09IGMyWzBdICYmIGMxWzFdICE9PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwiaFwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9IGVsc2UgaWYgKGMxWzBdICE9PSBjMlswXSAmJiBjMVsxXSA9PT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcInZcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RyZWFrID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbMF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBtb2RlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH1cbiAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCkge1xuICAgIHN0cmVhayA9IGZhbHNlO1xuICB9XG4gIC8vIHJlcG9ydCBtaXNzIGZ1bmN0aW9uP1xuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuXG4vLyBhdHRhY2sgb24gcGxheWVyIGNsYXNzIGFjY2VwdHMgYSBjb29yZGluYXRlIHBhaXIuIGhvdyB0aGF0IHBhaXIgZ2V0cyBmb3JtdWxhdGVkIGRvZXMgbm90IG1hdHRlclxuLy8gaGF2ZSBhIGdlbmVyYWwgbmV4dE1vdmUgZnVuY3Rpb24gdGhhdCB3aWxsIGludGVsbGlnZW50bHkgZGV0ZXJtaW5lIHdoYXQgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWRcbi8vIGFjY29yZGluZyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiBoaXRzLlxuLy8gdGhlIGluZm9ybWF0aW9uIHlvdSB3b3VsZCBuZWVkIHJlY29yZCB3aGVuIHlvdSBoYXZlIHR3byBoaXRzLiBpZiB5b3UgaGF2ZSB0d28gaGl0cyB5b3UgbmVlZCB0byBmaWd1cmUgb3V0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGF0IHNoaXAgYW5kIHJlcGVhdGVkbHkgKGxvb3ApIHN0cmlrZSBpbmxpbmUgdW50aWwgdGhlcmUgaXMgYSBzdW5rIHNoaXAuXG4vL1xuLy8gY29uY2x1c2lvbjogdGhlcmUgZGVmaW5pdGVseSBuZWVkcyB0byBiZSBhIHdheSBmb3IgdGhlIGdhbWVib2FyZCB0byBjb21tdW5pY2F0ZSBiYWNrIHRvIHRoZSBjcHUgc2NyaXB0LlxuLy9cbi8vIGNhbGxiYWNrIGZucyB0aGF0IGNoZWNrIG9uIGVhY2ggbW92ZT8gb3IgaXMgaXQgZmVkIHRvIHRoZSBjcHUgc2NyaXB0IGJ5IHRoZSBnYW1lbG9vcD9cbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGxldCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgbGV0IGMgPSBjb29yZGluYXRlc1sxXTtcbiAgICBjb25zdCByb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3QgY29mZnNldCA9IG9yaWVudGF0aW9uID09PSBcInZcIiA/IDEgOiAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gY29vcmRpbmF0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2hpcEdyaWRbY3VycmVudFswXV1bY3VycmVudFsxXV0gPSBzaGlwO1xuICAgICAgY3VycmVudFswXSArPSBvZmZzZXRbMF07XG4gICAgICBjdXJyZW50WzFdICs9IG9mZnNldFsxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTaGlwKHNoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgIGNvbnN0IHJvdyA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGNvbHVtbiA9IGNvb3JkaW5hdGVzWzFdO1xuICAgIHNoaXBzLnB1c2goc2hpcCk7XG5cbiAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgXCJoXCIpKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzAsIDFdKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9yaWVudGF0aW9uID09PSBcInZcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIFwiaFwiKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFsxLCAwXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuXG4gICAgcmV0dXJuIHN0cmlrZVNxdWFyZSA9PT0gbnVsbCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgYyA9IGNvb3JkaW5hdGVzWzFdO1xuXG4gICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgY29uc3QgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcblxuICAgICAgaWYgKHNoaXAuaXNTdW5rKCkgPT09IHRydWUpIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHNlbmQgc2lnbmFsIHRvIGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIHNoaXBzPyBvclxuICAgICAgICAvLyBqdXN0IGEgZnVuY3Rpb24gdGhhdCByZXBvcnRzIGlmIHRoZXJlIGFyZSBzaGlwcyByZW1haW5pbmcuXG4gICAgICAgIHJldHVybiBgJHtzaGlwLnR5cGV9IGhhcyBiZWVuIHN1bmtgO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpdFJlcG9ydDtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMDtcbiAgICByZXR1cm4gXCJtaXNzXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwc1JlbWFpbmluZygpIHtcbiAgICByZXR1cm4gc2hpcHMubGVuZ3RoID4gMCA/IHNoaXBzLmxlbmd0aCA6IFwiQWxsIHNoaXBzIGhhdmUgc3Vua1wiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzaGlwR3JpZCxcbiAgICBhdHRhY2tzUmVjZWl2ZWQsXG4gICAgc2hpcHMsXG4gICAgc2hpcEZpdHMsXG4gICAgYWRkU2hpcCxcbiAgICBjYW5TdHJpa2UsXG4gICAgcmVjZWl2ZUF0dGFjayxcbiAgICBzaGlwc1JlbWFpbmluZyxcbiAgfTtcbn07XG5cbi8vXG4vL1xuLy9tYWtlIHN1cmUgbm90IHRvIGxlYXZlIHRoaXMgZ2xvYmFsIHZhcmlhYmxlIVxuLy9cbi8vXG5cbmNvbnN0IHRlc3QgPSBnYW1lQm9hcmQoKTtcbnRlc3QuY2FuU3RyaWtlKFsxLCAyXSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2FtZUJvYXJkO1xuIiwiLy8gaW5kZXggaG91c2VzIHRoZSBkcml2ZXIgY29kZSBpbmNsdWRpbmcgdGhlIGdhbWUgbG9vcFxuY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuY29uc3QgZ2FtZUJvYXJkID0gcmVxdWlyZShcIi4vZ2FtZWJvYXJkXCIpO1xuY29uc3Qgc2hpcCA9IHJlcXVpcmUoXCIuL3NoaXBcIik7XG5jb25zdCBjcHUgPSByZXF1aXJlKFwiLi9jcHVQbGF5ZXJcIik7XG5jb25zdCB1aVNjcmlwdCA9IHJlcXVpcmUoXCIuL3VpXCIpO1xuXG5jb25zdCBnYW1lTW9kdWxlID0gKCkgPT4ge1xuICAvLyB0ZW1wb3JhcnkgaW5pdGlhbGl6ZXJzIHRoYXQgd2lsbCBiZSB3cmFwcGVkIGluIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGFzc2lnbiBnYW1lIGVsZW1lbnRzXG4gIC8vIHRoZSBnYW1lIGluaXRpYWxpemVyIHdpbGwgdXNlIHRoaXMgZnVuY3Rpb24gdG8gYnVpbGQgdGhlIHBsYXllciBlbGVtZW50IGZvciBjcHVcbiAgY29uc3QgY3B1UGxheWVyV3JhcHBlciA9IChwbGF5ZXJDbGFzcywgY3B1QUksIGVuZW15Qm9hcmQpID0+IHtcbiAgICBwbGF5ZXJDbGFzcy5pc0NQVSA9IHRydWU7XG4gICAgZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgbGV0IG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG5cbiAgICAgIGlmIChzdHJpa2VSZXN1bHQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBhdHRhY2ssXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwbGF5ZXJJbml0aWFsaXplcihwbGF5ZXJPYmopIHtcbiAgICBjb25zdCBpc0NQVSA9IHBsYXllck9iai5wbGF5ZXIgPT09IFwicGVyc29uXCIgPyBmYWxzZSA6IHRydWU7XG5cbiAgICBpZiAocGxheWVyT2JqLm51bWJlciA9PT0gMSkge1xuICAgICAgcGxheWVyMSA9IHBsYXllcihwbGF5ZXJPYmouY291bnRyeSwgZ2FtZUJvYXJkKCksIGlzQ1BVKTtcbiAgICAgIGNvbnNvbGUubG9nKFwidGhpcyBvbmUgcDFcIik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXJPYmopO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXllcjIgPSBwbGF5ZXIocGxheWVyT2JqLmNvdW50cnksIGdhbWVCb2FyZCgpLCBpc0NQVSk7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUGxhY2VyUHJveHkobnVtYmVyLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIC8vIHdpbGwgbWFrZSBhbmQgcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBwbGF5ZXIgPSBudW1iZXIgPT09IDEgPyBwbGF5ZXIxIDogcGxheWVyMjtcbiAgICAvLyBmaXJzdCBjaGVjayB0aGUgY29vcmRpbmF0ZXNcbiAgICAvLyB0aGVuIG1ha2UgdGhlIHNoaXBcbiAgICAvLyB0aGVuIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgY2FuRml0ID0gcGxheWVyLnBsYXllckJvYXJkLnNoaXBGaXRzKFxuICAgICAgbGVuZ3RoLFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFwidGhlIGNvb3JkaW5hdGVzIHNlbnQgZml0OiBcIiArIGNhbkZpdCArIFwiIFwiICsgb3JpZW50YXRpb24pO1xuICAgIGlmICghY2FuRml0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IG5ld1NoaXAgPSBzaGlwKGxlbmd0aCk7XG4gICAgcGxheWVyLnBsYXllckJvYXJkLmFkZFNoaXAobmV3U2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcblxuICAgIGNvbnNvbGUubG9nKHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwR3JpZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gZ2FtZUluaXRpYWxpemVyKCkge1xuICAgIC8vIHRoaXMgd2lsbCBhZGQgdGhlIHNoaXBzIHRvIHRoZSBib2FyZDtcbiAgICAvLyBhZnRlciBhZGRpbmcgdGhlIHNoaXBzICwgaXQgd2lsbCBuZWVkIHRvIGNoZWNrIHdobyBpcyBjcHUgYW5kIGluaXRpYWxpemUgdGhlIGNwdXdyYXBwZXJcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcbiAgbGV0IHBsYXllcjEgPSB1bmRlZmluZWQ7XG4gIGxldCBwbGF5ZXIyID0gdW5kZWZpbmVkO1xuICBjb25zb2xlLmxvZyhwbGF5ZXIxKTtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgY29uc3Qgc2xvb3BQMSA9IHNoaXAoMik7XG4gIGNvbnN0IGZyaWdhdGVQMSA9IHNoaXAoNCk7XG4gIGNvbnN0IHNsb29wUDIgPSBzaGlwKDIpO1xuICBjb25zdCBmcmlnYXRlUDIgPSBzaGlwKDQpO1xuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgY29uc3QgcDEgPSBwbGF5ZXIoXCJEa1wiLCBnYW1lQm9hcmQoKSk7XG4gIGxldCBwMiA9IGNwdVBsYXllcldyYXBwZXIoXG4gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAgIGNwdUFJLFxuICAgIHAxLnBsYXllckJvYXJkLFxuICApO1xuICBsZXQgY3VycmVudFBsYXllciA9IHAxO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDEsIFsyLCA0XSwgXCJoXCIpO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDEsIFs2LCA0XSwgXCJoXCIpO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKGZyaWdhdGVQMSwgWzMsIDJdLCBcInZcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMiwgWzIsIDRdLCBcImhcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMiwgWzgsIDRdLCBcImhcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoZnJpZ2F0ZVAyLCBbMSwgMl0sIFwidlwiKTtcblxuICBmdW5jdGlvbiBlbmRHYW1lKHdpbm5lcikge1xuICAgIC8vIHNvbWUgc2hpdCBoZXJlIHRvIGVuZCB0aGUgZ2FtZVxuICAgIGNvbnNvbGUubG9nKFwidGhpcyBtZiBvdmVyIGxvbFwiKTtcbiAgfVxuICAvLyBnYW1lTG9vcCBpcyBjYWxsZWQgYnkgZXZlbnQgaGFuZGxlciBvbiBVSSBpbnRlcmFjdGlvbiAtb3ItIGJ5IHJlY3Vyc2lvbiB3aGVuIGl0cyBjcHUgdHVyblxuICBmdW5jdGlvbiBnYW1lTG9vcChjb29yZGluYXRlcyA9IFwiXCIpIHtcbiAgICBpZiAoZ2FtZU92ZXIpIHtcbiAgICAgIHJldHVybiBlbmRHYW1lKCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHAxKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwMS5hdHRhY2soY29vcmRpbmF0ZXMsIHAyLnBsYXllckJvYXJkKTtcbiAgICAgIGlmIChpc05hTihwMi5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpKSkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHAxKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwMjtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHAyKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwMi5hdHRhY2soY29vcmRpbmF0ZXMsIHAxLnBsYXllckJvYXJkKTtcbiAgICAgIGlmIChwMS5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpID09PSAwKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocDEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHAxO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFBsYXllci5pc0NQVSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGdhbWVMb29wKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzR2FtZU92ZXIoKSB7XG4gICAgcmV0dXJuIGdhbWVPdmVyO1xuICB9XG4gIHJldHVybiB7IGdhbWVMb29wLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKG5hdGlvbmFsaXR5LCBib2FyZEZuLCBpc0NQVSA9IFwiZmFsc2VcIikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgcmV0dXJuIGVuZW15Qm9hcmQuY2FuU3RyaWtlKGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0dGFjayhjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIC8vIHdpbGwgbmVlZCBjb2RlIGhlcmUgZm9yIGRldGVybWluaW5nIGxlZ2FsIG1vdmVcbiAgICBpZiAoY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSkge1xuICAgICAgcmV0dXJuIGVuZW15Qm9hcmQucmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcyk7XG4gICAgfVxuICAgIHJldHVybiBcInRyeSBhbm90aGVyIGF0dGFja1wiO1xuICB9XG5cbiAgcmV0dXJuIHsgbmF0aW9uYWxpdHksIHBsYXllckJvYXJkLCBjYW5TdHJpa2UsIGF0dGFjaywgaXNDUFUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxheWVyO1xuXG4vLyB0aGUgYXR0YWNrIGZuIGFzIG9mIG5vdyBkb2VzIG5vdCB3b3JrIHdlbGwgd2l0aCBjcHUgcGxheWVyIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byByZWdlbmVyYXRlIGFub3RoZXIgbW92ZSB3aXRob3V0IGxlYXZpbmcgaXRzIGN1cnJlbnQgc2NvcGVcbiIsIi8vIHNoaXBzIHNob3VsZCBoYXZlIHRoZSBjaG9pY2Ugb2Y6XG4vLyA1IG1hbi1vLXdhclxuLy8gNCBmcmlnYXRlXG4vLyAzIHggMyBzY2hvb25lclxuLy8gMiB4IDIgcGF0cm9sIHNsb29wXG5jb25zdCBzaGlwID0gKGxlbmd0aCkgPT4ge1xuICBsZXQgdHlwZSA9IFwiXCI7XG4gIGxldCBkYW1hZ2UgPSAwO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIHJldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHsgdHlwZSwgbGVuZ3RoLCBkYW1hZ2UsIGhpdHBvaW50cywgaGl0LCBpc1N1bmsgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInAxIGNvdW50cnkgYWRkZWQgXCIgKyBwMUNvdW50cnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAyXCIpIHtcbiAgICAgICAgICBwMkNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwicDIgY291bnRyeSBhZGRlZCBcIiArIHAyQ291bnRyeSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIHN0YXJ0U2NyZWVuKGdhbWVTY3JpcHRGbikge1xuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+QmF0dGxlc2hpcDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyU2VsZWN0Q29udFwiPlxuICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249XCJcIiBjbGFzcz1cInBsYXllckZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDFcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDFcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMVwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMlwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAyXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+QmVnaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllckZvcm1cIik7XG4gICAgaW5pdENvdW50cnlTZWxlY3QoKTtcbiAgICBwbGF5ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBwT2JqSW5pdGlhbGl6ZXIoXG4gICAgICAgIGdhbWVTY3JpcHRGbixcbiAgICAgICAgXCIucGxheWVyRm9ybVwiLFxuICAgICAgICBcInNlbGVjdHAxXCIsXG4gICAgICAgIFwic2VsZWN0cDJcIixcbiAgICAgICk7XG5cbiAgICAgIHBsYXllcnMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5wbGF5ZXIgPT09IFwicGVyc29uXCIpIHtcbiAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgIC8vIHNoaXBTY3JlZW4oZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICBzaGlwUmFuZG9taXplcihlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyB0cmlnZ2VyIHRoZSBuZXh0IHNjcmVlblxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQ29vcmQoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IGNvb3JkaW5hdGVzID0gW107XG5cbiAgICBjb29yZGluYXRlcy5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIGNvbnNvbGUubG9nKFwicmFuZG9tIGNvb3JkOiBcIiArIGNvb3JkaW5hdGVzKTtcblxuICAgIHJldHVybiBjb29yZGluYXRlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBTY3JlZW4ocGxheWVyMGJqKSB7fVxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuICAgIGxldCBwbGF5ZXI7XG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IGNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHNoaXBNYWtlclByb3h5IHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUG9zKHBsYXllckFycikge1xuICAgIC8vIHBhc3MgdGhyb3VnaCB0aGUgYXJyYXkgb2Ygb2JqZWN0cyBhbmQgc2hpZnQgZWFjaCBvbmUgYW5kIGNhbGwgYSBkaWZmZXJlbnQgZnVuY3Rpb24gZGVwZW5kaW5nIG9uIGlmIGl0cyBhIGNwdSBvciBhIHBlcnNvbiBhbmQgcm91dGVcbiAgICBsZXQgbmV3UGxheWVyQXJyID0gW107XG4gICAgd2hpbGUgKHBsYXllckFyci5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gcGxheWVyQXJyLnNoaWZ0KCk7XG5cbiAgICAgIGlmIChjdXJyZW50LnBsYXllciA9PT0gXCJwZXJzb25cIikge1xuICAgICAgICBsZXQgdG1wT2JqID0gc2hpcFNjcmVlbihjdXJyZW50LnBsYXllcik7XG4gICAgICAgIG5ld1BsYXllckFyci5wdXNoKHRtcE9iaik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgdG1wT2JqID0gc2hpcFJhbmRvbWl6ZXIoY3VycmVudC5wbGF5ZXIpO1xuICAgICAgICBuZXdQbGF5ZXJBcnIucHVzaCh0bXBPYmopO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNhbGwgdGhlIGdhbWUgaW5pdCBmbiBwYXNzaW5nIHRoZSBuZXcgcGxheWVyIGFycmF5XG4gICAgLy8gY2FsbCBmbiB0aGF0IGdvZXMgdG8gdGhlIGFjdHVhbCBwbGF5IHNjcmVlblxuICB9XG4gIC8vIGJ1aWxkcyBhIHBsYXllcm9iaiB0aGF0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHRvIGluaXRpYWxpemUgdGhlIGdhbWVcbiAgZnVuY3Rpb24gcE9iakluaXRpYWxpemVyKGdhbWVTY3JpcHRGbiwgZm9ybUNsc3NObWUsIHAxc2VsZWN0aWQsIHAyc2VsZWN0aWQpIHtcbiAgICAvLyBidWlsZCB0aGUgb2JqIGFuZCBleHBvcnQgdG9cbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ2xzc05tZSk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMXNlbGVjdGlkKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAyc2VsZWN0aWQpO1xuICAgIGxldCBwbGF5ZXJzID0gW107XG5cbiAgICBjb25zdCBtYW5vd2FyID0gNTtcbiAgICBjb25zdCBmcmlnYXRlID0gNDtcbiAgICBjb25zdCBzY2hvb25lciA9IDM7XG4gICAgY29uc3Qgc2xvb3AgPSAyO1xuXG4gICAgY29uc3QgcGxheWVyb2JqID0ge1xuICAgICAgcGxheWVyOiB1bmRlZmluZWQsXG4gICAgICBudW1iZXI6IHVuZGVmaW5lZCxcbiAgICAgIGNvdW50cnk6IHVuZGVmaW5lZCxcbiAgICAgIHNoaXBzOiBbXG4gICAgICAgIG1hbm93YXIsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNsb29wLFxuICAgICAgICBzbG9vcCxcbiAgICAgIF0sXG4gICAgfTtcblxuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiBVSXRvQ29vcmQoKSB7fVxuICBmdW5jdGlvbiBzZW5kTW92ZSgpIHt9XG4gIGZ1bmN0aW9uIGNoZWNrU3BhY2UoY29vcmRpbmF0ZXMpIHt9XG4gIHN0YXJ0U2NyZWVuKCk7XG4gIHJldHVybiB7IHBPYmpJbml0aWFsaXplciwgc2VuZE1vdmUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXNlckludGVyZmFjZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==