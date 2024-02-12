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
              `.${gridContainerName} [data-r="${point[0]}"][data-c="${point[1]}"]`,
            );
            const timeout = 400;
            await delay(timeout);
            currentCell.classList.add("streakHit");
            await delay(timeout);
            currentCell.classList.remove("streakHit");
          };
          // visual effect that higlights the strike
          // make sure that it is an async function that has a half second delay.
          enemyStreakArr.forEach((hit) => {
            const current = enemyStreakArr.shift();
            asyncController(500, streakSequence(current));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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WUFBWTtBQUNwRCx1Q0FBdUMsV0FBVztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxTQUFTO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFVBQVU7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsWUFBWTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxXQUFXO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG1CQUFtQixXQUFXLGFBQWEsYUFBYSxhQUFhO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxnQkFBZ0IsbUJBQW1CLFdBQVcsYUFBYSxhQUFhLGFBQWE7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG1CQUFtQixXQUFXLFNBQVMsYUFBYSxTQUFTO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDtBQUNBO0FBQ0EseUNBQXlDLG9CQUFvQjtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsS0FBUyxFQUFFLEVBRWQ7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLFNBQVM7QUFDVCxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUM5cEJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNwdVBsYXllciA9ICgpID0+IHtcbiAgbGV0IHN0YXRlID0gXCJyYW5kb21cIjtcbiAgbGV0IGhpdCA9IGZhbHNlO1xuICBsZXQgc3RyZWFrID0gZmFsc2U7XG4gIGxldCBoaXRBcnIgPSBbXTtcbiAgbGV0IHB1cnN1aXRBeGlzID0gbnVsbDtcblxuICBmdW5jdGlvbiByYW5kb21Nb3ZlKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5kb21Db29yZCA9IFtdO1xuXG4gICAgcmFuZG9tQ29vcmQucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuZG9tQ29vcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBhZGphY2VudE1vdmUoKSB7XG4gICAgLy8gd2lsbCByZXR1cm4gY29vcmRpbmF0ZSBpbiBlaXRoZXIgc2FtZSByb3cgb3IgY29sdW1uIGFzIGxhc3RIaXRcbiAgICBjb25zdCBbbGFzdEhpdF0gPSBoaXRBcnI7XG4gICAgbGV0IGFkamFjZW50U3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuICAgIC8vIHJhbmRvbWx5IGNob29zZSBlaXRoZXIgcm93IG9yIGNvbHVtbiB0byBjaGFuZ2VcbiAgICBjb25zdCBheGlzID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgLy8gMCAtPiAtMSB3aWxsIGJlIGFkZGVkIHx8IDEgLT4gMSB3aWxsIGJlIGFkZGVkXG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgYWRqYWNlbnRTdHJpa2VbYXhpc10gKz0gb2Zmc2V0VmFsdWU7XG4gICAgLy9jaGVjayB0byBwcm90ZWN0IG91dG9mYm91bmRzIHN0cmlrZXNcbiAgICBpZiAoXG4gICAgICBhZGphY2VudFN0cmlrZVswXSA8IDAgfHxcbiAgICAgIGFkamFjZW50U3RyaWtlWzFdIDwgMCB8fFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMF0gPiA5IHx8XG4gICAgICBhZGphY2VudFN0cmlrZVsxXSA+IDlcbiAgICApIHtcbiAgICAgIGNvbnN0IHJlZG8gPSBhZGphY2VudE1vdmUoKTtcbiAgICAgIGFkamFjZW50U3RyaWtlID0gcmVkbztcbiAgICB9XG5cbiAgICByZXR1cm4gYWRqYWNlbnRTdHJpa2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0SW5saW5lKGxhc3RIaXQpIHtcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBcImhcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzFdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9IGVsc2UgaWYgKHB1cnN1aXRBeGlzID09PSBcInZcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzBdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmxpbmVNb3ZlKCkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtjMSwgYzJdID0gaGl0QXJyO1xuICAgICAgaWYgKGMxWzBdID09PSBjMlswXSAmJiBjMVsxXSAhPT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfSBlbHNlIGlmIChjMVswXSAhPT0gYzJbMF0gJiYgYzFbMV0gPT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFycltoaXRBcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgLy8gY29uZGl0aW9uIGlmIHRoZSBsYXN0IHN0cmlrZSB3YXMgYSBtaXNzIHRoZW4gc3RhcnQgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGxpc3RcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbmV4dE1vdmUoKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgc3RhdGUgPSBcInJhbmRvbVwiO1xuICAgICAgaGl0QXJyID0gW107XG4gICAgICBwdXJzdWl0QXhpcyA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpdEFyci5wdXNoKGNvb3JkaW5hdGUpO1xuICAgICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgICB9IGVsc2UgaWYgKGhpdEFyci5sZW5ndGggPiAxKSB7XG4gICAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuIiwiY29uc3QgZ2FtZUJvYXJkID0gKCkgPT4ge1xuICBsZXQgc2hpcHMgPSBbXTtcbiAgbGV0IHN0cmVha0FyciA9IFtdO1xuICBmdW5jdGlvbiBncmlkTWFrZXIoKSB7XG4gICAgZ3JpZCA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBncmlkW2ldID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgZ3JpZFtpXVtqXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmlkO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZXIgZm9yIHRoZSBncmlkXG4gIGxldCBzaGlwR3JpZCA9IGdyaWRNYWtlcigpO1xuICBsZXQgYXR0YWNrc1JlY2VpdmVkID0gZ3JpZE1ha2VyKCk7XG5cbiAgZnVuY3Rpb24gc2hpcFBlcmltZXRlcihib3dQb3MsIGxlbmd0aCwgb3JpZW50YXRpb24sIGNhbGxiYWNrZm4pIHtcbiAgICAvLyB0aGlzIGZuIGRlZmluZXMgNCBhcmVhcyB0b3AsIEwsIFIsIGJvdHRvbSBhbmQgY2FsbHMgaW5qZWN0ZWQgZnVuY3Rpb25cbiAgICAvLyBvbiBlYWNoIG9mIHRoZSBzcXVhcmVzIGl0IGlzIGV4cGVjdGVkIHRoYXQgdGhlIGNhbGxiYWNrZm4gcmV0dXJuIGJvb2xcblxuICAgIC8vIHRoZSAwIG1lYW5zIHRoYXQgdGhlIHJvdyB3aWxsIGJlIGFkZGVkIG9mZnNldCB0byBkcmF3IGJvcmRlciBhYm92ZSBzaGlwXG4gICAgY29uc3QgYXhpc09mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGF4aXNDb3VudGVyID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgY29uc3QgYU9mZnNldCA9IDE7XG4gICAgY29uc3QgYk9mZnNldCA9IC0xO1xuXG4gICAgbGV0IGVuZGNhcEE7XG4gICAgbGV0IGVuZGNhcEI7XG5cbiAgICAvLyBmaW5kcyB0aGUgcG9pbnQgZGlyZWN0bHkgYWRqYWNlbnQgdG8gYm93IGFuZCB0cmFuc29tXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgZW5kY2FwQSA9IFtib3dQb3NbMF0sIGJvd1Bvc1sxXSAtIDFdO1xuICAgICAgZW5kY2FwQiA9IFtib3dQb3NbMF0sIGJvd1Bvc1sxXSArIGxlbmd0aF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuZGNhcEEgPSBbYm93UG9zWzBdIC0gMSwgYm93UG9zWzFdXTtcbiAgICAgIGVuZGNhcEIgPSBbYm93UG9zWzBdICsgbGVuZ3RoLCBib3dQb3NbMV1dO1xuICAgIH1cblxuICAgIGxldCByb3dBID0gWy4uLmJvd1Bvc107XG4gICAgbGV0IHJvd0IgPSBbLi4uYm93UG9zXTtcblxuICAgIHJvd0FbYXhpc09mZnNldF0gKz0gYU9mZnNldDtcbiAgICByb3dCW2F4aXNPZmZzZXRdICs9IGJPZmZzZXQ7XG4gICAgLy8gc3VidHJhY3QgYnkgMSB0byBnZXQgY29ybmVyIHNwb3QgZGlhZ29uYWwgdG8gYm93XG4gICAgcm93QVtheGlzQ291bnRlcl0gKz0gLTE7XG4gICAgcm93QltheGlzQ291bnRlcl0gKz0gLTE7XG5cbiAgICBjb25zdCByZXN1bHRFQ0EgPSBjYWxsYmFja2ZuKGVuZGNhcEEpO1xuICAgIGNvbnN0IHJlc3VsdEVDQiA9IGNhbGxiYWNrZm4oZW5kY2FwQik7XG5cbiAgICBpZiAocmVzdWx0RUNBID09PSBmYWxzZSB8fCByZXN1bHRFQ0IgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJlc3VsdEEgPSBjYWxsYmFja2ZuKHJvd0EpO1xuICAgICAgY29uc3QgcmVzdWx0QiA9IGNhbGxiYWNrZm4ocm93Qik7XG4gICAgICBpZiAocmVzdWx0QSA9PT0gZmFsc2UgfHwgcmVzdWx0QiA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcm93QVtheGlzQ291bnRlcl0gKz0gMTtcbiAgICAgIHJvd0JbYXhpc0NvdW50ZXJdICs9IDE7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBjb3B5Q29vcmQgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIGxldCByID0gY29weUNvb3JkWzBdO1xuICAgIGxldCBjID0gY29weUNvb3JkWzFdO1xuICAgIGNvbnN0IHJvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBjb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzaGlwZml0IGxlbmd0aCB1bmRlZmluZWRcIik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByICs9IHJvZmZzZXQ7XG4gICAgICBjICs9IGNvZmZzZXQ7XG4gICAgfVxuICAgIC8vIGNhbGxiYWNrZm4gY2hlY2tzIGVhY2ggY29vcmQgcGFzc2VkIGFuZCByZXR1cm4gZmFsc2UgaWYgbm90IG51bGxcbiAgICBjb25zdCBwZXJpbWV0ZXJDaGVjayA9IHNoaXBQZXJpbWV0ZXIoXG4gICAgICBjb29yZGluYXRlcyxcbiAgICAgIGxlbmd0aCxcbiAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgKHBvaW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSBwb2ludFswXTtcbiAgICAgICAgY29uc3QgYyA9IHBvaW50WzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBleHRlbmRzIGJleW9uZCBib3VuZGFyeSwgc2tpcHMgaWYgc29cbiAgICAgICAgaWYgKHIgPD0gLTEgfHwgciA+PSAxMCB8fCBjIDw9IC0xIHx8IGMgPj0gMTApIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gPT09IG51bGwgfHwgc2hpcEdyaWRbcl1bY10gPT09IFwieFwiKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICApO1xuICAgIC8vIHRydWUgcGVyaW1ldGVyQ2hlY2sgaW5kaWNhdGVzIHNoaXAgZml0c1xuICAgIHJldHVybiBwZXJpbWV0ZXJDaGVjaztcbiAgfVxuXG4gIGZ1bmN0aW9uIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyBbMCwgMV0gOiBbMSwgMF07XG4gICAgbGV0IGN1cnJlbnQgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBHcmlkW2N1cnJlbnRbMF1dW2N1cnJlbnRbMV1dID0gc2hpcDtcbiAgICAgIGN1cnJlbnRbMF0gKz0gb2Zmc2V0WzBdO1xuICAgICAgY3VycmVudFsxXSArPSBvZmZzZXRbMV07XG4gICAgfVxuICAgIC8vIHJldHVybiBzdGF0ZW1lbnQgb2YgdHJ1ZSBtZWFucyBzdWNjZXNzZnVsXG4gICAgY29uc3QgYnVpbGRQZXJpbWV0ZXIgPSBzaGlwUGVyaW1ldGVyKFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBsZW5ndGgsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICAgIChwb2ludCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcG9pbnRbMF07XG4gICAgICAgIGNvbnN0IGMgPSBwb2ludFsxXTtcbiAgICAgICAgLy8gY2hlY2sgaWYgZXh0ZW5kcyBiZXlvbmQgYm91bmRhcnlcbiAgICAgICAgaWYgKHIgPD0gLTEgfHwgciA+PSAxMCB8fCBjIDw9IC0xIHx8IGMgPj0gMTApIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBzaGlwR3JpZFtyXVtjXSA9IFwieFwiO1xuICAgICAgfSxcbiAgICApO1xuICAgIGlmIChidWlsZFBlcmltZXRlciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4Y2VwdGlvbiBvY2N1cmVkIHdpdGggYnVpbGRpbmcgc2hpcCBwZXJpbWV0ZXJcIik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2hpcChzaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICBzaGlwcy5wdXNoKHNoaXApO1xuXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9yaWVudGF0aW9uID09PSBcInZcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2hpcC5jb29yZGluYXRlcyA9IFsuLi5jb29yZGluYXRlc107XG4gICAgc2hpcC5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuXG4gICAgaWYgKHN0cmlrZVNxdWFyZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgYyA9IGNvb3JkaW5hdGVzWzFdO1xuICAgIGxldCBoaXRSZXBvcnQgPSB1bmRlZmluZWQ7XG4gICAgbGV0IGlzU3VuayA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCAmJiBzaGlwR3JpZFtyXVtjXSAhPT0gXCJ4XCIpIHtcbiAgICAgIGNvbnN0IHNoaXAgPSBzaGlwR3JpZFtyXVtjXTtcbiAgICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDE7XG4gICAgICBoaXRSZXBvcnQgPSBzaGlwLmhpdCgpO1xuICAgICAgaXNTdW5rID0gc2hpcC5pc1N1bmsoKTtcblxuICAgICAgaWYgKGlzU3Vuaykge1xuICAgICAgICBzaGlwcyA9IHNoaXBzLmZpbHRlcigoZWxlbWVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBlbGVtZW50ICE9PSBzaGlwO1xuICAgICAgICB9KTtcbiAgICAgICAgaGl0UmVwb3J0ID0gYCR7c2hpcC50eXBlfSBoYXMgYmVlbiBzdW5rYDtcbiAgICAgICAgLy8gcmV0dXJuIHN0YXRlbWVudCBpcyBvYmogdGhhdCBjb250YWlucyB0aGUgcmVwb3J0IGFzIHdlbGwgaXNTdW5rXG4gICAgICAgIHJldHVybiB7IGhpdFJlcG9ydCwgaXNTdW5rIH07XG4gICAgICB9XG4gICAgICByZXR1cm4geyBoaXRSZXBvcnQsIGlzU3VuayB9O1xuICAgIH1cbiAgICBoaXRSZXBvcnQgPSBcIm1pc3NcIjtcbiAgICBpc1N1bmsgPSBcImZhbHNlXCI7XG4gICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMDtcbiAgICBjb25zb2xlLmxvZyhoaXRSZXBvcnQpO1xuICAgIGNvbnNvbGUubG9nKGBhdHRlbXB0ZWQgU3RyaWtlOiAke3J9LCAke2N9YCk7XG5cbiAgICByZXR1cm4geyBoaXRSZXBvcnQsIGlzU3VuayB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcHNSZW1haW5pbmcoKSB7XG4gICAgcmV0dXJuIHNoaXBzLmxlbmd0aCA+IDAgPyBzaGlwcy5sZW5ndGggOiBcIkFsbCBzaGlwcyBoYXZlIHN1bmtcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2hpcEdyaWQsXG4gICAgc3RyZWFrQXJyLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgY29ubmVjdGluZyBjcHUgQUkgdG8gb3RoZXIgZnVuY3Rpb25zXG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgY29uc29sZS5sb2cocGxheWVyQ2xhc3MpO1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIGNvbnNvbGUubG9nKG5leHRTdHJpa2UpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmVwZWF0TW92ZSA9IHRydWU7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZShyZXBlYXRNb3ZlKTtcbiAgICAgICAgY29uc29sZS5sb2cobmV4dFN0cmlrZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG4gICAgICBjb25zb2xlLmxvZyhzdHJpa2VSZXN1bHQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0LmhpdFJlcG9ydCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UsIHN0cmlrZVJlc3VsdC5pc1N1bmspO1xuICAgICAgICBlbmVteUJvYXJkLnN0cmVha0Fyci5wdXNoKG5leHRTdHJpa2UpO1xuXG4gICAgICAgIHJldHVybiBhdHRhY2soKTtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0LmhpdFJlcG9ydCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0TWlzcygpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgLi4uKHsgY2FuU3RyaWtlLCBzdHJpa2VzIH0gPSBwbGF5ZXJDbGFzcyksXG4gICAgICBhdHRhY2ssXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwbGF5ZXJJbml0aWFsaXplcihwbGF5ZXJPYmopIHtcbiAgICBpZiAocGxheWVyT2JqLm51bWJlciA9PT0gMSkge1xuICAgICAgcGxheWVyMSA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGF5ZXIyID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFBsYWNlclByb3h5KFxuICAgIG51bWJlcixcbiAgICBsZW5ndGgsXG4gICAgY29vcmRpbmF0ZXMsXG4gICAgb3JpZW50YXRpb24sXG4gICAgY2hlY2tvbmx5ID0gZmFsc2UsXG4gICkge1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPT09IG51bGwgfHwgbGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHdpbGwgbWFrZSBhbmQgcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBwbGF5ZXIgPSBudW1iZXIgPT09IDEgPyBwbGF5ZXIxIDogcGxheWVyMjtcbiAgICAvLyBmaXJzdCBjaGVjayB0aGUgY29vcmRpbmF0ZXNcbiAgICAvLyB0aGVuIG1ha2UgdGhlIHNoaXBcbiAgICAvLyB0aGVuIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgY2FuRml0ID0gcGxheWVyLnBsYXllckJvYXJkLnNoaXBGaXRzKFxuICAgICAgbGVuZ3RoLFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICApO1xuICAgIGlmICghY2FuRml0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghY2hlY2tvbmx5KSB7XG4gICAgICBjb25zdCBuZXdTaGlwID0gc2hpcChsZW5ndGgpO1xuICAgICAgcGxheWVyLnBsYXllckJvYXJkLmFkZFNoaXAobmV3U2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwR3JpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBnYW1lVHVybihwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcywgY29vcmRpbmF0ZXMgPSBcIlwiKSB7XG4gICAgLy9yZXNwb25zZSB3aWxsIG11dGF0ZSBlbmVteSBib2FyZCBhbmQgc2hpcGNoZWNrIHJldHVybnMgIyBvZiBzaGlwcyByZW1haW5pbmdcbiAgICAvLyByZXNwb25zZSByZXR1cm5zIGFuIG9iamVjdCB3aXRoIC5oaXRSZXBvcnQgJiAuaXNTdW5rXG4gICAgY29uc3QgcmVzcG9uc2UgPSBwbGF5ZXJDbGFzcy5hdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Q2xhc3MucGxheWVyQm9hcmQpO1xuICAgIGNvbnN0IHNoaXBDaGVjayA9IGVuZW15Q2xhc3MucGxheWVyQm9hcmQuc2hpcHNSZW1haW5pbmcoKTtcbiAgICBjb25zb2xlLmxvZyhzaGlwQ2hlY2spO1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG4gICAgLy8gcmV0dXJuIHZhbHVlIGFueXRoaW5nIG90aGVyIHRoYW4gbnVtID0gZ2FtZSBvdmVyXG4gICAgaWYgKGlzTmFOKHNoaXBDaGVjaykpIHtcbiAgICAgIGdhbWVPdmVyID0gdHJ1ZTtcbiAgICAgIHJldHVybiBlbmRHYW1lKCk7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIC8vIGNhbGwgdWkgc3RyaWtlc2NyZWVuIGZvciBjdXJyZW50IHBsYXllciBpZiBpdHMgYSBwZXJzb25cbiAgICB3aGlsZSAoZ2FtZU92ZXIgPT09IGZhbHNlKSB7XG4gICAgICBjb25zb2xlLmRpcihjdXJyZW50UGxheWVyKTtcblxuICAgICAgY29uc3QgZW5lbXlDbGFzcyA9IGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEgPyBwbGF5ZXIyIDogcGxheWVyMTtcbiAgICAgIGlmICghY3VycmVudFBsYXllci5pc0NQVSkge1xuICAgICAgICBhd2FpdCB1aS5zdHJpa2VTY3JlZW4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcywgZ2FtZVR1cm4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZVR1cm4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIyO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIyKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdhbWVJbml0aWFsaXplcigpIHtcbiAgICBpZiAocGxheWVyMS5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMSB9O1xuICAgICAgcGxheWVyMSA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyMi5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMiB9O1xuICAgICAgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjEucGxheWVyQm9hcmQpO1xuICAgIH1cblxuICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgIGNvbnNvbGUubG9nKGN1cnJlbnRQbGF5ZXIpO1xuICAgIGNvbnNvbGUubG9nKHBsYXllcjIpO1xuICAgIC8vIHdpbGwgaW5pdGlhbGl6ZSB0aGUgZ2FtZSBsb29wIGZuIHRoYXQgd2lsbCBjYWxsIHVpIGZvciBzdHJpa2Ugc2NyZWVuc1xuICAgIGdhbWVMb29wKCk7XG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG5cbiAgLy8gdGhpcyBpbml0aWFsaXplcyBidXQgdGhlIGdhbWUgbG9vcCBwaWNrcyBiYWNrIHVwIHdoZW4gdWkgc2NyaXB0IGNhbGxzIGdhbWVpbml0aWFsaXplcjtcbiAgbGV0IHBsYXllcjEgPSB1bmRlZmluZWQ7XG4gIGxldCBwbGF5ZXIyID0gdW5kZWZpbmVkO1xuICBsZXQgY3VycmVudFBsYXllciA9IHVuZGVmaW5lZDtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIHVpLnN0YXJ0U2NyZWVuKCk7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gICAgcmV0dXJuIGlzR2FtZU92ZXIoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzR2FtZU92ZXIoKSB7XG4gICAgcmV0dXJuIGdhbWVPdmVyO1xuICB9XG5cbiAgcmV0dXJuIHsgZ2FtZVR1cm4sIGlzR2FtZU92ZXIgfTtcbn07XG5nYW1lTW9kdWxlKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVNb2R1bGU7XG4iLCIvLyB0aGlzIHdpbGwgZGVtb25zdHJhdGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gd2l0aCB0aGUgbmVlZGVkIG1ldGhvZHMgZm9yIHRoZSBwbGF5ZXIgYm9hcmQgYW5kIGVuZW15IGJvYXJkIHJlZlxuXG5jb25zdCBwbGF5ZXIgPSAocGxheWVyT2JqLCBib2FyZEZuKSA9PiB7XG4gIGNvbnN0IHBsYXllckJvYXJkID0gYm9hcmRGbjtcbiAgY29uc3QgaXNDUFUgPSBwbGF5ZXJPYmoucGxheWVyID09PSBcInBlcnNvblwiID8gZmFsc2UgOiB0cnVlO1xuICBjb25zdCBzdHJpa2VzID0ge1xuICAgIG1pc3NlczogW10sXG4gICAgaGl0czogW10sXG4gIH07XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgcmV0dXJuIGVuZW15Qm9hcmQuY2FuU3RyaWtlKGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0dGFjayhjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIC8vIHdpbGwgbmVlZCBjb2RlIGhlcmUgZm9yIGRldGVybWluaW5nIGxlZ2FsIG1vdmVcbiAgICBsZXQgcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgIGlmIChjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpKSB7XG4gICAgICByZXN1bHQgPSBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgICAgaWYgKHJlc3VsdC5oaXRSZXBvcnQgPT09IFwiaGl0XCIpIHtcbiAgICAgICAgc3RyaWtlcy5oaXRzLnB1c2goY29vcmRpbmF0ZXMpO1xuICAgICAgfSBlbHNlIGlmIChyZXN1bHQuaXNTdW5rID09PSB0cnVlKSB7XG4gICAgICAgIHN0cmlrZXMuaGl0cy5wdXNoKGNvb3JkaW5hdGVzKTtcbiAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmhpdFJlcG9ydCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgc3RyaWtlcy5taXNzZXMucHVzaChjb29yZGluYXRlcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IC4uLnBsYXllck9iaiwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSwgc3RyaWtlcyB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG4iLCIvLyBzaGlwcyBzaG91bGQgaGF2ZSB0aGUgY2hvaWNlIG9mOlxuLy8gNSBtYW4tby13YXJcbi8vIDQgZnJpZ2F0ZVxuLy8gMyB4IDMgc2Nob29uZXJcbi8vIDIgeCAyIHBhdHJvbCBzbG9vcFxuY29uc3Qgc2hpcCA9IChsZW5ndGgpID0+IHtcbiAgbGV0IHR5cGUgPSBcIlwiO1xuICBsZXQgZGFtYWdlID0gMDtcbiAgbGV0IGNvb3JkaW5hdGVzID0gW107XG4gIGxldCBvcmllbnRhdGlvbiA9IFwiXCI7XG5cbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDI6XG4gICAgICB0eXBlID0gXCJQYXRyb2wgU2xvb3BcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHR5cGUgPSBcIlNjaG9vbmVyXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICB0eXBlID0gXCJGcmlnYXRlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICB0eXBlID0gXCJNYW4tby1XYXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaGlwIHR5cGUgZXhjZXB0aW9uOiBsZW5ndGggbXVzdCBiZSAxLTVcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoaXQoKSB7XG4gICAgZGFtYWdlKys7XG4gICAgLy9yZXR1cm4gYCR7dHlwZX0gd2FzIGhpdC4gJHtoaXRwb2ludHMoKX0gaGl0cG9pbnRzIHJlbWFpbmluZ2A7XG4gICAgcmV0dXJuIGBoaXRgO1xuICB9XG4gIGZ1bmN0aW9uIGlzU3VuaygpIHtcbiAgICByZXR1cm4gZGFtYWdlID49IGxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBoaXRwb2ludHMoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCAtIGRhbWFnZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGUsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGRhbWFnZSxcbiAgICBoaXRwb2ludHMsXG4gICAgaGl0LFxuICAgIGlzU3VuayxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcblxuY29uc3QgdXNlckludGVyZmFjZSA9IChzaGlwTWFrZXJQcm94eSwgcGxheWVySW5pdFNjcmlwdCwgZ2FtZUluaXRTY3JpcHQpID0+IHtcbiAgY29uc3QgcGFnZUNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGFnZUNvbnRhaW5lclwiKTtcbiAgbGV0IHAxQ291bnRyeSA9IFwiXCI7XG4gIGxldCBwMkNvdW50cnkgPSBcIlwiO1xuXG4gIGZ1bmN0aW9uIGluaXRDb3VudHJ5U2VsZWN0KCkge1xuICAgIGNvbnN0IG5vZGVMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jb3VudHJ5Qm94XCIpO1xuICAgIG5vZGVMaXN0LmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAxXCIpIHtcbiAgICAgICAgICBwMUNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAyXCIpIHtcbiAgICAgICAgICBwMkNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGJ1aWxkcyBhIHBsYXllcm9iaiB0aGF0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHRvIGluaXRpYWxpemUgdGhlIGdhbWVcbiAgZnVuY3Rpb24gcE9iakluaXRpYWxpemVyKGZvcm1DbHNzTm1lLCBwMXNlbGVjdGlkLCBwMnNlbGVjdGlkKSB7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNsc3NObWUpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDFzZWxlY3RpZCk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMnNlbGVjdGlkKTtcbiAgICBsZXQgcGxheWVycyA9IFtdO1xuXG4gICAgY29uc3QgbWFub3dhciA9IDU7XG4gICAgY29uc3QgZnJpZ2F0ZSA9IDQ7XG4gICAgY29uc3Qgc2Nob29uZXIgPSAzO1xuICAgIGNvbnN0IHNsb29wID0gMjtcblxuICAgIC8vIHBsYXllciBpcyBlaXRoZXIgXCJjcHVcIiBvciBcInBlcnNvblwiXG4gICAgY29uc3QgcGxheWVyb2JqID0ge1xuICAgICAgcGxheWVyOiB1bmRlZmluZWQsXG4gICAgICBudW1iZXI6IHVuZGVmaW5lZCxcbiAgICAgIGNvdW50cnk6IHVuZGVmaW5lZCxcbiAgICAgIHNoaXBzOiBbbWFub3dhciwgZnJpZ2F0ZSwgZnJpZ2F0ZSwgc2Nob29uZXIsIHNjaG9vbmVyLCBzbG9vcCwgc2xvb3BdLFxuICAgIH07XG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IFtdO1xuXG4gICAgcmFuY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuXG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIHJhbmNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZ3JpZEJ1aWxkZXIoZ3JpZENvbnRhaW5lciwgZ3JpZFNpemUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICByb3cuY2xhc3NMaXN0LmFkZChcInJvd0NvbnRcIik7XG4gICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3JpZFNpemU7IGorKykge1xuICAgICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LnIgPSBpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuYyA9IGo7XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZ3JpZFNoYWRlcihcbiAgICBjb29yZCxcbiAgICBsZW5ndGgsXG4gICAgb3JpZW50YXRpb24sXG4gICAgZHJhZ0ZpdHMsXG4gICAgcGxhY2VkID0gZmFsc2UsXG4gICAgZ3JpZENvbnRhaW5lcixcbiAgKSB7XG4gICAgY29uc3Qgb2Zmc2V0ciA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IG9mZnNldGMgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBsZXQgYWRkZWRDbGFzcyA9IFwiXCI7XG4gICAgY29uc3QgZ3JpZENvbnRhaW5lck5hbWUgPSBncmlkQ29udGFpbmVyLmNsYXNzTGlzdC52YWx1ZTtcblxuICAgIC8vIDMgc2hhZGluZyBwb3NzaWJsaXRpZXMgZml0cy9ub2ZpdHMvcGxhY2VkXG4gICAgaWYgKHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgYWRkZWRDbGFzcyA9IFwicGxhY2VkXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZGVkQ2xhc3MgPSBkcmFnRml0cyA9PT0gdHJ1ZSA/IFwiZml0c1wiIDogXCJub3RGaXRzXCI7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudENvb3JkID0gWy4uLmNvb3JkXTtcbiAgICBsZXQgY2VsbENvbGxlY3Rpb24gPSBbXTtcblxuICAgIC8vIHNoYWRlIGVhY2ggY2VsbCByZXByZXNlbnRpbmcgc2hpcCBsZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y3VycmVudENvb3JkWzBdfVwiXVtkYXRhLWM9XCIke2N1cnJlbnRDb29yZFsxXX1cIl1gLFxuICAgICAgKTtcbiAgICAgIGNlbGxDb2xsZWN0aW9uLnB1c2goY3VycmVudENlbGwpO1xuXG4gICAgICBpZiAoY3VycmVudENlbGwgIT09IG51bGwpIHtcbiAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChgJHthZGRlZENsYXNzfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjdXJyZW50Q29vcmRbMF0gKz0gb2Zmc2V0cjtcbiAgICAgIGN1cnJlbnRDb29yZFsxXSArPSBvZmZzZXRjO1xuICAgIH1cbiAgICAvLyBhZnRlciBzaGFkZSwgZHJhZ2xlYXZlIGhhbmRsZXIgdG8gY2xlYXIgc2hhZGluZyB3aGVuIG5vdCBwbGFjZWRcbiAgICBjb25zdCBmaXJzdENlbGwgPSBjZWxsQ29sbGVjdGlvblswXTtcbiAgICBpZiAoZmlyc3RDZWxsID09PSBudWxsIHx8IGZpcnN0Q2VsbCA9PT0gdW5kZWZpbmVkIHx8IHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaXJzdENlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY2VsbENvbGxlY3Rpb24uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShgJHthZGRlZENsYXNzfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNoaXBTY3JlZW4ocGxheWVyT2JqKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyBjbGVhciBwYWdlIGNvbnRhaW5lciBhbmQgcG9wdWxhdGUgd2l0aCBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2hpcFNjcmVlbkNvbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keUNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdyaWRDb250XCI+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwRGlzcGxheUNvbnRcIj5cbiAgICAgICAgICAgICAgICAgIHRoaXMgd2lsbCBiZSBhbGwgYm9hdHMgbGlzdGVkIGFuZCBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRhdGEtaW5kZXg9XCI1XCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBtYW5cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cblxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjRcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IGZyaWdcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiM1wiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2Nob29uXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiAgZGF0YS1pbmRleD1cIjJcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IHNsb29wXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvcmllbnRhdGlvbkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIm9yaWVudGF0aW9uQnRuXCIgZGF0YS1vcmllbnRhdGlvbj1cImhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEhvcml6b250YWxcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0eHRcIj5cbiAgICAgICAgICAgICAgICAgIFBsYWNlIHlvdXIgc2hpcHMhXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicmFuZG9tQnRuXCI+XG4gICAgICAgICAgICAgICAgICBSYW5kb21pemVcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgYXJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBjeWNsZSBzaGlwIHBsYWNlbWVudCBvcmllbnRhdGlvbiwgaW5pdGlhbGl6ZWQgdG8gXCJoXCJcbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5vcmllbnRhdGlvbkJ0blwiKTtcbiAgICAgIG9yaWVudGF0aW9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJWZXJ0aWNhbFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiSG9yaXpvbnRhbFwiO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gcmFuZG9tQnRuRm4oKSB7XG4gICAgICAgIHNoaXBSYW5kb21pemVyKHBsYXllck9iaik7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmFuZG9tQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5yYW5kb21CdG5cIik7XG5cbiAgICAgIHJhbmRvbUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICByYW5kb21CdG5GbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIGxlYXZlU2NyZWVuKCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgICAgLy8gdHJhbnNsYXRlcyBVSSBjZWxsIHRvIGEgY29vcmRpbmF0ZSBvbiBhIGRyYWdvdmVyIGV2ZW50XG4gICAgICAvLyBjaGVja3MgaWYgdGhlIHNoaXAgZHJhZ2dlZCB3aWxsIGZpdFxuICAgICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICBjb25zdCBkcmFnT3ZlckhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICAgIGlmIChkcmFnU2hpcExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcIm1vdXNlb3ZlclwiKTtcblxuICAgICAgICAgIGNvbnN0IHIgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucik7XG4gICAgICAgICAgY29uc3QgYyA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5jKTtcbiAgICAgICAgICBjb29yZCA9IFtyLCBjXTtcbiAgICAgICAgICBkcmFnRml0cyA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IHRydWU7XG4gICAgICAgICAgY2VsbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoXCJtb3VzZW92ZXJcIik7XG4gICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc2hpcElNRyA9IG5ldyBJbWFnZSgpO1xuICAgICAgc2hpcElNRy5zcmMgPSBcIi4vaW1hZ2VzL3NhaWxib2F0LnBuZ1wiO1xuICAgICAgc2hpcElNRy5jbGFzc0xpc3QuYWRkKFwic2hpcElNR1wiKTtcbiAgICAgIHNoaXBJTUcuc3R5bGUud2lkdGggPSBcIjFyZW1cIjtcblxuICAgICAgc2hpcHMuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgICAgICBmdW5jdGlvbiBzaGlwRHJhZ0hhbmRsZXIoZSkge1xuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmluZGV4KTtcblxuICAgICAgICAgIGNvbnN0IGNsb25lID0gc2hpcC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgZHJhZ1NoaXAgPSBzaGlwO1xuICAgICAgICAgIC8vIFNldCB0aGUgb2Zmc2V0IGZvciB0aGUgZHJhZyBpbWFnZVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggPSAyMDtcbiAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREcmFnSW1hZ2UoY2xvbmUsIDAsIDApO1xuICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRyYWdnaW5nXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hpcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChlKSA9PiB7XG4gICAgICAgICAgc2hpcERyYWdIYW5kbGVyKGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgY29uc3QgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKHBsYWNlZCkge1xuICAgICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgcmVtYWluaW5nU2hpcHMgPSBcIlwiO1xuXG4gICAgICAgICAgICAgIHN3aXRjaCAoZHJhZ1NoaXBMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IG1vd0NvdW50O1xuICAgICAgICAgICAgICAgICAgbW93Q291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBmcmlnQ291bnQ7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNjaG9vbkNvdW50O1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzbG9vcENvdW50O1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogaW52YWxpZCBzaGlwIGxlbmd0aCBpbiBkcmFnU2hpcFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyAtPSAxO1xuXG4gICAgICAgICAgICAgIGlmIChyZW1haW5pbmdTaGlwcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZGVwbGV0ZWRcIik7XG4gICAgICAgICAgICAgICAgc2hpcC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIHNoaXBEcmFnSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgc2hpcC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBtb3dDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBmcmlnQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2Nob29uQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2xvb3BDb3VudCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIG5leHRCdG4udGV4dENvbnRlbnQgPSBcIk5leHRcIjtcbiAgICAgICAgICAgIHBhZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQobmV4dEJ0bik7XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIC8vIGdhbWVUdXJuIHJlcXVpcmVzIGNvb3JkaW5hdGVzLCBwbGF5ZXJDbGFzcywgZW5lbXlDbGFzc1xuICBhc3luYyBmdW5jdGlvbiBzdHJpa2VTY3JlZW4ocGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MsIGdhbWVUdXJuU2NyaXB0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+PC9kaXY+XG4gICAgICAgPC9kaXY+XG4gICAgICAgPGRpdiBjbGFzcz1cInN0cmlrZUNvbnRcIj5cbiAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0cmlrZUdyaWRDb250XCI+XG4gICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0cmlrZVJlc3VsdFwiPlN0cmlrZSBSZXN1bHQ8L3NwYW4+XG4gICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFBsYWNlZENvbnRcIj5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwUGxhY2VkR3JpZFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBzUmVtYWluQ29udFwiPjwvZGl2PlxuICAgICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcblxuICAgICAgY29uc3QgcGxheWVyTmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyTmFtZVwiKTtcbiAgICAgIGNvbnN0IHN0cmlrZVJlc3VsdENvbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnN0cmlrZVJlc3VsdFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdHJpa2VHcmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IHNoaXBQbGFjZUdyaWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBQbGFjZWRHcmlkXCIpO1xuICAgICAgbGV0IGFibGVUb1N0cmlrZSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB0b29rVHVybiA9IGZhbHNlO1xuICAgICAgY29uc3QgaGl0U1ZHID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGhpdFNWRy5pbm5lckhUTUwgPSBgPHN2ZyBjbGFzcz1cImhpdEljb25cIiB4bWxucyA9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgLTk2MCA5NjAgOTYwXCIgd2lkdGg9XCIyNFwiPlxuICAgICAgICAgIDxwYXRoIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBkPVwibTI1Ni0yMDAtNTYtNTYgMjI0LTIyNC0yMjQtMjI0IDU2LTU2IDIyNCAyMjQgMjI0LTIyNCA1NiA1Ni0yMjQgMjI0IDIyNCAyMjQtNTYgNTYtMjI0LTIyNC0yMjQgMjI0WlwiLz5cbiAgICAgICAgPC9zdmc+YDtcbiAgICAgIGNvbnN0IG1pc3NTdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbWlzc1N2Zy5pbm5lckhUTUwgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAtOTYwIDk2MCA5NjBcIiB3aWR0aD1cIjI0XCI+PHBhdGggZD1cIk00ODAtNDgwWm0wIDI4MHEtMTE2IDAtMTk4LTgydC04Mi0xOThxMC0xMTYgODItMTk4dDE5OC04MnExMTYgMCAxOTggODJ0ODIgMTk4cTAgMTE2LTgyIDE5OHQtMTk4IDgyWm0wLTgwcTgzIDAgMTQxLjUtNTguNVQ2ODAtNDgwcTAtODMtNTguNS0xNDEuNVQ0ODAtNjgwcS04MyAwLTE0MS41IDU4LjVUMjgwLTQ4MHEwIDgzIDU4LjUgMTQxLjVUNDgwLTI4MFpcIi8+PC9zdmc+YDtcbiAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICBmdW5jdGlvbiBwcmV2U3RyaWtlUG9wdWxhdG9yKFxuICAgICAgICBwbGF5ZXJDbGFzcyxcbiAgICAgICAgaGl0U1ZHLFxuICAgICAgICBtaXNzU3ZnLFxuICAgICAgICBncmlkQ29udCxcbiAgICAgICAgaGl0c09ubHkgPSBmYWxzZSxcbiAgICAgICkge1xuICAgICAgICBjb25zdCBncmlkQ29udGFpbmVyTmFtZSA9IGdyaWRDb250LmNsYXNzTGlzdC52YWx1ZTtcbiAgICAgICAgY29uc3QgbWlzc0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMubWlzc2VzO1xuICAgICAgICBjb25zdCBoaXRzQXJyID0gcGxheWVyQ2xhc3Muc3RyaWtlcy5oaXRzO1xuICAgICAgICBjb25zdCBlbmVteVN0cmVha0FyciA9IGVuZW15Q2xhc3MucGxheWVyQm9hcmQuc3RyZWFrQXJyO1xuICAgICAgICBjb25zdCBkZWxheSA9ICh0aW1lb3V0KSA9PlxuICAgICAgICAgIG5ldyBQcm9taXNlKChyZXMpID0+IHNldFRpbWVvdXQocmVzLCB0aW1lb3V0KSk7XG4gICAgICAgIC8vIGZvciB2aWV3aW5nIHdoaWNoIG9mIHlvdXIgc2hpcHMgYXJlIGhpdCwgcGFzc3Rocm91Z2ggZW5lbXlDbGFzcyBpbnN0ZWFkIG9mIGN1cnJlbnQgcGxheWVyXG4gICAgICAgIGlmIChoaXRzT25seSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBtaXNzQXJyLmZvckVhY2goKGNvb3JkUGFpcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICBgLiR7Z3JpZENvbnRhaW5lck5hbWV9IFtkYXRhLXI9XCIke2Nvb3JkUGFpclswXX1cIl1bZGF0YS1jPVwiJHtjb29yZFBhaXJbMV19XCJdYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjdXJyZW50Q2VsbC5jbGFzc0xpc3QuYWRkKFwibWlzc1wiKTtcbiAgICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gbWlzc1N2Zy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjdXJyZW50Q2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBmdW5jdGlvbiBhc3luY0NvbnRyb2xsZXIodGltZW91dCwgY2FsbGJhY2tmbikge1xuICAgICAgICAgIGF3YWl0IGRlbGF5KHRpbWVvdXQpO1xuICAgICAgICAgIGNhbGxiYWNrZm4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpdHNBcnIuZm9yRWFjaCgoY29vcmRQYWlyKSA9PiB7XG4gICAgICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjdXJyZW50Q2VsbC5jbGFzc0xpc3QuYWRkKFwiaGl0XCIpO1xuICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gaGl0U1ZHLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICBjdXJyZW50Q2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZW5lbXlTdHJlYWtBcnIubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IHN0cmVha1NlcXVlbmNlID0gYXN5bmMgKHBvaW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7cG9pbnRbMF19XCJdW2RhdGEtYz1cIiR7cG9pbnRbMV19XCJdYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gNDAwO1xuICAgICAgICAgICAgYXdhaXQgZGVsYXkodGltZW91dCk7XG4gICAgICAgICAgICBjdXJyZW50Q2VsbC5jbGFzc0xpc3QuYWRkKFwic3RyZWFrSGl0XCIpO1xuICAgICAgICAgICAgYXdhaXQgZGVsYXkodGltZW91dCk7XG4gICAgICAgICAgICBjdXJyZW50Q2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwic3RyZWFrSGl0XCIpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gdmlzdWFsIGVmZmVjdCB0aGF0IGhpZ2xpZ2h0cyB0aGUgc3RyaWtlXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgaXQgaXMgYW4gYXN5bmMgZnVuY3Rpb24gdGhhdCBoYXMgYSBoYWxmIHNlY29uZCBkZWxheS5cbiAgICAgICAgICBlbmVteVN0cmVha0Fyci5mb3JFYWNoKChoaXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBlbmVteVN0cmVha0Fyci5zaGlmdCgpO1xuICAgICAgICAgICAgYXN5bmNDb250cm9sbGVyKDUwMCwgc3RyZWFrU2VxdWVuY2UoY3VycmVudCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllckNsYXNzLm51bWJlcn0gVHVybmA7XG4gICAgICAvLyBidWlsZCB0aGUgc3RyaWtlIGdyaWQgJiYgcG9wdWxhdGUgcHJldmlvdXMgc3RyaWtlcyBpZiBhcHBsaWNhYmxlXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBidWlsZCB0aGUgc2hpcFBsYWNlZEdyaWRcbiAgICAgIGdyaWRCdWlsZGVyKHNoaXBQbGFjZUdyaWQsIDEwKTtcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IocGxheWVyQ2xhc3MsIGhpdFNWRywgbWlzc1N2ZywgZ3JpZENvbnRhaW5lcik7XG4gICAgICAvLyBwb3B1bGF0ZSB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXRcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IoZW5lbXlDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBzaGlwUGxhY2VHcmlkLCB0cnVlKTtcblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGlmICh1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIC8vIHJlcGxhY2UgdGhpcyBmbiB3aXRoIGNoZWNrZXIgZm9yIHJlcGVhdCBzdHJpa2VzXG4gICAgICAgICAgY29uc3QgY2FuU3RyaWtlID0gcGxheWVyQ2xhc3MuY2FuU3RyaWtlKFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBlbmVteUNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGNhblN0cmlrZSAmJiAhdG9va1R1cm4pIHtcbiAgICAgICAgICAgIC8vIHNlbmQgc2lnbmFsIHRvIHN0cmlrZSB0byBnYW1lVHVyblxuICAgICAgICAgICAgLy8gcmVzcG9uc2Ugd2lsbCByZXR1cm4gb2JqIHdpdGggLmhpdFJlcG9ydCAmIC5pc1N1bmtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gZ2FtZVR1cm5TY3JpcHQocGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MsIGNvb3JkKTtcbiAgICAgICAgICAgIGxldCBuZXh0QnRuO1xuXG4gICAgICAgICAgICBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIHN0cmlrZVJlc3VsdENvbnQudGV4dENvbnRlbnQgPVxuICAgICAgICAgICAgICBzdHJpa2VSZXN1bHRDb250LnRleHRDb250ZW50ICsgXCI6IFwiICsgcmVzcG9uc2UuaGl0UmVwb3J0O1xuICAgICAgICAgICAgbmV4dEJ0bi50ZXh0Q29udGVudCA9IFwiRW5kIFR1cm5cIjtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhpdFJlcG9ydCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcbiAgICAgICAgICAgICAgdG9va1R1cm4gPSB0cnVlO1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuaGl0UmVwb3J0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yOiBzdHJpa2UgcmVzcG9uc2UgZXhjZXB0aW9uXCIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvL3N0cmVha0FyciB3aWxsIGFsbG93IGZvciB2aXN1YWwgb2YgaGl0cyByZWNlaXZlZCBmcm9tIHByZXZpb3VzIHBsYXllclxuICAgICAgICAgICAgICBlbmVteUNsYXNzLnBsYXllckJvYXJkLnN0cmVha0Fyci5wdXNoKGNvb3JkKTtcbiAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiaGl0XCIpO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IGhpdFNWRy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgIGNlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gcGxhY2VTaGlwcyhwbGF5ZXJDbGFzcykge1xuICAgICAgICBjb25zdCBzaGlwc0FycmF5ID0gcGxheWVyQ2xhc3MucGxheWVyQm9hcmQuc2hpcHM7XG4gICAgICAgIHNoaXBzQXJyYXkuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgICAgICAgIGNvbnN0IGNvb3JkID0gc2hpcC5jb29yZGluYXRlcztcbiAgICAgICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHNoaXAub3JpZW50YXRpb247XG5cbiAgICAgICAgICBncmlkU2hhZGVyKGNvb3JkLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBudWxsLCB0cnVlLCBzaGlwUGxhY2VHcmlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBwbGFjZVNoaXBzKHBsYXllckNsYXNzKTtcbiAgICB9KTtcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBzdGFydFNjcmVlbigpIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPkJhdHRsZXNoaXA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllclNlbGVjdENvbnRcIj5cbiAgICAgICAgICAgICAgICAgPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJwbGF5ZXJGb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAxXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAxXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDFcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDJcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMlwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG5Db250XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkJlZ2luPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJGb3JtXCIpO1xuICAgIGluaXRDb3VudHJ5U2VsZWN0KCk7XG4gICAgcGxheWVyRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBwbGF5ZXJzID0gcE9iakluaXRpYWxpemVyKFwiLnBsYXllckZvcm1cIiwgXCJzZWxlY3RwMVwiLCBcInNlbGVjdHAyXCIpO1xuICAgICAgLy8gcGxheWVyb2JqIHNlbnQgYmFjayB0byBleHRlbmQgZnVuY3Rpb25hbGl0eSB3aXRoIHBsYXllciBzY3JpcHRcbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHBsYXllcnMpIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC5wbGF5ZXIgPT09IFwicGVyc29uXCIpIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBhd2FpdCBzaGlwU2NyZWVuKGVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgc2hpcFJhbmRvbWl6ZXIoZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKTtcbiAgICAgIC8vIHRoaXMgcGFzc2VzIG92ZXIgY29udHJvbCBiYWNrIHRvIHRoZSBpbmRleCBzY3JpcHQuXG4gICAgICBnYW1lSW5pdFNjcmlwdCgpO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdhbWVPdmVyU2NyZWVuKCkge1xuICAgIC8vIGdldCByZWZlcmVuY2UgdG8gdGhlIHBhZ2UgY29udGFpbmVyXG4gICAgLy8gY2xlYXIgdGhlIHBhZ2VcbiAgICAvLyBzYXkgZ2FtZSBvdmVyIGFuZCB3aG8gd29uIHRoZSBnYW1lXG4gICAgLy8gaGF2ZSBhIGJ1dHRvbiB0aGF0IHdpbGwgcmVzZXQgdGhlIGdhbWVcbiAgICAvLyBhbHRlcm5hdGl2ZWx5IHlvdSBjb3VsZCBub3QgY2xlYXIgdGhlIHNjcmVlbiBhbmQgdGhlbiBqdXN0IHVzZSBtb2RhbHMgdG8gbWFrZSBpdCBhcHBlYXJcbiAgICAvLyB0aGUgbW9kYWwgd291bGQgYmUgYSBmb3JtIHdpdGggdGhlIHJlc2V0IGJ1dHRvbiBhY3RpbmcgYXMgdGhlIHN1Ym1pdCBmb3IgdGhlIGZvcm0uXG4gIH1cbiAgcmV0dXJuIHsgc3RhcnRTY3JlZW4sIHBPYmpJbml0aWFsaXplciwgc3RyaWtlU2NyZWVuLCBnYW1lT3ZlclNjcmVlbiB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c2VySW50ZXJmYWNlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9