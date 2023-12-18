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

  function getNextInline(lastHit){
    // will need to guess next one until you have a legal one that hasnt been used yet
    const binaryOffset = Math.floor(Math.random() * 2);
    const offsetValue = binaryOffset === 0 ? -1 : 1;
    let inlineStrike = [...lastHit];

    if(pursuitAxis === 'h'){
      inlineStrike[1] += offsetValue;
      return inlineStrike;
    } else if(pursuitAxis === 'v'){
      inlineStrike[0] += offsetValue;
      return inlineStrike;
    }
  }

  function inlineMove() {
    // finds the axis by comparing hits and calls an inline guess
    if(pursuitAxis === null){
      const [c1, c2] = hitArr;
      if(c1[0] === c2[0] && c1[1] !== c2[1]){
        pursuitAxis = 'h';
        return getNextInline(c2);
      } else if (c1[0] !== c2[0] && c1[1] === c2[1]){
        pursuitAxis = 'v';
        return getNextInline(c2);
      }
    } else {
      if(streak === false){
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
  function reportMiss(){
    streak = false;
  }
  // report miss function?
  return { randomMove, adjacentMove, inlineMove, nextMove, reportHit, reportMiss, hitArr };
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
    const r = coordinates[0];
    const c = coordinates[1];
    let space = 0;

    // h horizontal : v vertical
    if ((orientation = "h")) {
      space = shipGrid[0].length - 1 - c;
    } else if ((orientation = "v")) {
      space = shipGrid.length - 1 - r;
    }
    return space >= length ? true : false;
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

  function uiInitializer() {}
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
  return { uiInitializer, gameLoop, isGameOver };
};
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixRQUFRO0FBQzVCO0FBQ0Esc0JBQXNCLFFBQVE7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0IsWUFBWTtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBa0IsV0FBVztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7O0FDbEhBO0FBQ0EsZUFBZSxtQkFBTyxDQUFDLGlDQUFVO0FBQ2pDLGtCQUFrQixtQkFBTyxDQUFDLHVDQUFhO0FBQ3ZDLGFBQWEsbUJBQU8sQ0FBQyw2QkFBUTtBQUM3QixZQUFZLG1CQUFPLENBQUMsdUNBQWE7O0FBRWpDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQTs7Ozs7Ozs7Ozs7QUN4RkE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYOztBQUVBOztBQUVBOzs7Ozs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjLE1BQU0sV0FBVyxhQUFhO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDdkNBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cyBmb3IgY3B1IHBsYXllciB3aWxsIGJlIHBsYWNlZCBpbiBwbGF5ZXIudGVzdC5qc1xuLy8gaGl0IGJvb2wgbWlnaHQgbm90IHBsYXkgYSByb2xlLCByZW1lbWJlciB0byBkZWxldGUgaWYgbm8gcm9sZS5cbmNvbnN0IGNwdVBsYXllciA9ICgpID0+IHtcbiAgbGV0IHN0YXRlID0gXCJyYW5kb21cIjtcbiAgbGV0IGhpdCA9IGZhbHNlO1xuICBsZXQgc3RyZWFrID0gZmFsc2U7XG4gIGxldCBoaXRBcnIgPSBbXTtcbiAgbGV0IHB1cnN1aXRBeGlzID0gbnVsbDsgXG5cblxuICBmdW5jdGlvbiByYW5kb21Nb3ZlKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5kb21Db29yZCA9IFtdO1xuXG4gICAgcmFuZG9tQ29vcmQucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuZG9tQ29vcmQ7XG4gIH1cblxuICAvLyB3aWxsIG5lZWQgdG8gaW1wbGVtZW50IHRoZSBsZWdhbCBtb3ZlIC0+IGRlcGVuZGVuY3kgaW5qZWN0aW9uIGZyb20gZ2FtZWJvYXJkIHNjcmlwdFxuICBmdW5jdGlvbiBhZGphY2VudE1vdmUoKSB7XG4gICAgLy8gd2lsbCByZXR1cm4gY29vcmRpbmF0ZSBpbiBlaXRoZXIgc2FtZSByb3cgb3IgY29sdW1uIGFzIGxhc3RIaXRcbiAgICBjb25zdCBbbGFzdEhpdF0gPSBoaXRBcnI7XG4gICAgbGV0IGFkamFjZW50U3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuICAgIC8vIHJhbmRvbWx5IGNob29zZSBlaXRoZXIgcm93IG9yIGNvbHVtbiB0byBjaGFuZ2VcbiAgICBjb25zdCBheGlzID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgLy8gMCAtPiAtMSB3aWxsIGJlIGFkZGVkIHx8IDEgLT4gMSB3aWxsIGJlIGFkZGVkXG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgYWRqYWNlbnRTdHJpa2VbYXhpc10gKz0gb2Zmc2V0VmFsdWU7XG5cbiAgICByZXR1cm4gYWRqYWNlbnRTdHJpa2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0SW5saW5lKGxhc3RIaXQpe1xuICAgIC8vIHdpbGwgbmVlZCB0byBndWVzcyBuZXh0IG9uZSB1bnRpbCB5b3UgaGF2ZSBhIGxlZ2FsIG9uZSB0aGF0IGhhc250IGJlZW4gdXNlZCB5ZXRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYocHVyc3VpdEF4aXMgPT09ICdoJyl7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICAgIH0gZWxzZSBpZihwdXJzdWl0QXhpcyA9PT0gJ3YnKXtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZSgpIHtcbiAgICAvLyBmaW5kcyB0aGUgYXhpcyBieSBjb21wYXJpbmcgaGl0cyBhbmQgY2FsbHMgYW4gaW5saW5lIGd1ZXNzXG4gICAgaWYocHVyc3VpdEF4aXMgPT09IG51bGwpe1xuICAgICAgY29uc3QgW2MxLCBjMl0gPSBoaXRBcnI7XG4gICAgICBpZihjMVswXSA9PT0gYzJbMF0gJiYgYzFbMV0gIT09IGMyWzFdKXtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSAnaCc7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH0gZWxzZSBpZiAoYzFbMF0gIT09IGMyWzBdICYmIGMxWzFdID09PSBjMlsxXSl7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gJ3YnO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKHN0cmVhayA9PT0gZmFsc2Upe1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbMF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBtb2RlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH1cbiAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCl7XG4gICAgc3RyZWFrID0gZmFsc2U7XG4gIH1cbiAgLy8gcmVwb3J0IG1pc3MgZnVuY3Rpb24/XG4gIHJldHVybiB7IHJhbmRvbU1vdmUsIGFkamFjZW50TW92ZSwgaW5saW5lTW92ZSwgbmV4dE1vdmUsIHJlcG9ydEhpdCwgcmVwb3J0TWlzcywgaGl0QXJyIH07XG59O1xubW9kdWxlLmV4cG9ydHMgPSBjcHVQbGF5ZXI7XG5cbi8vIGF0dGFjayBvbiBwbGF5ZXIgY2xhc3MgYWNjZXB0cyBhIGNvb3JkaW5hdGUgcGFpci4gaG93IHRoYXQgcGFpciBnZXRzIGZvcm11bGF0ZWQgZG9lcyBub3QgbWF0dGVyXG4vLyBoYXZlIGEgZ2VuZXJhbCBuZXh0TW92ZSBmdW5jdGlvbiB0aGF0IHdpbGwgaW50ZWxsaWdlbnRseSBkZXRlcm1pbmUgd2hhdCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZFxuLy8gYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIGhpdHMuXG4vLyB0aGUgaW5mb3JtYXRpb24geW91IHdvdWxkIG5lZWQgcmVjb3JkIHdoZW4geW91IGhhdmUgdHdvIGhpdHMuIGlmIHlvdSBoYXZlIHR3byBoaXRzIHlvdSBuZWVkIHRvIGZpZ3VyZSBvdXQgdGhlIG9yaWVudGF0aW9uIG9mIHRoYXQgc2hpcCBhbmQgcmVwZWF0ZWRseSAobG9vcCkgc3RyaWtlIGlubGluZSB1bnRpbCB0aGVyZSBpcyBhIHN1bmsgc2hpcC5cbi8vXG4vLyBjb25jbHVzaW9uOiB0aGVyZSBkZWZpbml0ZWx5IG5lZWRzIHRvIGJlIGEgd2F5IGZvciB0aGUgZ2FtZWJvYXJkIHRvIGNvbW11bmljYXRlIGJhY2sgdG8gdGhlIGNwdSBzY3JpcHQuXG4vL1xuLy8gY2FsbGJhY2sgZm5zIHRoYXQgY2hlY2sgb24gZWFjaCBtb3ZlPyBvciBpcyBpdCBmZWQgdG8gdGhlIGNwdSBzY3JpcHQgYnkgdGhlIGdhbWVsb29wP1xuIiwiY29uc3QgZ2FtZUJvYXJkID0gKCkgPT4ge1xuICBsZXQgc2hpcHMgPSBbXTtcbiAgZnVuY3Rpb24gZ3JpZE1ha2VyKCkge1xuICAgIGdyaWQgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZ3JpZFtpXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGdyaWRbaV1bal0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JpZDtcbiAgfVxuXG4gIC8vIGluaXRpYWxpemVyIGZvciB0aGUgZ3JpZFxuICBsZXQgc2hpcEdyaWQgPSBncmlkTWFrZXIoKTtcbiAgbGV0IGF0dGFja3NSZWNlaXZlZCA9IGdyaWRNYWtlcigpO1xuXG4gIGZ1bmN0aW9uIHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcbiAgICBsZXQgc3BhY2UgPSAwO1xuXG4gICAgLy8gaCBob3Jpem9udGFsIDogdiB2ZXJ0aWNhbFxuICAgIGlmICgob3JpZW50YXRpb24gPSBcImhcIikpIHtcbiAgICAgIHNwYWNlID0gc2hpcEdyaWRbMF0ubGVuZ3RoIC0gMSAtIGM7XG4gICAgfSBlbHNlIGlmICgob3JpZW50YXRpb24gPSBcInZcIikpIHtcbiAgICAgIHNwYWNlID0gc2hpcEdyaWQubGVuZ3RoIC0gMSAtIHI7XG4gICAgfVxuICAgIHJldHVybiBzcGFjZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gY29vcmRpbmF0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2hpcEdyaWRbY3VycmVudFswXV1bY3VycmVudFsxXV0gPSBzaGlwO1xuICAgICAgY3VycmVudFswXSArPSBvZmZzZXRbMF07XG4gICAgICBjdXJyZW50WzFdICs9IG9mZnNldFsxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTaGlwKHNoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgIGNvbnN0IHJvdyA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGNvbHVtbiA9IGNvb3JkaW5hdGVzWzFdO1xuICAgIHNoaXBzLnB1c2goc2hpcCk7XG5cbiAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgXCJoXCIpKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzAsIDFdKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9yaWVudGF0aW9uID09PSBcInZcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIFwiaFwiKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFsxLCAwXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuXG4gICAgcmV0dXJuIHN0cmlrZVNxdWFyZSA9PT0gbnVsbCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgYyA9IGNvb3JkaW5hdGVzWzFdO1xuXG4gICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgY29uc3QgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcblxuICAgICAgaWYgKHNoaXAuaXNTdW5rKCkgPT09IHRydWUpIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHNlbmQgc2lnbmFsIHRvIGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nIHNoaXBzPyBvclxuICAgICAgICAvLyBqdXN0IGEgZnVuY3Rpb24gdGhhdCByZXBvcnRzIGlmIHRoZXJlIGFyZSBzaGlwcyByZW1haW5pbmcuXG4gICAgICAgIHJldHVybiBgJHtzaGlwLnR5cGV9IGhhcyBiZWVuIHN1bmtgO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpdFJlcG9ydDtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMDtcbiAgICByZXR1cm4gXCJtaXNzXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwc1JlbWFpbmluZygpIHtcbiAgICByZXR1cm4gc2hpcHMubGVuZ3RoID4gMCA/IHNoaXBzLmxlbmd0aCA6IFwiQWxsIHNoaXBzIGhhdmUgc3Vua1wiO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzaGlwR3JpZCxcbiAgICBhdHRhY2tzUmVjZWl2ZWQsXG4gICAgc2hpcHMsXG4gICAgc2hpcEZpdHMsXG4gICAgYWRkU2hpcCxcbiAgICBjYW5TdHJpa2UsXG4gICAgcmVjZWl2ZUF0dGFjayxcbiAgICBzaGlwc1JlbWFpbmluZyxcbiAgfTtcbn07XG5cbi8vXG4vL1xuLy9tYWtlIHN1cmUgbm90IHRvIGxlYXZlIHRoaXMgZ2xvYmFsIHZhcmlhYmxlIVxuLy9cbi8vXG5cbmNvbnN0IHRlc3QgPSBnYW1lQm9hcmQoKTtcbnRlc3QuY2FuU3RyaWtlKFsxLCAyXSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2FtZUJvYXJkO1xuIiwiLy8gaW5kZXggaG91c2VzIHRoZSBkcml2ZXIgY29kZSBpbmNsdWRpbmcgdGhlIGdhbWUgbG9vcFxuY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuY29uc3QgZ2FtZUJvYXJkID0gcmVxdWlyZShcIi4vZ2FtZWJvYXJkXCIpO1xuY29uc3Qgc2hpcCA9IHJlcXVpcmUoXCIuL3NoaXBcIik7XG5jb25zdCBjcHUgPSByZXF1aXJlKFwiLi9jcHVQbGF5ZXJcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiB0byBidWlsZCB0aGUgcGxheWVyIGVsZW1lbnQgZm9yIGNwdVxuICBjb25zdCBjcHVQbGF5ZXJXcmFwcGVyID0gKHBsYXllckNsYXNzLCBjcHVBSSwgZW5lbXlCb2FyZCkgPT4ge1xuICAgIHBsYXllckNsYXNzLmlzQ1BVID0gdHJ1ZTtcbiAgICBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICBsZXQgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB3aGlsZSAocGxheWVyQ2xhc3MuY2FuU3RyaWtlKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpID09PSBmYWxzZSkge1xuICAgICAgICBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0cmlrZVJlc3VsdCA9IHBsYXllckNsYXNzLmF0dGFjayhuZXh0U3RyaWtlLCBlbmVteUJvYXJkKTtcblxuICAgICAgaWYgKHN0cmlrZVJlc3VsdCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfSBlbHNlIGlmIChzdHJpa2VSZXN1bHQgPT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydE1pc3MoKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGF0dGFjayxcbiAgICAgIGlzQ1BVOiBwbGF5ZXJDbGFzcy5pc0NQVSxcbiAgICAgIHBsYXllckJvYXJkOiBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZCxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGNwdUFJID0gY3B1KCk7XG4gIGNvbnN0IHNsb29wUDEgPSBzaGlwKDIpO1xuICBjb25zdCBmcmlnYXRlUDEgPSBzaGlwKDQpO1xuICBjb25zdCBzbG9vcFAyID0gc2hpcCgyKTtcbiAgY29uc3QgZnJpZ2F0ZVAyID0gc2hpcCg0KTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIGNvbnN0IHAxID0gcGxheWVyKFwiRGtcIiwgZ2FtZUJvYXJkKCkpO1xuICBsZXQgcDIgPSBjcHVQbGF5ZXJXcmFwcGVyKFxuICAgIHBsYXllcihcIlVLXCIsIGdhbWVCb2FyZCgpLCB0cnVlKSxcbiAgICBjcHVBSSxcbiAgICBwMS5wbGF5ZXJCb2FyZCxcbiAgKTtcbiAgbGV0IGN1cnJlbnRQbGF5ZXIgPSBwMTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAxLCBbMiwgNF0sIFwiaFwiKTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChzbG9vcFAxLCBbNiwgNF0sIFwiaFwiKTtcbiAgcDEucGxheWVyQm9hcmQuYWRkU2hpcChmcmlnYXRlUDEsIFszLCAyXSwgXCJ2XCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDIsIFsyLCA0XSwgXCJoXCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDIsIFs4LCA0XSwgXCJoXCIpO1xuICBwMi5wbGF5ZXJCb2FyZC5hZGRTaGlwKGZyaWdhdGVQMiwgWzEsIDJdLCBcInZcIik7XG5cbiAgZnVuY3Rpb24gdWlJbml0aWFsaXplcigpIHt9XG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG4gIC8vIGdhbWVMb29wIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVMb29wKGNvb3JkaW5hdGVzID0gXCJcIikge1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFBsYXllciA9PT0gcDEpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHAxLmF0dGFjayhjb29yZGluYXRlcywgcDIucGxheWVyQm9hcmQpO1xuICAgICAgaWYgKGlzTmFOKHAyLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkpKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocDEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHAyO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudFBsYXllciA9PT0gcDIpIHtcbiAgICAgIGNvbnN0IHN0cmlrZSA9IHAyLmF0dGFjayhjb29yZGluYXRlcywgcDEucGxheWVyQm9hcmQpO1xuICAgICAgaWYgKHAxLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCkgPT09IDApIHtcbiAgICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZW5kR2FtZShwMSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50UGxheWVyID0gcDE7XG4gICAgfVxuICAgIGlmIChjdXJyZW50UGxheWVyLmlzQ1BVID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZ2FtZUxvb3AoKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNHYW1lT3ZlcigpIHtcbiAgICByZXR1cm4gZ2FtZU92ZXI7XG4gIH1cbiAgcmV0dXJuIHsgdWlJbml0aWFsaXplciwgZ2FtZUxvb3AsIGlzR2FtZU92ZXIgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVNb2R1bGU7XG4iLCIvLyB0aGlzIHdpbGwgZGVtb25zdHJhdGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gd2l0aCB0aGUgbmVlZGVkIG1ldGhvZHMgZm9yIHRoZSBwbGF5ZXIgYm9hcmQgYW5kIGVuZW15IGJvYXJkIHJlZlxuXG5jb25zdCBwbGF5ZXIgPSAobmF0aW9uYWxpdHksIGJvYXJkRm4sIGlzQ1BVID0gXCJmYWxzZVwiKSA9PiB7XG4gIGNvbnN0IHBsYXllckJvYXJkID0gYm9hcmRGbjtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGlmIChjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpKSB7XG4gICAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIFwidHJ5IGFub3RoZXIgYXR0YWNrXCI7XG4gIH1cblxuICByZXR1cm4geyBuYXRpb25hbGl0eSwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG5cbi8vIHRoZSBhdHRhY2sgZm4gYXMgb2Ygbm93IGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIGNwdSBwbGF5ZXIgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHJlZ2VuZXJhdGUgYW5vdGhlciBtb3ZlIHdpdGhvdXQgbGVhdmluZyBpdHMgY3VycmVudCBzY29wZVxuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG5cbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDI6XG4gICAgICB0eXBlID0gXCJQYXRyb2wgU2xvb3BcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHR5cGUgPSBcIlNjaG9vbmVyXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICB0eXBlID0gXCJGcmlnYXRlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICB0eXBlID0gXCJNYW4tby1XYXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaGlwIHR5cGUgZXhjZXB0aW9uOiBsZW5ndGggbXVzdCBiZSAxLTVcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoaXQoKSB7XG4gICAgZGFtYWdlKys7XG4gICAgcmV0dXJuIGAke3R5cGV9IHdhcyBoaXQuICR7aGl0cG9pbnRzKCl9IGhpdHBvaW50cyByZW1haW5pbmdgO1xuICB9XG4gIGZ1bmN0aW9uIGlzU3VuaygpIHtcbiAgICByZXR1cm4gZGFtYWdlID49IGxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBoaXRwb2ludHMoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCAtIGRhbWFnZTtcbiAgfVxuICByZXR1cm4geyB0eXBlLCBsZW5ndGgsIGRhbWFnZSwgaGl0cG9pbnRzLCBoaXQsIGlzU3VuayB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGlwO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9