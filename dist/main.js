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
                <div class="shipBox">
                    <div class="ship" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship" draggable="true"></div>
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
      const orientation = e.currentTarget.dataset.orientation;
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
    //  cells.forEach((cell) => {
    //    cell.addEventListener("mouseover", (e) => {
    //      r = Number(e.currentTarget.dataset.r);
    //      c = Number(e.currentTarget.dataset.c);
    //      coord = [r, c];
    //      // const shipFits = shipMakerProxy(player0bj.number);
    //    });
    //  });
    //  cells.forEach((cell) => {
    //    cell.addEventListener("click", (e) => {
    //      const orientation = orientationBtn.dataset.orientation;
    //      console.log(`current orientation is ${orientation}`);
    //    });
    //  });

    cells.forEach((cell) => {
      const dragOverHandler = (e) => {
        e.preventDefault();

        cell.classList.add("mouseover");

        r = Number(e.currentTarget.dataset.r);
        c = Number(e.currentTarget.dataset.c);
        coord = [r, c];
        console.log(coord);
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
      ship.addEventListener("dragstart", (e) => {
        const clone = ship.cloneNode(true);

        // Set the offset for the drag image
        const offsetX = 20; // Set your desired offset value
        e.dataTransfer.setDragImage(clone, 0, 0);
        ship.classList.add("dragging");
      });

      ship.addEventListener("dragend", () => {
        ship.classList.remove("dragging");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQzNIQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsUUFBUTtBQUM1QjtBQUNBLHNCQUFzQixRQUFRO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW9CLFlBQVk7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG9CQUFvQixZQUFZO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFrQixXQUFXO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7QUN4SEE7QUFDQSxlQUFlLG1CQUFPLENBQUMsaUNBQVU7QUFDakMsa0JBQWtCLG1CQUFPLENBQUMsdUNBQWE7QUFDdkMsYUFBYSxtQkFBTyxDQUFDLDZCQUFRO0FBQzdCLFlBQVksbUJBQU8sQ0FBQyx1Q0FBYTtBQUNqQyxpQkFBaUIsbUJBQU8sQ0FBQyx5QkFBTTs7QUFFL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUM5SUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYOztBQUVBOztBQUVBOzs7Ozs7Ozs7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjLE1BQU0sV0FBVyxhQUFhO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7Ozs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW9CLGNBQWM7QUFDbEM7QUFDQTtBQUNBOztBQUVBLHNCQUFzQixjQUFjO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RCxXQUFXO0FBQ1gsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsT0FBTzs7QUFFUDtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCO0FBQ3RCLHNCQUFzQjs7QUFFdEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDelVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzIGZvciBjcHUgcGxheWVyIHdpbGwgYmUgcGxhY2VkIGluIHBsYXllci50ZXN0LmpzXG4vLyBoaXQgYm9vbCBtaWdodCBub3QgcGxheSBhIHJvbGUsIHJlbWVtYmVyIHRvIGRlbGV0ZSBpZiBubyByb2xlLlxuY29uc3QgY3B1UGxheWVyID0gKCkgPT4ge1xuICBsZXQgc3RhdGUgPSBcInJhbmRvbVwiO1xuICBsZXQgaGl0ID0gZmFsc2U7XG4gIGxldCBzdHJlYWsgPSBmYWxzZTtcbiAgbGV0IGhpdEFyciA9IFtdO1xuICBsZXQgcHVyc3VpdEF4aXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJhbmRvbUNvb3JkID0gW107XG5cbiAgICByYW5kb21Db29yZC5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIHJldHVybiByYW5kb21Db29yZDtcbiAgfVxuXG4gIC8vIHdpbGwgbmVlZCB0byBpbXBsZW1lbnQgdGhlIGxlZ2FsIG1vdmUgLT4gZGVwZW5kZW5jeSBpbmplY3Rpb24gZnJvbSBnYW1lYm9hcmQgc2NyaXB0XG4gIGZ1bmN0aW9uIGFkamFjZW50TW92ZSgpIHtcbiAgICAvLyB3aWxsIHJldHVybiBjb29yZGluYXRlIGluIGVpdGhlciBzYW1lIHJvdyBvciBjb2x1bW4gYXMgbGFzdEhpdFxuICAgIGNvbnN0IFtsYXN0SGl0XSA9IGhpdEFycjtcbiAgICBsZXQgYWRqYWNlbnRTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG4gICAgLy8gcmFuZG9tbHkgY2hvb3NlIGVpdGhlciByb3cgb3IgY29sdW1uIHRvIGNoYW5nZVxuICAgIGNvbnN0IGF4aXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAvLyAwIC0+IC0xIHdpbGwgYmUgYWRkZWQgfHwgMSAtPiAxIHdpbGwgYmUgYWRkZWRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBhZGphY2VudFN0cmlrZVtheGlzXSArPSBvZmZzZXRWYWx1ZTtcblxuICAgIHJldHVybiBhZGphY2VudFN0cmlrZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRJbmxpbmUobGFzdEhpdCkge1xuICAgIC8vIHdpbGwgbmVlZCB0byBndWVzcyBuZXh0IG9uZSB1bnRpbCB5b3UgaGF2ZSBhIGxlZ2FsIG9uZSB0aGF0IGhhc250IGJlZW4gdXNlZCB5ZXRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBcImhcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzFdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9IGVsc2UgaWYgKHB1cnN1aXRBeGlzID09PSBcInZcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzBdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmxpbmVNb3ZlKCkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtjMSwgYzJdID0gaGl0QXJyO1xuICAgICAgaWYgKGMxWzBdID09PSBjMlswXSAmJiBjMVsxXSAhPT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfSBlbHNlIGlmIChjMVswXSAhPT0gYzJbMF0gJiYgYzFbMV0gPT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFycltoaXRBcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgLy8gY29uZGl0aW9uIGlmIHRoZSBsYXN0IHN0cmlrZSB3YXMgYSBtaXNzIHRoZW4gc3RhcnQgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGxpc3RcbiAgICAgIC8vIHRha2UgdGhlIGxhc3Qga25vd24gaGl0IGFuZCBhZGQgdG8gaXRcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbmV4dE1vdmUoKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgbW9kZSA9IFwicmFuZG9tXCI7XG4gICAgICBoaXRBcnIgPSBbXTtcbiAgICAgIHB1cnN1aXRBeGlzID0gbnVsbDtcbiAgICB9XG4gICAgaGl0QXJyLnB1c2goY29vcmRpbmF0ZSk7XG4gICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgIHN0YXRlID0gXCJhZGphY2VudFwiO1xuICAgIH0gZWxzZSBpZiAoaGl0QXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICAvLyByZXBvcnQgbWlzcyBmdW5jdGlvbj9cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcblxuLy8gYXR0YWNrIG9uIHBsYXllciBjbGFzcyBhY2NlcHRzIGEgY29vcmRpbmF0ZSBwYWlyLiBob3cgdGhhdCBwYWlyIGdldHMgZm9ybXVsYXRlZCBkb2VzIG5vdCBtYXR0ZXJcbi8vIGhhdmUgYSBnZW5lcmFsIG5leHRNb3ZlIGZ1bmN0aW9uIHRoYXQgd2lsbCBpbnRlbGxpZ2VudGx5IGRldGVybWluZSB3aGF0IGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkXG4vLyBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgaGl0cy5cbi8vIHRoZSBpbmZvcm1hdGlvbiB5b3Ugd291bGQgbmVlZCByZWNvcmQgd2hlbiB5b3UgaGF2ZSB0d28gaGl0cy4gaWYgeW91IGhhdmUgdHdvIGhpdHMgeW91IG5lZWQgdG8gZmlndXJlIG91dCB0aGUgb3JpZW50YXRpb24gb2YgdGhhdCBzaGlwIGFuZCByZXBlYXRlZGx5IChsb29wKSBzdHJpa2UgaW5saW5lIHVudGlsIHRoZXJlIGlzIGEgc3VuayBzaGlwLlxuLy9cbi8vIGNvbmNsdXNpb246IHRoZXJlIGRlZmluaXRlbHkgbmVlZHMgdG8gYmUgYSB3YXkgZm9yIHRoZSBnYW1lYm9hcmQgdG8gY29tbXVuaWNhdGUgYmFjayB0byB0aGUgY3B1IHNjcmlwdC5cbi8vXG4vLyBjYWxsYmFjayBmbnMgdGhhdCBjaGVjayBvbiBlYWNoIG1vdmU/IG9yIGlzIGl0IGZlZCB0byB0aGUgY3B1IHNjcmlwdCBieSB0aGUgZ2FtZWxvb3A/XG4iLCJjb25zdCBnYW1lQm9hcmQgPSAoKSA9PiB7XG4gIGxldCBzaGlwcyA9IFtdO1xuICBmdW5jdGlvbiBncmlkTWFrZXIoKSB7XG4gICAgZ3JpZCA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBncmlkW2ldID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgZ3JpZFtpXVtqXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmlkO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZXIgZm9yIHRoZSBncmlkXG4gIGxldCBzaGlwR3JpZCA9IGdyaWRNYWtlcigpO1xuICBsZXQgYXR0YWNrc1JlY2VpdmVkID0gZ3JpZE1ha2VyKCk7XG5cbiAgZnVuY3Rpb24gc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBsZXQgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGxldCBjID0gY29vcmRpbmF0ZXNbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJ2XCIgPyAxIDogMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgciArPSByb2Zmc2V0O1xuICAgICAgYyArPSBjb2Zmc2V0O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgb2Zmc2V0KSB7XG4gICAgbGV0IGN1cnJlbnQgPSBjb29yZGluYXRlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgY29uc3Qgcm93ID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgY29sdW1uID0gY29vcmRpbmF0ZXNbMV07XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBcImhcIikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMCwgMV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3JpZW50YXRpb24gPT09IFwidlwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgXCJoXCIpKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzEsIDBdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCBbciwgY10gPSBjb29yZGluYXRlcztcbiAgICBjb25zdCBzdHJpa2VTcXVhcmUgPSBhdHRhY2tzUmVjZWl2ZWRbcl1bY107XG5cbiAgICByZXR1cm4gc3RyaWtlU3F1YXJlID09PSBudWxsID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcykge1xuICAgIGNvbnN0IHIgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjID0gY29vcmRpbmF0ZXNbMV07XG5cbiAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHNoaXAgPSBzaGlwR3JpZFtyXVtjXTtcbiAgICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDE7XG4gICAgICBjb25zdCBoaXRSZXBvcnQgPSBzaGlwLmhpdCgpO1xuXG4gICAgICBpZiAoc2hpcC5pc1N1bmsoKSA9PT0gdHJ1ZSkge1xuICAgICAgICBzaGlwcyA9IHNoaXBzLmZpbHRlcigoZWxlbWVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50ICE9PSBzaGlwO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gc2VuZCBzaWduYWwgdG8gY2hlY2sgaWYgdGhlcmUgYXJlIGFueSByZW1haW5pbmcgc2hpcHM/IG9yXG4gICAgICAgIC8vIGp1c3QgYSBmdW5jdGlvbiB0aGF0IHJlcG9ydHMgaWYgdGhlcmUgYXJlIHNoaXBzIHJlbWFpbmluZy5cbiAgICAgICAgcmV0dXJuIGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGl0UmVwb3J0O1xuICAgIH1cbiAgICAvLyByZWNvcmQgdGhlIG1pc3NcbiAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAwO1xuICAgIHJldHVybiBcIm1pc3NcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxuLy9cbi8vXG4vL21ha2Ugc3VyZSBub3QgdG8gbGVhdmUgdGhpcyBnbG9iYWwgdmFyaWFibGUhXG4vL1xuLy9cblxuY29uc3QgdGVzdCA9IGdhbWVCb2FyZCgpO1xudGVzdC5jYW5TdHJpa2UoWzEsIDJdKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiB0byBidWlsZCB0aGUgcGxheWVyIGVsZW1lbnQgZm9yIGNwdVxuICBjb25zdCBjcHVQbGF5ZXJXcmFwcGVyID0gKHBsYXllckNsYXNzLCBjcHVBSSwgZW5lbXlCb2FyZCkgPT4ge1xuICAgIHBsYXllckNsYXNzLmlzQ1BVID0gdHJ1ZTtcbiAgICBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICBsZXQgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB3aGlsZSAocGxheWVyQ2xhc3MuY2FuU3RyaWtlKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpID09PSBmYWxzZSkge1xuICAgICAgICBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0cmlrZVJlc3VsdCA9IHBsYXllckNsYXNzLmF0dGFjayhuZXh0U3RyaWtlLCBlbmVteUJvYXJkKTtcblxuICAgICAgaWYgKHN0cmlrZVJlc3VsdCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfSBlbHNlIGlmIChzdHJpa2VSZXN1bHQgPT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydE1pc3MoKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGF0dGFjayxcbiAgICAgIGlzQ1BVOiBwbGF5ZXJDbGFzcy5pc0NQVSxcbiAgICAgIHBsYXllckJvYXJkOiBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZCxcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBsYXllckluaXRpYWxpemVyKHBsYXllck9iaikge1xuICAgIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcblxuICAgIGlmIChwbGF5ZXJPYmoubnVtYmVyID09PSAxKSB7XG4gICAgICBwbGF5ZXIxID0gcGxheWVyKHBsYXllck9iai5jb3VudHJ5LCBnYW1lQm9hcmQoKSwgaXNDUFUpO1xuICAgICAgY29uc29sZS5sb2coXCJ0aGlzIG9uZSBwMVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllck9iaik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGxheWVyMiA9IHBsYXllcihwbGF5ZXJPYmouY291bnRyeSwgZ2FtZUJvYXJkKCksIGlzQ1BVKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllcjIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBQbGFjZXJQcm94eShcbiAgICBudW1iZXIsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGNoZWNrb25seSA9IGZhbHNlLFxuICApIHtcbiAgICAvLyB3aWxsIG1ha2UgYW5kIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgcGxheWVyID0gbnVtYmVyID09PSAxID8gcGxheWVyMSA6IHBsYXllcjI7XG4gICAgLy8gZmlyc3QgY2hlY2sgdGhlIGNvb3JkaW5hdGVzXG4gICAgLy8gdGhlbiBtYWtlIHRoZSBzaGlwXG4gICAgLy8gdGhlbiBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IGNhbkZpdCA9IHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwRml0cyhcbiAgICAgIGxlbmd0aCxcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZyhcInRoZSBjb29yZGluYXRlcyBzZW50IGZpdDogXCIgKyBjYW5GaXQgKyBcIiBcIiArIG9yaWVudGF0aW9uKTtcbiAgICBpZiAoIWNhbkZpdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrb25seSkge1xuICAgICAgY29uc3QgbmV3U2hpcCA9IHNoaXAobGVuZ3RoKTtcbiAgICAgIHBsYXllci5wbGF5ZXJCb2FyZC5hZGRTaGlwKG5ld1NoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEdyaWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2FtZUluaXRpYWxpemVyKCkge1xuICAgIC8vIHRoaXMgd2lsbCBhZGQgdGhlIHNoaXBzIHRvIHRoZSBib2FyZDtcbiAgICAvLyBhZnRlciBhZGRpbmcgdGhlIHNoaXBzICwgaXQgd2lsbCBuZWVkIHRvIGNoZWNrIHdobyBpcyBjcHUgYW5kIGluaXRpYWxpemUgdGhlIGNwdXdyYXBwZXJcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcbiAgbGV0IHBsYXllcjEgPSB1bmRlZmluZWQ7XG4gIGxldCBwbGF5ZXIyID0gdW5kZWZpbmVkO1xuICBjb25zb2xlLmxvZyhwbGF5ZXIxKTtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgY29uc3Qgc2xvb3BQMSA9IHNoaXAoMik7XG4gIGNvbnN0IGZyaWdhdGVQMSA9IHNoaXAoNCk7XG4gIGNvbnN0IHNsb29wUDIgPSBzaGlwKDIpO1xuICBjb25zdCBmcmlnYXRlUDIgPSBzaGlwKDQpO1xuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgY29uc3QgcDEgPSBwbGF5ZXIoXCJEa1wiLCBnYW1lQm9hcmQoKSk7XG4gIGxldCBwMiA9IGNwdVBsYXllcldyYXBwZXIoXG4gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAgIGNwdUFJLFxuICAgIHAxLnBsYXllckJvYXJkLFxuICApO1xuICBsZXQgY3VycmVudFBsYXllciA9IHAxO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDEsIFsyLCA0XSwgXCJoXCIpO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKHNsb29wUDEsIFs2LCA0XSwgXCJoXCIpO1xuICBwMS5wbGF5ZXJCb2FyZC5hZGRTaGlwKGZyaWdhdGVQMSwgWzMsIDJdLCBcInZcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMiwgWzIsIDRdLCBcImhcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoc2xvb3BQMiwgWzgsIDRdLCBcImhcIik7XG4gIHAyLnBsYXllckJvYXJkLmFkZFNoaXAoZnJpZ2F0ZVAyLCBbMSwgMl0sIFwidlwiKTtcblxuICBmdW5jdGlvbiBlbmRHYW1lKHdpbm5lcikge1xuICAgIC8vIHNvbWUgc2hpdCBoZXJlIHRvIGVuZCB0aGUgZ2FtZVxuICAgIGNvbnNvbGUubG9nKFwidGhpcyBtZiBvdmVyIGxvbFwiKTtcbiAgfVxuICAvLyBnYW1lTG9vcCBpcyBjYWxsZWQgYnkgZXZlbnQgaGFuZGxlciBvbiBVSSBpbnRlcmFjdGlvbiAtb3ItIGJ5IHJlY3Vyc2lvbiB3aGVuIGl0cyBjcHUgdHVyblxuICBmdW5jdGlvbiBnYW1lTG9vcChjb29yZGluYXRlcyA9IFwiXCIpIHtcbiAgICBpZiAoZ2FtZU92ZXIpIHtcbiAgICAgIHJldHVybiBlbmRHYW1lKCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHAxKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwMS5hdHRhY2soY29vcmRpbmF0ZXMsIHAyLnBsYXllckJvYXJkKTtcbiAgICAgIGlmIChpc05hTihwMi5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpKSkge1xuICAgICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICAgIHJldHVybiBlbmRHYW1lKHAxKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwMjtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHAyKSB7XG4gICAgICBjb25zdCBzdHJpa2UgPSBwMi5hdHRhY2soY29vcmRpbmF0ZXMsIHAxLnBsYXllckJvYXJkKTtcbiAgICAgIGlmIChwMS5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpID09PSAwKSB7XG4gICAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVuZEdhbWUocDEpO1xuICAgICAgfVxuICAgICAgY3VycmVudFBsYXllciA9IHAxO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFBsYXllci5pc0NQVSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGdhbWVMb29wKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzR2FtZU92ZXIoKSB7XG4gICAgcmV0dXJuIGdhbWVPdmVyO1xuICB9XG4gIHJldHVybiB7IGdhbWVMb29wLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKG5hdGlvbmFsaXR5LCBib2FyZEZuLCBpc0NQVSA9IFwiZmFsc2VcIikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgcmV0dXJuIGVuZW15Qm9hcmQuY2FuU3RyaWtlKGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0dGFjayhjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIC8vIHdpbGwgbmVlZCBjb2RlIGhlcmUgZm9yIGRldGVybWluaW5nIGxlZ2FsIG1vdmVcbiAgICBpZiAoY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSkge1xuICAgICAgcmV0dXJuIGVuZW15Qm9hcmQucmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcyk7XG4gICAgfVxuICAgIHJldHVybiBcInRyeSBhbm90aGVyIGF0dGFja1wiO1xuICB9XG5cbiAgcmV0dXJuIHsgbmF0aW9uYWxpdHksIHBsYXllckJvYXJkLCBjYW5TdHJpa2UsIGF0dGFjaywgaXNDUFUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxheWVyO1xuXG4vLyB0aGUgYXR0YWNrIGZuIGFzIG9mIG5vdyBkb2VzIG5vdCB3b3JrIHdlbGwgd2l0aCBjcHUgcGxheWVyIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byByZWdlbmVyYXRlIGFub3RoZXIgbW92ZSB3aXRob3V0IGxlYXZpbmcgaXRzIGN1cnJlbnQgc2NvcGVcbiIsIi8vIHNoaXBzIHNob3VsZCBoYXZlIHRoZSBjaG9pY2Ugb2Y6XG4vLyA1IG1hbi1vLXdhclxuLy8gNCBmcmlnYXRlXG4vLyAzIHggMyBzY2hvb25lclxuLy8gMiB4IDIgcGF0cm9sIHNsb29wXG5jb25zdCBzaGlwID0gKGxlbmd0aCkgPT4ge1xuICBsZXQgdHlwZSA9IFwiXCI7XG4gIGxldCBkYW1hZ2UgPSAwO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIHJldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHsgdHlwZSwgbGVuZ3RoLCBkYW1hZ2UsIGhpdHBvaW50cywgaGl0LCBpc1N1bmsgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gc3RhcnRTY3JlZW4oZ2FtZVNjcmlwdEZuKSB7XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5CYXR0bGVzaGlwPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJTZWxlY3RDb250XCI+XG4gICAgICAgICAgICAgICAgIDxmb3JtIGFjdGlvbj1cIlwiIGNsYXNzPVwicGxheWVyRm9ybVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMVwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAxXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAyXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDJcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5CZWdpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyRm9ybVwiKTtcbiAgICBpbml0Q291bnRyeVNlbGVjdCgpO1xuICAgIHBsYXllckZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgcGxheWVycyA9IHBPYmpJbml0aWFsaXplcihcbiAgICAgICAgZ2FtZVNjcmlwdEZuLFxuICAgICAgICBcIi5wbGF5ZXJGb3JtXCIsXG4gICAgICAgIFwic2VsZWN0cDFcIixcbiAgICAgICAgXCJzZWxlY3RwMlwiLFxuICAgICAgKTtcblxuICAgICAgcGxheWVycy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LnBsYXllciA9PT0gXCJwZXJzb25cIikge1xuICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgc2hpcFNjcmVlbihlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgIHNoaXBSYW5kb21pemVyKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vIHRyaWdnZXIgdGhlIG5leHQgc2NyZWVuXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21Db29yZCgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgY29vcmRpbmF0ZXMgPSBbXTtcblxuICAgIGNvb3JkaW5hdGVzLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgY29uc29sZS5sb2coXCJyYW5kb20gY29vcmQ6IFwiICsgY29vcmRpbmF0ZXMpO1xuXG4gICAgcmV0dXJuIGNvb3JkaW5hdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFNjcmVlbihwbGF5ZXIwYmopIHtcbiAgICAvLyBnZXQgcmVmZXJlbmNlIHRvIHRoZSBwYWdlIGNvbnRhaW5lciBhbmQgY2xlYXIgdGhlIHBhZ2UuXG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2hpcFNjcmVlbkNvbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keUNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdyaWRDb250XCI+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwRGlzcGxheUNvbnRcIj5cbiAgICAgICAgICAgICAgICAgIHRoaXMgd2lsbCBiZSBhbGwgYm9hdHMgbGlzdGVkIGFuZCBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcblxuICAgIC8vIGNoYW5nZSBpbmZvIHBlciB0aGUgcGxheWVyIG9ialxuXG4gICAgLy8gc3RvcmUgdGhlIGh0bWwgZm9yIHRoZSBzaGlwIHBsYWNlbWVudFxuICAgIGNvbnN0IGdyaWRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmdyaWRDb250XCIpO1xuICAgIC8vIGJ1aWxkIHRoZSB2aXN1YWwgZ3JpZFxuICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICByb3cuY2xhc3NMaXN0LmFkZChcInJvd0NvbnRcIik7XG4gICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3JpZFNpemU7IGorKykge1xuICAgICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LnIgPSBpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuYyA9IGo7XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gY3JlYXRlIHN5c3RlbSBmb3IgVUkgdG8gY29vcmRpbmF0ZXNcbiAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgb3JpZW50YXRpb25CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBjb25zdCBvcmllbnRhdGlvbiA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJIb3Jpem9udGFsXCI7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gaG9sZCByZWZlcmVuY2UgdG8gdGhlIGdyaWQgZWxlbWVudHNcbiAgICAvLyBhY3RpdmF0ZSBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBvZiB0aGUgZ3JpZCBpdGVtc1xuICAgIGxldCByID0gdW5kZWZpbmVkO1xuICAgIGxldCBjID0gdW5kZWZpbmVkO1xuICAgIGxldCBjb29yZCA9IFtdO1xuICAgIGxldCBzaGlwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc2hpcFwiKTtcbiAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcblxuICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgIC8vICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgLy8gICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChlKSA9PiB7XG4gICAgLy8gICAgICByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgIC8vICAgICAgYyA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5jKTtcbiAgICAvLyAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgIC8vICAgICAgLy8gY29uc3Qgc2hpcEZpdHMgPSBzaGlwTWFrZXJQcm94eShwbGF5ZXIwYmoubnVtYmVyKTtcbiAgICAvLyAgICB9KTtcbiAgICAvLyAgfSk7XG4gICAgLy8gIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAvLyAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIC8vICAgICAgY29uc3Qgb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbkJ0bi5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuICAgIC8vICAgICAgY29uc29sZS5sb2coYGN1cnJlbnQgb3JpZW50YXRpb24gaXMgJHtvcmllbnRhdGlvbn1gKTtcbiAgICAvLyAgICB9KTtcbiAgICAvLyAgfSk7XG5cbiAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICBjb25zdCBkcmFnT3ZlckhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwibW91c2VvdmVyXCIpO1xuXG4gICAgICAgIHIgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucik7XG4gICAgICAgIGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICBjb25zb2xlLmxvZyhjb29yZCk7XG4gICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IHRydWU7XG4gICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICB9O1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcblxuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IGZhbHNlO1xuICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoXCJtb3VzZW92ZXJcIik7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICBzaGlwSU1HLnNyYyA9IFwiLi9pbWFnZXMvc2FpbGJvYXQucG5nXCI7XG4gICAgc2hpcElNRy5jbGFzc0xpc3QuYWRkKFwic2hpcElNR1wiKTtcbiAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICBzaGlwcy5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGUpID0+IHtcbiAgICAgICAgY29uc3QgY2xvbmUgPSBzaGlwLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IDIwOyAvLyBTZXQgeW91ciBkZXNpcmVkIG9mZnNldCB2YWx1ZVxuICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREcmFnSW1hZ2UoY2xvbmUsIDAsIDApO1xuICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgIH0pO1xuXG4gICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgc2hpcC5jbGFzc0xpc3QucmVtb3ZlKFwiZHJhZ2dpbmdcIik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIGNyZWF0ZSBtZXRob2QgZm9yIGNoZWNraW5nIHRoZSBjb29yZGluYXRlIHNwYWNlIG9uIGEgaG92ZXIgZXZlbnRcbiAgICAvLyBjcmVhdGUgbWV0aG9kIGZvciBhZGRpbmcgdGhlIHNoaXAgdG8gdGhlIGxvY2F0aW9uIG9uIHRoZSBjbGljayBldmVudC5cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBSYW5kb21pemVyKHBsYXllck9iaikge1xuICAgIGxldCBzaGlwQXJyID0gWy4uLnBsYXllck9iai5zaGlwc107XG5cbiAgICBzaGlwQXJyLmZvckVhY2goKHNoaXBMZW5ndGgpID0+IHtcbiAgICAgIGxldCBwbGFjZWQgPSBmYWxzZTtcbiAgICAgIHdoaWxlICghcGxhY2VkKSB7XG4gICAgICAgIC8vIHJhbmRvbSBkaXJlY3Rpb24gb2Ygc2hpcCBwbGFjZW1lbnRcbiAgICAgICAgY29uc3QgY29vcmRpbmF0ZXMgPSByYW5kb21Db29yZCgpO1xuICAgICAgICBjb25zdCByYW5kb20gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAgICAgY29uc3QgYXhpcyA9IHJhbmRvbSA9PT0gMCA/IFwiaFwiIDogXCJ2XCI7XG5cbiAgICAgICAgLy8gc2hpcE1ha2VyUHJveHkgcmV0dXJucyBmYWxzZSBpZiB3YXMgbm90IGFibGUgdG8gcGxhY2Ugc2hpcCBhdCByYW5kb20gc3BvdCwgdHJ5cyBhZ2FpblxuICAgICAgICBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgIHNoaXBMZW5ndGgsXG4gICAgICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICAgICAgYXhpcyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIGJ1aWxkcyBhIHBsYXllcm9iaiB0aGF0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHRvIGluaXRpYWxpemUgdGhlIGdhbWVcbiAgZnVuY3Rpb24gcE9iakluaXRpYWxpemVyKGdhbWVTY3JpcHRGbiwgZm9ybUNsc3NObWUsIHAxc2VsZWN0aWQsIHAyc2VsZWN0aWQpIHtcbiAgICAvLyBidWlsZCB0aGUgb2JqIGFuZCBleHBvcnQgdG9cbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ2xzc05tZSk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMXNlbGVjdGlkKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAyc2VsZWN0aWQpO1xuICAgIGxldCBwbGF5ZXJzID0gW107XG5cbiAgICBjb25zdCBtYW5vd2FyID0gNTtcbiAgICBjb25zdCBmcmlnYXRlID0gNDtcbiAgICBjb25zdCBzY2hvb25lciA9IDM7XG4gICAgY29uc3Qgc2xvb3AgPSAyO1xuXG4gICAgY29uc3QgcGxheWVyb2JqID0ge1xuICAgICAgcGxheWVyOiB1bmRlZmluZWQsXG4gICAgICBudW1iZXI6IHVuZGVmaW5lZCxcbiAgICAgIGNvdW50cnk6IHVuZGVmaW5lZCxcbiAgICAgIHNoaXBzOiBbXG4gICAgICAgIG1hbm93YXIsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNsb29wLFxuICAgICAgICBzbG9vcCxcbiAgICAgIF0sXG4gICAgfTtcblxuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiBVSXRvQ29vcmQoKSB7fVxuICBmdW5jdGlvbiBzZW5kTW92ZSgpIHt9XG4gIGZ1bmN0aW9uIGNoZWNrU3BhY2UoY29vcmRpbmF0ZXMpIHt9XG4gIHN0YXJ0U2NyZWVuKCk7XG4gIHJldHVybiB7IHBPYmpJbml0aWFsaXplciwgc2VuZE1vdmUgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXNlckludGVyZmFjZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==