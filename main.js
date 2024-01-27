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
    // there could be a problem with returning the whole class because of the attack fn being on the same level
    // as cpu player wrapper. come back to this, maybe do not spread the whole class but pieces of it.
    return {
      ...playerClass.playerObj,
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
  function gameTurn(coordinates = "", playerClass, enemyClass) {
    if (gameOver) {
      return endGame();
    }

    // return value anything other than num = player loses
    if (isNaN(enemyClass.playerBoard.shipsRemaining())) {
      gameOver = true;
      // return endGame(player1); this needs to be refactored
    }
    // how the cpu player is handled will need to be refactored as well.
    if (currentPlayer.isCPU === true) {
      return gameTurn();
    }
    return playerClass.attack(coordinates, enemyClass.playerBoard);
  }

  async function gameLoop() {
    // while game is not over
    console.log("greetings from gameloop");
    console.dir(currentPlayer);
    // call ui strikescreen for current player if its a person
    while (gameOver === false) {
      if (!currentPlayer.isCpu) {
        const enemyClass = currentPlayer === player1 ? player2 : player1;
        // strikeScreen will call take turn and await the results
        // of that strike. then will return to this once its done
        await ui.strikeScreen(currentPlayer, enemyClass, gameTurn);
        console.log("this should not be printing yet");
      } else {
        // there is a chance could use strike screen for CPU for the purposes of
        // showing the strike that cpu will place;
        // would need to give the strikescreen the cpu wrapper so it can trigger
        // the cpu fns from strike screen

        gameTurn();
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
    if (canStrike(coordinates, enemyBoard)) {
      return enemyBoard.receiveAttack(coordinates);
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
    return `${type} was hit. ${hitpoints()} hitpoints remaining`;
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

      function shipDragHandler(e) {
        dragShipLength = Number(e.currentTarget.dataset.index);

        const clone = ship.cloneNode(true);
        dragShip = ship;
        // Set the offset for the drag image
        const offsetX = 20; // Set your desired offset value
        e.dataTransfer.setDragImage(clone, 0, 0);
        ship.classList.add("dragging");
      }
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
               <span>Strike Result</span>
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

        console.log(gridContainerName);
        console.log(gridCont);
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
            const response = gameTurnScript(coord, playerClass, enemyClass);
            const nextBtn = document.createElement("button");
            console.log(response);
            nextBtn.textContent = "End Turn";
            pageContainer.appendChild(nextBtn);

            if (response !== "miss") {
              cell.classList.add("hit");
              const cloneSVG = hitSVG.cloneNode(true);
              cell.appendChild(cloneSVG);
              playerClass.strikes.hits.push(coord);
              console.dir(playerClass);
              // show the visual hit on the cell
            } else {
              cell.classList.add("miss");
              const cloneSVG = missSvg.cloneNode(true);
              cell.appendChild(cloneSVG);
              playerClass.strikes.misses.push(coord);
              console.dir(playerClass);
              // show the visual miss on the cell
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QWtDO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNsTEE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTs7QUFFQTs7Ozs7Ozs7Ozs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWMsTUFBTSxXQUFXLGFBQWE7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7Ozs7OztBQ2xEQSxlQUFlLG1CQUFPLENBQUMsaUNBQVU7O0FBRWpDO0FBQ0E7QUFDQTtBQUNB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YUFBYSxhQUFhLGFBQWE7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxLQUFTLEVBQUUsRUFFZDtBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7Ozs7Ozs7VUM1cEJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2NwdVBsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3VpLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2JhdHRsZXNoaXAvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNwdVBsYXllciA9ICgpID0+IHtcbiAgbGV0IHN0YXRlID0gXCJyYW5kb21cIjtcbiAgbGV0IGhpdCA9IGZhbHNlO1xuICBsZXQgc3RyZWFrID0gZmFsc2U7XG4gIGxldCBoaXRBcnIgPSBbXTtcbiAgbGV0IHB1cnN1aXRBeGlzID0gbnVsbDtcblxuICBmdW5jdGlvbiByYW5kb21Nb3ZlKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5kb21Db29yZCA9IFtdO1xuXG4gICAgcmFuZG9tQ29vcmQucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuZG9tQ29vcmQ7XG4gIH1cblxuICAvLyB3aWxsIG5lZWQgdG8gaW1wbGVtZW50IHRoZSBsZWdhbCBtb3ZlIC0+IGRlcGVuZGVuY3kgaW5qZWN0aW9uIGZyb20gZ2FtZWJvYXJkIHNjcmlwdFxuICBmdW5jdGlvbiBhZGphY2VudE1vdmUoKSB7XG4gICAgLy8gd2lsbCByZXR1cm4gY29vcmRpbmF0ZSBpbiBlaXRoZXIgc2FtZSByb3cgb3IgY29sdW1uIGFzIGxhc3RIaXRcbiAgICBjb25zdCBbbGFzdEhpdF0gPSBoaXRBcnI7XG4gICAgbGV0IGFkamFjZW50U3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuICAgIC8vIHJhbmRvbWx5IGNob29zZSBlaXRoZXIgcm93IG9yIGNvbHVtbiB0byBjaGFuZ2VcbiAgICBjb25zdCBheGlzID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgLy8gMCAtPiAtMSB3aWxsIGJlIGFkZGVkIHx8IDEgLT4gMSB3aWxsIGJlIGFkZGVkXG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgYWRqYWNlbnRTdHJpa2VbYXhpc10gKz0gb2Zmc2V0VmFsdWU7XG5cbiAgICByZXR1cm4gYWRqYWNlbnRTdHJpa2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXh0SW5saW5lKGxhc3RIaXQpIHtcbiAgICAvLyB3aWxsIG5lZWQgdG8gZ3Vlc3MgbmV4dCBvbmUgdW50aWwgeW91IGhhdmUgYSBsZWdhbCBvbmUgdGhhdCBoYXNudCBiZWVuIHVzZWQgeWV0XG4gICAgY29uc3QgYmluYXJ5T2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSBiaW5hcnlPZmZzZXQgPT09IDAgPyAtMSA6IDE7XG4gICAgbGV0IGlubGluZVN0cmlrZSA9IFsuLi5sYXN0SGl0XTtcblxuICAgIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJoXCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVsxXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfSBlbHNlIGlmIChwdXJzdWl0QXhpcyA9PT0gXCJ2XCIpIHtcbiAgICAgIGlubGluZVN0cmlrZVswXSArPSBvZmZzZXRWYWx1ZTtcbiAgICAgIHJldHVybiBpbmxpbmVTdHJpa2U7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5saW5lTW92ZSgpIHtcbiAgICAvLyBmaW5kcyB0aGUgYXhpcyBieSBjb21wYXJpbmcgaGl0cyBhbmQgY2FsbHMgYW4gaW5saW5lIGd1ZXNzXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBudWxsKSB7XG4gICAgICBjb25zdCBbYzEsIGMyXSA9IGhpdEFycjtcbiAgICAgIGlmIChjMVswXSA9PT0gYzJbMF0gJiYgYzFbMV0gIT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJoXCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH0gZWxzZSBpZiAoYzFbMF0gIT09IGMyWzBdICYmIGMxWzFdID09PSBjMlsxXSkge1xuICAgICAgICBwdXJzdWl0QXhpcyA9IFwidlwiO1xuICAgICAgICByZXR1cm4gZ2V0TmV4dElubGluZShjMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdHJlYWsgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFyclswXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TmV4dElubGluZShoaXRBcnJbaGl0QXJyLmxlbmd0aCAtIDFdKTtcbiAgICAgIC8vIGNvbmRpdGlvbiBpZiB0aGUgbGFzdCBzdHJpa2Ugd2FzIGEgbWlzcyB0aGVuIHN0YXJ0IGZyb20gdGhlIGZyb250IG9mIHRoZSBsaXN0XG4gICAgICAvLyB0YWtlIHRoZSBsYXN0IGtub3duIGhpdCBhbmQgYWRkIHRvIGl0XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG5leHRNb3ZlKCkge1xuICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgIGNhc2UgXCJyYW5kb21cIjpcbiAgICAgICAgcmV0dXJuIHJhbmRvbU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRqYWNlbnRcIjpcbiAgICAgICAgcmV0dXJuIGFkamFjZW50TW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpbmxpbmVcIjpcbiAgICAgICAgcmV0dXJuIGlubGluZU1vdmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gXCJFcnJvciBjb25kaXRpb24gZXhjZXB0aW9uOiBuZXh0TW92ZVwiO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXBvcnRIaXQoY29vcmRpbmF0ZSwgaXNTdW5rKSB7XG4gICAgc3RyZWFrID0gdHJ1ZTtcbiAgICBpZiAoaXNTdW5rID09PSB0cnVlKSB7XG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSBcInJhbmRvbVwiO1xuICAgICAgaGl0QXJyID0gW107XG4gICAgICBwdXJzdWl0QXhpcyA9IG51bGw7XG4gICAgfVxuICAgIGhpdEFyci5wdXNoKGNvb3JkaW5hdGUpO1xuICAgIGlmIChoaXRBcnIubGVuZ3RoID09PSAxKSB7XG4gICAgICBzdGF0ZSA9IFwiYWRqYWNlbnRcIjtcbiAgICB9IGVsc2UgaWYgKGhpdEFyci5sZW5ndGggPiAxKSB7XG4gICAgICBzdGF0ZSA9IFwiaW5saW5lXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydE1pc3MoKSB7XG4gICAgc3RyZWFrID0gZmFsc2U7XG4gIH1cbiAgLy8gcmVwb3J0IG1pc3MgZnVuY3Rpb24/XG4gIHJldHVybiB7XG4gICAgcmFuZG9tTW92ZSxcbiAgICBhZGphY2VudE1vdmUsXG4gICAgaW5saW5lTW92ZSxcbiAgICBuZXh0TW92ZSxcbiAgICByZXBvcnRIaXQsXG4gICAgcmVwb3J0TWlzcyxcbiAgICBoaXRBcnIsXG4gIH07XG59O1xubW9kdWxlLmV4cG9ydHMgPSBjcHVQbGF5ZXI7XG4iLCJjb25zdCBnYW1lQm9hcmQgPSAoKSA9PiB7XG4gIGxldCBzaGlwcyA9IFtdO1xuICBmdW5jdGlvbiBncmlkTWFrZXIoKSB7XG4gICAgZ3JpZCA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBncmlkW2ldID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgZ3JpZFtpXVtqXSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncmlkO1xuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZXIgZm9yIHRoZSBncmlkXG4gIGxldCBzaGlwR3JpZCA9IGdyaWRNYWtlcigpO1xuICBsZXQgYXR0YWNrc1JlY2VpdmVkID0gZ3JpZE1ha2VyKCk7XG5cbiAgZnVuY3Rpb24gc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBjb3B5Q29vcmQgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIGxldCByID0gY29weUNvb3JkWzBdO1xuICAgIGxldCBjID0gY29weUNvb3JkWzFdO1xuICAgIGNvbnN0IHJvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAwIDogMTtcbiAgICBjb25zdCBjb2Zmc2V0ID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMSA6IDA7XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzaGlwZml0IGxlbmd0aCB1bmRlZmluZWRcIik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByICs9IHJvZmZzZXQ7XG4gICAgICBjICs9IGNvZmZzZXQ7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBvZmZzZXQpIHtcbiAgICBsZXQgY3VycmVudCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2hpcEdyaWRbY3VycmVudFswXV1bY3VycmVudFsxXV0gPSBzaGlwO1xuICAgICAgY3VycmVudFswXSArPSBvZmZzZXRbMF07XG4gICAgICBjdXJyZW50WzFdICs9IG9mZnNldFsxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTaGlwKHNoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGxlbmd0aCA9IHNoaXAubGVuZ3RoO1xuICAgIHNoaXBzLnB1c2goc2hpcCk7XG5cbiAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzAsIDFdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9yaWVudGF0aW9uID09PSBcInZcIikge1xuICAgICAgaWYgKHNoaXBGaXRzKGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSkge1xuICAgICAgICBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIFsxLCAwXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHNoaXAgZGlkIG5vdCBmaXRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHNoaXAuY29vcmRpbmF0ZXMgPSBbLi4uY29vcmRpbmF0ZXNdO1xuICAgIHNoaXAub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcykge1xuICAgIGNvbnN0IFtyLCBjXSA9IGNvb3JkaW5hdGVzO1xuICAgIGNvbnN0IHN0cmlrZVNxdWFyZSA9IGF0dGFja3NSZWNlaXZlZFtyXVtjXTtcblxuICAgIHJldHVybiBzdHJpa2VTcXVhcmUgPT09IG51bGwgPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgciA9IGNvb3JkaW5hdGVzWzBdO1xuICAgIGNvbnN0IGMgPSBjb29yZGluYXRlc1sxXTtcblxuICAgIGlmIChzaGlwR3JpZFtyXVtjXSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2hpcCA9IHNoaXBHcmlkW3JdW2NdO1xuICAgICAgYXR0YWNrc1JlY2VpdmVkW3JdW2NdID0gMTtcbiAgICAgIGNvbnN0IGhpdFJlcG9ydCA9IHNoaXAuaGl0KCk7XG5cbiAgICAgIGlmIChzaGlwLmlzU3VuaygpID09PSB0cnVlKSB7XG4gICAgICAgIHNoaXBzID0gc2hpcHMuZmlsdGVyKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnQgIT09IHNoaXA7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBmdW5jdGlvbiB0aGF0IHJlcG9ydHMgaWYgdGhlcmUgYXJlIHNoaXBzIHJlbWFpbmluZy5cbiAgICAgICAgcmV0dXJuIGAke3NoaXAudHlwZX0gaGFzIGJlZW4gc3Vua2A7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGl0UmVwb3J0O1xuICAgIH1cbiAgICAvLyByZWNvcmQgdGhlIG1pc3NcbiAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAwO1xuICAgIHJldHVybiBcIm1pc3NcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBzUmVtYWluaW5nKCkge1xuICAgIHJldHVybiBzaGlwcy5sZW5ndGggPiAwID8gc2hpcHMubGVuZ3RoIDogXCJBbGwgc2hpcHMgaGF2ZSBzdW5rXCI7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNoaXBHcmlkLFxuICAgIGF0dGFja3NSZWNlaXZlZCxcbiAgICBzaGlwcyxcbiAgICBzaGlwRml0cyxcbiAgICBhZGRTaGlwLFxuICAgIGNhblN0cmlrZSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHNoaXBzUmVtYWluaW5nLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnYW1lQm9hcmQ7XG4iLCIvLyBpbmRleCBob3VzZXMgdGhlIGRyaXZlciBjb2RlIGluY2x1ZGluZyB0aGUgZ2FtZSBsb29wXG5jb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5jb25zdCBnYW1lQm9hcmQgPSByZXF1aXJlKFwiLi9nYW1lYm9hcmRcIik7XG5jb25zdCBzaGlwID0gcmVxdWlyZShcIi4vc2hpcFwiKTtcbmNvbnN0IGNwdSA9IHJlcXVpcmUoXCIuL2NwdVBsYXllclwiKTtcbmNvbnN0IHVpU2NyaXB0ID0gcmVxdWlyZShcIi4vdWlcIik7XG5cbmNvbnN0IGdhbWVNb2R1bGUgPSAoKSA9PiB7XG4gIC8vIHRlbXBvcmFyeSBpbml0aWFsaXplcnMgdGhhdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgYXNzaWduIGdhbWUgZWxlbWVudHNcbiAgLy8gdGhlIGdhbWUgaW5pdGlhbGl6ZXIgd2lsbCB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgY29ubmVjdGluZyBjcHUgQUkgdG8gb3RoZXIgZnVuY3Rpb25zXG4gIGNvbnN0IGNwdVBsYXllcldyYXBwZXIgPSAocGxheWVyQ2xhc3MsIGNwdUFJLCBlbmVteUJvYXJkKSA9PiB7XG4gICAgLy8gdGhpcyB3cmFwcGVyIHdpbGwgbmVlZCB0byBiZSByZWZhY3RvcmVkIGFmdGVyIGNoYW5nZXMgdG8gcGxheWVyIGNsYXNzXG4gICAgZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgbGV0IG5leHRTdHJpa2UgPSBjcHVBSS5uZXh0TW92ZSgpO1xuICAgICAgd2hpbGUgKHBsYXllckNsYXNzLmNhblN0cmlrZShuZXh0U3RyaWtlLCBlbmVteUJvYXJkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJpa2VSZXN1bHQgPSBwbGF5ZXJDbGFzcy5hdHRhY2sobmV4dFN0cmlrZSwgZW5lbXlCb2FyZCk7XG5cbiAgICAgIGlmIChzdHJpa2VSZXN1bHQgIT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydEhpdChuZXh0U3RyaWtlKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH0gZWxzZSBpZiAoc3RyaWtlUmVzdWx0ID09PSBcIm1pc3NcIikge1xuICAgICAgICBjcHVBSS5yZXBvcnRNaXNzKCk7XG4gICAgICAgIHJldHVybiBzdHJpa2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHRoZXJlIGNvdWxkIGJlIGEgcHJvYmxlbSB3aXRoIHJldHVybmluZyB0aGUgd2hvbGUgY2xhc3MgYmVjYXVzZSBvZiB0aGUgYXR0YWNrIGZuIGJlaW5nIG9uIHRoZSBzYW1lIGxldmVsXG4gICAgLy8gYXMgY3B1IHBsYXllciB3cmFwcGVyLiBjb21lIGJhY2sgdG8gdGhpcywgbWF5YmUgZG8gbm90IHNwcmVhZCB0aGUgd2hvbGUgY2xhc3MgYnV0IHBpZWNlcyBvZiBpdC5cbiAgICByZXR1cm4ge1xuICAgICAgLi4ucGxheWVyQ2xhc3MucGxheWVyT2JqLFxuICAgICAgYXR0YWNrLFxuICAgICAgcGxheWVyQm9hcmQ6IHBsYXllckNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgaXNDUFU6IHBsYXllckNsYXNzLmlzQ1BVLFxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGxheWVySW5pdGlhbGl6ZXIocGxheWVyT2JqKSB7XG4gICAgaWYgKHBsYXllck9iai5udW1iZXIgPT09IDEpIHtcbiAgICAgIHBsYXllcjEgPSBwbGF5ZXIocGxheWVyT2JqLCBnYW1lQm9hcmQoKSk7XG4gICAgICBjb25zb2xlLmRpcihwbGF5ZXIxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGxheWVyMiA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoaXBQbGFjZXJQcm94eShcbiAgICBudW1iZXIsXG4gICAgbGVuZ3RoLFxuICAgIGNvb3JkaW5hdGVzLFxuICAgIG9yaWVudGF0aW9uLFxuICAgIGNoZWNrb25seSA9IGZhbHNlLFxuICApIHtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsIHx8IGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB3aWxsIG1ha2UgYW5kIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgcGxheWVyID0gbnVtYmVyID09PSAxID8gcGxheWVyMSA6IHBsYXllcjI7XG4gICAgLy8gZmlyc3QgY2hlY2sgdGhlIGNvb3JkaW5hdGVzXG4gICAgLy8gdGhlbiBtYWtlIHRoZSBzaGlwXG4gICAgLy8gdGhlbiBwbGFjZSB0aGUgc2hpcFxuICAgIGNvbnN0IGNhbkZpdCA9IHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwRml0cyhcbiAgICAgIGxlbmd0aCxcbiAgICAgIGNvb3JkaW5hdGVzLFxuICAgICAgb3JpZW50YXRpb24sXG4gICAgKTtcbiAgICBpZiAoIWNhbkZpdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrb25seSkge1xuICAgICAgY29uc3QgbmV3U2hpcCA9IHNoaXAobGVuZ3RoKTtcbiAgICAgIHBsYXllci5wbGF5ZXJCb2FyZC5hZGRTaGlwKG5ld1NoaXAsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbik7XG4gICAgICBjb25zb2xlLmxvZyhwbGF5ZXIucGxheWVyQm9hcmQuc2hpcEdyaWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gZ2FtZVR1cm4gaXMgY2FsbGVkIGJ5IGV2ZW50IGhhbmRsZXIgb24gVUkgaW50ZXJhY3Rpb24gLW9yLSBieSByZWN1cnNpb24gd2hlbiBpdHMgY3B1IHR1cm5cbiAgZnVuY3Rpb24gZ2FtZVR1cm4oY29vcmRpbmF0ZXMgPSBcIlwiLCBwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcykge1xuICAgIGlmIChnYW1lT3Zlcikge1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gdmFsdWUgYW55dGhpbmcgb3RoZXIgdGhhbiBudW0gPSBwbGF5ZXIgbG9zZXNcbiAgICBpZiAoaXNOYU4oZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpKSkge1xuICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgLy8gcmV0dXJuIGVuZEdhbWUocGxheWVyMSk7IHRoaXMgbmVlZHMgdG8gYmUgcmVmYWN0b3JlZFxuICAgIH1cbiAgICAvLyBob3cgdGhlIGNwdSBwbGF5ZXIgaXMgaGFuZGxlZCB3aWxsIG5lZWQgdG8gYmUgcmVmYWN0b3JlZCBhcyB3ZWxsLlxuICAgIGlmIChjdXJyZW50UGxheWVyLmlzQ1BVID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZ2FtZVR1cm4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHBsYXllckNsYXNzLmF0dGFjayhjb29yZGluYXRlcywgZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZCk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBnYW1lTG9vcCgpIHtcbiAgICAvLyB3aGlsZSBnYW1lIGlzIG5vdCBvdmVyXG4gICAgY29uc29sZS5sb2coXCJncmVldGluZ3MgZnJvbSBnYW1lbG9vcFwiKTtcbiAgICBjb25zb2xlLmRpcihjdXJyZW50UGxheWVyKTtcbiAgICAvLyBjYWxsIHVpIHN0cmlrZXNjcmVlbiBmb3IgY3VycmVudCBwbGF5ZXIgaWYgaXRzIGEgcGVyc29uXG4gICAgd2hpbGUgKGdhbWVPdmVyID09PSBmYWxzZSkge1xuICAgICAgaWYgKCFjdXJyZW50UGxheWVyLmlzQ3B1KSB7XG4gICAgICAgIGNvbnN0IGVuZW15Q2xhc3MgPSBjdXJyZW50UGxheWVyID09PSBwbGF5ZXIxID8gcGxheWVyMiA6IHBsYXllcjE7XG4gICAgICAgIC8vIHN0cmlrZVNjcmVlbiB3aWxsIGNhbGwgdGFrZSB0dXJuIGFuZCBhd2FpdCB0aGUgcmVzdWx0c1xuICAgICAgICAvLyBvZiB0aGF0IHN0cmlrZS4gdGhlbiB3aWxsIHJldHVybiB0byB0aGlzIG9uY2UgaXRzIGRvbmVcbiAgICAgICAgYXdhaXQgdWkuc3RyaWtlU2NyZWVuKGN1cnJlbnRQbGF5ZXIsIGVuZW15Q2xhc3MsIGdhbWVUdXJuKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0aGlzIHNob3VsZCBub3QgYmUgcHJpbnRpbmcgeWV0XCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdGhlcmUgaXMgYSBjaGFuY2UgY291bGQgdXNlIHN0cmlrZSBzY3JlZW4gZm9yIENQVSBmb3IgdGhlIHB1cnBvc2VzIG9mXG4gICAgICAgIC8vIHNob3dpbmcgdGhlIHN0cmlrZSB0aGF0IGNwdSB3aWxsIHBsYWNlO1xuICAgICAgICAvLyB3b3VsZCBuZWVkIHRvIGdpdmUgdGhlIHN0cmlrZXNjcmVlbiB0aGUgY3B1IHdyYXBwZXIgc28gaXQgY2FuIHRyaWdnZXJcbiAgICAgICAgLy8gdGhlIGNwdSBmbnMgZnJvbSBzdHJpa2Ugc2NyZWVuXG5cbiAgICAgICAgZ2FtZVR1cm4oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEpIHtcbiAgICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjI7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjIpIHtcbiAgICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjE7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGNhbGwgdWkgZm4gdGhhdCB3aWxsIGVuZCB0aGUgZ2FtZVxuICAgIC8vIHVpIHNob3VsZCBhbGxvdyB0aGVtIHRvIHJlc2V0IHRoZSBnYW1lLlxuICAgIC8vIGNhbGwgaW5kZXggZm4gdGhhdCB3aWxsIHRoZSBnYW1lXG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG5cbiAgICBpZiAocGxheWVyMS5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMSB9O1xuICAgICAgcGxheWVyMSA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyMi5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMiB9O1xuICAgICAgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjEucGxheWVyQm9hcmQpO1xuICAgIH1cblxuICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgIGNvbnNvbGUubG9nKGN1cnJlbnRQbGF5ZXIpO1xuICAgIGdhbWVMb29wKCk7XG5cbiAgICAvLyB3aWxsIGluaXRpYWxpemUgdGhlIGdhbWUgbG9vcCBmbiB0aGF0IHdpbGwgY2FsbCB1aSBmb3Igc3RyaWtlIHNjcmVlbnNcbiAgICAvLyBjcHUgdHVybnMgd2lsbCBiZSBoYW5kbGVkIGJ5IGdhbWVsb29wIGF1dG9tYXRpY2FsbHlcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcblxuICAvLyB0aGlzIGluaXRpYWxpemVzIGJ1dCB0aGUgZ2FtZSBsb29wIHBpY2tzIGJhY2sgdXAgd2hlbiB1aSBzY3JpcHQgY2FsbHMgZ2FtZWluaXRpYWxpemVyO1xuICBsZXQgcGxheWVyMSA9IHVuZGVmaW5lZDtcbiAgbGV0IHBsYXllcjIgPSB1bmRlZmluZWQ7XG4gIGxldCBjdXJyZW50UGxheWVyID0gdW5kZWZpbmVkO1xuICBjb25zdCBjcHVBSSA9IGNwdSgpO1xuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgdWkuc3RhcnRTY3JlZW4oKTtcblxuICAvLyAgY29uc3QgcGxheWVyMSA9IHBsYXllcihcIkRrXCIsIGdhbWVCb2FyZCgpKTtcbiAgLy8gIGxldCBwbGF5ZXIyID0gY3B1UGxheWVyV3JhcHBlcihcbiAgLy8gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAvLyAgICBjcHVBSSxcbiAgLy8gICAgcGxheWVyMS5wbGF5ZXJCb2FyZCxcbiAgLy8gICk7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gIH1cblxuICBmdW5jdGlvbiBpc0dhbWVPdmVyKCkge1xuICAgIHJldHVybiBnYW1lT3ZlcjtcbiAgfVxuXG4gIHJldHVybiB7IGdhbWVUdXJuLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKHBsYXllck9iaiwgYm9hcmRGbikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG4gIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcbiAgY29uc3Qgc3RyaWtlcyA9IHtcbiAgICBtaXNzZXM6IFtdLFxuICAgIGhpdHM6IFtdLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IC4uLnBsYXllck9iaiwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSwgc3RyaWtlcyB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG5cbi8vIHRoZSBhdHRhY2sgZm4gYXMgb2Ygbm93IGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIGNwdSBwbGF5ZXIgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHJlZ2VuZXJhdGUgYW5vdGhlciBtb3ZlIHdpdGhvdXQgbGVhdmluZyBpdHMgY3VycmVudCBzY29wZVxuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG4gIGxldCBjb29yZGluYXRlcyA9IFtdO1xuICBsZXQgb3JpZW50YXRpb24gPSBcIlwiO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIHJldHVybiBgJHt0eXBlfSB3YXMgaGl0LiAke2hpdHBvaW50cygpfSBoaXRwb2ludHMgcmVtYWluaW5nYDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eXBlLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBkYW1hZ2UsXG4gICAgaGl0cG9pbnRzLFxuICAgIGhpdCxcbiAgICBpc1N1bmssXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaXA7XG4iLCJjb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5cbmNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICAvLyBwbGF5ZXIgaXMgZWl0aGVyIFwiY3B1XCIgb3IgXCJwZXJzb25cIlxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW1xuICAgICAgICBtYW5vd2FyLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzbG9vcCxcbiAgICAgICAgc2xvb3AsXG4gICAgICBdLFxuICAgIH07XG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IFtdO1xuXG4gICAgcmFuY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuXG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIHJhbmNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc29sZS5kaXIocGxheWVyT2JqKTtcbiAgfVxuICBmdW5jdGlvbiBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCBncmlkU2l6ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JpZFNpemU7IGkrKykge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHJvdy5jbGFzc0xpc3QuYWRkKFwicm93Q29udFwiKTtcbiAgICAgIGdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQocm93KTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJjZWxsXCIpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgIGNlbGwuZGF0YXNldC5jID0gajtcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKGNlbGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBncmlkU2hhZGVyKFxuICAgIGNvb3JkLFxuICAgIGxlbmd0aCxcbiAgICBvcmllbnRhdGlvbixcbiAgICBkcmFnRml0cyxcbiAgICBwbGFjZWQgPSBmYWxzZSxcbiAgICBncmlkQ29udGFpbmVyLFxuICApIHtcbiAgICBjb25zdCBvZmZzZXRyID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3Qgb2Zmc2V0YyA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgIGxldCBhZGRlZENsYXNzID0gXCJcIjtcbiAgICBjb25zdCBncmlkQ29udGFpbmVyTmFtZSA9IGdyaWRDb250YWluZXIuY2xhc3NMaXN0LnZhbHVlO1xuICAgIGNvbnNvbGUubG9nKGdyaWRDb250YWluZXJOYW1lKTtcblxuICAgIC8vIDMgc2hhZGluZyBwb3NzaWJsaXRpZXMgZml0cy9ub2ZpdHMvcGxhY2VkXG4gICAgaWYgKHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgYWRkZWRDbGFzcyA9IFwicGxhY2VkXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZGVkQ2xhc3MgPSBkcmFnRml0cyA9PT0gdHJ1ZSA/IFwiZml0c1wiIDogXCJub3RGaXRzXCI7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudENvb3JkID0gWy4uLmNvb3JkXTtcbiAgICBsZXQgY2VsbENvbGxlY3Rpb24gPSBbXTtcblxuICAgIC8vIHNoYWRlIGVhY2ggY2VsbCByZXByZXNlbnRpbmcgc2hpcCBsZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y3VycmVudENvb3JkWzBdfVwiXVtkYXRhLWM9XCIke2N1cnJlbnRDb29yZFsxXX1cIl1gLFxuICAgICAgKTtcbiAgICAgIGNlbGxDb2xsZWN0aW9uLnB1c2goY3VycmVudENlbGwpO1xuXG4gICAgICBpZiAoY3VycmVudENlbGwgIT09IG51bGwpIHtcbiAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChgJHthZGRlZENsYXNzfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjdXJyZW50Q29vcmRbMF0gKz0gb2Zmc2V0cjtcbiAgICAgIGN1cnJlbnRDb29yZFsxXSArPSBvZmZzZXRjO1xuICAgIH1cbiAgICAvLyBhZnRlciBzaGFkZSwgZHJhZ2xlYXZlIGhhbmRsZXIgdG8gY2xlYXIgc2hhZGluZyB3aGVuIG5vdCBwbGFjZWRcbiAgICBjb25zdCBmaXJzdENlbGwgPSBjZWxsQ29sbGVjdGlvblswXTtcbiAgICBpZiAoZmlyc3RDZWxsID09PSBudWxsIHx8IGZpcnN0Q2VsbCA9PT0gdW5kZWZpbmVkIHx8IHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaXJzdENlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY2VsbENvbGxlY3Rpb24uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShgJHthZGRlZENsYXNzfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNoaXBTY3JlZW4ocGxheWVyT2JqKSB7XG4gICAgLy9pbmRleC5qcyBsb29wIHN1c3BlbmRlZCB1bnRpbCBlYWNoIHBsYXllciBwbGFjZXMgc2hpcHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIC8vIGNsZWFyIHBhZ2UgY29udGFpbmVyIGFuZCBwb3B1bGF0ZSB3aXRoIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IG1hblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgZnJpZ1wiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIzXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzY2hvb25cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2xvb3BcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJyYW5kb21CdG5cIj5cbiAgICAgICAgICAgICAgICAgIFJhbmRvbWl6ZVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICBgO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICAgIGNvbnNvbGUubG9nKFwiZG9tIGZpbmlzaGVkIGxvYWRpbmdcIik7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgYXJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuICAgICAgY29uc29sZS5sb2coYHRoZSBjdXJyZW50IHBsYXllciBpczogJHtwbGF5ZXJPYmoubnVtYmVyfWApO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBjeWNsZSBzaGlwIHBsYWNlbWVudCBvcmllbnRhdGlvbiwgaW5pdGlhbGl6ZWQgdG8gXCJoXCJcbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5vcmllbnRhdGlvbkJ0blwiKTtcbiAgICAgIG9yaWVudGF0aW9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJWZXJ0aWNhbFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiSG9yaXpvbnRhbFwiO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gc2hpcERyYWdIYW5kbGVyKGUpIHtcbiAgICAgICAgZHJhZ1NoaXBMZW5ndGggPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuaW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGNsb25lID0gc2hpcC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgLy8gU2V0IHRoZSBvZmZzZXQgZm9yIHRoZSBkcmFnIGltYWdlXG4gICAgICAgIGNvbnN0IG9mZnNldFggPSAyMDsgLy8gU2V0IHlvdXIgZGVzaXJlZCBvZmZzZXQgdmFsdWVcbiAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgc2hpcC5jbGFzc0xpc3QuYWRkKFwiZHJhZ2dpbmdcIik7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiByYW5kb21CdG5GbigpIHtcbiAgICAgICAgY29uc29sZS5sb2cocGxheWVyT2JqKTtcbiAgICAgICAgc2hpcFJhbmRvbWl6ZXIocGxheWVyT2JqKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByYW5kb21CdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnJhbmRvbUJ0blwiKTtcblxuICAgICAgY29uc29sZS5sb2cocmFuZG9tQnRuKTtcbiAgICAgIHJhbmRvbUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICByYW5kb21CdG5GbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIGxlYXZlU2NyZWVuKCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgICAgLy8gdHJhbnNsYXRlcyBVSSBjZWxsIHRvIGEgY29vcmRpbmF0ZSBvbiBhIGRyYWdvdmVyIGV2ZW50XG4gICAgICAvLyBjaGVja3MgaWYgdGhlIHNoaXAgZHJhZ2dlZCB3aWxsIGZpdFxuICAgICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICBjb25zdCBkcmFnT3ZlckhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICAgIGlmIChkcmFnU2hpcExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcIm1vdXNlb3ZlclwiKTtcblxuICAgICAgICAgIGNvbnN0IHIgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucik7XG4gICAgICAgICAgY29uc3QgYyA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5jKTtcbiAgICAgICAgICBjb29yZCA9IFtyLCBjXTtcbiAgICAgICAgICBkcmFnRml0cyA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgY29vcmQgcG9zdCBzaGlwbWFrZXI6ICR7Y29vcmR9YCk7XG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBmaXRzXG4gICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgY2xhc3NuYW1lIGZvciBub3QgZml0c1xuICAgICAgICAgICAgZ3JpZFNoYWRlcihcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICBncmlkQ29udGFpbmVyLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICBjZWxsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgICAgIGNvb3JkQ2FsY3VsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm1vdXNlb3ZlclwiKTtcbiAgICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBkcmFnT3ZlckhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzaGlwSU1HID0gbmV3IEltYWdlKCk7XG4gICAgICBzaGlwSU1HLnNyYyA9IFwiLi9pbWFnZXMvc2FpbGJvYXQucG5nXCI7XG4gICAgICBzaGlwSU1HLmNsYXNzTGlzdC5hZGQoXCJzaGlwSU1HXCIpO1xuICAgICAgc2hpcElNRy5zdHlsZS53aWR0aCA9IFwiMXJlbVwiO1xuXG4gICAgICBzaGlwcy5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBzaGlwRHJhZ0hhbmRsZXIpO1xuXG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LnJlbW92ZShcImRyYWdnaW5nXCIpO1xuXG4gICAgICAgICAgaWYgKGRyYWdGaXRzKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFjZWQgPSBzaGlwTWFrZXJQcm94eShcbiAgICAgICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAocGxhY2VkKSB7XG4gICAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgICAgZHJhZ0ZpdHMsXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBncmlkQ29udGFpbmVyLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGxldCByZW1haW5pbmdTaGlwcyA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgc3dpdGNoIChkcmFnU2hpcExlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gbW93Q291bnQ7XG4gICAgICAgICAgICAgICAgICBtb3dDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgbWFuQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke21vd0NvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IGZyaWdDb3VudDtcbiAgICAgICAgICAgICAgICAgIGZyaWdDb3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2Nob29uQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudCAtPSAxO1xuICAgICAgICAgICAgICAgICAgc2Nob29uQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3NjaG9vbkNvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICByZW1haW5pbmdTaGlwcyA9IHNsb29wQ291bnQ7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzbG9vcENvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzbG9vcENvdW50fWA7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBpbnZhbGlkIHNoaXAgbGVuZ3RoIGluIGRyYWdTaGlwXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzIC09IDE7XG5cbiAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ1NoaXBzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkZXBsZXRlZFwiKTtcbiAgICAgICAgICAgICAgICBzaGlwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgc2hpcERyYWdIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBzaGlwLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGRyYWdTaGlwTGVuZ3RoID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG1vd0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIGZyaWdDb3VudCA8PSAwICYmXG4gICAgICAgICAgICBzY2hvb25Db3VudCA8PSAwICYmXG4gICAgICAgICAgICBzbG9vcENvdW50IDw9IDBcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgbmV4dEJ0bi50ZXh0Q29udGVudCA9IFwiTmV4dFwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFwidGhlcmUgc2hvdWxkIGJlIHNvbWUgcmVzb2x2aW5nIG9mIHByb21pc2VzIGhhcHBlbmluZyByaWdodCBub3dcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBwb3NzaWJseSBmb3IgY3B1LCBzdGlsbCBjYWxsIFNTIGJ1dCBkbyBub3Qgd2lwZSBodG1sIGFuZCBqdXN0IHNob3cgdGhlIGVmZmVjdCBvZiBoaXR0aW5nIG9uZSBvZiB0aGUgb3RoZXIgcGxheWVyIHNoaXBzLlxuICAvLyBnYW1lVHVybiByZXF1aXJlcyBjb29yZGluYXRlcywgcGxheWVyQ2xhc3MsIGVuZW15Q2xhc3NcbiAgYXN5bmMgZnVuY3Rpb24gc3RyaWtlU2NyZWVuKHBsYXllckNsYXNzLCBlbmVteUNsYXNzLCBnYW1lVHVyblNjcmlwdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyTmFtZVwiPjwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VDb250XCI+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdHJpa2VHcmlkQ29udFwiPlxuICAgICAgICAgICAgICAgPHNwYW4+U3RyaWtlIFJlc3VsdDwvc3Bhbj5cbiAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwUGxhY2VkQ29udFwiPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBQbGFjZWRHcmlkXCI+PC9kaXY+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcHNSZW1haW5Db250XCI+PC9kaXY+XG4gICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuXG4gICAgICBjb25zdCBncmlkU2l6ZSA9IDEwO1xuICAgICAgY29uc3QgZ3JpZENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc3RyaWtlR3JpZENvbnRcIik7XG4gICAgICBjb25zdCBzaGlwUGxhY2VHcmlkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwUGxhY2VkR3JpZFwiKTtcbiAgICAgIGxldCBhYmxlVG9TdHJpa2UgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdG9va1R1cm4gPSBmYWxzZTtcbiAgICAgIGNvbnN0IGhpdFNWRyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBoaXRTVkcuaW5uZXJIVE1MID0gYDxzdmcgY2xhc3M9XCJoaXRJY29uXCIgeG1sbnMgPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIC05NjAgOTYwIDk2MFwiIHdpZHRoPVwiMjRcIj5cbiAgICAgICAgICA8cGF0aCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgZD1cIm0yNTYtMjAwLTU2LTU2IDIyNC0yMjQtMjI0LTIyNCA1Ni01NiAyMjQgMjI0IDIyNC0yMjQgNTYgNTYtMjI0IDIyNCAyMjQgMjI0LTU2IDU2LTIyNC0yMjQtMjI0IDIyNFpcIi8+XG4gICAgICAgIDwvc3ZnPmA7XG4gICAgICBjb25zdCBtaXNzU3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1pc3NTdmcuaW5uZXJIVE1MID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgLTk2MCA5NjAgOTYwXCIgd2lkdGg9XCIyNFwiPjxwYXRoIGQ9XCJNNDgwLTQ4MFptMCAyODBxLTExNiAwLTE5OC04MnQtODItMTk4cTAtMTE2IDgyLTE5OHQxOTgtODJxMTE2IDAgMTk4IDgydDgyIDE5OHEwIDExNi04MiAxOTh0LTE5OCA4MlptMC04MHE4MyAwIDE0MS41LTU4LjVUNjgwLTQ4MHEwLTgzLTU4LjUtMTQxLjVUNDgwLTY4MHEtODMgMC0xNDEuNSA1OC41VDI4MC00ODBxMCA4MyA1OC41IDE0MS41VDQ4MC0yODBaXCIvPjwvc3ZnPmA7XG4gICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgZnVuY3Rpb24gcHJldlN0cmlrZVBvcHVsYXRvcihcbiAgICAgICAgcGxheWVyQ2xhc3MsXG4gICAgICAgIGhpdFNWRyxcbiAgICAgICAgbWlzc1N2ZyxcbiAgICAgICAgZ3JpZENvbnQsXG4gICAgICAgIGhpdHNPbmx5ID0gZmFsc2UsXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgZ3JpZENvbnRhaW5lck5hbWUgPSBncmlkQ29udC5jbGFzc0xpc3QudmFsdWU7XG4gICAgICAgIGNvbnN0IG1pc3NBcnIgPSBwbGF5ZXJDbGFzcy5zdHJpa2VzLm1pc3NlcztcbiAgICAgICAgY29uc3QgaGl0c0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMuaGl0cztcblxuICAgICAgICBjb25zb2xlLmxvZyhncmlkQ29udGFpbmVyTmFtZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWRDb250KTtcbiAgICAgICAgLy8gZm9yIHZpZXdpbmcgd2hpY2ggb2YgeW91ciBzaGlwcyBhcmUgaGl0LCBwYXNzdGhyb3VnaCBlbmVteUNsYXNzIGluc3RlYWQgb2YgY3VycmVudCBwbGF5ZXJcbiAgICAgICAgaWYgKGhpdHNPbmx5ID09PSBmYWxzZSkge1xuICAgICAgICAgIG1pc3NBcnIuZm9yRWFjaCgoY29vcmRQYWlyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y29vcmRQYWlyWzBdfVwiXVtkYXRhLWM9XCIke2Nvb3JkUGFpclsxXX1cIl1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1cnJlbnRDZWxsKTtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBtaXNzU3ZnLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGN1cnJlbnRDZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBoaXRzQXJyLmZvckVhY2goKGNvb3JkUGFpcikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y29vcmRQYWlyWzBdfVwiXVtkYXRhLWM9XCIke2Nvb3JkUGFpclsxXX1cIl1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc29sZS5sb2coY3VycmVudENlbGwpO1xuICAgICAgICAgIGN1cnJlbnRDZWxsLmNsYXNzTGlzdC5hZGQoXCJoaXRcIik7XG4gICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBoaXRTVkcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGN1cnJlbnRDZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBidWlsZCB0aGUgc3RyaWtlIGdyaWQgJiYgcG9wdWxhdGUgcHJldmlvdXMgc3RyaWtlcyBpZiBhcHBsaWNhYmxlXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBidWlsZCB0aGUgc2hpcFBsYWNlZEdyaWRcbiAgICAgIGdyaWRCdWlsZGVyKHNoaXBQbGFjZUdyaWQsIDEwKTtcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IocGxheWVyQ2xhc3MsIGhpdFNWRywgbWlzc1N2ZywgZ3JpZENvbnRhaW5lcik7XG4gICAgICAvLyBwb3B1bGF0ZSB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXRcbiAgICAgIHByZXZTdHJpa2VQb3B1bGF0b3IoZW5lbXlDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBzaGlwUGxhY2VHcmlkLCB0cnVlKTtcbiAgICAgIGNvbnNvbGUubG9nKFwidGhpcyBzIGNhbGxlZCBhZnRlciBzdHJpa2UgcG9wdWxhdG9yXCIpO1xuXG4gICAgICAvLyB0cmFuc2xhdGVzIFVJIGNlbGwgdG8gYSBjb29yZGluYXRlXG4gICAgICAvLyBjaGVja3MgaWYgdGhlcmUgd2FzIGFscmVhZHkgYSBoaXQgaW4gdGhlIGdyaWQgc3F1YXJlXG5cbiAgICAgIGNvbnN0IGNlbGxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jZWxsXCIpO1xuICAgICAgY2VsbHMuZm9yRWFjaCgoY2VsbCkgPT4ge1xuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAvLyBpZiBzdHJ1Y2sgYWxyZWFkeVxuICAgICAgICAgIGlmICh1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIC8vIHJlcGxhY2UgdGhpcyBmbiB3aXRoIGNoZWNrZXIgZm9yIHJlcGVhdCBzdHJpa2VzXG4gICAgICAgICAgY29uc29sZS5sb2coY29vcmQpO1xuICAgICAgICAgIC8vIHRoaXMgbWlnaHQgYnJlYWsgaWYgcGxheWVyIGNhbnN0cmlrZSBpcyByZWZhY3RvcmVkXG4gICAgICAgICAgY29uc3QgY2FuU3RyaWtlID0gcGxheWVyQ2xhc3MuY2FuU3RyaWtlKFxuICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICBlbmVteUNsYXNzLnBsYXllckJvYXJkLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGNhblN0cmlrZSAmJiAhdG9va1R1cm4pIHtcbiAgICAgICAgICAgIHRvb2tUdXJuID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIHNlbmQgc2lnbmFsIHRvIHN0cmlrZSB0byBnYW1lVHVyblxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBnYW1lVHVyblNjcmlwdChjb29yZCwgcGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MpO1xuICAgICAgICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJFbmQgVHVyblwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlICE9PSBcIm1pc3NcIikge1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJoaXRcIik7XG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lU1ZHID0gaGl0U1ZHLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgICAgY2VsbC5hcHBlbmRDaGlsZChjbG9uZVNWRyk7XG4gICAgICAgICAgICAgIHBsYXllckNsYXNzLnN0cmlrZXMuaGl0cy5wdXNoKGNvb3JkKTtcbiAgICAgICAgICAgICAgY29uc29sZS5kaXIocGxheWVyQ2xhc3MpO1xuICAgICAgICAgICAgICAvLyBzaG93IHRoZSB2aXN1YWwgaGl0IG9uIHRoZSBjZWxsXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgICAgcGxheWVyQ2xhc3Muc3RyaWtlcy5taXNzZXMucHVzaChjb29yZCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHBsYXllckNsYXNzKTtcbiAgICAgICAgICAgICAgLy8gc2hvdyB0aGUgdmlzdWFsIG1pc3Mgb24gdGhlIGNlbGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNob3cgdGhlIGJ1dHRvbiBmb3IgbmV4dFxuXG4gICAgICAgICAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgXCJ0aGVyZSBzaG91bGQgYmUgc29tZSByZXNvbHZpbmcgb2YgcHJvbWlzZXMgaGFwcGVuaW5nIHJpZ2h0IG5vd1wiLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBwbGFjZVNoaXBzKHBsYXllckNsYXNzKSB7XG4gICAgICAgIGNvbnN0IHNoaXBzQXJyYXkgPSBwbGF5ZXJDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwcztcbiAgICAgICAgc2hpcHNBcnJheS5mb3JFYWNoKChzaGlwKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgY29vcmQgPSBzaGlwLmNvb3JkaW5hdGVzO1xuICAgICAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gc2hpcC5vcmllbnRhdGlvbjtcblxuICAgICAgICAgIGdyaWRTaGFkZXIoY29vcmQsIGxlbmd0aCwgb3JpZW50YXRpb24sIG51bGwsIHRydWUsIHNoaXBQbGFjZUdyaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHBsYWNlU2hpcHMocGxheWVyQ2xhc3MpO1xuICAgIH0pO1xuICB9XG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2NyZWVuKCkge1xuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+QmF0dGxlc2hpcDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGxheWVyU2VsZWN0Q29udFwiPlxuICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249XCJcIiBjbGFzcz1cInBsYXllckZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFNlbGVjdCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeU5hbWUgcDFcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBUeHQgcDFcIj5QbGF5ZXIgMTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VsZWN0RHJvcGRvd24gcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJzZWxlY3RwMVwiIG5hbWU9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicGVyc29uXCIgc2VsZWN0ZWQ+UGxheWVyPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNwdVwiPkNQVTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeVNlbGVjdENvbnQgcDFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJHZXJtYW55XCI+REU8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEZW5tYXJrXCI+REs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJVS1wiPlVLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiUG9ydHVnYWxcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlNwYWluXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJJdGFseVwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiRnJlbmNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJEdXRjaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMlwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMlwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAyXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bkNvbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+QmVnaW48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgPC9mb3JtPlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgYDtcbiAgICBwYWdlQ29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXllckZvcm1cIik7XG4gICAgaW5pdENvdW50cnlTZWxlY3QoKTtcbiAgICBwbGF5ZXJGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBwT2JqSW5pdGlhbGl6ZXIoXCIucGxheWVyRm9ybVwiLCBcInNlbGVjdHAxXCIsIFwic2VsZWN0cDJcIik7XG4gICAgICAvLyBwbGF5ZXJvYmogc2VudCBiYWNrIHRvIGV4dGVuZCBmdW5jdGlvbmFsaXR5IHdpdGggcGxheWVyIHNjcmlwdFxuICAgICAgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1BsYXllcnMocGxheWVycykge1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcGxheWVycykge1xuICAgICAgICAgIGlmIChlbGVtZW50LnBsYXllciA9PT0gXCJwZXJzb25cIikge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIGF3YWl0IHNoaXBTY3JlZW4oZWxlbWVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllckluaXRTY3JpcHQoZWxlbWVudCk7XG4gICAgICAgICAgICBzaGlwUmFuZG9taXplcihlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IHByb2Nlc3NQbGF5ZXJzKHBsYXllcnMpO1xuICAgICAgLy8gaW5kZXggZ2xvYmFsIHZhcmlhYmxlcyBzaG91bGQgYmUgcG9wdWxhdGVkIHdpdGggYm90aCBwbGF5ZXJzXG4gICAgICAvLyBjYWxsIHRvIGNvbnRpbnVlIGdhbWUgc2hvdWxkIGhhdmUgaW5kZXggYWNjZXNzaW5nIGdsb2JhbCBwbGF5ZXJcbiAgICAgIC8vIG9ianMgYW5kIHNob3VsZCB3b3JrIGZpbmUuIGJ1dCBpdCBpcyBraW5kYSBzbG9wcHlcbiAgICAgIC8vIHRoaXMgcGFzc2VzIG92ZXIgY29udHJvbCBiYWNrIHRvIHRoZSBpbmRleCBzY3JpcHQuXG4gICAgICBnYW1lSW5pdFNjcmlwdCgpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7IHN0YXJ0U2NyZWVuLCBwT2JqSW5pdGlhbGl6ZXIsIHN0cmlrZVNjcmVlbiB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c2VySW50ZXJmYWNlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9