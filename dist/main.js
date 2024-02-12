/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/cpuPlayer.js":
/*!**************************!*\
  !*** ./src/cpuPlayer.js ***!
  \**************************/
/***/ ((module) => {

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
    //check to protect outofbounds strikes
    if (
      adjacentStrike[0] < 0 ||
      adjacentStrike[1] < 0 ||
      adjacentStrike[0] > 9 ||
      adjacentStrike[1] > 9
    ) {
      const redo = adjacentMove();
      adjacentStrike = redo;
    }

    return adjacentStrike;
  }

  function getNextInline(lastHit) {
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
      state = "random";
      hitArr = [];
      pursuitAxis = null;
    } else {
      hitArr.push(coordinate);
      if (hitArr.length === 1) {
        state = "adjacent";
      } else if (hitArr.length > 1) {
        state = "inline";
      }
    }
  }
  function reportMiss() {
    streak = false;
  }
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


/***/ }),

/***/ "./src/gameboard.js":
/*!**************************!*\
  !*** ./src/gameboard.js ***!
  \**************************/
/***/ ((module) => {

const gameBoard = () => {
  let ships = [];
  let streakArr = [];
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

  function shipPerimeter(bowPos, length, orientation, callbackfn) {
    // this fn defines 4 areas top, L, R, bottom and calls injected function
    // on each of the squares it is expected that the callbackfn return bool

    // the 0 means that the row will be added offset to draw border above ship
    const axisOffset = orientation === "h" ? 0 : 1;
    const axisCounter = orientation === "h" ? 1 : 0;
    const aOffset = 1;
    const bOffset = -1;

    let endcapA;
    let endcapB;

    // finds the point directly adjacent to bow and transom
    if (orientation === "h") {
      endcapA = [bowPos[0], bowPos[1] - 1];
      endcapB = [bowPos[0], bowPos[1] + length];
    } else {
      endcapA = [bowPos[0] - 1, bowPos[1]];
      endcapB = [bowPos[0] + length, bowPos[1]];
    }

    let rowA = [...bowPos];
    let rowB = [...bowPos];

    rowA[axisOffset] += aOffset;
    rowB[axisOffset] += bOffset;
    // subtract by 1 to get corner spot diagonal to bow
    rowA[axisCounter] += -1;
    rowB[axisCounter] += -1;

    const resultECA = callbackfn(endcapA);
    const resultECB = callbackfn(endcapB);

    if (resultECA === false || resultECB === false) {
      return false;
    }

    for (let i = 0; i <= length; i++) {
      const resultA = callbackfn(rowA);
      const resultB = callbackfn(rowB);
      if (resultA === false || resultB === false) {
        return false;
      }
      rowA[axisCounter] += 1;
      rowB[axisCounter] += 1;
    }
    return true;
  }

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
    // callbackfn checks each coord passed and return false if not null
    const perimeterCheck = shipPerimeter(
      coordinates,
      length,
      orientation,
      (point) => {
        const r = point[0];
        const c = point[1];
        // check if extends beyond boundary, skips if so
        if (r <= -1 || r >= 10 || c <= -1 || c >= 10) {
          return true;
        }
        if (shipGrid[r][c] === null || shipGrid[r][c] === "x") {
          return true;
        }
        return false;
      },
    );
    // true perimeterCheck indicates ship fits
    return perimeterCheck;
  }

  function pushtoGrid(ship, length, coordinates, orientation) {
    const offset = orientation === "h" ? [0, 1] : [1, 0];
    let current = [...coordinates];
    for (let i = 0; i < length; i++) {
      shipGrid[current[0]][current[1]] = ship;
      current[0] += offset[0];
      current[1] += offset[1];
    }
    // return statement of true means successful
    const buildPerimeter = shipPerimeter(
      coordinates,
      length,
      orientation,
      (point) => {
        const r = point[0];
        const c = point[1];
        // check if extends beyond boundary
        if (r <= -1 || r >= 10 || c <= -1 || c >= 10) {
          return true;
        }
        shipGrid[r][c] = "x";
      },
    );
    if (buildPerimeter === false) {
      throw new Error("Exception occured with building ship perimeter");
    }
  }

  function addShip(ship, coordinates, orientation) {
    const length = ship.length;
    ships.push(ship);

    if (orientation === "h") {
      if (shipFits(length, coordinates, orientation)) {
        pushtoGrid(ship, length, coordinates, orientation);
      } else {
        console.error("error: ship did not fit");
      }
    } else if (orientation === "v") {
      if (shipFits(length, coordinates, orientation)) {
        pushtoGrid(ship, length, coordinates, orientation);
      } else {
        console.error("error: ship did not fit");
      }
    }
    ship.coordinates = [...coordinates];
    ship.orientation = orientation;
  }

  function canStrike(coordinates) {
    const [r, c] = coordinates;
    const strikeSquare = attacksReceived[r][c];

    if (strikeSquare !== null) {
      return false;
    }
    return true;
  }

  function receiveAttack(coordinates) {
    const r = coordinates[0];
    const c = coordinates[1];
    let hitReport = undefined;
    let isSunk = undefined;

    if (shipGrid[r][c] !== null && shipGrid[r][c] !== "x") {
      const ship = shipGrid[r][c];
      attacksReceived[r][c] = 1;
      hitReport = ship.hit();
      isSunk = ship.isSunk();

      if (isSunk) {
        ships = ships.filter((element) => {
          return element !== ship;
        });
        hitReport = `${ship.type} has been sunk`;
        // return statement is obj that contains the report as well isSunk
        return { hitReport, isSunk };
      }
      return { hitReport, isSunk };
    }
    hitReport = "miss";
    isSunk = "false";
    attacksReceived[r][c] = 0;
    console.log(hitReport);
    console.log(`attempted Strike: ${r}, ${c}`);

    return { hitReport, isSunk };
  }

  function shipsRemaining() {
    return ships.length > 0 ? ships.length : "All ships have sunk";
  }

  return {
    shipGrid,
    streakArr,
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
    console.log(playerClass);
    function attack() {
      let nextStrike = cpuAI.nextMove();
      console.log(nextStrike);
      while (playerClass.canStrike(nextStrike, enemyBoard) === false) {
        repeatMove = true;
        nextStrike = cpuAI.nextMove(repeatMove);
        console.log(nextStrike);
      }
      const strikeResult = playerClass.attack(nextStrike, enemyBoard);
      console.log(strikeResult);

      if (strikeResult.hitReport !== "miss") {
        cpuAI.reportHit(nextStrike, strikeResult.isSunk);
        enemyBoard.streakArr.push(nextStrike);

        return attack();
      } else if (strikeResult.hitReport === "miss") {
        cpuAI.reportMiss();
        return strikeResult;
      }
    }
    return {
      ...({ canStrike, strikes } = playerClass),
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

  function gameTurn(playerClass, enemyClass, coordinates = "") {
    //response will mutate enemy board and shipcheck returns # of ships remaining
    // response returns an object with .hitReport & .isSunk
    const response = playerClass.attack(coordinates, enemyClass.playerBoard);
    const shipCheck = enemyClass.playerBoard.shipsRemaining();
    console.log(shipCheck);
    if (gameOver) {
      return endGame();
    }
    // return value anything other than num = game over
    if (isNaN(shipCheck)) {
      gameOver = true;
      return endGame();
    }
    return response;
  }

  async function gameLoop() {
    // call ui strikescreen for current player if its a person
    while (gameOver === false) {
      console.dir(currentPlayer);

      const enemyClass = currentPlayer === player1 ? player2 : player1;
      if (!currentPlayer.isCPU) {
        await ui.strikeScreen(currentPlayer, enemyClass, gameTurn);
      } else {
        gameTurn(currentPlayer, enemyClass);
      }

      if (currentPlayer === player1) {
        currentPlayer = player2;
      } else if (currentPlayer === player2) {
        currentPlayer = player1;
      }
    }
  }

  function gameInitializer() {
    if (player1.isCPU) {
      const copy = { ...player1 };
      player1 = cpuPlayerWrapper(copy, cpuAI, player2.playerBoard);
    }
    if (player2.isCPU) {
      const copy = { ...player2 };
      player2 = cpuPlayerWrapper(copy, cpuAI, player1.playerBoard);
    }

    currentPlayer = player1;
    console.log(currentPlayer);
    console.log(player2);
    // will initialize the game loop fn that will call ui for strike screens
    gameLoop();
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  let player1 = undefined;
  let player2 = undefined;
  let currentPlayer = undefined;
  const cpuAI = cpu();
  let gameOver = false;
  ui.startScreen();

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
    return isGameOver();
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
  const strikes = {
    misses: [],
    hits: [],
  };

  function canStrike(coordinates, enemyBoard) {
    return enemyBoard.canStrike(coordinates);
  }

  function attack(coordinates, enemyBoard) {
    // will need code here for determining legal move
    let result = undefined;
    if (canStrike(coordinates, enemyBoard)) {
      result = enemyBoard.receiveAttack(coordinates);
      if (result.hitReport === "hit") {
        strikes.hits.push(coordinates);
      } else if (result.isSunk === true) {
        strikes.hits.push(coordinates);
      } else if (result.hitReport === "miss") {
        strikes.misses.push(coordinates);
      }
      return result;
    }
    return "try another attack";
  }

  return { ...playerObj, playerBoard, canStrike, attack, isCPU, strikes };
};

module.exports = player;


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
  let coordinates = [];
  let orientation = "";

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
    //return `${type} was hit. ${hitpoints()} hitpoints remaining`;
    return `hit`;
  }
  function isSunk() {
    return damage >= length ? true : false;
  }
  function hitpoints() {
    return length - damage;
  }
  return {
    type,
    length,
    coordinates,
    orientation,
    damage,
    hitpoints,
    hit,
    isSunk,
  };
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
      ships: [manowar, frigate, frigate, schooner, schooner, sloop, sloop],
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
  function gridBuilder(gridContainer, gridSize) {
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
  }
  function gridShader(
    coord,
    length,
    orientation,
    dragFits,
    placed = false,
    gridContainer,
  ) {
    const offsetr = orientation === "h" ? 0 : 1;
    const offsetc = orientation === "h" ? 1 : 0;
    let addedClass = "";
    const gridContainerName = gridContainer.classList.value;

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
        `.${gridContainerName} [data-r="${currentCoord[0]}"][data-c="${currentCoord[1]}"]`,
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
  }

  async function shipScreen(playerObj) {
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
      gridBuilder(gridContainer, 10);
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

      function randomBtnFn() {
        shipRandomizer(playerObj);
        resolve();
      }

      const randomBtn = document.querySelector(".randomBtn");

      randomBtn.addEventListener("click", () => {
        randomBtnFn();
      });

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
          if (dragFits) {
            gridShader(
              coord,
              dragShipLength,
              orientation,
              dragFits,
              false,
              gridContainer,
            );
          } else {
            gridShader(
              coord,
              dragShipLength,
              orientation,
              dragFits,
              false,
              gridContainer,
            );
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
        function shipDragHandler(e) {
          dragShipLength = Number(e.currentTarget.dataset.index);

          const clone = ship.cloneNode(true);
          dragShip = ship;
          // Set the offset for the drag image
          const offsetX = 20;
          e.dataTransfer.setDragImage(clone, 0, 0);
          ship.classList.add("dragging");
        }

        ship.addEventListener("dragstart", (e) => {
          shipDragHandler(e);
        });

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
              gridShader(
                coord,
                dragShipLength,
                orientation,
                dragFits,
                true,
                gridContainer,
              );

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
            });
          }
        });
      });
    });
  }
  // gameTurn requires coordinates, playerClass, enemyClass
  async function strikeScreen(playerClass, enemyClass, gameTurnScript) {
    return new Promise((resolve) => {
      const htmlContent = ` <div class="header">
          <div class="playerName"></div>
       </div>
       <div class="strikeCont">
           <div class="strikeGridCont">
               <span class="strikeResult">Strike Result</span>
           </div>
           <div class="shipPlacedCont">
               <div class="shipPlacedGrid"></div>
               <div class="shipsRemainCont"></div>
           </div>
       </div>
       <div class="footer">
       </div>
      `;
      pageContainer.innerHTML = "";
      pageContainer.innerHTML = htmlContent;

      const playerName = document.querySelector(".playerName");
      const strikeResultCont = document.querySelector(".strikeResult");
      const gridSize = 10;
      const gridContainer = document.querySelector(".strikeGridCont");
      const shipPlaceGrid = document.querySelector(".shipPlacedGrid");
      let ableToStrike = undefined;
      let tookTurn = false;
      const hitSVG = document.createElement("div");
      hitSVG.innerHTML = `<svg class="hitIcon" xmlns ="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
          <path xmlns="http://www.w3.org/2000/svg" d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>`;
      const missSvg = document.createElement("div");
      missSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-480Zm0 280q-116 0-198-82t-82-198q0-116 82-198t198-82q116 0 198 82t82 198q0 116-82 198t-198 82Zm0-80q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680q-83 0-141.5 58.5T280-480q0 83 58.5 141.5T480-280Z"/></svg>`;
      const nextBtn = document.createElement("button");

      function prevStrikePopulator(
        playerClass,
        hitSVG,
        missSvg,
        gridCont,
        hitsOnly = false,
      ) {
        const gridContainerName = gridCont.classList.value;
        const missArr = playerClass.strikes.misses;
        const hitsArr = playerClass.strikes.hits;
        const enemyStreakArr = enemyClass.playerBoard.streakArr;
        const delay = (timeout) =>
          new Promise((res) => setTimeout(res, timeout));
        // for viewing which of your ships are hit, passthrough enemyClass instead of current player
        if (hitsOnly === false) {
          missArr.forEach((coordPair) => {
            const currentCell = document.querySelector(
              `.${gridContainerName} [data-r="${coordPair[0]}"][data-c="${coordPair[1]}"]`,
            );
            currentCell.classList.add("miss");
            const cloneSVG = missSvg.cloneNode(true);
            currentCell.appendChild(cloneSVG);
          });
        }

        async function asyncController(timeout, callbackfn) {
          await delay(timeout);
          callbackfn();
        }

        hitsArr.forEach((coordPair) => {
          const currentCell = document.querySelector(
            `.${gridContainerName} [data-r="${coordPair[0]}"][data-c="${coordPair[1]}"]`,
          );
          currentCell.classList.add("hit");
          const cloneSVG = hitSVG.cloneNode(true);
          currentCell.appendChild(cloneSVG);
        });
        if (enemyStreakArr.length > 0) {
          const streakSequence = async (point) => {
            const currentCell = document.querySelector(
              `.shipPlacedGrid [data-r="${point[0]}"][data-c="${point[1]}"]`,
            );
            const timeout = 400;
            await delay(timeout);
            currentCell.classList.add("streakHit");
            await delay(timeout);
            currentCell.classList.remove("streakHit");
          };
          // visual effect that higlights the strike
          enemyStreakArr.forEach((hit) => {
            const current = enemyStreakArr.shift();
            asyncController(500, () => {
              streakSequence(current);
            });
          });
        }
      }
      playerName.textContent = `Player ${playerClass.number} Turn`;
      // build the strike grid && populate previous strikes if applicable
      gridBuilder(gridContainer, 10);
      // build the shipPlacedGrid
      gridBuilder(shipPlaceGrid, 10);
      prevStrikePopulator(playerClass, hitSVG, missSvg, gridContainer);
      // populate which of your ships are hit
      prevStrikePopulator(enemyClass, hitSVG, missSvg, shipPlaceGrid, true);

      const cells = document.querySelectorAll(".cell");
      cells.forEach((cell) => {
        cell.addEventListener("click", (e) => {
          e.preventDefault();
          if (false) {}
          const r = Number(e.currentTarget.dataset.r);
          const c = Number(e.currentTarget.dataset.c);
          coord = [r, c];
          // replace this fn with checker for repeat strikes
          const canStrike = playerClass.canStrike(
            coord,
            enemyClass.playerBoard,
          );
          if (canStrike && !tookTurn) {
            // send signal to strike to gameTurn
            // response will return obj with .hitReport & .isSunk
            const response = gameTurnScript(playerClass, enemyClass, coord);
            let nextBtn;

            nextBtn = document.createElement("button");
            strikeResultCont.textContent =
              strikeResultCont.textContent + ": " + response.hitReport;
            nextBtn.textContent = "End Turn";

            if (response.hitReport === "miss") {
              pageContainer.appendChild(nextBtn);
              tookTurn = true;
              cell.classList.add("miss");
              const cloneSVG = missSvg.cloneNode(true);
              cell.appendChild(cloneSVG);
            } else if (response.hitReport === undefined) {
              console.error("Error: strike response exception");
              return;
            } else {
              //streakArr will allow for visual of hits received from previous player
              enemyClass.playerBoard.streakArr.push(coord);
              cell.classList.add("hit");
              const cloneSVG = hitSVG.cloneNode(true);
              cell.appendChild(cloneSVG);
            }

            nextBtn.addEventListener("click", () => {
              resolve();
            });
          }
        });
      });

      function placeShips(playerClass) {
        const shipsArray = playerClass.playerBoard.ships;
        shipsArray.forEach((ship) => {
          const length = ship.length;
          const coord = ship.coordinates;
          const orientation = ship.orientation;

          gridShader(coord, length, orientation, null, true, shipPlaceGrid);
        });
      }
      placeShips(playerClass);
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
      // this passes over control back to the index script.
      gameInitScript();
    });
  }
  function gameOverScreen() {
    // get reference to the page container
    // clear the page
    // say game over and who won the game
    // have a button that will reset the game
    // alternatively you could not clear the screen and then just use modals to make it appear
    // the modal would be a form with the reset button acting as the submit for the form.
  }
  return { startScreen, pObjInitializer, strikeScreen, gameOverScreen };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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WUFBWTtBQUNwRCx1Q0FBdUMsV0FBVztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxTQUFTO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFVBQVU7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsWUFBWTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxXQUFXO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG1CQUFtQixXQUFXLGFBQWEsYUFBYSxhQUFhO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxnQkFBZ0IsbUJBQW1CLFdBQVcsYUFBYSxhQUFhLGFBQWE7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLFNBQVMsYUFBYSxTQUFTO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixXQUFXO0FBQ1g7QUFDQTtBQUNBLHlDQUF5QyxvQkFBb0I7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLEtBQVMsRUFBRSxFQUVkO0FBQ1g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDL3BCQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9jcHVQbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9nYW1lYm9hcmQuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3BsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3NoaXAuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy91aS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuICAgIC8vY2hlY2sgdG8gcHJvdGVjdCBvdXRvZmJvdW5kcyBzdHJpa2VzXG4gICAgaWYgKFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMF0gPCAwIHx8XG4gICAgICBhZGphY2VudFN0cmlrZVsxXSA8IDAgfHxcbiAgICAgIGFkamFjZW50U3RyaWtlWzBdID4gOSB8fFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMV0gPiA5XG4gICAgKSB7XG4gICAgICBjb25zdCByZWRvID0gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICBhZGphY2VudFN0cmlrZSA9IHJlZG87XG4gICAgfVxuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgbGV0IGlubGluZVN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcblxuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJoXCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVsxXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfSBlbHNlIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJ2XCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZSgpIHtcbiAgICAvLyBmaW5kcyB0aGUgYXhpcyBieSBjb21wYXJpbmcgaGl0cyBhbmQgY2FsbHMgYW4gaW5saW5lIGd1ZXNzXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBudWxsKSB7XG4gICAgICBjb25zdCBbYzEsIGMyXSA9IGhpdEFycjtcbiAgICAgIGlmIChjMVswXSA9PT0gYzJbMF0gJiYgYzFbMV0gIT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJoXCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH0gZWxzZSBpZiAoYzFbMF0gIT09IGMyWzBdICYmIGMxWzFdID09PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwidlwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdHJlYWsgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFyclswXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbaGl0QXJyLmxlbmd0aCAtIDFdKTtcbiAgICAgIC8vIGNvbmRpdGlvbiBpZiB0aGUgbGFzdCBzdHJpa2Ugd2FzIGEgbWlzcyB0aGVuIHN0YXJ0IGZyb20gdGhlIGZyb250IG9mIHRoZSBsaXN0XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG5leHRNb3ZlKCkge1xuICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgIGNhc2UgXCJyYW5kb21cIjpcbiAgICAgICAgcmV0dXJuIHJhbmRvbU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRqYWNlbnRcIjpcbiAgICAgICAgcmV0dXJuIGFkamFjZW50TW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpbmxpbmVcIjpcbiAgICAgICAgcmV0dXJuIGlubGluZU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gXCJFcnJvciBjb25kaXRpb24gZXhjZXB0aW9uOiBuZXh0TW92ZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRIaXQoY29vcmRpbmF0ZSwgaXNTdW5rKSB7XG4gICAgc3RyZWFrID0gdHJ1ZTtcbiAgICBpZiAoaXNTdW5rID09PSB0cnVlKSB7XG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICAgIHN0YXRlID0gXCJyYW5kb21cIjtcbiAgICAgIGhpdEFyciA9IFtdO1xuICAgICAgcHVyc3VpdEF4aXMgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaXRBcnIucHVzaChjb29yZGluYXRlKTtcbiAgICAgIGlmIChoaXRBcnIubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHN0YXRlID0gXCJhZGphY2VudFwiO1xuICAgICAgfSBlbHNlIGlmIChoaXRBcnIubGVuZ3RoID4gMSkge1xuICAgICAgICBzdGF0ZSA9IFwiaW5saW5lXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydE1pc3MoKSB7XG4gICAgc3RyZWFrID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGxldCBzdHJlYWtBcnIgPSBbXTtcbiAgZnVuY3Rpb24gZ3JpZE1ha2VyKCkge1xuICAgIGdyaWQgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZ3JpZFtpXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGdyaWRbaV1bal0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JpZDtcbiAgfVxuXG4gIC8vIGluaXRpYWxpemVyIGZvciB0aGUgZ3JpZFxuICBsZXQgc2hpcEdyaWQgPSBncmlkTWFrZXIoKTtcbiAgbGV0IGF0dGFja3NSZWNlaXZlZCA9IGdyaWRNYWtlcigpO1xuXG4gIGZ1bmN0aW9uIHNoaXBQZXJpbWV0ZXIoYm93UG9zLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBjYWxsYmFja2ZuKSB7XG4gICAgLy8gdGhpcyBmbiBkZWZpbmVzIDQgYXJlYXMgdG9wLCBMLCBSLCBib3R0b20gYW5kIGNhbGxzIGluamVjdGVkIGZ1bmN0aW9uXG4gICAgLy8gb24gZWFjaCBvZiB0aGUgc3F1YXJlcyBpdCBpcyBleHBlY3RlZCB0aGF0IHRoZSBjYWxsYmFja2ZuIHJldHVybiBib29sXG5cbiAgICAvLyB0aGUgMCBtZWFucyB0aGF0IHRoZSByb3cgd2lsbCBiZSBhZGRlZCBvZmZzZXQgdG8gZHJhdyBib3JkZXIgYWJvdmUgc2hpcFxuICAgIGNvbnN0IGF4aXNPZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBheGlzQ291bnRlciA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgIGNvbnN0IGFPZmZzZXQgPSAxO1xuICAgIGNvbnN0IGJPZmZzZXQgPSAtMTtcblxuICAgIGxldCBlbmRjYXBBO1xuICAgIGxldCBlbmRjYXBCO1xuXG4gICAgLy8gZmluZHMgdGhlIHBvaW50IGRpcmVjdGx5IGFkamFjZW50IHRvIGJvdyBhbmQgdHJhbnNvbVxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGVuZGNhcEEgPSBbYm93UG9zWzBdLCBib3dQb3NbMV0gLSAxXTtcbiAgICAgIGVuZGNhcEIgPSBbYm93UG9zWzBdLCBib3dQb3NbMV0gKyBsZW5ndGhdO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmRjYXBBID0gW2Jvd1Bvc1swXSAtIDEsIGJvd1Bvc1sxXV07XG4gICAgICBlbmRjYXBCID0gW2Jvd1Bvc1swXSArIGxlbmd0aCwgYm93UG9zWzFdXTtcbiAgICB9XG5cbiAgICBsZXQgcm93QSA9IFsuLi5ib3dQb3NdO1xuICAgIGxldCByb3dCID0gWy4uLmJvd1Bvc107XG5cbiAgICByb3dBW2F4aXNPZmZzZXRdICs9IGFPZmZzZXQ7XG4gICAgcm93QltheGlzT2Zmc2V0XSArPSBiT2Zmc2V0O1xuICAgIC8vIHN1YnRyYWN0IGJ5IDEgdG8gZ2V0IGNvcm5lciBzcG90IGRpYWdvbmFsIHRvIGJvd1xuICAgIHJvd0FbYXhpc0NvdW50ZXJdICs9IC0xO1xuICAgIHJvd0JbYXhpc0NvdW50ZXJdICs9IC0xO1xuXG4gICAgY29uc3QgcmVzdWx0RUNBID0gY2FsbGJhY2tmbihlbmRjYXBBKTtcbiAgICBjb25zdCByZXN1bHRFQ0IgPSBjYWxsYmFja2ZuKGVuZGNhcEIpO1xuXG4gICAgaWYgKHJlc3VsdEVDQSA9PT0gZmFsc2UgfHwgcmVzdWx0RUNCID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByZXN1bHRBID0gY2FsbGJhY2tmbihyb3dBKTtcbiAgICAgIGNvbnN0IHJlc3VsdEIgPSBjYWxsYmFja2ZuKHJvd0IpO1xuICAgICAgaWYgKHJlc3VsdEEgPT09IGZhbHNlIHx8IHJlc3VsdEIgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJvd0FbYXhpc0NvdW50ZXJdICs9IDE7XG4gICAgICByb3dCW2F4aXNDb3VudGVyXSArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgY29weUNvb3JkID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBsZXQgciA9IGNvcHlDb29yZFswXTtcbiAgICBsZXQgYyA9IGNvcHlDb29yZFsxXTtcbiAgICBjb25zdCByb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3QgY29mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2hpcGZpdCBsZW5ndGggdW5kZWZpbmVkXCIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgciArPSByb2Zmc2V0O1xuICAgICAgYyArPSBjb2Zmc2V0O1xuICAgIH1cbiAgICAvLyBjYWxsYmFja2ZuIGNoZWNrcyBlYWNoIGNvb3JkIHBhc3NlZCBhbmQgcmV0dXJuIGZhbHNlIGlmIG5vdCBudWxsXG4gICAgY29uc3QgcGVyaW1ldGVyQ2hlY2sgPSBzaGlwUGVyaW1ldGVyKFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBsZW5ndGgsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICAgIChwb2ludCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcG9pbnRbMF07XG4gICAgICAgIGNvbnN0IGMgPSBwb2ludFsxXTtcbiAgICAgICAgLy8gY2hlY2sgaWYgZXh0ZW5kcyBiZXlvbmQgYm91bmRhcnksIHNraXBzIGlmIHNvXG4gICAgICAgIGlmIChyIDw9IC0xIHx8IHIgPj0gMTAgfHwgYyA8PSAtMSB8fCBjID49IDEwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdID09PSBudWxsIHx8IHNoaXBHcmlkW3JdW2NdID09PSBcInhcIikge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgKTtcbiAgICAvLyB0cnVlIHBlcmltZXRlckNoZWNrIGluZGljYXRlcyBzaGlwIGZpdHNcbiAgICByZXR1cm4gcGVyaW1ldGVyQ2hlY2s7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gWzAsIDFdIDogWzEsIDBdO1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgICAvLyByZXR1cm4gc3RhdGVtZW50IG9mIHRydWUgbWVhbnMgc3VjY2Vzc2Z1bFxuICAgIGNvbnN0IGJ1aWxkUGVyaW1ldGVyID0gc2hpcFBlcmltZXRlcihcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgbGVuZ3RoLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgICAocG9pbnQpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHBvaW50WzBdO1xuICAgICAgICBjb25zdCBjID0gcG9pbnRbMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIGV4dGVuZHMgYmV5b25kIGJvdW5kYXJ5XG4gICAgICAgIGlmIChyIDw9IC0xIHx8IHIgPj0gMTAgfHwgYyA8PSAtMSB8fCBjID49IDEwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc2hpcEdyaWRbcl1bY10gPSBcInhcIjtcbiAgICAgIH0sXG4gICAgKTtcbiAgICBpZiAoYnVpbGRQZXJpbWV0ZXIgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeGNlcHRpb24gb2NjdXJlZCB3aXRoIGJ1aWxkaW5nIHNoaXAgcGVyaW1ldGVyXCIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcmllbnRhdGlvbiA9PT0gXCJ2XCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHNoaXAuY29vcmRpbmF0ZXMgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIHNoaXAub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcblxuICAgIGlmIChzdHJpa2VTcXVhcmUgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcbiAgICBsZXQgaGl0UmVwb3J0ID0gdW5kZWZpbmVkO1xuICAgIGxldCBpc1N1bmsgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwgJiYgc2hpcEdyaWRbcl1bY10gIT09IFwieFwiKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcbiAgICAgIGlzU3VuayA9IHNoaXAuaXNTdW5rKCk7XG5cbiAgICAgIGlmIChpc1N1bmspIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIGhpdFJlcG9ydCA9IGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICAgIC8vIHJldHVybiBzdGF0ZW1lbnQgaXMgb2JqIHRoYXQgY29udGFpbnMgdGhlIHJlcG9ydCBhcyB3ZWxsIGlzU3Vua1xuICAgICAgICByZXR1cm4geyBoaXRSZXBvcnQsIGlzU3VuayB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgICB9XG4gICAgaGl0UmVwb3J0ID0gXCJtaXNzXCI7XG4gICAgaXNTdW5rID0gXCJmYWxzZVwiO1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgY29uc29sZS5sb2coaGl0UmVwb3J0KTtcbiAgICBjb25zb2xlLmxvZyhgYXR0ZW1wdGVkIFN0cmlrZTogJHtyfSwgJHtjfWApO1xuXG4gICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIHN0cmVha0FycixcbiAgICBhdHRhY2tzUmVjZWl2ZWQsXG4gICAgc2hpcHMsXG4gICAgc2hpcEZpdHMsXG4gICAgYWRkU2hpcCxcbiAgICBjYW5TdHJpa2UsXG4gICAgcmVjZWl2ZUF0dGFjayxcbiAgICBzaGlwc1JlbWFpbmluZyxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2FtZUJvYXJkO1xuIiwiLy8gaW5kZXggaG91c2VzIHRoZSBkcml2ZXIgY29kZSBpbmNsdWRpbmcgdGhlIGdhbWUgbG9vcFxuY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuY29uc3QgZ2FtZUJvYXJkID0gcmVxdWlyZShcIi4vZ2FtZWJvYXJkXCIpO1xuY29uc3Qgc2hpcCA9IHJlcXVpcmUoXCIuL3NoaXBcIik7XG5jb25zdCBjcHUgPSByZXF1aXJlKFwiLi9jcHVQbGF5ZXJcIik7XG5jb25zdCB1aVNjcmlwdCA9IHJlcXVpcmUoXCIuL3VpXCIpO1xuXG5jb25zdCBnYW1lTW9kdWxlID0gKCkgPT4ge1xuICAvLyB0ZW1wb3JhcnkgaW5pdGlhbGl6ZXJzIHRoYXQgd2lsbCBiZSB3cmFwcGVkIGluIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGFzc2lnbiBnYW1lIGVsZW1lbnRzXG4gIC8vIHRoZSBnYW1lIGluaXRpYWxpemVyIHdpbGwgdXNlIHRoaXMgZnVuY3Rpb24gZm9yIGNvbm5lY3RpbmcgY3B1IEFJIHRvIG90aGVyIGZ1bmN0aW9uc1xuICBjb25zdCBjcHVQbGF5ZXJXcmFwcGVyID0gKHBsYXllckNsYXNzLCBjcHVBSSwgZW5lbXlCb2FyZCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKHBsYXllckNsYXNzKTtcbiAgICBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICBsZXQgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICBjb25zb2xlLmxvZyhuZXh0U3RyaWtlKTtcbiAgICAgIHdoaWxlIChwbGF5ZXJDbGFzcy5jYW5TdHJpa2UobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJlcGVhdE1vdmUgPSB0cnVlO1xuICAgICAgICBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUocmVwZWF0TW92ZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKG5leHRTdHJpa2UpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyaWtlUmVzdWx0ID0gcGxheWVyQ2xhc3MuYXR0YWNrKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpO1xuICAgICAgY29uc29sZS5sb2coc3RyaWtlUmVzdWx0KTtcblxuICAgICAgaWYgKHN0cmlrZVJlc3VsdC5oaXRSZXBvcnQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlLCBzdHJpa2VSZXN1bHQuaXNTdW5rKTtcbiAgICAgICAgZW5lbXlCb2FyZC5zdHJlYWtBcnIucHVzaChuZXh0U3RyaWtlKTtcblxuICAgICAgICByZXR1cm4gYXR0YWNrKCk7XG4gICAgICB9IGVsc2UgaWYgKHN0cmlrZVJlc3VsdC5oaXRSZXBvcnQgPT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydE1pc3MoKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLih7IGNhblN0cmlrZSwgc3RyaWtlcyB9ID0gcGxheWVyQ2xhc3MpLFxuICAgICAgYXR0YWNrLFxuICAgICAgcGxheWVyQm9hcmQ6IHBsYXllckNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgaXNDUFU6IHBsYXllckNsYXNzLmlzQ1BVLFxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGxheWVySW5pdGlhbGl6ZXIocGxheWVyT2JqKSB7XG4gICAgaWYgKHBsYXllck9iai5udW1iZXIgPT09IDEpIHtcbiAgICAgIHBsYXllcjEgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGxheWVyMiA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBQbGFjZXJQcm94eShcbiAgICBudW1iZXIsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGNoZWNrb25seSA9IGZhbHNlLFxuICApIHtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsIHx8IGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB3aWxsIG1ha2UgYW5kIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgcGxheWVyID0gbnVtYmVyID09PSAxID8gcGxheWVyMSA6IHBsYXllcjI7XG4gICAgLy8gZmlyc3QgY2hlY2sgdGhlIGNvb3JkaW5hdGVzXG4gICAgLy8gdGhlbiBtYWtlIHRoZSBzaGlwXG4gICAgLy8gdGhlbiBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IGNhbkZpdCA9IHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwRml0cyhcbiAgICAgIGxlbmd0aCxcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgKTtcbiAgICBpZiAoIWNhbkZpdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrb25seSkge1xuICAgICAgY29uc3QgbmV3U2hpcCA9IHNoaXAobGVuZ3RoKTtcbiAgICAgIHBsYXllci5wbGF5ZXJCb2FyZC5hZGRTaGlwKG5ld1NoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEdyaWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2FtZVR1cm4ocGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MsIGNvb3JkaW5hdGVzID0gXCJcIikge1xuICAgIC8vcmVzcG9uc2Ugd2lsbCBtdXRhdGUgZW5lbXkgYm9hcmQgYW5kIHNoaXBjaGVjayByZXR1cm5zICMgb2Ygc2hpcHMgcmVtYWluaW5nXG4gICAgLy8gcmVzcG9uc2UgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCAuaGl0UmVwb3J0ICYgLmlzU3Vua1xuICAgIGNvbnN0IHJlc3BvbnNlID0gcGxheWVyQ2xhc3MuYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUNsYXNzLnBsYXllckJvYXJkKTtcbiAgICBjb25zdCBzaGlwQ2hlY2sgPSBlbmVteUNsYXNzLnBsYXllckJvYXJkLnNoaXBzUmVtYWluaW5nKCk7XG4gICAgY29uc29sZS5sb2coc2hpcENoZWNrKTtcbiAgICBpZiAoZ2FtZU92ZXIpIHtcbiAgICAgIHJldHVybiBlbmRHYW1lKCk7XG4gICAgfVxuICAgIC8vIHJldHVybiB2YWx1ZSBhbnl0aGluZyBvdGhlciB0aGFuIG51bSA9IGdhbWUgb3ZlclxuICAgIGlmIChpc05hTihzaGlwQ2hlY2spKSB7XG4gICAgICBnYW1lT3ZlciA9IHRydWU7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBnYW1lTG9vcCgpIHtcbiAgICAvLyBjYWxsIHVpIHN0cmlrZXNjcmVlbiBmb3IgY3VycmVudCBwbGF5ZXIgaWYgaXRzIGEgcGVyc29uXG4gICAgd2hpbGUgKGdhbWVPdmVyID09PSBmYWxzZSkge1xuICAgICAgY29uc29sZS5kaXIoY3VycmVudFBsYXllcik7XG5cbiAgICAgIGNvbnN0IGVuZW15Q2xhc3MgPSBjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxID8gcGxheWVyMiA6IHBsYXllcjE7XG4gICAgICBpZiAoIWN1cnJlbnRQbGF5ZXIuaXNDUFUpIHtcbiAgICAgICAgYXdhaXQgdWkuc3RyaWtlU2NyZWVuKGN1cnJlbnRQbGF5ZXIsIGVuZW15Q2xhc3MsIGdhbWVUdXJuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdhbWVUdXJuKGN1cnJlbnRQbGF5ZXIsIGVuZW15Q2xhc3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudFBsYXllciA9PT0gcGxheWVyMSkge1xuICAgICAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMjtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFBsYXllciA9PT0gcGxheWVyMikge1xuICAgICAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgaWYgKHBsYXllcjEuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjEgfTtcbiAgICAgIHBsYXllcjEgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIyLnBsYXllckJvYXJkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllcjIuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjIgfTtcbiAgICAgIHBsYXllcjIgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIxLnBsYXllckJvYXJkKTtcbiAgICB9XG5cbiAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMTtcbiAgICBjb25zb2xlLmxvZyhjdXJyZW50UGxheWVyKTtcbiAgICBjb25zb2xlLmxvZyhwbGF5ZXIyKTtcbiAgICAvLyB3aWxsIGluaXRpYWxpemUgdGhlIGdhbWUgbG9vcCBmbiB0aGF0IHdpbGwgY2FsbCB1aSBmb3Igc3RyaWtlIHNjcmVlbnNcbiAgICBnYW1lTG9vcCgpO1xuICB9XG5cbiAgY29uc3QgdWkgPSB1aVNjcmlwdChzaGlwUGxhY2VyUHJveHksIHBsYXllckluaXRpYWxpemVyLCBnYW1lSW5pdGlhbGl6ZXIpO1xuXG4gIC8vIHRoaXMgaW5pdGlhbGl6ZXMgYnV0IHRoZSBnYW1lIGxvb3AgcGlja3MgYmFjayB1cCB3aGVuIHVpIHNjcmlwdCBjYWxscyBnYW1laW5pdGlhbGl6ZXI7XG4gIGxldCBwbGF5ZXIxID0gdW5kZWZpbmVkO1xuICBsZXQgcGxheWVyMiA9IHVuZGVmaW5lZDtcbiAgbGV0IGN1cnJlbnRQbGF5ZXIgPSB1bmRlZmluZWQ7XG4gIGNvbnN0IGNwdUFJID0gY3B1KCk7XG4gIGxldCBnYW1lT3ZlciA9IGZhbHNlO1xuICB1aS5zdGFydFNjcmVlbigpO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICAgIHJldHVybiBpc0dhbWVPdmVyKCk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0dhbWVPdmVyKCkge1xuICAgIHJldHVybiBnYW1lT3ZlcjtcbiAgfVxuXG4gIHJldHVybiB7IGdhbWVUdXJuLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKHBsYXllck9iaiwgYm9hcmRGbikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG4gIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcbiAgY29uc3Qgc3RyaWtlcyA9IHtcbiAgICBtaXNzZXM6IFtdLFxuICAgIGhpdHM6IFtdLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSkge1xuICAgICAgcmVzdWx0ID0gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKTtcbiAgICAgIGlmIChyZXN1bHQuaGl0UmVwb3J0ID09PSBcImhpdFwiKSB7XG4gICAgICAgIHN0cmlrZXMuaGl0cy5wdXNoKGNvb3JkaW5hdGVzKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgICBzdHJpa2VzLmhpdHMucHVzaChjb29yZGluYXRlcyk7XG4gICAgICB9IGVsc2UgaWYgKHJlc3VsdC5oaXRSZXBvcnQgPT09IFwibWlzc1wiKSB7XG4gICAgICAgIHN0cmlrZXMubWlzc2VzLnB1c2goY29vcmRpbmF0ZXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIFwidHJ5IGFub3RoZXIgYXR0YWNrXCI7XG4gIH1cblxuICByZXR1cm4geyAuLi5wbGF5ZXJPYmosIHBsYXllckJvYXJkLCBjYW5TdHJpa2UsIGF0dGFjaywgaXNDUFUsIHN0cmlrZXMgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxheWVyO1xuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG4gIGxldCBjb29yZGluYXRlcyA9IFtdO1xuICBsZXQgb3JpZW50YXRpb24gPSBcIlwiO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIC8vcmV0dXJuIGAke3R5cGV9IHdhcyBoaXQuICR7aGl0cG9pbnRzKCl9IGhpdHBvaW50cyByZW1haW5pbmdgO1xuICAgIHJldHVybiBgaGl0YDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eXBlLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBkYW1hZ2UsXG4gICAgaGl0cG9pbnRzLFxuICAgIGhpdCxcbiAgICBpc1N1bmssXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaXA7XG4iLCJjb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5cbmNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICAvLyBwbGF5ZXIgaXMgZWl0aGVyIFwiY3B1XCIgb3IgXCJwZXJzb25cIlxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW21hbm93YXIsIGZyaWdhdGUsIGZyaWdhdGUsIHNjaG9vbmVyLCBzY2hvb25lciwgc2xvb3AsIHNsb29wXSxcbiAgICB9O1xuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21Db29yZCgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuY29vcmRpbmF0ZXMgPSBbXTtcblxuICAgIHJhbmNvb3JkaW5hdGVzLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmNvb3JkaW5hdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKSB7XG4gICAgbGV0IHNoaXBBcnIgPSBbLi4ucGxheWVyT2JqLnNoaXBzXTtcblxuICAgIHNoaXBBcnIuZm9yRWFjaCgoc2hpcExlbmd0aCkgPT4ge1xuICAgICAgbGV0IHBsYWNlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKCFwbGFjZWQpIHtcbiAgICAgICAgLy8gcmFuZG9tIGRpcmVjdGlvbiBvZiBzaGlwIHBsYWNlbWVudFxuICAgICAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IHJhbmRvbUNvb3JkKCk7XG4gICAgICAgIGNvbnN0IHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgICAgICBjb25zdCBheGlzID0gcmFuZG9tID09PSAwID8gXCJoXCIgOiBcInZcIjtcblxuICAgICAgICAvLyByZXR1cm5zIGZhbHNlIGlmIHdhcyBub3QgYWJsZSB0byBwbGFjZSBzaGlwIGF0IHJhbmRvbSBzcG90LCB0cnlzIGFnYWluXG4gICAgICAgIHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgc2hpcExlbmd0aCxcbiAgICAgICAgICByYW5jb29yZGluYXRlcyxcbiAgICAgICAgICBheGlzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIGdyaWRTaXplKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncmlkU2l6ZTsgaSsrKSB7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dDb250XCIpO1xuICAgICAgZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChyb3cpO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGdyaWRTaXplOyBqKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcImNlbGxcIik7XG4gICAgICAgIGNlbGwuZGF0YXNldC5yID0gaTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LmMgPSBqO1xuICAgICAgICByb3cuYXBwZW5kQ2hpbGQoY2VsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdyaWRTaGFkZXIoXG4gICAgY29vcmQsXG4gICAgbGVuZ3RoLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGRyYWdGaXRzLFxuICAgIHBsYWNlZCA9IGZhbHNlLFxuICAgIGdyaWRDb250YWluZXIsXG4gICkge1xuICAgIGNvbnN0IG9mZnNldHIgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBvZmZzZXRjID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgbGV0IGFkZGVkQ2xhc3MgPSBcIlwiO1xuICAgIGNvbnN0IGdyaWRDb250YWluZXJOYW1lID0gZ3JpZENvbnRhaW5lci5jbGFzc0xpc3QudmFsdWU7XG5cbiAgICAvLyAzIHNoYWRpbmcgcG9zc2libGl0aWVzIGZpdHMvbm9maXRzL3BsYWNlZFxuICAgIGlmIChwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgIGFkZGVkQ2xhc3MgPSBcInBsYWNlZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRlZENsYXNzID0gZHJhZ0ZpdHMgPT09IHRydWUgPyBcImZpdHNcIiA6IFwibm90Rml0c1wiO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRDb29yZCA9IFsuLi5jb29yZF07XG4gICAgbGV0IGNlbGxDb2xsZWN0aW9uID0gW107XG5cbiAgICAvLyBzaGFkZSBlYWNoIGNlbGwgcmVwcmVzZW50aW5nIHNoaXAgbGVuZ3RoXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBgLiR7Z3JpZENvbnRhaW5lck5hbWV9IFtkYXRhLXI9XCIke2N1cnJlbnRDb29yZFswXX1cIl1bZGF0YS1jPVwiJHtjdXJyZW50Q29vcmRbMV19XCJdYCxcbiAgICAgICk7XG4gICAgICBjZWxsQ29sbGVjdGlvbi5wdXNoKGN1cnJlbnRDZWxsKTtcblxuICAgICAgaWYgKGN1cnJlbnRDZWxsICE9PSBudWxsKSB7XG4gICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY3VycmVudENvb3JkWzBdICs9IG9mZnNldHI7XG4gICAgICBjdXJyZW50Q29vcmRbMV0gKz0gb2Zmc2V0YztcbiAgICB9XG4gICAgLy8gYWZ0ZXIgc2hhZGUsIGRyYWdsZWF2ZSBoYW5kbGVyIHRvIGNsZWFyIHNoYWRpbmcgd2hlbiBub3QgcGxhY2VkXG4gICAgY29uc3QgZmlyc3RDZWxsID0gY2VsbENvbGxlY3Rpb25bMF07XG4gICAgaWYgKGZpcnN0Q2VsbCA9PT0gbnVsbCB8fCBmaXJzdENlbGwgPT09IHVuZGVmaW5lZCB8fCBwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZmlyc3RDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNlbGxDb2xsZWN0aW9uLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgLy8gY2xlYXIgcGFnZSBjb250YWluZXIgYW5kIHBvcHVsYXRlIHdpdGggc2hpcCBzZWxlY3RcbiAgICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInNoaXBTY3JlZW5Db250XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllck5hbWVcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJncmlkQ29udFwiPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcERpc3BsYXlDb250XCI+XG4gICAgICAgICAgICAgICAgICB0aGlzIHdpbGwgYmUgYWxsIGJvYXRzIGxpc3RlZCBhbmQgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNVwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgbWFuXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRhdGEtaW5kZXg9XCI0XCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBmcmlnXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiAgZGF0YS1pbmRleD1cIjNcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IHNjaG9vblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIyXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzbG9vcFwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3JpZW50YXRpb25Db250XCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJvcmllbnRhdGlvbkJ0blwiIGRhdGEtb3JpZW50YXRpb249XCJoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBIb3Jpem9udGFsXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidHh0XCI+XG4gICAgICAgICAgICAgICAgICBQbGFjZSB5b3VyIHNoaXBzIVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInJhbmRvbUJ0blwiPlxuICAgICAgICAgICAgICAgICAgUmFuZG9taXplXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgIGA7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuXG4gICAgICAvLyBuZWNlc3NhcnkgZ2xvYmFscyBmb3IgbWV0aG9kcyBpbiBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZ3JpZENvbnRcIik7XG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgbGV0IGFyYWdTaGlwTGVuZ3RoID0gMDtcbiAgICAgIGxldCBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkcmFnRml0cyA9IGZhbHNlO1xuICAgICAgbGV0IG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICBsZXQgY29vcmQgPSBbXTtcbiAgICAgIGxldCBtb3dDb3VudCA9IDE7XG4gICAgICBsZXQgZnJpZ0NvdW50ID0gMjtcbiAgICAgIGxldCBzY2hvb25Db3VudCA9IDM7XG4gICAgICBsZXQgc2xvb3BDb3VudCA9IDI7XG4gICAgICBsZXQgZGVwbGV0ZWRTaGlwID0gbnVsbDtcblxuICAgICAgbGV0IHNoaXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5zaGlwXCIpO1xuICAgICAgbGV0IHNoaXBDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBCb3hcIik7XG4gICAgICBsZXQgcGxheWVyTmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyTmFtZVwiKTtcbiAgICAgIGxldCBtYW5Db3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50Lm1hblwiKTtcbiAgICAgIGxldCBmcmlnQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5mcmlnXCIpO1xuICAgICAgbGV0IHNjaG9vbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQuc2Nob29uXCIpO1xuICAgICAgbGV0IHNsb29wQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zbG9vcFwiKTtcblxuICAgICAgcGxheWVyTmFtZS50ZXh0Q29udGVudCA9IGBQbGF5ZXIgJHtwbGF5ZXJPYmoubnVtYmVyfWA7XG4gICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgIC8vIGJ1aWxkIHRoZSB2aXN1YWwgZ3JpZFxuICAgICAgZ3JpZEJ1aWxkZXIoZ3JpZENvbnRhaW5lciwgMTApO1xuICAgICAgLy8gY3ljbGUgc2hpcCBwbGFjZW1lbnQgb3JpZW50YXRpb24sIGluaXRpYWxpemVkIHRvIFwiaFwiXG4gICAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgICBvcmllbnRhdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIkhvcml6b250YWxcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHJhbmRvbUJ0bkZuKCkge1xuICAgICAgICBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJhbmRvbUJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucmFuZG9tQnRuXCIpO1xuXG4gICAgICByYW5kb21CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgcmFuZG9tQnRuRm4oKTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBsZWF2ZVNjcmVlbigpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2VsbFwiKTtcbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGUgb24gYSBkcmFnb3ZlciBldmVudFxuICAgICAgLy8gY2hlY2tzIGlmIHRoZSBzaGlwIGRyYWdnZWQgd2lsbCBmaXRcbiAgICAgIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAgICAgY29uc3QgZHJhZ092ZXJIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZ1NoaXBMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtb3VzZW92ZXJcIik7XG5cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibW91c2VvdmVyXCIpO1xuICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICAgIHNoaXBJTUcuY2xhc3NMaXN0LmFkZChcInNoaXBJTUdcIik7XG4gICAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgZnVuY3Rpb24gc2hpcERyYWdIYW5kbGVyKGUpIHtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG5cbiAgICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7XG4gICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZSkgPT4ge1xuICAgICAgICAgIHNoaXBEcmFnSGFuZGxlcihlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2hpcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgc2hpcC5jbGFzc0xpc3QucmVtb3ZlKFwiZHJhZ2dpbmdcIik7XG5cbiAgICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChwbGFjZWQpIHtcbiAgICAgICAgICAgICAgZ3JpZFNoYWRlcihcbiAgICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NoaXBzID0gXCJcIjtcblxuICAgICAgICAgICAgICBzd2l0Y2ggKGRyYWdTaGlwTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBtb3dDb3VudDtcbiAgICAgICAgICAgICAgICAgIG1vd0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gZnJpZ0NvdW50O1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke2ZyaWdDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzY2hvb25Db3VudDtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2xvb3BDb3VudDtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IGludmFsaWQgc2hpcCBsZW5ndGggaW4gZHJhZ1NoaXBcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgLT0gMTtcblxuICAgICAgICAgICAgICBpZiAocmVtYWluaW5nU2hpcHMgPD0gMCkge1xuICAgICAgICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRlcGxldGVkXCIpO1xuICAgICAgICAgICAgICAgIHNoaXAucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBzaGlwRHJhZ0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHNoaXAuZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZHJhZ1NoaXAgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgZHJhZ1NoaXBMZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbW93Q291bnQgPD0gMCAmJlxuICAgICAgICAgICAgZnJpZ0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNjaG9vbkNvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNsb29wQ291bnQgPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJOZXh0XCI7XG4gICAgICAgICAgICBwYWdlQ29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRCdG4pO1xuXG4gICAgICAgICAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBnYW1lVHVybiByZXF1aXJlcyBjb29yZGluYXRlcywgcGxheWVyQ2xhc3MsIGVuZW15Q2xhc3NcbiAgYXN5bmMgZnVuY3Rpb24gc3RyaWtlU2NyZWVuKHBsYXllckNsYXNzLCBlbmVteUNsYXNzLCBnYW1lVHVyblNjcmlwdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPjwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VDb250XCI+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VHcmlkQ29udFwiPlxuICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdHJpa2VSZXN1bHRcIj5TdHJpa2UgUmVzdWx0PC9zcGFuPlxuICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBQbGFjZWRDb250XCI+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFBsYWNlZEdyaWRcIj48L2Rpdj5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwc1JlbWFpbkNvbnRcIj48L2Rpdj5cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgPC9kaXY+XG4gICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG5cbiAgICAgIGNvbnN0IHBsYXllck5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllck5hbWVcIik7XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHRDb250ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdHJpa2VSZXN1bHRcIik7XG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc3RyaWtlR3JpZENvbnRcIik7XG4gICAgICBjb25zdCBzaGlwUGxhY2VHcmlkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwUGxhY2VkR3JpZFwiKTtcbiAgICAgIGxldCBhYmxlVG9TdHJpa2UgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdG9va1R1cm4gPSBmYWxzZTtcbiAgICAgIGNvbnN0IGhpdFNWRyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBoaXRTVkcuaW5uZXJIVE1MID0gYDxzdmcgY2xhc3M9XCJoaXRJY29uXCIgeG1sbnMgPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIC05NjAgOTYwIDk2MFwiIHdpZHRoPVwiMjRcIj5cbiAgICAgICAgICA8cGF0aCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgZD1cIm0yNTYtMjAwLTU2LTU2IDIyNC0yMjQtMjI0LTIyNCA1Ni01NiAyMjQgMjI0IDIyNC0yMjQgNTYgNTYtMjI0IDIyNCAyMjQgMjI0LTU2IDU2LTIyNC0yMjQtMjI0IDIyNFpcIi8+XG4gICAgICAgIDwvc3ZnPmA7XG4gICAgICBjb25zdCBtaXNzU3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1pc3NTdmcuaW5uZXJIVE1MID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgLTk2MCA5NjAgOTYwXCIgd2lkdGg9XCIyNFwiPjxwYXRoIGQ9XCJNNDgwLTQ4MFptMCAyODBxLTExNiAwLTE5OC04MnQtODItMTk4cTAtMTE2IDgyLTE5OHQxOTgtODJxMTE2IDAgMTk4IDgydDgyIDE5OHEwIDExNi04MiAxOTh0LTE5OCA4MlptMC04MHE4MyAwIDE0MS41LTU4LjVUNjgwLTQ4MHEwLTgzLTU4LjUtMTQxLjVUNDgwLTY4MHEtODMgMC0xNDEuNSA1OC41VDI4MC00ODBxMCA4MyA1OC41IDE0MS41VDQ4MC0yODBaXCIvPjwvc3ZnPmA7XG4gICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgZnVuY3Rpb24gcHJldlN0cmlrZVBvcHVsYXRvcihcbiAgICAgICAgcGxheWVyQ2xhc3MsXG4gICAgICAgIGhpdFNWRyxcbiAgICAgICAgbWlzc1N2ZyxcbiAgICAgICAgZ3JpZENvbnQsXG4gICAgICAgIGhpdHNPbmx5ID0gZmFsc2UsXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgZ3JpZENvbnRhaW5lck5hbWUgPSBncmlkQ29udC5jbGFzc0xpc3QudmFsdWU7XG4gICAgICAgIGNvbnN0IG1pc3NBcnIgPSBwbGF5ZXJDbGFzcy5zdHJpa2VzLm1pc3NlcztcbiAgICAgICAgY29uc3QgaGl0c0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMuaGl0cztcbiAgICAgICAgY29uc3QgZW5lbXlTdHJlYWtBcnIgPSBlbmVteUNsYXNzLnBsYXllckJvYXJkLnN0cmVha0FycjtcbiAgICAgICAgY29uc3QgZGVsYXkgPSAodGltZW91dCkgPT5cbiAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzKSA9PiBzZXRUaW1lb3V0KHJlcywgdGltZW91dCkpO1xuICAgICAgICAvLyBmb3Igdmlld2luZyB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXQsIHBhc3N0aHJvdWdoIGVuZW15Q2xhc3MgaW5zdGVhZCBvZiBjdXJyZW50IHBsYXllclxuICAgICAgICBpZiAoaGl0c09ubHkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgbWlzc0Fyci5mb3JFYWNoKChjb29yZFBhaXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcIm1pc3NcIik7XG4gICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gYXN5bmNDb250cm9sbGVyKHRpbWVvdXQsIGNhbGxiYWNrZm4pIHtcbiAgICAgICAgICBhd2FpdCBkZWxheSh0aW1lb3V0KTtcbiAgICAgICAgICBjYWxsYmFja2ZuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBoaXRzQXJyLmZvckVhY2goKGNvb3JkUGFpcikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y29vcmRQYWlyWzBdfVwiXVtkYXRhLWM9XCIke2Nvb3JkUGFpclsxXX1cIl1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcImhpdFwiKTtcbiAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IGhpdFNWRy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGVuZW15U3RyZWFrQXJyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBzdHJlYWtTZXF1ZW5jZSA9IGFzeW5jIChwb2ludCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICBgLnNoaXBQbGFjZWRHcmlkIFtkYXRhLXI9XCIke3BvaW50WzBdfVwiXVtkYXRhLWM9XCIke3BvaW50WzFdfVwiXWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IDQwMDtcbiAgICAgICAgICAgIGF3YWl0IGRlbGF5KHRpbWVvdXQpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcInN0cmVha0hpdFwiKTtcbiAgICAgICAgICAgIGF3YWl0IGRlbGF5KHRpbWVvdXQpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LnJlbW92ZShcInN0cmVha0hpdFwiKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIHZpc3VhbCBlZmZlY3QgdGhhdCBoaWdsaWdodHMgdGhlIHN0cmlrZVxuICAgICAgICAgIGVuZW15U3RyZWFrQXJyLmZvckVhY2goKGhpdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGVuZW15U3RyZWFrQXJyLnNoaWZ0KCk7XG4gICAgICAgICAgICBhc3luY0NvbnRyb2xsZXIoNTAwLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHN0cmVha1NlcXVlbmNlKGN1cnJlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBsYXllck5hbWUudGV4dENvbnRlbnQgPSBgUGxheWVyICR7cGxheWVyQ2xhc3MubnVtYmVyfSBUdXJuYDtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzdHJpa2UgZ3JpZCAmJiBwb3B1bGF0ZSBwcmV2aW91cyBzdHJpa2VzIGlmIGFwcGxpY2FibGVcbiAgICAgIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIDEwKTtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzaGlwUGxhY2VkR3JpZFxuICAgICAgZ3JpZEJ1aWxkZXIoc2hpcFBsYWNlR3JpZCwgMTApO1xuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihwbGF5ZXJDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBncmlkQ29udGFpbmVyKTtcbiAgICAgIC8vIHBvcHVsYXRlIHdoaWNoIG9mIHlvdXIgc2hpcHMgYXJlIGhpdFxuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihlbmVteUNsYXNzLCBoaXRTVkcsIG1pc3NTdmcsIHNoaXBQbGFjZUdyaWQsIHRydWUpO1xuXG4gICAgICBjb25zdCBjZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2VsbFwiKTtcbiAgICAgIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgLy8gcmVwbGFjZSB0aGlzIGZuIHdpdGggY2hlY2tlciBmb3IgcmVwZWF0IHN0cmlrZXNcbiAgICAgICAgICBjb25zdCBjYW5TdHJpa2UgPSBwbGF5ZXJDbGFzcy5jYW5TdHJpa2UoXG4gICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgIGVuZW15Q2xhc3MucGxheWVyQm9hcmQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoY2FuU3RyaWtlICYmICF0b29rVHVybikge1xuICAgICAgICAgICAgLy8gc2VuZCBzaWduYWwgdG8gc3RyaWtlIHRvIGdhbWVUdXJuXG4gICAgICAgICAgICAvLyByZXNwb25zZSB3aWxsIHJldHVybiBvYmogd2l0aCAuaGl0UmVwb3J0ICYgLmlzU3Vua1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBnYW1lVHVyblNjcmlwdChwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcywgY29vcmQpO1xuICAgICAgICAgICAgbGV0IG5leHRCdG47XG5cbiAgICAgICAgICAgIG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgc3RyaWtlUmVzdWx0Q29udC50ZXh0Q29udGVudCA9XG4gICAgICAgICAgICAgIHN0cmlrZVJlc3VsdENvbnQudGV4dENvbnRlbnQgKyBcIjogXCIgKyByZXNwb25zZS5oaXRSZXBvcnQ7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJFbmQgVHVyblwiO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICAgICAgICBwYWdlQ29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRCdG4pO1xuICAgICAgICAgICAgICB0b29rVHVybiA9IHRydWU7XG4gICAgICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcIm1pc3NcIik7XG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gbWlzc1N2Zy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgIGNlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5oaXRSZXBvcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3I6IHN0cmlrZSByZXNwb25zZSBleGNlcHRpb25cIik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vc3RyZWFrQXJyIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBvZiBoaXRzIHJlY2VpdmVkIGZyb20gcHJldmlvdXMgcGxheWVyXG4gICAgICAgICAgICAgIGVuZW15Q2xhc3MucGxheWVyQm9hcmQuc3RyZWFrQXJyLnB1c2goY29vcmQpO1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJoaXRcIik7XG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gaGl0U1ZHLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgICAgY2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBwbGFjZVNoaXBzKHBsYXllckNsYXNzKSB7XG4gICAgICAgIGNvbnN0IHNoaXBzQXJyYXkgPSBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwcztcbiAgICAgICAgc2hpcHNBcnJheS5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgY29vcmQgPSBzaGlwLmNvb3JkaW5hdGVzO1xuICAgICAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gc2hpcC5vcmllbnRhdGlvbjtcblxuICAgICAgICAgIGdyaWRTaGFkZXIoY29vcmQsIGxlbmd0aCwgb3JpZW50YXRpb24sIG51bGwsIHRydWUsIHNoaXBQbGFjZUdyaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHBsYWNlU2hpcHMocGxheWVyQ2xhc3MpO1xuICAgIH0pO1xuICB9XG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2NyZWVuKCkge1xuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+QmF0dGxlc2hpcDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyU2VsZWN0Q29udFwiPlxuICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249XCJcIiBjbGFzcz1cInBsYXllckZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDFcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDFcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMVwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMlwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAyXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+QmVnaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllckZvcm1cIik7XG4gICAgaW5pdENvdW50cnlTZWxlY3QoKTtcbiAgICBwbGF5ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBwT2JqSW5pdGlhbGl6ZXIoXCIucGxheWVyRm9ybVwiLCBcInNlbGVjdHAxXCIsIFwic2VsZWN0cDJcIik7XG4gICAgICAvLyBwbGF5ZXJvYmogc2VudCBiYWNrIHRvIGV4dGVuZCBmdW5jdGlvbmFsaXR5IHdpdGggcGxheWVyIHNjcmlwdFxuICAgICAgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1BsYXllcnMocGxheWVycykge1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcGxheWVycykge1xuICAgICAgICAgIGlmIChlbGVtZW50LnBsYXllciA9PT0gXCJwZXJzb25cIikge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIGF3YWl0IHNoaXBTY3JlZW4oZWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBzaGlwUmFuZG9taXplcihlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpO1xuICAgICAgLy8gdGhpcyBwYXNzZXMgb3ZlciBjb250cm9sIGJhY2sgdG8gdGhlIGluZGV4IHNjcmlwdC5cbiAgICAgIGdhbWVJbml0U2NyaXB0KCk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2FtZU92ZXJTY3JlZW4oKSB7XG4gICAgLy8gZ2V0IHJlZmVyZW5jZSB0byB0aGUgcGFnZSBjb250YWluZXJcbiAgICAvLyBjbGVhciB0aGUgcGFnZVxuICAgIC8vIHNheSBnYW1lIG92ZXIgYW5kIHdobyB3b24gdGhlIGdhbWVcbiAgICAvLyBoYXZlIGEgYnV0dG9uIHRoYXQgd2lsbCByZXNldCB0aGUgZ2FtZVxuICAgIC8vIGFsdGVybmF0aXZlbHkgeW91IGNvdWxkIG5vdCBjbGVhciB0aGUgc2NyZWVuIGFuZCB0aGVuIGp1c3QgdXNlIG1vZGFscyB0byBtYWtlIGl0IGFwcGVhclxuICAgIC8vIHRoZSBtb2RhbCB3b3VsZCBiZSBhIGZvcm0gd2l0aCB0aGUgcmVzZXQgYnV0dG9uIGFjdGluZyBhcyB0aGUgc3VibWl0IGZvciB0aGUgZm9ybS5cbiAgfVxuICByZXR1cm4geyBzdGFydFNjcmVlbiwgcE9iakluaXRpYWxpemVyLCBzdHJpa2VTY3JlZW4sIGdhbWVPdmVyU2NyZWVuIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZXJJbnRlcmZhY2U7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=