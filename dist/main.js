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
      // if length -1 was stored then maybe could eventually get back to the beginning of the hit array.
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

  function shipPerimeter(bowPos, length, orientation, callbackfn) {
    // this fn defines 4 areas top, L, R, bottom and calls injected function
    // on each of the squares. it is expected that the callbackfn return bool
    // the result of this call would be the successful

    // need to come back here to make sure that attempting to go out of bounds wont break it.
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
      console.log(`rowA is ${rowA}`);
      console.log(`rowB is ${rowB}`);

      const resultA = callbackfn(rowA);
      const resultB = callbackfn(rowB);
      if (resultA === false || resultB === false) {
        return false;
      }
      rowA[axisCounter] += 1;
      rowB[axisCounter] += 1;

      //insert logic here for what happens to each of the squares
    }

    return true;
  }

  function shipFits(length, coordinates, orientation) {
    // refactor to if pass initial test, then do perimeter test w/ callbackfn
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
        // check if extends beyond boundary. no need to check if it does.
        if (r <= -1 || r >= 10 || c <= -1 || c >= 10) {
          return true;
        }
        if (shipGrid[r][c] !== null) {
          return false;
        }
        return true;
      },
    );

    // return the results of perimeter check as ship will fit if its gotten this far
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
        // check if extends beyond boundary. no need to check if it does.
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
    console.log(strikeSquare);
    console.log(r);
    console.log(c);

    if (strikeSquare !== null && shipGrid[r][c] !== "x") {
      return true;
    }
    return false;
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
    // record the miss
    hitReport = "miss";
    isSunk = "false";
    attacksReceived[r][c] = 0;
    return { hitReport, isSunk };
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
        return strikeResult;
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

  // gameTurn is called by event handler on UI interaction -or- by recursion when its cpu turn
  function gameTurn(playerClass, enemyClass, coordinates = "") {
    //response will mutate enemy board and shipcheck returns # of ships remaining
    // response returns an object with .hitReport & .isSunk
    const response = playerClass.attack(coordinates, enemyClass.playerBoard);
    const shipCheck = enemyClass.playerBoard.shipsRemaining();
    console.log(shipCheck);
    if (gameOver) {
      return endGame();
    }
    // return value anything other than num = player loses
    if (isNaN(shipCheck)) {
      gameOver = true;
      return endGame();
    }
    // how the cpu player is handled will need to be refactored as well.
    // this might actually be deleted since gameloop will call gameturn fn
    return response;
  }

  async function gameLoop() {
    // while game is not over
    console.log("greetings from gameloop");
    // call ui strikescreen for current player if its a person
    while (gameOver === false) {
      console.dir(currentPlayer);

      // current player check is failing, passingthrough cpu player to strikescreen
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
      player2 = cpuPlayerWrapper(copy, cpuAI, player1.playerBoard);
    }

    currentPlayer = player1;
    console.log(currentPlayer);
    console.log(player2);
    gameLoop();

    // will initialize the game loop fn that will call ui for strike screens
    // cpu turns will be handled by gameloop automatically
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  let player1 = undefined;
  let player2 = undefined;
  let currentPlayer = undefined;
  const cpuAI = cpu();
  let gameOver = false;
  ui.startScreen();

  //  const player1 = player("Dk", gameBoard());
  //  let player2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    player1.playerBoard,
  //  );

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
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
      ships: [manowar, frigate, schooner, schooner, sloop],
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
    console.dir(playerObj);
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
    console.log(gridContainerName);

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
    //index.js loop suspended until each player places ships
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
      console.log("dom finished loading");

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
        console.log(playerObj);
        shipRandomizer(playerObj);
        resolve();
      }

      const randomBtn = document.querySelector(".randomBtn");

      console.log(randomBtn);
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
          console.log(`coord post shipmaker: ${coord}`);
          if (dragFits) {
            // add classname for fits
            gridShader(
              coord,
              dragShipLength,
              orientation,
              dragFits,
              false,
              gridContainer,
            );
          } else {
            // add classname for not fits
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
          const offsetX = 20; // Set your desired offset value
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
              console.log(
                "there should be some resolving of promises happening right now",
              );
            });
          }
        });
      });
    });
  }
  // possibly for cpu, still call SS but do not wipe html and just show the effect of hitting one of the other player ships.
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
        console.log(playerClass);
        const missArr = playerClass.strikes.misses;
        const hitsArr = playerClass.strikes.hits;
        // for viewing which of your ships are hit, passthrough enemyClass instead of current player
        if (hitsOnly === false) {
          missArr.forEach((coordPair) => {
            const currentCell = document.querySelector(
              `.${gridContainerName} [data-r="${coordPair[0]}"][data-c="${coordPair[1]}"]`,
            );
            console.log(currentCell);
            currentCell.classList.add("miss");
            const cloneSVG = missSvg.cloneNode(true);
            currentCell.appendChild(cloneSVG);
          });
        }
        hitsArr.forEach((coordPair) => {
          const currentCell = document.querySelector(
            `.${gridContainerName} [data-r="${coordPair[0]}"][data-c="${coordPair[1]}"]`,
          );
          console.log(currentCell);
          currentCell.classList.add("hit");
          const cloneSVG = hitSVG.cloneNode(true);
          currentCell.appendChild(cloneSVG);
        });
      }
      playerName.textContent = `Player ${playerClass.number} Turn`;
      // build the strike grid && populate previous strikes if applicable
      gridBuilder(gridContainer, 10);
      // build the shipPlacedGrid
      gridBuilder(shipPlaceGrid, 10);
      prevStrikePopulator(playerClass, hitSVG, missSvg, gridContainer);
      // populate which of your ships are hit
      prevStrikePopulator(enemyClass, hitSVG, missSvg, shipPlaceGrid, true);
      console.log("this s called after strike populator");

      // translates UI cell to a coordinate
      // checks if there was already a hit in the grid square

      const cells = document.querySelectorAll(".cell");
      cells.forEach((cell) => {
        cell.addEventListener("click", (e) => {
          e.preventDefault();
          // if struck already
          if (false) {}
          const r = Number(e.currentTarget.dataset.r);
          const c = Number(e.currentTarget.dataset.c);
          coord = [r, c];
          // replace this fn with checker for repeat strikes
          console.log(coord);
          // this might break if player canstrike is refactored
          const canStrike = playerClass.canStrike(
            coord,
            enemyClass.playerBoard,
          );
          if (canStrike && !tookTurn) {
            tookTurn = true;
            // send signal to strike to gameTurn
            // response will return obj with .hitReport & .isSunk
            const response = gameTurnScript(playerClass, enemyClass, coord);
            const nextBtn = document.createElement("button");
            strikeResultCont.textContent =
              strikeResultCont.textContent + ": " + response.hitReport;
            nextBtn.textContent = "End Turn";
            pageContainer.appendChild(nextBtn);

            if (response.hitReport === "miss") {
              cell.classList.add("miss");
              const cloneSVG = missSvg.cloneNode(true);
              cell.appendChild(cloneSVG);
              console.dir(playerClass);
            } else if (response.hitReport === undefined) {
              console.error("Error: strike response exception");
              return;
            } else {
              cell.classList.add("hit");
              const cloneSVG = hitSVG.cloneNode(true);
              cell.appendChild(cloneSVG);
              console.dir(playerClass);
            }

            // show the button for next

            nextBtn.addEventListener("click", () => {
              resolve();
              console.log(
                "there should be some resolving of promises happening right now",
              );
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixRQUFRO0FBQzVCO0FBQ0Esc0JBQXNCLFFBQVE7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsYUFBYTtBQUNqQyw2QkFBNkIsS0FBSztBQUNsQyw2QkFBNkIsS0FBSzs7QUFFbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixZQUFZO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFlBQVk7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULHVCQUF1QixXQUFXO0FBQ2xDO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7O0FDcE9BO0FBQ0EsZUFBZSxtQkFBTyxDQUFDLGlDQUFVO0FBQ2pDLGtCQUFrQixtQkFBTyxDQUFDLHVDQUFhO0FBQ3ZDLGFBQWEsbUJBQU8sQ0FBQyw2QkFBUTtBQUM3QixZQUFZLG1CQUFPLENBQUMsdUNBQWE7QUFDakMsaUJBQWlCLG1CQUFPLENBQUMseUJBQU07O0FBRS9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxxQkFBcUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQ2xMQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTs7Ozs7Ozs7Ozs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdCQUFnQixNQUFNLFdBQVcsYUFBYTtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7QUNuREEsZUFBZSxtQkFBTyxDQUFDLGlDQUFVOztBQUVqQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCLHNCQUFzQjs7QUFFdEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGNBQWM7QUFDbEM7QUFDQTtBQUNBOztBQUVBLHNCQUFzQixjQUFjO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLFlBQVk7QUFDaEM7QUFDQSxZQUFZLG1CQUFtQixXQUFXLGdCQUFnQixhQUFhLGdCQUFnQjtBQUN2RjtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFdBQVc7QUFDaEQsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsV0FBVztBQUNqRDtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLGlCQUFpQjs7QUFFN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEseUNBQXlDLGlCQUFpQjtBQUMxRCxxQ0FBcUMsU0FBUztBQUM5QyxzQ0FBc0MsVUFBVTtBQUNoRCx3Q0FBd0MsWUFBWTtBQUNwRCx1Q0FBdUMsV0FBVztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0MsTUFBTTtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QjtBQUM5QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxTQUFTO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFVBQVU7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsWUFBWTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxXQUFXO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixtQkFBbUIsV0FBVyxhQUFhLGFBQWEsYUFBYTtBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixtQkFBbUIsV0FBVyxhQUFhLGFBQWEsYUFBYTtBQUNyRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EseUNBQXlDLG9CQUFvQjtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsS0FBUyxFQUFFLEVBRWQ7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUN4cEJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNwdVBsYXllciA9ICgpID0+IHtcbiAgbGV0IHN0YXRlID0gXCJyYW5kb21cIjtcbiAgbGV0IGhpdCA9IGZhbHNlO1xuICBsZXQgc3RyZWFrID0gZmFsc2U7XG4gIGxldCBoaXRBcnIgPSBbXTtcbiAgbGV0IHB1cnN1aXRBeGlzID0gbnVsbDtcblxuICBmdW5jdGlvbiByYW5kb21Nb3ZlKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5kb21Db29yZCA9IFtdO1xuXG4gICAgcmFuZG9tQ29vcmQucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuZG9tQ29vcmQ7XG4gIH1cblxuICAvLyB3aWxsIG5lZWQgdG8gaW1wbGVtZW50IHRoZSBsZWdhbCBtb3ZlIC0+IGRlcGVuZGVuY3kgaW5qZWN0aW9uIGZyb20gZ2FtZWJvYXJkIHNjcmlwdFxuICBmdW5jdGlvbiBhZGphY2VudE1vdmUoKSB7XG4gICAgLy8gd2lsbCByZXR1cm4gY29vcmRpbmF0ZSBpbiBlaXRoZXIgc2FtZSByb3cgb3IgY29sdW1uIGFzIGxhc3RIaXRcbiAgICBjb25zdCBbbGFzdEhpdF0gPSBoaXRBcnI7XG4gICAgbGV0IGFkamFjZW50U3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuICAgIC8vIHJhbmRvbWx5IGNob29zZSBlaXRoZXIgcm93IG9yIGNvbHVtbiB0byBjaGFuZ2VcbiAgICBjb25zdCBheGlzID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgLy8gMCAtPiAtMSB3aWxsIGJlIGFkZGVkIHx8IDEgLT4gMSB3aWxsIGJlIGFkZGVkXG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgYWRqYWNlbnRTdHJpa2VbYXhpc10gKz0gb2Zmc2V0VmFsdWU7XG4gICAgLy9jaGVjayB0byBwcm90ZWN0IG91dG9mYm91bmRzIHN0cmlrZXNcbiAgICBpZiAoXG4gICAgICBhZGphY2VudFN0cmlrZVswXSA8IDAgfHxcbiAgICAgIGFkamFjZW50U3RyaWtlWzFdIDwgMCB8fFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMF0gPiA5IHx8XG4gICAgICBhZGphY2VudFN0cmlrZVsxXSA+IDlcbiAgICApIHtcbiAgICAgIGNvbnN0IHJlZG8gPSBhZGphY2VudE1vdmUoKTtcbiAgICAgIGFkamFjZW50U3RyaWtlID0gcmVkbztcbiAgICB9XG5cbiAgICByZXR1cm4gYWRqYWNlbnRTdHJpa2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0SW5saW5lKGxhc3RIaXQpIHtcbiAgICAvLyB3aWxsIG5lZWQgdG8gZ3Vlc3MgbmV4dCBvbmUgdW50aWwgeW91IGhhdmUgYSBsZWdhbCBvbmUgdGhhdCBoYXNudCBiZWVuIHVzZWQgeWV0XG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgbGV0IGlubGluZVN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcblxuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJoXCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVsxXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfSBlbHNlIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJ2XCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZSgpIHtcbiAgICAvLyBmaW5kcyB0aGUgYXhpcyBieSBjb21wYXJpbmcgaGl0cyBhbmQgY2FsbHMgYW4gaW5saW5lIGd1ZXNzXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBudWxsKSB7XG4gICAgICBjb25zdCBbYzEsIGMyXSA9IGhpdEFycjtcbiAgICAgIGlmIChjMVswXSA9PT0gYzJbMF0gJiYgYzFbMV0gIT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJoXCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH0gZWxzZSBpZiAoYzFbMF0gIT09IGMyWzBdICYmIGMxWzFdID09PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwidlwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdHJlYWsgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFyclswXSk7XG4gICAgICB9XG4gICAgICAvLyBpZiBsZW5ndGggLTEgd2FzIHN0b3JlZCB0aGVuIG1heWJlIGNvdWxkIGV2ZW50dWFsbHkgZ2V0IGJhY2sgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgaGl0IGFycmF5LlxuICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyW2hpdEFyci5sZW5ndGggLSAxXSk7XG4gICAgICAvLyBjb25kaXRpb24gaWYgdGhlIGxhc3Qgc3RyaWtlIHdhcyBhIG1pc3MgdGhlbiBzdGFydCBmcm9tIHRoZSBmcm9udCBvZiB0aGUgbGlzdFxuICAgICAgLy8gdGFrZSB0aGUgbGFzdCBrbm93biBoaXQgYW5kIGFkZCB0byBpdFxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBuZXh0TW92ZSgpIHtcbiAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICBjYXNlIFwicmFuZG9tXCI6XG4gICAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkamFjZW50XCI6XG4gICAgICAgIHJldHVybiBhZGphY2VudE1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaW5saW5lXCI6XG4gICAgICAgIHJldHVybiBpbmxpbmVNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3IgY29uZGl0aW9uIGV4Y2VwdGlvbjogbmV4dE1vdmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0SGl0KGNvb3JkaW5hdGUsIGlzU3Vuaykge1xuICAgIHN0cmVhayA9IHRydWU7XG4gICAgaWYgKGlzU3VuayA9PT0gdHJ1ZSkge1xuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgICBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gICAgICBoaXRBcnIgPSBbXTtcbiAgICAgIHB1cnN1aXRBeGlzID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGl0QXJyLnB1c2goY29vcmRpbmF0ZSk7XG4gICAgICBpZiAoaGl0QXJyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBzdGF0ZSA9IFwiYWRqYWNlbnRcIjtcbiAgICAgIH0gZWxzZSBpZiAoaGl0QXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgc3RhdGUgPSBcImlubGluZVwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRNaXNzKCkge1xuICAgIHN0cmVhayA9IGZhbHNlO1xuICB9XG4gIC8vIHJlcG9ydCBtaXNzIGZ1bmN0aW9uP1xuICByZXR1cm4ge1xuICAgIHJhbmRvbU1vdmUsXG4gICAgYWRqYWNlbnRNb3ZlLFxuICAgIGlubGluZU1vdmUsXG4gICAgbmV4dE1vdmUsXG4gICAgcmVwb3J0SGl0LFxuICAgIHJlcG9ydE1pc3MsXG4gICAgaGl0QXJyLFxuICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gY3B1UGxheWVyO1xuIiwiY29uc3QgZ2FtZUJvYXJkID0gKCkgPT4ge1xuICBsZXQgc2hpcHMgPSBbXTtcbiAgZnVuY3Rpb24gZ3JpZE1ha2VyKCkge1xuICAgIGdyaWQgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZ3JpZFtpXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGdyaWRbaV1bal0gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JpZDtcbiAgfVxuXG4gIC8vIGluaXRpYWxpemVyIGZvciB0aGUgZ3JpZFxuICBsZXQgc2hpcEdyaWQgPSBncmlkTWFrZXIoKTtcbiAgbGV0IGF0dGFja3NSZWNlaXZlZCA9IGdyaWRNYWtlcigpO1xuXG4gIGZ1bmN0aW9uIHNoaXBQZXJpbWV0ZXIoYm93UG9zLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBjYWxsYmFja2ZuKSB7XG4gICAgLy8gdGhpcyBmbiBkZWZpbmVzIDQgYXJlYXMgdG9wLCBMLCBSLCBib3R0b20gYW5kIGNhbGxzIGluamVjdGVkIGZ1bmN0aW9uXG4gICAgLy8gb24gZWFjaCBvZiB0aGUgc3F1YXJlcy4gaXQgaXMgZXhwZWN0ZWQgdGhhdCB0aGUgY2FsbGJhY2tmbiByZXR1cm4gYm9vbFxuICAgIC8vIHRoZSByZXN1bHQgb2YgdGhpcyBjYWxsIHdvdWxkIGJlIHRoZSBzdWNjZXNzZnVsXG5cbiAgICAvLyBuZWVkIHRvIGNvbWUgYmFjayBoZXJlIHRvIG1ha2Ugc3VyZSB0aGF0IGF0dGVtcHRpbmcgdG8gZ28gb3V0IG9mIGJvdW5kcyB3b250IGJyZWFrIGl0LlxuICAgIC8vIHRoZSAwIG1lYW5zIHRoYXQgdGhlIHJvdyB3aWxsIGJlIGFkZGVkIG9mZnNldCB0byBkcmF3IGJvcmRlciBhYm92ZSBzaGlwXG4gICAgY29uc3QgYXhpc09mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGF4aXNDb3VudGVyID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgY29uc3QgYU9mZnNldCA9IDE7XG4gICAgY29uc3QgYk9mZnNldCA9IC0xO1xuXG4gICAgbGV0IGVuZGNhcEE7XG4gICAgbGV0IGVuZGNhcEI7XG5cbiAgICAvLyBmaW5kcyB0aGUgcG9pbnQgZGlyZWN0bHkgYWRqYWNlbnQgdG8gYm93IGFuZCB0cmFuc29tXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgZW5kY2FwQSA9IFtib3dQb3NbMF0sIGJvd1Bvc1sxXSAtIDFdO1xuICAgICAgZW5kY2FwQiA9IFtib3dQb3NbMF0sIGJvd1Bvc1sxXSArIGxlbmd0aF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuZGNhcEEgPSBbYm93UG9zWzBdIC0gMSwgYm93UG9zWzFdXTtcbiAgICAgIGVuZGNhcEIgPSBbYm93UG9zWzBdICsgbGVuZ3RoLCBib3dQb3NbMV1dO1xuICAgIH1cblxuICAgIGxldCByb3dBID0gWy4uLmJvd1Bvc107XG4gICAgbGV0IHJvd0IgPSBbLi4uYm93UG9zXTtcblxuICAgIHJvd0FbYXhpc09mZnNldF0gKz0gYU9mZnNldDtcbiAgICByb3dCW2F4aXNPZmZzZXRdICs9IGJPZmZzZXQ7XG4gICAgLy8gc3VidHJhY3QgYnkgMSB0byBnZXQgY29ybmVyIHNwb3QgZGlhZ29uYWwgdG8gYm93XG4gICAgcm93QVtheGlzQ291bnRlcl0gKz0gLTE7XG4gICAgcm93QltheGlzQ291bnRlcl0gKz0gLTE7XG5cbiAgICBjb25zdCByZXN1bHRFQ0EgPSBjYWxsYmFja2ZuKGVuZGNhcEEpO1xuICAgIGNvbnN0IHJlc3VsdEVDQiA9IGNhbGxiYWNrZm4oZW5kY2FwQik7XG5cbiAgICBpZiAocmVzdWx0RUNBID09PSBmYWxzZSB8fCByZXN1bHRFQ0IgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnNvbGUubG9nKGByb3dBIGlzICR7cm93QX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGByb3dCIGlzICR7cm93Qn1gKTtcblxuICAgICAgY29uc3QgcmVzdWx0QSA9IGNhbGxiYWNrZm4ocm93QSk7XG4gICAgICBjb25zdCByZXN1bHRCID0gY2FsbGJhY2tmbihyb3dCKTtcbiAgICAgIGlmIChyZXN1bHRBID09PSBmYWxzZSB8fCByZXN1bHRCID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByb3dBW2F4aXNDb3VudGVyXSArPSAxO1xuICAgICAgcm93QltheGlzQ291bnRlcl0gKz0gMTtcblxuICAgICAgLy9pbnNlcnQgbG9naWMgaGVyZSBmb3Igd2hhdCBoYXBwZW5zIHRvIGVhY2ggb2YgdGhlIHNxdWFyZXNcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgLy8gcmVmYWN0b3IgdG8gaWYgcGFzcyBpbml0aWFsIHRlc3QsIHRoZW4gZG8gcGVyaW1ldGVyIHRlc3Qgdy8gY2FsbGJhY2tmblxuICAgIGNvbnN0IGNvcHlDb29yZCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgbGV0IHIgPSBjb3B5Q29vcmRbMF07XG4gICAgbGV0IGMgPSBjb3B5Q29vcmRbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNoaXBmaXQgbGVuZ3RoIHVuZGVmaW5lZFwiKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgLy8gY2FsbGJhY2tmbiBjaGVja3MgZWFjaCBjb29yZCBwYXNzZWQgYW5kIHJldHVybiBmYWxzZSBpZiBub3QgbnVsbFxuICAgIGNvbnN0IHBlcmltZXRlckNoZWNrID0gc2hpcFBlcmltZXRlcihcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgbGVuZ3RoLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgICAocG9pbnQpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHBvaW50WzBdO1xuICAgICAgICBjb25zdCBjID0gcG9pbnRbMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIGV4dGVuZHMgYmV5b25kIGJvdW5kYXJ5LiBubyBuZWVkIHRvIGNoZWNrIGlmIGl0IGRvZXMuXG4gICAgICAgIGlmIChyIDw9IC0xIHx8IHIgPj0gMTAgfHwgYyA8PSAtMSB8fCBjID49IDEwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgLy8gcmV0dXJuIHRoZSByZXN1bHRzIG9mIHBlcmltZXRlciBjaGVjayBhcyBzaGlwIHdpbGwgZml0IGlmIGl0cyBnb3R0ZW4gdGhpcyBmYXJcbiAgICByZXR1cm4gcGVyaW1ldGVyQ2hlY2s7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gWzAsIDFdIDogWzEsIDBdO1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgICAvLyByZXR1cm4gc3RhdGVtZW50IG9mIHRydWUgbWVhbnMgc3VjY2Vzc2Z1bFxuICAgIGNvbnN0IGJ1aWxkUGVyaW1ldGVyID0gc2hpcFBlcmltZXRlcihcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgbGVuZ3RoLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgICAocG9pbnQpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHBvaW50WzBdO1xuICAgICAgICBjb25zdCBjID0gcG9pbnRbMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIGV4dGVuZHMgYmV5b25kIGJvdW5kYXJ5LiBubyBuZWVkIHRvIGNoZWNrIGlmIGl0IGRvZXMuXG4gICAgICAgIGlmIChyIDw9IC0xIHx8IHIgPj0gMTAgfHwgYyA8PSAtMSB8fCBjID49IDEwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc2hpcEdyaWRbcl1bY10gPSBcInhcIjtcbiAgICAgIH0sXG4gICAgKTtcbiAgICBpZiAoYnVpbGRQZXJpbWV0ZXIgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeGNlcHRpb24gb2NjdXJlZCB3aXRoIGJ1aWxkaW5nIHNoaXAgcGVyaW1ldGVyXCIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcmllbnRhdGlvbiA9PT0gXCJ2XCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHNoaXAuY29vcmRpbmF0ZXMgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIHNoaXAub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcbiAgICBjb25zb2xlLmxvZyhzdHJpa2VTcXVhcmUpO1xuICAgIGNvbnNvbGUubG9nKHIpO1xuICAgIGNvbnNvbGUubG9nKGMpO1xuXG4gICAgaWYgKHN0cmlrZVNxdWFyZSAhPT0gbnVsbCAmJiBzaGlwR3JpZFtyXVtjXSAhPT0gXCJ4XCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcbiAgICBsZXQgaGl0UmVwb3J0ID0gdW5kZWZpbmVkO1xuICAgIGxldCBpc1N1bmsgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwgJiYgc2hpcEdyaWRbcl1bY10gIT09IFwieFwiKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcbiAgICAgIGlzU3VuayA9IHNoaXAuaXNTdW5rKCk7XG5cbiAgICAgIGlmIChpc1N1bmspIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIGhpdFJlcG9ydCA9IGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICAgIC8vIHJldHVybiBzdGF0ZW1lbnQgaXMgb2JqIHRoYXQgY29udGFpbnMgdGhlIHJlcG9ydCBhcyB3ZWxsIGlzU3Vua1xuICAgICAgICByZXR1cm4geyBoaXRSZXBvcnQsIGlzU3VuayB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgaGl0UmVwb3J0ID0gXCJtaXNzXCI7XG4gICAgaXNTdW5rID0gXCJmYWxzZVwiO1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgY29ubmVjdGluZyBjcHUgQUkgdG8gb3RoZXIgZnVuY3Rpb25zXG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgLy8gdGhpcyB3cmFwcGVyIHdpbGwgbmVlZCB0byBiZSByZWZhY3RvcmVkIGFmdGVyIGNoYW5nZXMgdG8gcGxheWVyIGNsYXNzXG4gICAgY29uc29sZS5sb2cocGxheWVyQ2xhc3MpO1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIGNvbnNvbGUubG9nKG5leHRTdHJpa2UpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmVwZWF0TW92ZSA9IHRydWU7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZShyZXBlYXRNb3ZlKTtcbiAgICAgICAgY29uc29sZS5sb2cobmV4dFN0cmlrZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG4gICAgICBjb25zb2xlLmxvZyhzdHJpa2VSZXN1bHQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0LmhpdFJlcG9ydCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UsIHN0cmlrZVJlc3VsdC5pc1N1bmspO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfSBlbHNlIGlmIChzdHJpa2VSZXN1bHQuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAuLi4oeyBjYW5TdHJpa2UsIHN0cmlrZXMgfSA9IHBsYXllckNsYXNzKSxcbiAgICAgIGF0dGFjayxcbiAgICAgIHBsYXllckJvYXJkOiBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZCxcbiAgICAgIGlzQ1BVOiBwbGF5ZXJDbGFzcy5pc0NQVSxcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBsYXllckluaXRpYWxpemVyKHBsYXllck9iaikge1xuICAgIGlmIChwbGF5ZXJPYmoubnVtYmVyID09PSAxKSB7XG4gICAgICBwbGF5ZXIxID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXllcjIgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUGxhY2VyUHJveHkoXG4gICAgbnVtYmVyLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBjaGVja29ubHkgPSBmYWxzZSxcbiAgKSB7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCB8fCBsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gd2lsbCBtYWtlIGFuZCBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IHBsYXllciA9IG51bWJlciA9PT0gMSA/IHBsYXllcjEgOiBwbGF5ZXIyO1xuICAgIC8vIGZpcnN0IGNoZWNrIHRoZSBjb29yZGluYXRlc1xuICAgIC8vIHRoZW4gbWFrZSB0aGUgc2hpcFxuICAgIC8vIHRoZW4gcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBjYW5GaXQgPSBwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEZpdHMoXG4gICAgICBsZW5ndGgsXG4gICAgICBjb29yZGluYXRlcyxcbiAgICAgIG9yaWVudGF0aW9uLFxuICAgICk7XG4gICAgaWYgKCFjYW5GaXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFjaGVja29ubHkpIHtcbiAgICAgIGNvbnN0IG5ld1NoaXAgPSBzaGlwKGxlbmd0aCk7XG4gICAgICBwbGF5ZXIucGxheWVyQm9hcmQuYWRkU2hpcChuZXdTaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyLnBsYXllckJvYXJkLnNoaXBHcmlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGdhbWVUdXJuIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVUdXJuKHBsYXllckNsYXNzLCBlbmVteUNsYXNzLCBjb29yZGluYXRlcyA9IFwiXCIpIHtcbiAgICAvL3Jlc3BvbnNlIHdpbGwgbXV0YXRlIGVuZW15IGJvYXJkIGFuZCBzaGlwY2hlY2sgcmV0dXJucyAjIG9mIHNoaXBzIHJlbWFpbmluZ1xuICAgIC8vIHJlc3BvbnNlIHJldHVybnMgYW4gb2JqZWN0IHdpdGggLmhpdFJlcG9ydCAmIC5pc1N1bmtcbiAgICBjb25zdCByZXNwb25zZSA9IHBsYXllckNsYXNzLmF0dGFjayhjb29yZGluYXRlcywgZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZCk7XG4gICAgY29uc3Qgc2hpcENoZWNrID0gZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpO1xuICAgIGNvbnNvbGUubG9nKHNoaXBDaGVjayk7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cbiAgICAvLyByZXR1cm4gdmFsdWUgYW55dGhpbmcgb3RoZXIgdGhhbiBudW0gPSBwbGF5ZXIgbG9zZXNcbiAgICBpZiAoaXNOYU4oc2hpcENoZWNrKSkge1xuICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG4gICAgLy8gaG93IHRoZSBjcHUgcGxheWVyIGlzIGhhbmRsZWQgd2lsbCBuZWVkIHRvIGJlIHJlZmFjdG9yZWQgYXMgd2VsbC5cbiAgICAvLyB0aGlzIG1pZ2h0IGFjdHVhbGx5IGJlIGRlbGV0ZWQgc2luY2UgZ2FtZWxvb3Agd2lsbCBjYWxsIGdhbWV0dXJuIGZuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gZ2FtZUxvb3AoKSB7XG4gICAgLy8gd2hpbGUgZ2FtZSBpcyBub3Qgb3ZlclxuICAgIGNvbnNvbGUubG9nKFwiZ3JlZXRpbmdzIGZyb20gZ2FtZWxvb3BcIik7XG4gICAgLy8gY2FsbCB1aSBzdHJpa2VzY3JlZW4gZm9yIGN1cnJlbnQgcGxheWVyIGlmIGl0cyBhIHBlcnNvblxuICAgIHdoaWxlIChnYW1lT3ZlciA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnNvbGUuZGlyKGN1cnJlbnRQbGF5ZXIpO1xuXG4gICAgICAvLyBjdXJyZW50IHBsYXllciBjaGVjayBpcyBmYWlsaW5nLCBwYXNzaW5ndGhyb3VnaCBjcHUgcGxheWVyIHRvIHN0cmlrZXNjcmVlblxuICAgICAgY29uc3QgZW5lbXlDbGFzcyA9IGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEgPyBwbGF5ZXIyIDogcGxheWVyMTtcbiAgICAgIGlmICghY3VycmVudFBsYXllci5pc0NQVSkge1xuICAgICAgICBhd2FpdCB1aS5zdHJpa2VTY3JlZW4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcywgZ2FtZVR1cm4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZVR1cm4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIyO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIyKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBjYWxsIHVpIGZuIHRoYXQgd2lsbCBlbmQgdGhlIGdhbWVcbiAgICAvLyB1aSBzaG91bGQgYWxsb3cgdGhlbSB0byByZXNldCB0aGUgZ2FtZS5cbiAgICAvLyBjYWxsIGluZGV4IGZuIHRoYXQgd2lsbCB0aGUgZ2FtZVxuICB9XG5cbiAgZnVuY3Rpb24gZ2FtZUluaXRpYWxpemVyKCkge1xuICAgIC8vIGFmdGVyIGFkZGluZyB0aGUgc2hpcHMgLCBpdCB3aWxsIG5lZWQgdG8gY2hlY2sgd2hvIGlzIGNwdSBhbmQgaW5pdGlhbGl6ZSB0aGUgY3B1d3JhcHBlclxuXG4gICAgaWYgKHBsYXllcjEuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjEgfTtcbiAgICAgIHBsYXllcjEgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIyLnBsYXllckJvYXJkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllcjIuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjIgfTtcbiAgICAgIHBsYXllcjIgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIxLnBsYXllckJvYXJkKTtcbiAgICB9XG5cbiAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMTtcbiAgICBjb25zb2xlLmxvZyhjdXJyZW50UGxheWVyKTtcbiAgICBjb25zb2xlLmxvZyhwbGF5ZXIyKTtcbiAgICBnYW1lTG9vcCgpO1xuXG4gICAgLy8gd2lsbCBpbml0aWFsaXplIHRoZSBnYW1lIGxvb3AgZm4gdGhhdCB3aWxsIGNhbGwgdWkgZm9yIHN0cmlrZSBzY3JlZW5zXG4gICAgLy8gY3B1IHR1cm5zIHdpbGwgYmUgaGFuZGxlZCBieSBnYW1lbG9vcCBhdXRvbWF0aWNhbGx5XG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG5cbiAgLy8gdGhpcyBpbml0aWFsaXplcyBidXQgdGhlIGdhbWUgbG9vcCBwaWNrcyBiYWNrIHVwIHdoZW4gdWkgc2NyaXB0IGNhbGxzIGdhbWVpbml0aWFsaXplcjtcbiAgbGV0IHBsYXllcjEgPSB1bmRlZmluZWQ7XG4gIGxldCBwbGF5ZXIyID0gdW5kZWZpbmVkO1xuICBsZXQgY3VycmVudFBsYXllciA9IHVuZGVmaW5lZDtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIHVpLnN0YXJ0U2NyZWVuKCk7XG5cbiAgLy8gIGNvbnN0IHBsYXllcjEgPSBwbGF5ZXIoXCJEa1wiLCBnYW1lQm9hcmQoKSk7XG4gIC8vICBsZXQgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoXG4gIC8vICAgIHBsYXllcihcIlVLXCIsIGdhbWVCb2FyZCgpLCB0cnVlKSxcbiAgLy8gICAgY3B1QUksXG4gIC8vICAgIHBsYXllcjEucGxheWVyQm9hcmQsXG4gIC8vICApO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNHYW1lT3ZlcigpIHtcbiAgICByZXR1cm4gZ2FtZU92ZXI7XG4gIH1cblxuICByZXR1cm4geyBnYW1lVHVybiwgaXNHYW1lT3ZlciB9O1xufTtcbmdhbWVNb2R1bGUoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZU1vZHVsZTtcbiIsIi8vIHRoaXMgd2lsbCBkZW1vbnN0cmF0ZSBkZXBlbmRlbmN5IGluamVjdGlvbiB3aXRoIHRoZSBuZWVkZWQgbWV0aG9kcyBmb3IgdGhlIHBsYXllciBib2FyZCBhbmQgZW5lbXkgYm9hcmQgcmVmXG5cbmNvbnN0IHBsYXllciA9IChwbGF5ZXJPYmosIGJvYXJkRm4pID0+IHtcbiAgY29uc3QgcGxheWVyQm9hcmQgPSBib2FyZEZuO1xuICBjb25zdCBpc0NQVSA9IHBsYXllck9iai5wbGF5ZXIgPT09IFwicGVyc29uXCIgPyBmYWxzZSA6IHRydWU7XG4gIGNvbnN0IHN0cmlrZXMgPSB7XG4gICAgbWlzc2VzOiBbXSxcbiAgICBoaXRzOiBbXSxcbiAgfTtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJlc3VsdCA9IGVuZW15Qm9hcmQucmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcyk7XG4gICAgICBpZiAocmVzdWx0LmhpdFJlcG9ydCA9PT0gXCJoaXRcIikge1xuICAgICAgICBzdHJpa2VzLmhpdHMucHVzaChjb29yZGluYXRlcyk7XG4gICAgICB9IGVsc2UgaWYgKHJlc3VsdC5pc1N1bmsgPT09IHRydWUpIHtcbiAgICAgICAgc3RyaWtlcy5oaXRzLnB1c2goY29vcmRpbmF0ZXMpO1xuICAgICAgfSBlbHNlIGlmIChyZXN1bHQuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBzdHJpa2VzLm1pc3Nlcy5wdXNoKGNvb3JkaW5hdGVzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBcInRyeSBhbm90aGVyIGF0dGFja1wiO1xuICB9XG5cbiAgcmV0dXJuIHsgLi4ucGxheWVyT2JqLCBwbGF5ZXJCb2FyZCwgY2FuU3RyaWtlLCBhdHRhY2ssIGlzQ1BVLCBzdHJpa2VzIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXllcjtcbiIsIi8vIHNoaXBzIHNob3VsZCBoYXZlIHRoZSBjaG9pY2Ugb2Y6XG4vLyA1IG1hbi1vLXdhclxuLy8gNCBmcmlnYXRlXG4vLyAzIHggMyBzY2hvb25lclxuLy8gMiB4IDIgcGF0cm9sIHNsb29wXG5jb25zdCBzaGlwID0gKGxlbmd0aCkgPT4ge1xuICBsZXQgdHlwZSA9IFwiXCI7XG4gIGxldCBkYW1hZ2UgPSAwO1xuICBsZXQgY29vcmRpbmF0ZXMgPSBbXTtcbiAgbGV0IG9yaWVudGF0aW9uID0gXCJcIjtcblxuICBzd2l0Y2ggKGxlbmd0aCkge1xuICAgIGNhc2UgMjpcbiAgICAgIHR5cGUgPSBcIlBhdHJvbCBTbG9vcFwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgdHlwZSA9IFwiU2Nob29uZXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIHR5cGUgPSBcIkZyaWdhdGVcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNTpcbiAgICAgIHR5cGUgPSBcIk1hbi1vLVdhclwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNoaXAgdHlwZSBleGNlcHRpb246IGxlbmd0aCBtdXN0IGJlIDEtNVwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpdCgpIHtcbiAgICBkYW1hZ2UrKztcbiAgICAvL3JldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgICByZXR1cm4gYGhpdGA7XG4gIH1cbiAgZnVuY3Rpb24gaXNTdW5rKCkge1xuICAgIHJldHVybiBkYW1hZ2UgPj0gbGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIGhpdHBvaW50cygpIHtcbiAgICByZXR1cm4gbGVuZ3RoIC0gZGFtYWdlO1xuICB9XG4gIHJldHVybiB7XG4gICAgdHlwZSxcbiAgICBsZW5ndGgsXG4gICAgY29vcmRpbmF0ZXMsXG4gICAgb3JpZW50YXRpb24sXG4gICAgZGFtYWdlLFxuICAgIGhpdHBvaW50cyxcbiAgICBoaXQsXG4gICAgaXNTdW5rLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGlwO1xuIiwiY29uc3QgcGxheWVyID0gcmVxdWlyZShcIi4vcGxheWVyXCIpO1xuXG5jb25zdCB1c2VySW50ZXJmYWNlID0gKHNoaXBNYWtlclByb3h5LCBwbGF5ZXJJbml0U2NyaXB0LCBnYW1lSW5pdFNjcmlwdCkgPT4ge1xuICBjb25zdCBwYWdlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wYWdlQ29udGFpbmVyXCIpO1xuICBsZXQgcDFDb3VudHJ5ID0gXCJcIjtcbiAgbGV0IHAyQ291bnRyeSA9IFwiXCI7XG5cbiAgZnVuY3Rpb24gaW5pdENvdW50cnlTZWxlY3QoKSB7XG4gICAgY29uc3Qgbm9kZUxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNvdW50cnlCb3hcIik7XG4gICAgbm9kZUxpc3QuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDFcIikge1xuICAgICAgICAgIHAxQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5jbGFzc0xpc3RbMV0gPT09IFwicDJcIikge1xuICAgICAgICAgIHAyQ291bnRyeSA9IGVsZW1lbnQuaWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYnVpbGRzIGEgcGxheWVyb2JqIHRoYXQgY29udGFpbnMgaW5mb3JtYXRpb24gdG8gaW5pdGlhbGl6ZSB0aGUgZ2FtZVxuICBmdW5jdGlvbiBwT2JqSW5pdGlhbGl6ZXIoZm9ybUNsc3NObWUsIHAxc2VsZWN0aWQsIHAyc2VsZWN0aWQpIHtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihmb3JtQ2xzc05tZSk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMXNlbGVjdGlkKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAyc2VsZWN0aWQpO1xuICAgIGxldCBwbGF5ZXJzID0gW107XG5cbiAgICBjb25zdCBtYW5vd2FyID0gNTtcbiAgICBjb25zdCBmcmlnYXRlID0gNDtcbiAgICBjb25zdCBzY2hvb25lciA9IDM7XG4gICAgY29uc3Qgc2xvb3AgPSAyO1xuXG4gICAgLy8gcGxheWVyIGlzIGVpdGhlciBcImNwdVwiIG9yIFwicGVyc29uXCJcbiAgICBjb25zdCBwbGF5ZXJvYmogPSB7XG4gICAgICBwbGF5ZXI6IHVuZGVmaW5lZCxcbiAgICAgIG51bWJlcjogdW5kZWZpbmVkLFxuICAgICAgY291bnRyeTogdW5kZWZpbmVkLFxuICAgICAgc2hpcHM6IFttYW5vd2FyLCBmcmlnYXRlLCBzY2hvb25lciwgc2Nob29uZXIsIHNsb29wXSxcbiAgICB9O1xuICAgIGNvbnN0IHBsYXllcjEgPSB7IC4uLnBsYXllcm9iaiB9O1xuICAgIGNvbnN0IHBsYXllcjIgPSB7IC4uLnBsYXllcm9iaiB9O1xuXG4gICAgcGxheWVyMS5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMS52YWx1ZTtcbiAgICBwbGF5ZXIxLm51bWJlciA9IDE7XG4gICAgcGxheWVyMS5jb3VudHJ5ID0gcDFDb3VudHJ5O1xuXG4gICAgcGxheWVyMi5wbGF5ZXIgPSBkcm9wZG93bmZpZWxkMi52YWx1ZTtcbiAgICBwbGF5ZXIyLm51bWJlciA9IDI7XG4gICAgcGxheWVyMi5jb3VudHJ5ID0gcDJDb3VudHJ5O1xuXG4gICAgcGxheWVycy5wdXNoKHBsYXllcjEsIHBsYXllcjIpO1xuXG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21Db29yZCgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuY29vcmRpbmF0ZXMgPSBbXTtcblxuICAgIHJhbmNvb3JkaW5hdGVzLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmNvb3JkaW5hdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKSB7XG4gICAgbGV0IHNoaXBBcnIgPSBbLi4ucGxheWVyT2JqLnNoaXBzXTtcblxuICAgIHNoaXBBcnIuZm9yRWFjaCgoc2hpcExlbmd0aCkgPT4ge1xuICAgICAgbGV0IHBsYWNlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKCFwbGFjZWQpIHtcbiAgICAgICAgLy8gcmFuZG9tIGRpcmVjdGlvbiBvZiBzaGlwIHBsYWNlbWVudFxuICAgICAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IHJhbmRvbUNvb3JkKCk7XG4gICAgICAgIGNvbnN0IHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgICAgICBjb25zdCBheGlzID0gcmFuZG9tID09PSAwID8gXCJoXCIgOiBcInZcIjtcblxuICAgICAgICAvLyByZXR1cm5zIGZhbHNlIGlmIHdhcyBub3QgYWJsZSB0byBwbGFjZSBzaGlwIGF0IHJhbmRvbSBzcG90LCB0cnlzIGFnYWluXG4gICAgICAgIHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgc2hpcExlbmd0aCxcbiAgICAgICAgICByYW5jb29yZGluYXRlcyxcbiAgICAgICAgICBheGlzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnNvbGUuZGlyKHBsYXllck9iaik7XG4gIH1cbiAgZnVuY3Rpb24gZ3JpZEJ1aWxkZXIoZ3JpZENvbnRhaW5lciwgZ3JpZFNpemUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWRTaXplOyBpKyspIHtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICByb3cuY2xhc3NMaXN0LmFkZChcInJvd0NvbnRcIik7XG4gICAgICBncmlkQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ3JpZFNpemU7IGorKykge1xuICAgICAgICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwiY2VsbFwiKTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LnIgPSBpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuYyA9IGo7XG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChjZWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZ3JpZFNoYWRlcihcbiAgICBjb29yZCxcbiAgICBsZW5ndGgsXG4gICAgb3JpZW50YXRpb24sXG4gICAgZHJhZ0ZpdHMsXG4gICAgcGxhY2VkID0gZmFsc2UsXG4gICAgZ3JpZENvbnRhaW5lcixcbiAgKSB7XG4gICAgY29uc3Qgb2Zmc2V0ciA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IG9mZnNldGMgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBsZXQgYWRkZWRDbGFzcyA9IFwiXCI7XG4gICAgY29uc3QgZ3JpZENvbnRhaW5lck5hbWUgPSBncmlkQ29udGFpbmVyLmNsYXNzTGlzdC52YWx1ZTtcbiAgICBjb25zb2xlLmxvZyhncmlkQ29udGFpbmVyTmFtZSk7XG5cbiAgICAvLyAzIHNoYWRpbmcgcG9zc2libGl0aWVzIGZpdHMvbm9maXRzL3BsYWNlZFxuICAgIGlmIChwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgIGFkZGVkQ2xhc3MgPSBcInBsYWNlZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRlZENsYXNzID0gZHJhZ0ZpdHMgPT09IHRydWUgPyBcImZpdHNcIiA6IFwibm90Rml0c1wiO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRDb29yZCA9IFsuLi5jb29yZF07XG4gICAgbGV0IGNlbGxDb2xsZWN0aW9uID0gW107XG5cbiAgICAvLyBzaGFkZSBlYWNoIGNlbGwgcmVwcmVzZW50aW5nIHNoaXAgbGVuZ3RoXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBgLiR7Z3JpZENvbnRhaW5lck5hbWV9IFtkYXRhLXI9XCIke2N1cnJlbnRDb29yZFswXX1cIl1bZGF0YS1jPVwiJHtjdXJyZW50Q29vcmRbMV19XCJdYCxcbiAgICAgICk7XG4gICAgICBjZWxsQ29sbGVjdGlvbi5wdXNoKGN1cnJlbnRDZWxsKTtcblxuICAgICAgaWYgKGN1cnJlbnRDZWxsICE9PSBudWxsKSB7XG4gICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY3VycmVudENvb3JkWzBdICs9IG9mZnNldHI7XG4gICAgICBjdXJyZW50Q29vcmRbMV0gKz0gb2Zmc2V0YztcbiAgICB9XG4gICAgLy8gYWZ0ZXIgc2hhZGUsIGRyYWdsZWF2ZSBoYW5kbGVyIHRvIGNsZWFyIHNoYWRpbmcgd2hlbiBub3QgcGxhY2VkXG4gICAgY29uc3QgZmlyc3RDZWxsID0gY2VsbENvbGxlY3Rpb25bMF07XG4gICAgaWYgKGZpcnN0Q2VsbCA9PT0gbnVsbCB8fCBmaXJzdENlbGwgPT09IHVuZGVmaW5lZCB8fCBwbGFjZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZmlyc3RDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNlbGxDb2xsZWN0aW9uLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYCR7YWRkZWRDbGFzc31gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzaGlwU2NyZWVuKHBsYXllck9iaikge1xuICAgIC8vaW5kZXguanMgbG9vcCBzdXNwZW5kZWQgdW50aWwgZWFjaCBwbGF5ZXIgcGxhY2VzIHNoaXBzXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyBjbGVhciBwYWdlIGNvbnRhaW5lciBhbmQgcG9wdWxhdGUgd2l0aCBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2hpcFNjcmVlbkNvbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keUNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdyaWRDb250XCI+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwRGlzcGxheUNvbnRcIj5cbiAgICAgICAgICAgICAgICAgIHRoaXMgd2lsbCBiZSBhbGwgYm9hdHMgbGlzdGVkIGFuZCBpbnRlcmFjdGFibGVcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRhdGEtaW5kZXg9XCI1XCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBtYW5cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cblxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjRcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IGZyaWdcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiM1wiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2Nob29uXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiAgZGF0YS1pbmRleD1cIjJcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IHNsb29wXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvcmllbnRhdGlvbkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cIm9yaWVudGF0aW9uQnRuXCIgZGF0YS1vcmllbnRhdGlvbj1cImhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEhvcml6b250YWxcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0eHRcIj5cbiAgICAgICAgICAgICAgICAgIFBsYWNlIHlvdXIgc2hpcHMhXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicmFuZG9tQnRuXCI+XG4gICAgICAgICAgICAgICAgICBSYW5kb21pemVcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG4gICAgICBjb25zb2xlLmxvZyhcImRvbSBmaW5pc2hlZCBsb2FkaW5nXCIpO1xuXG4gICAgICAvLyBuZWNlc3NhcnkgZ2xvYmFscyBmb3IgbWV0aG9kcyBpbiBzaGlwIHNlbGVjdFxuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZ3JpZENvbnRcIik7XG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgbGV0IGFyYWdTaGlwTGVuZ3RoID0gMDtcbiAgICAgIGxldCBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBkcmFnRml0cyA9IGZhbHNlO1xuICAgICAgbGV0IG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICBsZXQgY29vcmQgPSBbXTtcbiAgICAgIGxldCBtb3dDb3VudCA9IDE7XG4gICAgICBsZXQgZnJpZ0NvdW50ID0gMjtcbiAgICAgIGxldCBzY2hvb25Db3VudCA9IDM7XG4gICAgICBsZXQgc2xvb3BDb3VudCA9IDI7XG4gICAgICBsZXQgZGVwbGV0ZWRTaGlwID0gbnVsbDtcbiAgICAgIGNvbnNvbGUubG9nKGB0aGUgY3VycmVudCBwbGF5ZXIgaXM6ICR7cGxheWVyT2JqLm51bWJlcn1gKTtcblxuICAgICAgbGV0IHNoaXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5zaGlwXCIpO1xuICAgICAgbGV0IHNoaXBDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBCb3hcIik7XG4gICAgICBsZXQgcGxheWVyTmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyTmFtZVwiKTtcbiAgICAgIGxldCBtYW5Db3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50Lm1hblwiKTtcbiAgICAgIGxldCBmcmlnQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5mcmlnXCIpO1xuICAgICAgbGV0IHNjaG9vbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQuc2Nob29uXCIpO1xuICAgICAgbGV0IHNsb29wQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zbG9vcFwiKTtcblxuICAgICAgcGxheWVyTmFtZS50ZXh0Q29udGVudCA9IGBQbGF5ZXIgJHtwbGF5ZXJPYmoubnVtYmVyfWA7XG4gICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgIC8vIGJ1aWxkIHRoZSB2aXN1YWwgZ3JpZFxuICAgICAgZ3JpZEJ1aWxkZXIoZ3JpZENvbnRhaW5lciwgMTApO1xuICAgICAgLy8gY3ljbGUgc2hpcCBwbGFjZW1lbnQgb3JpZW50YXRpb24sIGluaXRpYWxpemVkIHRvIFwiaFwiXG4gICAgICBjb25zdCBvcmllbnRhdGlvbkJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIub3JpZW50YXRpb25CdG5cIik7XG4gICAgICBvcmllbnRhdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgaWYgKG9yaWVudGF0aW9uID09PSBcImhcIikge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiVmVydGljYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIkhvcml6b250YWxcIjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmdW5jdGlvbiByYW5kb21CdG5GbigpIHtcbiAgICAgICAgY29uc29sZS5sb2cocGxheWVyT2JqKTtcbiAgICAgICAgc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByYW5kb21CdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnJhbmRvbUJ0blwiKTtcblxuICAgICAgY29uc29sZS5sb2cocmFuZG9tQnRuKTtcbiAgICAgIHJhbmRvbUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICByYW5kb21CdG5GbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIGxlYXZlU2NyZWVuKCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgICAgLy8gdHJhbnNsYXRlcyBVSSBjZWxsIHRvIGEgY29vcmRpbmF0ZSBvbiBhIGRyYWdvdmVyIGV2ZW50XG4gICAgICAvLyBjaGVja3MgaWYgdGhlIHNoaXAgZHJhZ2dlZCB3aWxsIGZpdFxuICAgICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICBjb25zdCBkcmFnT3ZlckhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICAgIGlmIChkcmFnU2hpcExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcIm1vdXNlb3ZlclwiKTtcblxuICAgICAgICAgIGNvbnN0IHIgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucik7XG4gICAgICAgICAgY29uc3QgYyA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5jKTtcbiAgICAgICAgICBjb29yZCA9IFtyLCBjXTtcbiAgICAgICAgICBkcmFnRml0cyA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgY29vcmQgcG9zdCBzaGlwbWFrZXI6ICR7Y29vcmR9YCk7XG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBmaXRzXG4gICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBub3QgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICBncmlkQ29udGFpbmVyLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm1vdXNlb3ZlclwiKTtcbiAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzaGlwSU1HID0gbmV3IEltYWdlKCk7XG4gICAgICBzaGlwSU1HLnNyYyA9IFwiLi9pbWFnZXMvc2FpbGJvYXQucG5nXCI7XG4gICAgICBzaGlwSU1HLmNsYXNzTGlzdC5hZGQoXCJzaGlwSU1HXCIpO1xuICAgICAgc2hpcElNRy5zdHlsZS53aWR0aCA9IFwiMXJlbVwiO1xuXG4gICAgICBzaGlwcy5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICAgIGZ1bmN0aW9uIHNoaXBEcmFnSGFuZGxlcihlKSB7XG4gICAgICAgICAgZHJhZ1NoaXBMZW5ndGggPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuaW5kZXgpO1xuXG4gICAgICAgICAgY29uc3QgY2xvbmUgPSBzaGlwLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICBkcmFnU2hpcCA9IHNoaXA7XG4gICAgICAgICAgLy8gU2V0IHRoZSBvZmZzZXQgZm9yIHRoZSBkcmFnIGltYWdlXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IDIwOyAvLyBTZXQgeW91ciBkZXNpcmVkIG9mZnNldCB2YWx1ZVxuICAgICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERyYWdJbWFnZShjbG9uZSwgMCwgMCk7XG4gICAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZHJhZ2dpbmdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGUpID0+IHtcbiAgICAgICAgICBzaGlwRHJhZ0hhbmRsZXIoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LnJlbW92ZShcImRyYWdnaW5nXCIpO1xuXG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAocGxhY2VkKSB7XG4gICAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBncmlkQ29udGFpbmVyLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGxldCByZW1haW5pbmdTaGlwcyA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgc3dpdGNoIChkcmFnU2hpcExlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gbW93Q291bnQ7XG4gICAgICAgICAgICAgICAgICBtb3dDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgbWFuQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke21vd0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IGZyaWdDb3VudDtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2Nob29uQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3NjaG9vbkNvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNsb29wQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzbG9vcENvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBpbnZhbGlkIHNoaXAgbGVuZ3RoIGluIGRyYWdTaGlwXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzIC09IDE7XG5cbiAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ1NoaXBzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkZXBsZXRlZFwiKTtcbiAgICAgICAgICAgICAgICBzaGlwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBzaGlwLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG1vd0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIGZyaWdDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBzY2hvb25Db3VudCA8PSAwICYmXG4gICAgICAgICAgICBzbG9vcENvdW50IDw9IDBcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgbmV4dEJ0bi50ZXh0Q29udGVudCA9IFwiTmV4dFwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFwidGhlcmUgc2hvdWxkIGJlIHNvbWUgcmVzb2x2aW5nIG9mIHByb21pc2VzIGhhcHBlbmluZyByaWdodCBub3dcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBwb3NzaWJseSBmb3IgY3B1LCBzdGlsbCBjYWxsIFNTIGJ1dCBkbyBub3Qgd2lwZSBodG1sIGFuZCBqdXN0IHNob3cgdGhlIGVmZmVjdCBvZiBoaXR0aW5nIG9uZSBvZiB0aGUgb3RoZXIgcGxheWVyIHNoaXBzLlxuICAvLyBnYW1lVHVybiByZXF1aXJlcyBjb29yZGluYXRlcywgcGxheWVyQ2xhc3MsIGVuZW15Q2xhc3NcbiAgYXN5bmMgZnVuY3Rpb24gc3RyaWtlU2NyZWVuKHBsYXllckNsYXNzLCBlbmVteUNsYXNzLCBnYW1lVHVyblNjcmlwdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPjwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VDb250XCI+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VHcmlkQ29udFwiPlxuICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdHJpa2VSZXN1bHRcIj5TdHJpa2UgUmVzdWx0PC9zcGFuPlxuICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBQbGFjZWRDb250XCI+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFBsYWNlZEdyaWRcIj48L2Rpdj5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwc1JlbWFpbkNvbnRcIj48L2Rpdj5cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgPC9kaXY+XG4gICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG5cbiAgICAgIGNvbnN0IHBsYXllck5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllck5hbWVcIik7XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHRDb250ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdHJpa2VSZXN1bHRcIik7XG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc3RyaWtlR3JpZENvbnRcIik7XG4gICAgICBjb25zdCBzaGlwUGxhY2VHcmlkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwUGxhY2VkR3JpZFwiKTtcbiAgICAgIGxldCBhYmxlVG9TdHJpa2UgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdG9va1R1cm4gPSBmYWxzZTtcbiAgICAgIGNvbnN0IGhpdFNWRyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBoaXRTVkcuaW5uZXJIVE1MID0gYDxzdmcgY2xhc3M9XCJoaXRJY29uXCIgeG1sbnMgPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIC05NjAgOTYwIDk2MFwiIHdpZHRoPVwiMjRcIj5cbiAgICAgICAgICA8cGF0aCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgZD1cIm0yNTYtMjAwLTU2LTU2IDIyNC0yMjQtMjI0LTIyNCA1Ni01NiAyMjQgMjI0IDIyNC0yMjQgNTYgNTYtMjI0IDIyNCAyMjQgMjI0LTU2IDU2LTIyNC0yMjQtMjI0IDIyNFpcIi8+XG4gICAgICAgIDwvc3ZnPmA7XG4gICAgICBjb25zdCBtaXNzU3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1pc3NTdmcuaW5uZXJIVE1MID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgLTk2MCA5NjAgOTYwXCIgd2lkdGg9XCIyNFwiPjxwYXRoIGQ9XCJNNDgwLTQ4MFptMCAyODBxLTExNiAwLTE5OC04MnQtODItMTk4cTAtMTE2IDgyLTE5OHQxOTgtODJxMTE2IDAgMTk4IDgydDgyIDE5OHEwIDExNi04MiAxOTh0LTE5OCA4MlptMC04MHE4MyAwIDE0MS41LTU4LjVUNjgwLTQ4MHEwLTgzLTU4LjUtMTQxLjVUNDgwLTY4MHEtODMgMC0xNDEuNSA1OC41VDI4MC00ODBxMCA4MyA1OC41IDE0MS41VDQ4MC0yODBaXCIvPjwvc3ZnPmA7XG4gICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgZnVuY3Rpb24gcHJldlN0cmlrZVBvcHVsYXRvcihcbiAgICAgICAgcGxheWVyQ2xhc3MsXG4gICAgICAgIGhpdFNWRyxcbiAgICAgICAgbWlzc1N2ZyxcbiAgICAgICAgZ3JpZENvbnQsXG4gICAgICAgIGhpdHNPbmx5ID0gZmFsc2UsXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgZ3JpZENvbnRhaW5lck5hbWUgPSBncmlkQ29udC5jbGFzc0xpc3QudmFsdWU7XG4gICAgICAgIGNvbnNvbGUubG9nKHBsYXllckNsYXNzKTtcbiAgICAgICAgY29uc3QgbWlzc0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMubWlzc2VzO1xuICAgICAgICBjb25zdCBoaXRzQXJyID0gcGxheWVyQ2xhc3Muc3RyaWtlcy5oaXRzO1xuICAgICAgICAvLyBmb3Igdmlld2luZyB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXQsIHBhc3N0aHJvdWdoIGVuZW15Q2xhc3MgaW5zdGVhZCBvZiBjdXJyZW50IHBsYXllclxuICAgICAgICBpZiAoaGl0c09ubHkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgbWlzc0Fyci5mb3JFYWNoKChjb29yZFBhaXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY3VycmVudENlbGwpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcIm1pc3NcIik7XG4gICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGhpdHNBcnIuZm9yRWFjaCgoY29vcmRQYWlyKSA9PiB7XG4gICAgICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50Q2VsbCk7XG4gICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcImhpdFwiKTtcbiAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IGhpdFNWRy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHBsYXllck5hbWUudGV4dENvbnRlbnQgPSBgUGxheWVyICR7cGxheWVyQ2xhc3MubnVtYmVyfSBUdXJuYDtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzdHJpa2UgZ3JpZCAmJiBwb3B1bGF0ZSBwcmV2aW91cyBzdHJpa2VzIGlmIGFwcGxpY2FibGVcbiAgICAgIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIDEwKTtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzaGlwUGxhY2VkR3JpZFxuICAgICAgZ3JpZEJ1aWxkZXIoc2hpcFBsYWNlR3JpZCwgMTApO1xuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihwbGF5ZXJDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBncmlkQ29udGFpbmVyKTtcbiAgICAgIC8vIHBvcHVsYXRlIHdoaWNoIG9mIHlvdXIgc2hpcHMgYXJlIGhpdFxuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihlbmVteUNsYXNzLCBoaXRTVkcsIG1pc3NTdmcsIHNoaXBQbGFjZUdyaWQsIHRydWUpO1xuICAgICAgY29uc29sZS5sb2coXCJ0aGlzIHMgY2FsbGVkIGFmdGVyIHN0cmlrZSBwb3B1bGF0b3JcIik7XG5cbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGVcbiAgICAgIC8vIGNoZWNrcyBpZiB0aGVyZSB3YXMgYWxyZWFkeSBhIGhpdCBpbiB0aGUgZ3JpZCBzcXVhcmVcblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIC8vIGlmIHN0cnVjayBhbHJlYWR5XG4gICAgICAgICAgaWYgKHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgLy8gcmVwbGFjZSB0aGlzIGZuIHdpdGggY2hlY2tlciBmb3IgcmVwZWF0IHN0cmlrZXNcbiAgICAgICAgICBjb25zb2xlLmxvZyhjb29yZCk7XG4gICAgICAgICAgLy8gdGhpcyBtaWdodCBicmVhayBpZiBwbGF5ZXIgY2Fuc3RyaWtlIGlzIHJlZmFjdG9yZWRcbiAgICAgICAgICBjb25zdCBjYW5TdHJpa2UgPSBwbGF5ZXJDbGFzcy5jYW5TdHJpa2UoXG4gICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgIGVuZW15Q2xhc3MucGxheWVyQm9hcmQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoY2FuU3RyaWtlICYmICF0b29rVHVybikge1xuICAgICAgICAgICAgdG9va1R1cm4gPSB0cnVlO1xuICAgICAgICAgICAgLy8gc2VuZCBzaWduYWwgdG8gc3RyaWtlIHRvIGdhbWVUdXJuXG4gICAgICAgICAgICAvLyByZXNwb25zZSB3aWxsIHJldHVybiBvYmogd2l0aCAuaGl0UmVwb3J0ICYgLmlzU3Vua1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBnYW1lVHVyblNjcmlwdChwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcywgY29vcmQpO1xuICAgICAgICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBzdHJpa2VSZXN1bHRDb250LnRleHRDb250ZW50ID1cbiAgICAgICAgICAgICAgc3RyaWtlUmVzdWx0Q29udC50ZXh0Q29udGVudCArIFwiOiBcIiArIHJlc3BvbnNlLmhpdFJlcG9ydDtcbiAgICAgICAgICAgIG5leHRCdG4udGV4dENvbnRlbnQgPSBcIkVuZCBUdXJuXCI7XG4gICAgICAgICAgICBwYWdlQ29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRCdG4pO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgICAgY29uc29sZS5kaXIocGxheWVyQ2xhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5oaXRSZXBvcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3I6IHN0cmlrZSByZXNwb25zZSBleGNlcHRpb25cIik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcImhpdFwiKTtcbiAgICAgICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBoaXRTVkcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgICAgY29uc29sZS5kaXIocGxheWVyQ2xhc3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzaG93IHRoZSBidXR0b24gZm9yIG5leHRcblxuICAgICAgICAgICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFwidGhlcmUgc2hvdWxkIGJlIHNvbWUgcmVzb2x2aW5nIG9mIHByb21pc2VzIGhhcHBlbmluZyByaWdodCBub3dcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gcGxhY2VTaGlwcyhwbGF5ZXJDbGFzcykge1xuICAgICAgICBjb25zdCBzaGlwc0FycmF5ID0gcGxheWVyQ2xhc3MucGxheWVyQm9hcmQuc2hpcHM7XG4gICAgICAgIHNoaXBzQXJyYXkuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgICAgICAgIGNvbnN0IGNvb3JkID0gc2hpcC5jb29yZGluYXRlcztcbiAgICAgICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHNoaXAub3JpZW50YXRpb247XG5cbiAgICAgICAgICBncmlkU2hhZGVyKGNvb3JkLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBudWxsLCB0cnVlLCBzaGlwUGxhY2VHcmlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBwbGFjZVNoaXBzKHBsYXllckNsYXNzKTtcbiAgICB9KTtcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBzdGFydFNjcmVlbigpIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPkJhdHRsZXNoaXA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllclNlbGVjdENvbnRcIj5cbiAgICAgICAgICAgICAgICAgPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJwbGF5ZXJGb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAxXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAxXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDFcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDJcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDJcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMlwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG5Db250XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkJlZ2luPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgIDwvZm9ybT5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICBjb25zdCBwbGF5ZXJGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJGb3JtXCIpO1xuICAgIGluaXRDb3VudHJ5U2VsZWN0KCk7XG4gICAgcGxheWVyRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBwbGF5ZXJzID0gcE9iakluaXRpYWxpemVyKFwiLnBsYXllckZvcm1cIiwgXCJzZWxlY3RwMVwiLCBcInNlbGVjdHAyXCIpO1xuICAgICAgLy8gcGxheWVyb2JqIHNlbnQgYmFjayB0byBleHRlbmQgZnVuY3Rpb25hbGl0eSB3aXRoIHBsYXllciBzY3JpcHRcbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHBsYXllcnMpIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC5wbGF5ZXIgPT09IFwicGVyc29uXCIpIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBhd2FpdCBzaGlwU2NyZWVuKGVsZW1lbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgc2hpcFJhbmRvbWl6ZXIoZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKTtcbiAgICAgIC8vIGluZGV4IGdsb2JhbCB2YXJpYWJsZXMgc2hvdWxkIGJlIHBvcHVsYXRlZCB3aXRoIGJvdGggcGxheWVyc1xuICAgICAgLy8gY2FsbCB0byBjb250aW51ZSBnYW1lIHNob3VsZCBoYXZlIGluZGV4IGFjY2Vzc2luZyBnbG9iYWwgcGxheWVyXG4gICAgICAvLyBvYmpzIGFuZCBzaG91bGQgd29yayBmaW5lLiBidXQgaXQgaXMga2luZGEgc2xvcHB5XG4gICAgICAvLyB0aGlzIHBhc3NlcyBvdmVyIGNvbnRyb2wgYmFjayB0byB0aGUgaW5kZXggc2NyaXB0LlxuICAgICAgZ2FtZUluaXRTY3JpcHQoKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4geyBzdGFydFNjcmVlbiwgcE9iakluaXRpYWxpemVyLCBzdHJpa2VTY3JlZW4gfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXNlckludGVyZmFjZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==