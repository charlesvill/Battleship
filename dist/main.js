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
    } else if (pursuitAxis === "v") {
      inlineStrike[0] += offsetValue;
    }
    if (
      inlineStrike[0] < 0 ||
      inlineStrike[1] < 0 ||
      inlineStrike[0] > 9 ||
      inlineStrike[1] > 9
    ) {
      const redo = getNextInline(lastHit);
      inlineStrike = redo;
    }
    return inlineStrike;
  }

  function inlineMove(repeat = false) {
    // finds the axis by comparing hits and calls an inline guess
    // p1 & 2 refer to the 1st/2nd pair of hits to analyze
    if (pursuitAxis === null) {
      const [p1, p2] = hitArr;
      if (p1[0] === p2[0] && p1[1] !== p2[1]) {
        pursuitAxis = "h";
        return getNextInline(p2);
      } else if (p1[0] !== p2[0] && p1[1] === p2[1]) {
        pursuitAxis = "v";
        return getNextInline(p2);
      }
    } else {
      if (streak === false || repeat === true) {
        return getNextInline(hitArr[0]);
      }
      return getNextInline(hitArr[hitArr.length - 1]);
      // condition if the last strike was a miss then start from the front of the list
      // take the last known hit and add to it
    }
  }
  function nextMove(repeat = false) {
    switch (state) {
      case "random":
        return randomMove();
        break;
      case "adjacent":
        return adjacentMove();
        break;
      case "inline":
        return inlineMove(repeat);
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
    ship.coordinates = [...coordinates];
    ship.orientation = orientation;
  }

  function canStrike(coordinates) {
    const [r, c] = coordinates;
    const strikeSquare = attacksReceived[r][c];
    console.log(strikeSquare);
    console.log(r);
    console.log(c);

    return strikeSquare === null ? true : false;
  }

  function receiveAttack(coordinates) {
    const r = coordinates[0];
    const c = coordinates[1];
    let hitReport = undefined;
    let isSunk = undefined;

    if (shipGrid[r][c] !== null) {
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
        const repeatMove = true;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNsTEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsV0FBVztBQUNYOztBQUVBOzs7Ozs7O1VDanFCQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9jcHVQbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9nYW1lYm9hcmQuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3BsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3NoaXAuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy91aS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBjcHVQbGF5ZXIgPSAoKSA9PiB7XG4gIGxldCBzdGF0ZSA9IFwicmFuZG9tXCI7XG4gIGxldCBoaXQgPSBmYWxzZTtcbiAgbGV0IHN0cmVhayA9IGZhbHNlO1xuICBsZXQgaGl0QXJyID0gW107XG4gIGxldCBwdXJzdWl0QXhpcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtYXggPSAxMDtcbiAgICBjb25zdCBjQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgcmFuZG9tQ29vcmQgPSBbXTtcblxuICAgIHJhbmRvbUNvb3JkLnB1c2goY0Nvb3JkLCByQ29vcmQpO1xuXG4gICAgcmV0dXJuIHJhbmRvbUNvb3JkO1xuICB9XG5cbiAgLy8gd2lsbCBuZWVkIHRvIGltcGxlbWVudCB0aGUgbGVnYWwgbW92ZSAtPiBkZXBlbmRlbmN5IGluamVjdGlvbiBmcm9tIGdhbWVib2FyZCBzY3JpcHRcbiAgZnVuY3Rpb24gYWRqYWNlbnRNb3ZlKCkge1xuICAgIC8vIHdpbGwgcmV0dXJuIGNvb3JkaW5hdGUgaW4gZWl0aGVyIHNhbWUgcm93IG9yIGNvbHVtbiBhcyBsYXN0SGl0XG4gICAgY29uc3QgW2xhc3RIaXRdID0gaGl0QXJyO1xuICAgIGxldCBhZGphY2VudFN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcbiAgICAvLyByYW5kb21seSBjaG9vc2UgZWl0aGVyIHJvdyBvciBjb2x1bW4gdG8gY2hhbmdlXG4gICAgY29uc3QgYXhpcyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIC8vIDAgLT4gLTEgd2lsbCBiZSBhZGRlZCB8fCAxIC0+IDEgd2lsbCBiZSBhZGRlZFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGFkamFjZW50U3RyaWtlW2F4aXNdICs9IG9mZnNldFZhbHVlO1xuICAgIC8vY2hlY2sgdG8gcHJvdGVjdCBvdXRvZmJvdW5kcyBzdHJpa2VzXG4gICAgaWYgKFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMF0gPCAwIHx8XG4gICAgICBhZGphY2VudFN0cmlrZVsxXSA8IDAgfHxcbiAgICAgIGFkamFjZW50U3RyaWtlWzBdID4gOSB8fFxuICAgICAgYWRqYWNlbnRTdHJpa2VbMV0gPiA5XG4gICAgKSB7XG4gICAgICBjb25zdCByZWRvID0gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICBhZGphY2VudFN0cmlrZSA9IHJlZG87XG4gICAgfVxuXG4gICAgcmV0dXJuIGFkamFjZW50U3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV4dElubGluZShsYXN0SGl0KSB7XG4gICAgLy8gd2lsbCBuZWVkIHRvIGd1ZXNzIG5leHQgb25lIHVudGlsIHlvdSBoYXZlIGEgbGVnYWwgb25lIHRoYXQgaGFzbnQgYmVlbiB1c2VkIHlldFxuICAgIGNvbnN0IGJpbmFyeU9mZnNldCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGNvbnN0IG9mZnNldFZhbHVlID0gYmluYXJ5T2Zmc2V0ID09PSAwID8gLTEgOiAxO1xuICAgIGxldCBpbmxpbmVTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG5cbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IFwiaFwiKSB7XG4gICAgICBpbmxpbmVTdHJpa2VbMV0gKz0gb2Zmc2V0VmFsdWU7XG4gICAgfSBlbHNlIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJ2XCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgaW5saW5lU3RyaWtlWzBdIDwgMCB8fFxuICAgICAgaW5saW5lU3RyaWtlWzFdIDwgMCB8fFxuICAgICAgaW5saW5lU3RyaWtlWzBdID4gOSB8fFxuICAgICAgaW5saW5lU3RyaWtlWzFdID4gOVxuICAgICkge1xuICAgICAgY29uc3QgcmVkbyA9IGdldE5leHRJbmxpbmUobGFzdEhpdCk7XG4gICAgICBpbmxpbmVTdHJpa2UgPSByZWRvO1xuICAgIH1cbiAgICByZXR1cm4gaW5saW5lU3RyaWtlO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZShyZXBlYXQgPSBmYWxzZSkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICAvLyBwMSAmIDIgcmVmZXIgdG8gdGhlIDFzdC8ybmQgcGFpciBvZiBoaXRzIHRvIGFuYWx5emVcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtwMSwgcDJdID0gaGl0QXJyO1xuICAgICAgaWYgKHAxWzBdID09PSBwMlswXSAmJiBwMVsxXSAhPT0gcDJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUocDIpO1xuICAgICAgfSBlbHNlIGlmIChwMVswXSAhPT0gcDJbMF0gJiYgcDFbMV0gPT09IHAyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKHAyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UgfHwgcmVwZWF0ID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFyclswXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbaGl0QXJyLmxlbmd0aCAtIDFdKTtcbiAgICAgIC8vIGNvbmRpdGlvbiBpZiB0aGUgbGFzdCBzdHJpa2Ugd2FzIGEgbWlzcyB0aGVuIHN0YXJ0IGZyb20gdGhlIGZyb250IG9mIHRoZSBsaXN0XG4gICAgICAvLyB0YWtlIHRoZSBsYXN0IGtub3duIGhpdCBhbmQgYWRkIHRvIGl0XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG5leHRNb3ZlKHJlcGVhdCA9IGZhbHNlKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZShyZXBlYXQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgc3RhdGUgPSBcInJhbmRvbVwiO1xuICAgICAgaGl0QXJyID0gW107XG4gICAgICBwdXJzdWl0QXhpcyA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpdEFyci5wdXNoKGNvb3JkaW5hdGUpO1xuICAgICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgc3RhdGUgPSBcImFkamFjZW50XCI7XG4gICAgICB9IGVsc2UgaWYgKGhpdEFyci5sZW5ndGggPiAxKSB7XG4gICAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICAvLyByZXBvcnQgbWlzcyBmdW5jdGlvbj9cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGNvcHlDb29yZCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgbGV0IHIgPSBjb3B5Q29vcmRbMF07XG4gICAgbGV0IGMgPSBjb3B5Q29vcmRbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNoaXBmaXQgbGVuZ3RoIHVuZGVmaW5lZFwiKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMCwgMV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBzaGlwIGRpZCBub3QgZml0XCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3JpZW50YXRpb24gPT09IFwidlwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzEsIDBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2hpcC5jb29yZGluYXRlcyA9IFsuLi5jb29yZGluYXRlc107XG4gICAgc2hpcC5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuICAgIGNvbnNvbGUubG9nKHN0cmlrZVNxdWFyZSk7XG4gICAgY29uc29sZS5sb2cocik7XG4gICAgY29uc29sZS5sb2coYyk7XG5cbiAgICByZXR1cm4gc3RyaWtlU3F1YXJlID09PSBudWxsID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcykge1xuICAgIGNvbnN0IHIgPSBjb29yZGluYXRlc1swXTtcbiAgICBjb25zdCBjID0gY29vcmRpbmF0ZXNbMV07XG4gICAgbGV0IGhpdFJlcG9ydCA9IHVuZGVmaW5lZDtcbiAgICBsZXQgaXNTdW5rID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcbiAgICAgIGlzU3VuayA9IHNoaXAuaXNTdW5rKCk7XG5cbiAgICAgIGlmIChpc1N1bmspIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIGhpdFJlcG9ydCA9IGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICAgIC8vIHJldHVybiBzdGF0ZW1lbnQgaXMgb2JqIHRoYXQgY29udGFpbnMgdGhlIHJlcG9ydCBhcyB3ZWxsIGlzU3Vua1xuICAgICAgICByZXR1cm4geyBoaXRSZXBvcnQsIGlzU3VuayB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgICB9XG4gICAgLy8gcmVjb3JkIHRoZSBtaXNzXG4gICAgaGl0UmVwb3J0ID0gXCJtaXNzXCI7XG4gICAgaXNTdW5rID0gXCJmYWxzZVwiO1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIHsgaGl0UmVwb3J0LCBpc1N1bmsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgY29ubmVjdGluZyBjcHUgQUkgdG8gb3RoZXIgZnVuY3Rpb25zXG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgLy8gdGhpcyB3cmFwcGVyIHdpbGwgbmVlZCB0byBiZSByZWZhY3RvcmVkIGFmdGVyIGNoYW5nZXMgdG8gcGxheWVyIGNsYXNzXG4gICAgY29uc29sZS5sb2cocGxheWVyQ2xhc3MpO1xuICAgIGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIGxldCBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIGNvbnNvbGUubG9nKG5leHRTdHJpa2UpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgcmVwZWF0TW92ZSA9IHRydWU7XG4gICAgICAgIG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZShyZXBlYXRNb3ZlKTtcbiAgICAgICAgY29uc29sZS5sb2cobmV4dFN0cmlrZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG4gICAgICBjb25zb2xlLmxvZyhzdHJpa2VSZXN1bHQpO1xuXG4gICAgICBpZiAoc3RyaWtlUmVzdWx0LmhpdFJlcG9ydCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UsIHN0cmlrZVJlc3VsdC5pc1N1bmspO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfSBlbHNlIGlmIChzdHJpa2VSZXN1bHQuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAuLi4oeyBjYW5TdHJpa2UsIHN0cmlrZXMgfSA9IHBsYXllckNsYXNzKSxcbiAgICAgIGF0dGFjayxcbiAgICAgIHBsYXllckJvYXJkOiBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZCxcbiAgICAgIGlzQ1BVOiBwbGF5ZXJDbGFzcy5pc0NQVSxcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBsYXllckluaXRpYWxpemVyKHBsYXllck9iaikge1xuICAgIGlmIChwbGF5ZXJPYmoubnVtYmVyID09PSAxKSB7XG4gICAgICBwbGF5ZXIxID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXllcjIgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUGxhY2VyUHJveHkoXG4gICAgbnVtYmVyLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBjaGVja29ubHkgPSBmYWxzZSxcbiAgKSB7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCB8fCBsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gd2lsbCBtYWtlIGFuZCBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IHBsYXllciA9IG51bWJlciA9PT0gMSA/IHBsYXllcjEgOiBwbGF5ZXIyO1xuICAgIC8vIGZpcnN0IGNoZWNrIHRoZSBjb29yZGluYXRlc1xuICAgIC8vIHRoZW4gbWFrZSB0aGUgc2hpcFxuICAgIC8vIHRoZW4gcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBjYW5GaXQgPSBwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEZpdHMoXG4gICAgICBsZW5ndGgsXG4gICAgICBjb29yZGluYXRlcyxcbiAgICAgIG9yaWVudGF0aW9uLFxuICAgICk7XG4gICAgaWYgKCFjYW5GaXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFjaGVja29ubHkpIHtcbiAgICAgIGNvbnN0IG5ld1NoaXAgPSBzaGlwKGxlbmd0aCk7XG4gICAgICBwbGF5ZXIucGxheWVyQm9hcmQuYWRkU2hpcChuZXdTaGlwLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pO1xuICAgICAgY29uc29sZS5sb2cocGxheWVyLnBsYXllckJvYXJkLnNoaXBHcmlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGdhbWVUdXJuIGlzIGNhbGxlZCBieSBldmVudCBoYW5kbGVyIG9uIFVJIGludGVyYWN0aW9uIC1vci0gYnkgcmVjdXJzaW9uIHdoZW4gaXRzIGNwdSB0dXJuXG4gIGZ1bmN0aW9uIGdhbWVUdXJuKHBsYXllckNsYXNzLCBlbmVteUNsYXNzLCBjb29yZGluYXRlcyA9IFwiXCIpIHtcbiAgICAvL3Jlc3BvbnNlIHdpbGwgbXV0YXRlIGVuZW15IGJvYXJkIGFuZCBzaGlwY2hlY2sgcmV0dXJucyAjIG9mIHNoaXBzIHJlbWFpbmluZ1xuICAgIC8vIHJlc3BvbnNlIHJldHVybnMgYW4gb2JqZWN0IHdpdGggLmhpdFJlcG9ydCAmIC5pc1N1bmtcbiAgICBjb25zdCByZXNwb25zZSA9IHBsYXllckNsYXNzLmF0dGFjayhjb29yZGluYXRlcywgZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZCk7XG4gICAgY29uc3Qgc2hpcENoZWNrID0gZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpO1xuICAgIGNvbnNvbGUubG9nKHNoaXBDaGVjayk7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cbiAgICAvLyByZXR1cm4gdmFsdWUgYW55dGhpbmcgb3RoZXIgdGhhbiBudW0gPSBwbGF5ZXIgbG9zZXNcbiAgICBpZiAoaXNOYU4oc2hpcENoZWNrKSkge1xuICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG4gICAgLy8gaG93IHRoZSBjcHUgcGxheWVyIGlzIGhhbmRsZWQgd2lsbCBuZWVkIHRvIGJlIHJlZmFjdG9yZWQgYXMgd2VsbC5cbiAgICAvLyB0aGlzIG1pZ2h0IGFjdHVhbGx5IGJlIGRlbGV0ZWQgc2luY2UgZ2FtZWxvb3Agd2lsbCBjYWxsIGdhbWV0dXJuIGZuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gZ2FtZUxvb3AoKSB7XG4gICAgLy8gd2hpbGUgZ2FtZSBpcyBub3Qgb3ZlclxuICAgIGNvbnNvbGUubG9nKFwiZ3JlZXRpbmdzIGZyb20gZ2FtZWxvb3BcIik7XG4gICAgLy8gY2FsbCB1aSBzdHJpa2VzY3JlZW4gZm9yIGN1cnJlbnQgcGxheWVyIGlmIGl0cyBhIHBlcnNvblxuICAgIHdoaWxlIChnYW1lT3ZlciA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnNvbGUuZGlyKGN1cnJlbnRQbGF5ZXIpO1xuXG4gICAgICAvLyBjdXJyZW50IHBsYXllciBjaGVjayBpcyBmYWlsaW5nLCBwYXNzaW5ndGhyb3VnaCBjcHUgcGxheWVyIHRvIHN0cmlrZXNjcmVlblxuICAgICAgY29uc3QgZW5lbXlDbGFzcyA9IGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEgPyBwbGF5ZXIyIDogcGxheWVyMTtcbiAgICAgIGlmICghY3VycmVudFBsYXllci5pc0NQVSkge1xuICAgICAgICBhd2FpdCB1aS5zdHJpa2VTY3JlZW4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcywgZ2FtZVR1cm4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZVR1cm4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIyO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50UGxheWVyID09PSBwbGF5ZXIyKSB7XG4gICAgICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBjYWxsIHVpIGZuIHRoYXQgd2lsbCBlbmQgdGhlIGdhbWVcbiAgICAvLyB1aSBzaG91bGQgYWxsb3cgdGhlbSB0byByZXNldCB0aGUgZ2FtZS5cbiAgICAvLyBjYWxsIGluZGV4IGZuIHRoYXQgd2lsbCB0aGUgZ2FtZVxuICB9XG5cbiAgZnVuY3Rpb24gZ2FtZUluaXRpYWxpemVyKCkge1xuICAgIC8vIGFmdGVyIGFkZGluZyB0aGUgc2hpcHMgLCBpdCB3aWxsIG5lZWQgdG8gY2hlY2sgd2hvIGlzIGNwdSBhbmQgaW5pdGlhbGl6ZSB0aGUgY3B1d3JhcHBlclxuXG4gICAgaWYgKHBsYXllcjEuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjEgfTtcbiAgICAgIHBsYXllcjEgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIyLnBsYXllckJvYXJkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllcjIuaXNDUFUpIHtcbiAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLnBsYXllcjIgfTtcbiAgICAgIHBsYXllcjIgPSBjcHVQbGF5ZXJXcmFwcGVyKGNvcHksIGNwdUFJLCBwbGF5ZXIxLnBsYXllckJvYXJkKTtcbiAgICB9XG5cbiAgICBjdXJyZW50UGxheWVyID0gcGxheWVyMTtcbiAgICBjb25zb2xlLmxvZyhjdXJyZW50UGxheWVyKTtcbiAgICBjb25zb2xlLmxvZyhwbGF5ZXIyKTtcbiAgICBnYW1lTG9vcCgpO1xuXG4gICAgLy8gd2lsbCBpbml0aWFsaXplIHRoZSBnYW1lIGxvb3AgZm4gdGhhdCB3aWxsIGNhbGwgdWkgZm9yIHN0cmlrZSBzY3JlZW5zXG4gICAgLy8gY3B1IHR1cm5zIHdpbGwgYmUgaGFuZGxlZCBieSBnYW1lbG9vcCBhdXRvbWF0aWNhbGx5XG4gIH1cblxuICBjb25zdCB1aSA9IHVpU2NyaXB0KHNoaXBQbGFjZXJQcm94eSwgcGxheWVySW5pdGlhbGl6ZXIsIGdhbWVJbml0aWFsaXplcik7XG5cbiAgLy8gdGhpcyBpbml0aWFsaXplcyBidXQgdGhlIGdhbWUgbG9vcCBwaWNrcyBiYWNrIHVwIHdoZW4gdWkgc2NyaXB0IGNhbGxzIGdhbWVpbml0aWFsaXplcjtcbiAgbGV0IHBsYXllcjEgPSB1bmRlZmluZWQ7XG4gIGxldCBwbGF5ZXIyID0gdW5kZWZpbmVkO1xuICBsZXQgY3VycmVudFBsYXllciA9IHVuZGVmaW5lZDtcbiAgY29uc3QgY3B1QUkgPSBjcHUoKTtcbiAgbGV0IGdhbWVPdmVyID0gZmFsc2U7XG4gIHVpLnN0YXJ0U2NyZWVuKCk7XG5cbiAgLy8gIGNvbnN0IHBsYXllcjEgPSBwbGF5ZXIoXCJEa1wiLCBnYW1lQm9hcmQoKSk7XG4gIC8vICBsZXQgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoXG4gIC8vICAgIHBsYXllcihcIlVLXCIsIGdhbWVCb2FyZCgpLCB0cnVlKSxcbiAgLy8gICAgY3B1QUksXG4gIC8vICAgIHBsYXllcjEucGxheWVyQm9hcmQsXG4gIC8vICApO1xuXG4gIGZ1bmN0aW9uIGVuZEdhbWUod2lubmVyKSB7XG4gICAgLy8gc29tZSBzaGl0IGhlcmUgdG8gZW5kIHRoZSBnYW1lXG4gICAgY29uc29sZS5sb2coXCJ0aGlzIG1mIG92ZXIgbG9sXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNHYW1lT3ZlcigpIHtcbiAgICByZXR1cm4gZ2FtZU92ZXI7XG4gIH1cblxuICByZXR1cm4geyBnYW1lVHVybiwgaXNHYW1lT3ZlciB9O1xufTtcbmdhbWVNb2R1bGUoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZU1vZHVsZTtcbiIsIi8vIHRoaXMgd2lsbCBkZW1vbnN0cmF0ZSBkZXBlbmRlbmN5IGluamVjdGlvbiB3aXRoIHRoZSBuZWVkZWQgbWV0aG9kcyBmb3IgdGhlIHBsYXllciBib2FyZCBhbmQgZW5lbXkgYm9hcmQgcmVmXG5cbmNvbnN0IHBsYXllciA9IChwbGF5ZXJPYmosIGJvYXJkRm4pID0+IHtcbiAgY29uc3QgcGxheWVyQm9hcmQgPSBib2FyZEZuO1xuICBjb25zdCBpc0NQVSA9IHBsYXllck9iai5wbGF5ZXIgPT09IFwicGVyc29uXCIgPyBmYWxzZSA6IHRydWU7XG4gIGNvbnN0IHN0cmlrZXMgPSB7XG4gICAgbWlzc2VzOiBbXSxcbiAgICBoaXRzOiBbXSxcbiAgfTtcblxuICBmdW5jdGlvbiBjYW5TdHJpa2UoY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5jYW5TdHJpa2UoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNrKGNvb3JkaW5hdGVzLCBlbmVteUJvYXJkKSB7XG4gICAgLy8gd2lsbCBuZWVkIGNvZGUgaGVyZSBmb3IgZGV0ZXJtaW5pbmcgbGVnYWwgbW92ZVxuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJlc3VsdCA9IGVuZW15Qm9hcmQucmVjZWl2ZUF0dGFjayhjb29yZGluYXRlcyk7XG4gICAgICBpZiAocmVzdWx0LmhpdFJlcG9ydCA9PT0gXCJoaXRcIikge1xuICAgICAgICBzdHJpa2VzLmhpdHMucHVzaChjb29yZGluYXRlcyk7XG4gICAgICB9IGVsc2UgaWYgKHJlc3VsdC5pc1N1bmsgPT09IHRydWUpIHtcbiAgICAgICAgc3RyaWtlcy5oaXRzLnB1c2goY29vcmRpbmF0ZXMpO1xuICAgICAgfSBlbHNlIGlmIChyZXN1bHQuaGl0UmVwb3J0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBzdHJpa2VzLm1pc3Nlcy5wdXNoKGNvb3JkaW5hdGVzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBcInRyeSBhbm90aGVyIGF0dGFja1wiO1xuICB9XG5cbiAgcmV0dXJuIHsgLi4ucGxheWVyT2JqLCBwbGF5ZXJCb2FyZCwgY2FuU3RyaWtlLCBhdHRhY2ssIGlzQ1BVLCBzdHJpa2VzIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXllcjtcblxuLy8gdGhlIGF0dGFjayBmbiBhcyBvZiBub3cgZG9lcyBub3Qgd29yayB3ZWxsIHdpdGggY3B1IHBsYXllciBiZWNhdXNlIGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gcmVnZW5lcmF0ZSBhbm90aGVyIG1vdmUgd2l0aG91dCBsZWF2aW5nIGl0cyBjdXJyZW50IHNjb3BlXG4iLCIvLyBzaGlwcyBzaG91bGQgaGF2ZSB0aGUgY2hvaWNlIG9mOlxuLy8gNSBtYW4tby13YXJcbi8vIDQgZnJpZ2F0ZVxuLy8gMyB4IDMgc2Nob29uZXJcbi8vIDIgeCAyIHBhdHJvbCBzbG9vcFxuY29uc3Qgc2hpcCA9IChsZW5ndGgpID0+IHtcbiAgbGV0IHR5cGUgPSBcIlwiO1xuICBsZXQgZGFtYWdlID0gMDtcbiAgbGV0IGNvb3JkaW5hdGVzID0gW107XG4gIGxldCBvcmllbnRhdGlvbiA9IFwiXCI7XG5cbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDI6XG4gICAgICB0eXBlID0gXCJQYXRyb2wgU2xvb3BcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHR5cGUgPSBcIlNjaG9vbmVyXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICB0eXBlID0gXCJGcmlnYXRlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICB0eXBlID0gXCJNYW4tby1XYXJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaGlwIHR5cGUgZXhjZXB0aW9uOiBsZW5ndGggbXVzdCBiZSAxLTVcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoaXQoKSB7XG4gICAgZGFtYWdlKys7XG4gICAgLy9yZXR1cm4gYCR7dHlwZX0gd2FzIGhpdC4gJHtoaXRwb2ludHMoKX0gaGl0cG9pbnRzIHJlbWFpbmluZ2A7XG4gICAgcmV0dXJuIGBoaXRgO1xuICB9XG4gIGZ1bmN0aW9uIGlzU3VuaygpIHtcbiAgICByZXR1cm4gZGFtYWdlID49IGxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBoaXRwb2ludHMoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCAtIGRhbWFnZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGUsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGRhbWFnZSxcbiAgICBoaXRwb2ludHMsXG4gICAgaGl0LFxuICAgIGlzU3VuayxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpcDtcbiIsImNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcblxuY29uc3QgdXNlckludGVyZmFjZSA9IChzaGlwTWFrZXJQcm94eSwgcGxheWVySW5pdFNjcmlwdCwgZ2FtZUluaXRTY3JpcHQpID0+IHtcbiAgY29uc3QgcGFnZUNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGFnZUNvbnRhaW5lclwiKTtcbiAgbGV0IHAxQ291bnRyeSA9IFwiXCI7XG4gIGxldCBwMkNvdW50cnkgPSBcIlwiO1xuXG4gIGZ1bmN0aW9uIGluaXRDb3VudHJ5U2VsZWN0KCkge1xuICAgIGNvbnN0IG5vZGVMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jb3VudHJ5Qm94XCIpO1xuICAgIG5vZGVMaXN0LmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAxXCIpIHtcbiAgICAgICAgICBwMUNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuY2xhc3NMaXN0WzFdID09PSBcInAyXCIpIHtcbiAgICAgICAgICBwMkNvdW50cnkgPSBlbGVtZW50LmlkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGJ1aWxkcyBhIHBsYXllcm9iaiB0aGF0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHRvIGluaXRpYWxpemUgdGhlIGdhbWVcbiAgZnVuY3Rpb24gcE9iakluaXRpYWxpemVyKGZvcm1DbHNzTm1lLCBwMXNlbGVjdGlkLCBwMnNlbGVjdGlkKSB7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZm9ybUNsc3NObWUpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDFzZWxlY3RpZCk7XG4gICAgY29uc3QgZHJvcGRvd25maWVsZDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwMnNlbGVjdGlkKTtcbiAgICBsZXQgcGxheWVycyA9IFtdO1xuXG4gICAgY29uc3QgbWFub3dhciA9IDU7XG4gICAgY29uc3QgZnJpZ2F0ZSA9IDQ7XG4gICAgY29uc3Qgc2Nob29uZXIgPSAzO1xuICAgIGNvbnN0IHNsb29wID0gMjtcblxuICAgIC8vIHBsYXllciBpcyBlaXRoZXIgXCJjcHVcIiBvciBcInBlcnNvblwiXG4gICAgY29uc3QgcGxheWVyb2JqID0ge1xuICAgICAgcGxheWVyOiB1bmRlZmluZWQsXG4gICAgICBudW1iZXI6IHVuZGVmaW5lZCxcbiAgICAgIGNvdW50cnk6IHVuZGVmaW5lZCxcbiAgICAgIHNoaXBzOiBbXG4gICAgICAgIG1hbm93YXIsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIGZyaWdhdGUsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNsb29wLFxuICAgICAgICBzbG9vcCxcbiAgICAgIF0sXG4gICAgfTtcbiAgICBjb25zdCBwbGF5ZXIxID0geyAuLi5wbGF5ZXJvYmogfTtcbiAgICBjb25zdCBwbGF5ZXIyID0geyAuLi5wbGF5ZXJvYmogfTtcblxuICAgIHBsYXllcjEucGxheWVyID0gZHJvcGRvd25maWVsZDEudmFsdWU7XG4gICAgcGxheWVyMS5udW1iZXIgPSAxO1xuICAgIHBsYXllcjEuY291bnRyeSA9IHAxQ291bnRyeTtcblxuICAgIHBsYXllcjIucGxheWVyID0gZHJvcGRvd25maWVsZDIudmFsdWU7XG4gICAgcGxheWVyMi5udW1iZXIgPSAyO1xuICAgIHBsYXllcjIuY291bnRyeSA9IHAyQ291bnRyeTtcblxuICAgIHBsYXllcnMucHVzaChwbGF5ZXIxLCBwbGF5ZXIyKTtcblxuICAgIHJldHVybiBwbGF5ZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQ29vcmQoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gW107XG5cbiAgICByYW5jb29yZGluYXRlcy5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIHJldHVybiByYW5jb29yZGluYXRlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBSYW5kb21pemVyKHBsYXllck9iaikge1xuICAgIGxldCBzaGlwQXJyID0gWy4uLnBsYXllck9iai5zaGlwc107XG5cbiAgICBzaGlwQXJyLmZvckVhY2goKHNoaXBMZW5ndGgpID0+IHtcbiAgICAgIGxldCBwbGFjZWQgPSBmYWxzZTtcbiAgICAgIHdoaWxlICghcGxhY2VkKSB7XG4gICAgICAgIC8vIHJhbmRvbSBkaXJlY3Rpb24gb2Ygc2hpcCBwbGFjZW1lbnRcbiAgICAgICAgY29uc3QgcmFuY29vcmRpbmF0ZXMgPSByYW5kb21Db29yZCgpO1xuICAgICAgICBjb25zdCByYW5kb20gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAgICAgY29uc3QgYXhpcyA9IHJhbmRvbSA9PT0gMCA/IFwiaFwiIDogXCJ2XCI7XG5cbiAgICAgICAgLy8gcmV0dXJucyBmYWxzZSBpZiB3YXMgbm90IGFibGUgdG8gcGxhY2Ugc2hpcCBhdCByYW5kb20gc3BvdCwgdHJ5cyBhZ2FpblxuICAgICAgICBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgIHNoaXBMZW5ndGgsXG4gICAgICAgICAgcmFuY29vcmRpbmF0ZXMsXG4gICAgICAgICAgYXhpcyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zb2xlLmRpcihwbGF5ZXJPYmopO1xuICB9XG4gIGZ1bmN0aW9uIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIGdyaWRTaXplKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncmlkU2l6ZTsgaSsrKSB7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgcm93LmNsYXNzTGlzdC5hZGQoXCJyb3dDb250XCIpO1xuICAgICAgZ3JpZENvbnRhaW5lci5hcHBlbmRDaGlsZChyb3cpO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGdyaWRTaXplOyBqKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcImNlbGxcIik7XG4gICAgICAgIGNlbGwuZGF0YXNldC5yID0gaTtcbiAgICAgICAgY2VsbC5kYXRhc2V0LmMgPSBqO1xuICAgICAgICByb3cuYXBwZW5kQ2hpbGQoY2VsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdyaWRTaGFkZXIoXG4gICAgY29vcmQsXG4gICAgbGVuZ3RoLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGRyYWdGaXRzLFxuICAgIHBsYWNlZCA9IGZhbHNlLFxuICAgIGdyaWRDb250YWluZXIsXG4gICkge1xuICAgIGNvbnN0IG9mZnNldHIgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBvZmZzZXRjID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgbGV0IGFkZGVkQ2xhc3MgPSBcIlwiO1xuICAgIGNvbnN0IGdyaWRDb250YWluZXJOYW1lID0gZ3JpZENvbnRhaW5lci5jbGFzc0xpc3QudmFsdWU7XG4gICAgY29uc29sZS5sb2coZ3JpZENvbnRhaW5lck5hbWUpO1xuXG4gICAgLy8gMyBzaGFkaW5nIHBvc3NpYmxpdGllcyBmaXRzL25vZml0cy9wbGFjZWRcbiAgICBpZiAocGxhY2VkID09PSB0cnVlKSB7XG4gICAgICBhZGRlZENsYXNzID0gXCJwbGFjZWRcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgYWRkZWRDbGFzcyA9IGRyYWdGaXRzID09PSB0cnVlID8gXCJmaXRzXCIgOiBcIm5vdEZpdHNcIjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50Q29vcmQgPSBbLi4uY29vcmRdO1xuICAgIGxldCBjZWxsQ29sbGVjdGlvbiA9IFtdO1xuXG4gICAgLy8gc2hhZGUgZWFjaCBjZWxsIHJlcHJlc2VudGluZyBzaGlwIGxlbmd0aFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjdXJyZW50Q29vcmRbMF19XCJdW2RhdGEtYz1cIiR7Y3VycmVudENvb3JkWzFdfVwiXWAsXG4gICAgICApO1xuICAgICAgY2VsbENvbGxlY3Rpb24ucHVzaChjdXJyZW50Q2VsbCk7XG5cbiAgICAgIGlmIChjdXJyZW50Q2VsbCAhPT0gbnVsbCkge1xuICAgICAgICBjdXJyZW50Q2VsbC5jbGFzc0xpc3QuYWRkKGAke2FkZGVkQ2xhc3N9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRDb29yZFswXSArPSBvZmZzZXRyO1xuICAgICAgY3VycmVudENvb3JkWzFdICs9IG9mZnNldGM7XG4gICAgfVxuICAgIC8vIGFmdGVyIHNoYWRlLCBkcmFnbGVhdmUgaGFuZGxlciB0byBjbGVhciBzaGFkaW5nIHdoZW4gbm90IHBsYWNlZFxuICAgIGNvbnN0IGZpcnN0Q2VsbCA9IGNlbGxDb2xsZWN0aW9uWzBdO1xuICAgIGlmIChmaXJzdENlbGwgPT09IG51bGwgfHwgZmlyc3RDZWxsID09PSB1bmRlZmluZWQgfHwgcGxhY2VkID09PSB0cnVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZpcnN0Q2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjZWxsQ29sbGVjdGlvbi5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGAke2FkZGVkQ2xhc3N9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2hpcFNjcmVlbihwbGF5ZXJPYmopIHtcbiAgICAvL2luZGV4LmpzIGxvb3Agc3VzcGVuZGVkIHVudGlsIGVhY2ggcGxheWVyIHBsYWNlcyBzaGlwc1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgLy8gY2xlYXIgcGFnZSBjb250YWluZXIgYW5kIHBvcHVsYXRlIHdpdGggc2hpcCBzZWxlY3RcbiAgICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInNoaXBTY3JlZW5Db250XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllck5hbWVcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJncmlkQ29udFwiPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcERpc3BsYXlDb250XCI+XG4gICAgICAgICAgICAgICAgICB0aGlzIHdpbGwgYmUgYWxsIGJvYXRzIGxpc3RlZCBhbmQgaW50ZXJhY3RhYmxlXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNVwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgbWFuXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiIGRhdGEtaW5kZXg9XCI0XCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBmcmlnXCIgZHJhZ2dhYmxlPVwiZmFsc2VcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiAgZGF0YS1pbmRleD1cIjNcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IHNjaG9vblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIyXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzbG9vcFwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3JpZW50YXRpb25Db250XCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJvcmllbnRhdGlvbkJ0blwiIGRhdGEtb3JpZW50YXRpb249XCJoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBIb3Jpem9udGFsXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyQ29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidHh0XCI+XG4gICAgICAgICAgICAgICAgICBQbGFjZSB5b3VyIHNoaXBzIVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInJhbmRvbUJ0blwiPlxuICAgICAgICAgICAgICAgICAgUmFuZG9taXplXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgIGA7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgICAgY29uc29sZS5sb2coXCJkb20gZmluaXNoZWQgbG9hZGluZ1wiKTtcblxuICAgICAgLy8gbmVjZXNzYXJ5IGdsb2JhbHMgZm9yIG1ldGhvZHMgaW4gc2hpcCBzZWxlY3RcbiAgICAgIGNvbnN0IGdyaWRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmdyaWRDb250XCIpO1xuICAgICAgY29uc3QgZ3JpZFNpemUgPSAxMDtcbiAgICAgIGxldCBhcmFnU2hpcExlbmd0aCA9IDA7XG4gICAgICBsZXQgZHJhZ1NoaXAgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZHJhZ0ZpdHMgPSBmYWxzZTtcbiAgICAgIGxldCBvcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgbGV0IGNvb3JkID0gW107XG4gICAgICBsZXQgbW93Q291bnQgPSAxO1xuICAgICAgbGV0IGZyaWdDb3VudCA9IDI7XG4gICAgICBsZXQgc2Nob29uQ291bnQgPSAzO1xuICAgICAgbGV0IHNsb29wQ291bnQgPSAyO1xuICAgICAgbGV0IGRlcGxldGVkU2hpcCA9IG51bGw7XG4gICAgICBjb25zb2xlLmxvZyhgdGhlIGN1cnJlbnQgcGxheWVyIGlzOiAke3BsYXllck9iai5udW1iZXJ9YCk7XG5cbiAgICAgIGxldCBzaGlwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc2hpcFwiKTtcbiAgICAgIGxldCBzaGlwQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQm94XCIpO1xuICAgICAgbGV0IHBsYXllck5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllck5hbWVcIik7XG4gICAgICBsZXQgbWFuQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5tYW5cIik7XG4gICAgICBsZXQgZnJpZ0NvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQuZnJpZ1wiKTtcbiAgICAgIGxldCBzY2hvb25Db3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNjaG9vblwiKTtcbiAgICAgIGxldCBzbG9vcENvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQuc2xvb3BcIik7XG5cbiAgICAgIHBsYXllck5hbWUudGV4dENvbnRlbnQgPSBgUGxheWVyICR7cGxheWVyT2JqLm51bWJlcn1gO1xuICAgICAgbWFuQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke21vd0NvdW50fWA7XG4gICAgICBmcmlnQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke2ZyaWdDb3VudH1gO1xuICAgICAgc2Nob29uQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3NjaG9vbkNvdW50fWA7XG4gICAgICBzbG9vcENvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzbG9vcENvdW50fWA7XG4gICAgICAvLyBidWlsZCB0aGUgdmlzdWFsIGdyaWRcbiAgICAgIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIDEwKTtcbiAgICAgIC8vIGN5Y2xlIHNoaXAgcGxhY2VtZW50IG9yaWVudGF0aW9uLCBpbml0aWFsaXplZCB0byBcImhcIlxuICAgICAgY29uc3Qgb3JpZW50YXRpb25CdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLm9yaWVudGF0aW9uQnRuXCIpO1xuICAgICAgb3JpZW50YXRpb25CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5vcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uID0gXCJ2XCI7XG4gICAgICAgICAgb3JpZW50YXRpb25CdG4udGV4dENvbnRlbnQgPSBcIlZlcnRpY2FsXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbiA9IFwiaFwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJIb3Jpem9udGFsXCI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZnVuY3Rpb24gcmFuZG9tQnRuRm4oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHBsYXllck9iaik7XG4gICAgICAgIHNoaXBSYW5kb21pemVyKHBsYXllck9iaik7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmFuZG9tQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5yYW5kb21CdG5cIik7XG5cbiAgICAgIGNvbnNvbGUubG9nKHJhbmRvbUJ0bik7XG4gICAgICByYW5kb21CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgcmFuZG9tQnRuRm4oKTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBsZWF2ZVNjcmVlbigpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjZWxscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2VsbFwiKTtcbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGUgb24gYSBkcmFnb3ZlciBldmVudFxuICAgICAgLy8gY2hlY2tzIGlmIHRoZSBzaGlwIGRyYWdnZWQgd2lsbCBmaXRcbiAgICAgIGNlbGxzLmZvckVhY2goKGNlbGwpID0+IHtcbiAgICAgICAgY29uc3QgZHJhZ092ZXJIYW5kbGVyID0gKGUpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZ1NoaXBMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtb3VzZW92ZXJcIik7XG5cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgZHJhZ0ZpdHMgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coYGNvb3JkIHBvc3Qgc2hpcG1ha2VyOiAke2Nvb3JkfWApO1xuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3IgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICBncmlkQ29udGFpbmVyLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYWRkIGNsYXNzbmFtZSBmb3Igbm90IGZpdHNcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IHRydWU7XG4gICAgICAgICAgY2VsbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKGUpID0+IHtcbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoXCJtb3VzZW92ZXJcIik7XG4gICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc2hpcElNRyA9IG5ldyBJbWFnZSgpO1xuICAgICAgc2hpcElNRy5zcmMgPSBcIi4vaW1hZ2VzL3NhaWxib2F0LnBuZ1wiO1xuICAgICAgc2hpcElNRy5jbGFzc0xpc3QuYWRkKFwic2hpcElNR1wiKTtcbiAgICAgIHNoaXBJTUcuc3R5bGUud2lkdGggPSBcIjFyZW1cIjtcblxuICAgICAgc2hpcHMuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgICAgICBmdW5jdGlvbiBzaGlwRHJhZ0hhbmRsZXIoZSkge1xuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmluZGV4KTtcblxuICAgICAgICAgIGNvbnN0IGNsb25lID0gc2hpcC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgZHJhZ1NoaXAgPSBzaGlwO1xuICAgICAgICAgIC8vIFNldCB0aGUgb2Zmc2V0IGZvciB0aGUgZHJhZyBpbWFnZVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggPSAyMDsgLy8gU2V0IHlvdXIgZGVzaXJlZCBvZmZzZXQgdmFsdWVcbiAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREcmFnSW1hZ2UoY2xvbmUsIDAsIDApO1xuICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRyYWdnaW5nXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hpcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChlKSA9PiB7XG4gICAgICAgICAgc2hpcERyYWdIYW5kbGVyKGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnZ2luZ1wiKTtcblxuICAgICAgICAgIGlmIChkcmFnRml0cykge1xuICAgICAgICAgICAgY29uc3QgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICAgIHBsYXllck9iai5udW1iZXIsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKHBsYWNlZCkge1xuICAgICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBsZXQgcmVtYWluaW5nU2hpcHMgPSBcIlwiO1xuXG4gICAgICAgICAgICAgIHN3aXRjaCAoZHJhZ1NoaXBMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IG1vd0NvdW50O1xuICAgICAgICAgICAgICAgICAgbW93Q291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBmcmlnQ291bnQ7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7ZnJpZ0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNjaG9vbkNvdW50O1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzbG9vcENvdW50O1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogaW52YWxpZCBzaGlwIGxlbmd0aCBpbiBkcmFnU2hpcFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyAtPSAxO1xuXG4gICAgICAgICAgICAgIGlmIChyZW1haW5pbmdTaGlwcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZGVwbGV0ZWRcIik7XG4gICAgICAgICAgICAgICAgc2hpcC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIHNoaXBEcmFnSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgc2hpcC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBkcmFnU2hpcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBtb3dDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBmcmlnQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2Nob29uQ291bnQgPD0gMCAmJlxuICAgICAgICAgICAgc2xvb3BDb3VudCA8PSAwXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIG5leHRCdG4udGV4dENvbnRlbnQgPSBcIk5leHRcIjtcbiAgICAgICAgICAgIHBhZ2VDb250YWluZXIuYXBwZW5kQ2hpbGQobmV4dEJ0bik7XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcInRoZXJlIHNob3VsZCBiZSBzb21lIHJlc29sdmluZyBvZiBwcm9taXNlcyBoYXBwZW5pbmcgcmlnaHQgbm93XCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gcG9zc2libHkgZm9yIGNwdSwgc3RpbGwgY2FsbCBTUyBidXQgZG8gbm90IHdpcGUgaHRtbCBhbmQganVzdCBzaG93IHRoZSBlZmZlY3Qgb2YgaGl0dGluZyBvbmUgb2YgdGhlIG90aGVyIHBsYXllciBzaGlwcy5cbiAgLy8gZ2FtZVR1cm4gcmVxdWlyZXMgY29vcmRpbmF0ZXMsIHBsYXllckNsYXNzLCBlbmVteUNsYXNzXG4gIGFzeW5jIGZ1bmN0aW9uIHN0cmlrZVNjcmVlbihwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcywgZ2FtZVR1cm5TY3JpcHQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYCA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllck5hbWVcIj48L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwic3RyaWtlQ29udFwiPlxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RyaWtlR3JpZENvbnRcIj5cbiAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic3RyaWtlUmVzdWx0XCI+U3RyaWtlIFJlc3VsdDwvc3Bhbj5cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwUGxhY2VkQ29udFwiPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBQbGFjZWRHcmlkXCI+PC9kaXY+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcHNSZW1haW5Db250XCI+PC9kaXY+XG4gICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuXG4gICAgICBjb25zdCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgY29uc3Qgc3RyaWtlUmVzdWx0Q29udCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc3RyaWtlUmVzdWx0XCIpO1xuICAgICAgY29uc3QgZ3JpZFNpemUgPSAxMDtcbiAgICAgIGNvbnN0IGdyaWRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnN0cmlrZUdyaWRDb250XCIpO1xuICAgICAgY29uc3Qgc2hpcFBsYWNlR3JpZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcFBsYWNlZEdyaWRcIik7XG4gICAgICBsZXQgYWJsZVRvU3RyaWtlID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IHRvb2tUdXJuID0gZmFsc2U7XG4gICAgICBjb25zdCBoaXRTVkcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgaGl0U1ZHLmlubmVySFRNTCA9IGA8c3ZnIGNsYXNzPVwiaGl0SWNvblwiIHhtbG5zID1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAtOTYwIDk2MCA5NjBcIiB3aWR0aD1cIjI0XCI+XG4gICAgICAgICAgPHBhdGggeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGQ9XCJtMjU2LTIwMC01Ni01NiAyMjQtMjI0LTIyNC0yMjQgNTYtNTYgMjI0IDIyNCAyMjQtMjI0IDU2IDU2LTIyNCAyMjQgMjI0IDIyNC01NiA1Ni0yMjQtMjI0LTIyNCAyMjRaXCIvPlxuICAgICAgICA8L3N2Zz5gO1xuICAgICAgY29uc3QgbWlzc1N2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBtaXNzU3ZnLmlubmVySFRNTCA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIC05NjAgOTYwIDk2MFwiIHdpZHRoPVwiMjRcIj48cGF0aCBkPVwiTTQ4MC00ODBabTAgMjgwcS0xMTYgMC0xOTgtODJ0LTgyLTE5OHEwLTExNiA4Mi0xOTh0MTk4LTgycTExNiAwIDE5OCA4MnQ4MiAxOThxMCAxMTYtODIgMTk4dC0xOTggODJabTAtODBxODMgMCAxNDEuNS01OC41VDY4MC00ODBxMC04My01OC41LTE0MS41VDQ4MC02ODBxLTgzIDAtMTQxLjUgNTguNVQyODAtNDgwcTAgODMgNTguNSAxNDEuNVQ0ODAtMjgwWlwiLz48L3N2Zz5gO1xuICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgIGZ1bmN0aW9uIHByZXZTdHJpa2VQb3B1bGF0b3IoXG4gICAgICAgIHBsYXllckNsYXNzLFxuICAgICAgICBoaXRTVkcsXG4gICAgICAgIG1pc3NTdmcsXG4gICAgICAgIGdyaWRDb250LFxuICAgICAgICBoaXRzT25seSA9IGZhbHNlLFxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IGdyaWRDb250YWluZXJOYW1lID0gZ3JpZENvbnQuY2xhc3NMaXN0LnZhbHVlO1xuICAgICAgICBjb25zb2xlLmxvZyhwbGF5ZXJDbGFzcyk7XG4gICAgICAgIGNvbnN0IG1pc3NBcnIgPSBwbGF5ZXJDbGFzcy5zdHJpa2VzLm1pc3NlcztcbiAgICAgICAgY29uc3QgaGl0c0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMuaGl0cztcbiAgICAgICAgLy8gZm9yIHZpZXdpbmcgd2hpY2ggb2YgeW91ciBzaGlwcyBhcmUgaGl0LCBwYXNzdGhyb3VnaCBlbmVteUNsYXNzIGluc3RlYWQgb2YgY3VycmVudCBwbGF5ZXJcbiAgICAgICAgaWYgKGhpdHNPbmx5ID09PSBmYWxzZSkge1xuICAgICAgICAgIG1pc3NBcnIuZm9yRWFjaCgoY29vcmRQYWlyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y29vcmRQYWlyWzBdfVwiXVtkYXRhLWM9XCIke2Nvb3JkUGFpclsxXX1cIl1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1cnJlbnRDZWxsKTtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBtaXNzU3ZnLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBoaXRzQXJyLmZvckVhY2goKGNvb3JkUGFpcikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y29vcmRQYWlyWzBdfVwiXVtkYXRhLWM9XCIke2Nvb3JkUGFpclsxXX1cIl1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coY3VycmVudENlbGwpO1xuICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoXCJoaXRcIik7XG4gICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBoaXRTVkcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGN1cnJlbnRDZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllckNsYXNzLm51bWJlcn0gVHVybmA7XG4gICAgICAvLyBidWlsZCB0aGUgc3RyaWtlIGdyaWQgJiYgcG9wdWxhdGUgcHJldmlvdXMgc3RyaWtlcyBpZiBhcHBsaWNhYmxlXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBidWlsZCB0aGUgc2hpcFBsYWNlZEdyaWRcbiAgICAgIGdyaWRCdWlsZGVyKHNoaXBQbGFjZUdyaWQsIDEwKTtcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IocGxheWVyQ2xhc3MsIGhpdFNWRywgbWlzc1N2ZywgZ3JpZENvbnRhaW5lcik7XG4gICAgICAvLyBwb3B1bGF0ZSB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXRcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IoZW5lbXlDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBzaGlwUGxhY2VHcmlkLCB0cnVlKTtcbiAgICAgIGNvbnNvbGUubG9nKFwidGhpcyBzIGNhbGxlZCBhZnRlciBzdHJpa2UgcG9wdWxhdG9yXCIpO1xuXG4gICAgICAvLyB0cmFuc2xhdGVzIFVJIGNlbGwgdG8gYSBjb29yZGluYXRlXG4gICAgICAvLyBjaGVja3MgaWYgdGhlcmUgd2FzIGFscmVhZHkgYSBoaXQgaW4gdGhlIGdyaWQgc3F1YXJlXG5cbiAgICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAvLyBpZiBzdHJ1Y2sgYWxyZWFkeVxuICAgICAgICAgIGlmICh1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIC8vIHJlcGxhY2UgdGhpcyBmbiB3aXRoIGNoZWNrZXIgZm9yIHJlcGVhdCBzdHJpa2VzXG4gICAgICAgICAgY29uc29sZS5sb2coY29vcmQpO1xuICAgICAgICAgIC8vIHRoaXMgbWlnaHQgYnJlYWsgaWYgcGxheWVyIGNhbnN0cmlrZSBpcyByZWZhY3RvcmVkXG4gICAgICAgICAgY29uc3QgY2FuU3RyaWtlID0gcGxheWVyQ2xhc3MuY2FuU3RyaWtlKFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBlbmVteUNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGNhblN0cmlrZSAmJiAhdG9va1R1cm4pIHtcbiAgICAgICAgICAgIHRvb2tUdXJuID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIHNlbmQgc2lnbmFsIHRvIHN0cmlrZSB0byBnYW1lVHVyblxuICAgICAgICAgICAgLy8gcmVzcG9uc2Ugd2lsbCByZXR1cm4gb2JqIHdpdGggLmhpdFJlcG9ydCAmIC5pc1N1bmtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gZ2FtZVR1cm5TY3JpcHQocGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MsIGNvb3JkKTtcbiAgICAgICAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgc3RyaWtlUmVzdWx0Q29udC50ZXh0Q29udGVudCA9XG4gICAgICAgICAgICAgIHN0cmlrZVJlc3VsdENvbnQudGV4dENvbnRlbnQgKyBcIjogXCIgKyByZXNwb25zZS5oaXRSZXBvcnQ7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJFbmQgVHVyblwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhpdFJlcG9ydCA9PT0gXCJtaXNzXCIpIHtcbiAgICAgICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwibWlzc1wiKTtcbiAgICAgICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBtaXNzU3ZnLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgICAgY2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHBsYXllckNsYXNzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuaGl0UmVwb3J0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yOiBzdHJpa2UgcmVzcG9uc2UgZXhjZXB0aW9uXCIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJoaXRcIik7XG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gaGl0U1ZHLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgICAgY2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHBsYXllckNsYXNzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2hvdyB0aGUgYnV0dG9uIGZvciBuZXh0XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcInRoZXJlIHNob3VsZCBiZSBzb21lIHJlc29sdmluZyBvZiBwcm9taXNlcyBoYXBwZW5pbmcgcmlnaHQgbm93XCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHBsYWNlU2hpcHMocGxheWVyQ2xhc3MpIHtcbiAgICAgICAgY29uc3Qgc2hpcHNBcnJheSA9IHBsYXllckNsYXNzLnBsYXllckJvYXJkLnNoaXBzO1xuICAgICAgICBzaGlwc0FycmF5LmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBjb29yZCA9IHNoaXAuY29vcmRpbmF0ZXM7XG4gICAgICAgICAgY29uc3Qgb3JpZW50YXRpb24gPSBzaGlwLm9yaWVudGF0aW9uO1xuXG4gICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgbnVsbCwgdHJ1ZSwgc2hpcFBsYWNlR3JpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcGxhY2VTaGlwcyhwbGF5ZXJDbGFzcyk7XG4gICAgfSk7XG4gIH1cbiAgYXN5bmMgZnVuY3Rpb24gc3RhcnRTY3JlZW4oKSB7XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5CYXR0bGVzaGlwPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJTZWxlY3RDb250XCI+XG4gICAgICAgICAgICAgICAgIDxmb3JtIGFjdGlvbj1cIlwiIGNsYXNzPVwicGxheWVyRm9ybVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMVwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAxXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAyXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDJcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5CZWdpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyRm9ybVwiKTtcbiAgICBpbml0Q291bnRyeVNlbGVjdCgpO1xuICAgIHBsYXllckZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgcGxheWVycyA9IHBPYmpJbml0aWFsaXplcihcIi5wbGF5ZXJGb3JtXCIsIFwic2VsZWN0cDFcIiwgXCJzZWxlY3RwMlwiKTtcbiAgICAgIC8vIHBsYXllcm9iaiBzZW50IGJhY2sgdG8gZXh0ZW5kIGZ1bmN0aW9uYWxpdHkgd2l0aCBwbGF5ZXIgc2NyaXB0XG4gICAgICBhc3luYyBmdW5jdGlvbiBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwbGF5ZXJzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgYXdhaXQgc2hpcFNjcmVlbihlbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIHNoaXBSYW5kb21pemVyKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcHJvY2Vzc1BsYXllcnMocGxheWVycyk7XG4gICAgICAvLyBpbmRleCBnbG9iYWwgdmFyaWFibGVzIHNob3VsZCBiZSBwb3B1bGF0ZWQgd2l0aCBib3RoIHBsYXllcnNcbiAgICAgIC8vIGNhbGwgdG8gY29udGludWUgZ2FtZSBzaG91bGQgaGF2ZSBpbmRleCBhY2Nlc3NpbmcgZ2xvYmFsIHBsYXllclxuICAgICAgLy8gb2JqcyBhbmQgc2hvdWxkIHdvcmsgZmluZS4gYnV0IGl0IGlzIGtpbmRhIHNsb3BweVxuICAgICAgLy8gdGhpcyBwYXNzZXMgb3ZlciBjb250cm9sIGJhY2sgdG8gdGhlIGluZGV4IHNjcmlwdC5cbiAgICAgIGdhbWVJbml0U2NyaXB0KCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHsgc3RhcnRTY3JlZW4sIHBPYmpJbml0aWFsaXplciwgc3RyaWtlU2NyZWVuIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZXJJbnRlcmZhY2U7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=