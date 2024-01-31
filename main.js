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
    //response will mutate enemy board and shipcheck returns # of ships remaining
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
    if (currentPlayer.isCPU === true) {
      return gameTurn();
    }
    return;
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
      } else {
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
            const response = gameTurnScript(coord, playerClass, enemyClass);
            const nextBtn = document.createElement("button");
            strikeResultCont.textContent =
              strikeResultCont.textContent + ": " + response;
            nextBtn.textContent = "End Turn";
            pageContainer.appendChild(nextBtn);

            if (response === "hit") {
              cell.classList.add("hit");
              const cloneSVG = hitSVG.cloneNode(true);
              cell.appendChild(cloneSVG);
              playerClass.strikes.hits.push(coord);
              console.dir(playerClass);
            } else if (response === undefined) {
              console.error("Error: strike response exception");
              return;
            } else {
              cell.classList.add("miss");
              const cloneSVG = missSvg.cloneNode(true);
              cell.appendChild(cloneSVG);
              playerClass.strikes.misses.push(coord);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLFdBQVc7QUFDWDs7QUFFQTs7Ozs7OztVQ3BxQkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvY3B1UGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgY3B1UGxheWVyID0gKCkgPT4ge1xuICBsZXQgc3RhdGUgPSBcInJhbmRvbVwiO1xuICBsZXQgaGl0ID0gZmFsc2U7XG4gIGxldCBzdHJlYWsgPSBmYWxzZTtcbiAgbGV0IGhpdEFyciA9IFtdO1xuICBsZXQgcHVyc3VpdEF4aXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbWF4ID0gMTA7XG4gICAgY29uc3QgY0Nvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByQ29vcmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuICAgIGNvbnN0IHJhbmRvbUNvb3JkID0gW107XG5cbiAgICByYW5kb21Db29yZC5wdXNoKGNDb29yZCwgckNvb3JkKTtcblxuICAgIHJldHVybiByYW5kb21Db29yZDtcbiAgfVxuXG4gIC8vIHdpbGwgbmVlZCB0byBpbXBsZW1lbnQgdGhlIGxlZ2FsIG1vdmUgLT4gZGVwZW5kZW5jeSBpbmplY3Rpb24gZnJvbSBnYW1lYm9hcmQgc2NyaXB0XG4gIGZ1bmN0aW9uIGFkamFjZW50TW92ZSgpIHtcbiAgICAvLyB3aWxsIHJldHVybiBjb29yZGluYXRlIGluIGVpdGhlciBzYW1lIHJvdyBvciBjb2x1bW4gYXMgbGFzdEhpdFxuICAgIGNvbnN0IFtsYXN0SGl0XSA9IGhpdEFycjtcbiAgICBsZXQgYWRqYWNlbnRTdHJpa2UgPSBbLi4ubGFzdEhpdF07XG4gICAgLy8gcmFuZG9tbHkgY2hvb3NlIGVpdGhlciByb3cgb3IgY29sdW1uIHRvIGNoYW5nZVxuICAgIGNvbnN0IGF4aXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICAvLyAwIC0+IC0xIHdpbGwgYmUgYWRkZWQgfHwgMSAtPiAxIHdpbGwgYmUgYWRkZWRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBhZGphY2VudFN0cmlrZVtheGlzXSArPSBvZmZzZXRWYWx1ZTtcblxuICAgIHJldHVybiBhZGphY2VudFN0cmlrZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRJbmxpbmUobGFzdEhpdCkge1xuICAgIC8vIHdpbGwgbmVlZCB0byBndWVzcyBuZXh0IG9uZSB1bnRpbCB5b3UgaGF2ZSBhIGxlZ2FsIG9uZSB0aGF0IGhhc250IGJlZW4gdXNlZCB5ZXRcbiAgICBjb25zdCBiaW5hcnlPZmZzZXQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKTtcbiAgICBjb25zdCBvZmZzZXRWYWx1ZSA9IGJpbmFyeU9mZnNldCA9PT0gMCA/IC0xIDogMTtcbiAgICBsZXQgaW5saW5lU3RyaWtlID0gWy4uLmxhc3RIaXRdO1xuXG4gICAgaWYgKHB1cnN1aXRBeGlzID09PSBcImhcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzFdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9IGVsc2UgaWYgKHB1cnN1aXRBeGlzID09PSBcInZcIikge1xuICAgICAgaW5saW5lU3RyaWtlWzBdICs9IG9mZnNldFZhbHVlO1xuICAgICAgcmV0dXJuIGlubGluZVN0cmlrZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmxpbmVNb3ZlKCkge1xuICAgIC8vIGZpbmRzIHRoZSBheGlzIGJ5IGNvbXBhcmluZyBoaXRzIGFuZCBjYWxscyBhbiBpbmxpbmUgZ3Vlc3NcbiAgICBpZiAocHVyc3VpdEF4aXMgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IFtjMSwgYzJdID0gaGl0QXJyO1xuICAgICAgaWYgKGMxWzBdID09PSBjMlswXSAmJiBjMVsxXSAhPT0gYzJbMV0pIHtcbiAgICAgICAgcHVyc3VpdEF4aXMgPSBcImhcIjtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoYzIpO1xuICAgICAgfSBlbHNlIGlmIChjMVswXSAhPT0gYzJbMF0gJiYgYzFbMV0gPT09IGMyWzFdKSB7XG4gICAgICAgIHB1cnN1aXRBeGlzID0gXCJ2XCI7XG4gICAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGMyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0cmVhayA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGdldE5leHRJbmxpbmUoaGl0QXJyWzBdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXROZXh0SW5saW5lKGhpdEFycltoaXRBcnIubGVuZ3RoIC0gMV0pO1xuICAgICAgLy8gY29uZGl0aW9uIGlmIHRoZSBsYXN0IHN0cmlrZSB3YXMgYSBtaXNzIHRoZW4gc3RhcnQgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGxpc3RcbiAgICAgIC8vIHRha2UgdGhlIGxhc3Qga25vd24gaGl0IGFuZCBhZGQgdG8gaXRcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbmV4dE1vdmUoKSB7XG4gICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGphY2VudFwiOlxuICAgICAgICByZXR1cm4gYWRqYWNlbnRNb3ZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImlubGluZVwiOlxuICAgICAgICByZXR1cm4gaW5saW5lTW92ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIkVycm9yIGNvbmRpdGlvbiBleGNlcHRpb246IG5leHRNb3ZlXCI7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlcG9ydEhpdChjb29yZGluYXRlLCBpc1N1bmspIHtcbiAgICBzdHJlYWsgPSB0cnVlO1xuICAgIGlmIChpc1N1bmsgPT09IHRydWUpIHtcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgICAgbW9kZSA9IFwicmFuZG9tXCI7XG4gICAgICBoaXRBcnIgPSBbXTtcbiAgICAgIHB1cnN1aXRBeGlzID0gbnVsbDtcbiAgICB9XG4gICAgaGl0QXJyLnB1c2goY29vcmRpbmF0ZSk7XG4gICAgaWYgKGhpdEFyci5sZW5ndGggPT09IDEpIHtcbiAgICAgIHN0YXRlID0gXCJhZGphY2VudFwiO1xuICAgIH0gZWxzZSBpZiAoaGl0QXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgIHN0YXRlID0gXCJpbmxpbmVcIjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVwb3J0TWlzcygpIHtcbiAgICBzdHJlYWsgPSBmYWxzZTtcbiAgfVxuICAvLyByZXBvcnQgbWlzcyBmdW5jdGlvbj9cbiAgcmV0dXJuIHtcbiAgICByYW5kb21Nb3ZlLFxuICAgIGFkamFjZW50TW92ZSxcbiAgICBpbmxpbmVNb3ZlLFxuICAgIG5leHRNb3ZlLFxuICAgIHJlcG9ydEhpdCxcbiAgICByZXBvcnRNaXNzLFxuICAgIGhpdEFycixcbiAgfTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNwdVBsYXllcjtcbiIsImNvbnN0IGdhbWVCb2FyZCA9ICgpID0+IHtcbiAgbGV0IHNoaXBzID0gW107XG4gIGZ1bmN0aW9uIGdyaWRNYWtlcigpIHtcbiAgICBncmlkID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGdyaWRbaV0gPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBncmlkW2ldW2pdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyaWQ7XG4gIH1cblxuICAvLyBpbml0aWFsaXplciBmb3IgdGhlIGdyaWRcbiAgbGV0IHNoaXBHcmlkID0gZ3JpZE1ha2VyKCk7XG4gIGxldCBhdHRhY2tzUmVjZWl2ZWQgPSBncmlkTWFrZXIoKTtcblxuICBmdW5jdGlvbiBzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IGNvcHlDb29yZCA9IFsuLi5jb29yZGluYXRlc107XG4gICAgbGV0IHIgPSBjb3B5Q29vcmRbMF07XG4gICAgbGV0IGMgPSBjb3B5Q29vcmRbMV07XG4gICAgY29uc3Qgcm9mZnNldCA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDAgOiAxO1xuICAgIGNvbnN0IGNvZmZzZXQgPSBvcmllbnRhdGlvbiA9PT0gXCJoXCIgPyAxIDogMDtcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNoaXBmaXQgbGVuZ3RoIHVuZGVmaW5lZFwiKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2hpcEdyaWRbcl1bY10gIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHIgKz0gcm9mZnNldDtcbiAgICAgIGMgKz0gY29mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBwdXNodG9HcmlkKHNoaXAsIGxlbmd0aCwgY29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgIGxldCBjdXJyZW50ID0gWy4uLmNvb3JkaW5hdGVzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwR3JpZFtjdXJyZW50WzBdXVtjdXJyZW50WzFdXSA9IHNoaXA7XG4gICAgICBjdXJyZW50WzBdICs9IG9mZnNldFswXTtcbiAgICAgIGN1cnJlbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNoaXAoc2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gc2hpcC5sZW5ndGg7XG4gICAgc2hpcHMucHVzaChzaGlwKTtcblxuICAgIGlmIChvcmllbnRhdGlvbiA9PT0gXCJoXCIpIHtcbiAgICAgIGlmIChzaGlwRml0cyhsZW5ndGgsIGNvb3JkaW5hdGVzLCBvcmllbnRhdGlvbikpIHtcbiAgICAgICAgcHVzaHRvR3JpZChzaGlwLCBsZW5ndGgsIGNvb3JkaW5hdGVzLCBbMCwgMV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yOiBzaGlwIGRpZCBub3QgZml0XCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3JpZW50YXRpb24gPT09IFwidlwiKSB7XG4gICAgICBpZiAoc2hpcEZpdHMobGVuZ3RoLCBjb29yZGluYXRlcywgb3JpZW50YXRpb24pKSB7XG4gICAgICAgIHB1c2h0b0dyaWQoc2hpcCwgbGVuZ3RoLCBjb29yZGluYXRlcywgWzEsIDBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogc2hpcCBkaWQgbm90IGZpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2hpcC5jb29yZGluYXRlcyA9IFsuLi5jb29yZGluYXRlc107XG4gICAgc2hpcC5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuU3RyaWtlKGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3QgW3IsIGNdID0gY29vcmRpbmF0ZXM7XG4gICAgY29uc3Qgc3RyaWtlU3F1YXJlID0gYXR0YWNrc1JlY2VpdmVkW3JdW2NdO1xuXG4gICAgcmV0dXJuIHN0cmlrZVNxdWFyZSA9PT0gbnVsbCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCByID0gY29vcmRpbmF0ZXNbMF07XG4gICAgY29uc3QgYyA9IGNvb3JkaW5hdGVzWzFdO1xuXG4gICAgaWYgKHNoaXBHcmlkW3JdW2NdICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzaGlwID0gc2hpcEdyaWRbcl1bY107XG4gICAgICBhdHRhY2tzUmVjZWl2ZWRbcl1bY10gPSAxO1xuICAgICAgY29uc3QgaGl0UmVwb3J0ID0gc2hpcC5oaXQoKTtcblxuICAgICAgaWYgKHNoaXAuaXNTdW5rKCkgPT09IHRydWUpIHtcbiAgICAgICAgc2hpcHMgPSBzaGlwcy5maWx0ZXIoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCAhPT0gc2hpcDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGZ1bmN0aW9uIHRoYXQgcmVwb3J0cyBpZiB0aGVyZSBhcmUgc2hpcHMgcmVtYWluaW5nLlxuICAgICAgICByZXR1cm4gYCR7c2hpcC50eXBlfSBoYXMgYmVlbiBzdW5rYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoaXRSZXBvcnQ7XG4gICAgfVxuICAgIC8vIHJlY29yZCB0aGUgbWlzc1xuICAgIGF0dGFja3NSZWNlaXZlZFtyXVtjXSA9IDA7XG4gICAgcmV0dXJuIFwibWlzc1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hpcHNSZW1haW5pbmcoKSB7XG4gICAgcmV0dXJuIHNoaXBzLmxlbmd0aCA+IDAgPyBzaGlwcy5sZW5ndGggOiBcIkFsbCBzaGlwcyBoYXZlIHN1bmtcIjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2hpcEdyaWQsXG4gICAgYXR0YWNrc1JlY2VpdmVkLFxuICAgIHNoaXBzLFxuICAgIHNoaXBGaXRzLFxuICAgIGFkZFNoaXAsXG4gICAgY2FuU3RyaWtlLFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgc2hpcHNSZW1haW5pbmcsXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdhbWVCb2FyZDtcbiIsIi8vIGluZGV4IGhvdXNlcyB0aGUgZHJpdmVyIGNvZGUgaW5jbHVkaW5nIHRoZSBnYW1lIGxvb3BcbmNvbnN0IHBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcbmNvbnN0IGdhbWVCb2FyZCA9IHJlcXVpcmUoXCIuL2dhbWVib2FyZFwiKTtcbmNvbnN0IHNoaXAgPSByZXF1aXJlKFwiLi9zaGlwXCIpO1xuY29uc3QgY3B1ID0gcmVxdWlyZShcIi4vY3B1UGxheWVyXCIpO1xuY29uc3QgdWlTY3JpcHQgPSByZXF1aXJlKFwiLi91aVwiKTtcblxuY29uc3QgZ2FtZU1vZHVsZSA9ICgpID0+IHtcbiAgLy8gdGVtcG9yYXJ5IGluaXRpYWxpemVycyB0aGF0IHdpbGwgYmUgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBhc3NpZ24gZ2FtZSBlbGVtZW50c1xuICAvLyB0aGUgZ2FtZSBpbml0aWFsaXplciB3aWxsIHVzZSB0aGlzIGZ1bmN0aW9uIGZvciBjb25uZWN0aW5nIGNwdSBBSSB0byBvdGhlciBmdW5jdGlvbnNcbiAgY29uc3QgY3B1UGxheWVyV3JhcHBlciA9IChwbGF5ZXJDbGFzcywgY3B1QUksIGVuZW15Qm9hcmQpID0+IHtcbiAgICAvLyB0aGlzIHdyYXBwZXIgd2lsbCBuZWVkIHRvIGJlIHJlZmFjdG9yZWQgYWZ0ZXIgY2hhbmdlcyB0byBwbGF5ZXIgY2xhc3NcbiAgICBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICBsZXQgbmV4dFN0cmlrZSA9IGNwdUFJLm5leHRNb3ZlKCk7XG4gICAgICB3aGlsZSAocGxheWVyQ2xhc3MuY2FuU3RyaWtlKG5leHRTdHJpa2UsIGVuZW15Qm9hcmQpID09PSBmYWxzZSkge1xuICAgICAgICBuZXh0U3RyaWtlID0gY3B1QUkubmV4dE1vdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0cmlrZVJlc3VsdCA9IHBsYXllckNsYXNzLmF0dGFjayhuZXh0U3RyaWtlLCBlbmVteUJvYXJkKTtcblxuICAgICAgaWYgKHN0cmlrZVJlc3VsdCAhPT0gXCJtaXNzXCIpIHtcbiAgICAgICAgY3B1QUkucmVwb3J0SGl0KG5leHRTdHJpa2UpO1xuICAgICAgICByZXR1cm4gc3RyaWtlUmVzdWx0O1xuICAgICAgfSBlbHNlIGlmIChzdHJpa2VSZXN1bHQgPT09IFwibWlzc1wiKSB7XG4gICAgICAgIGNwdUFJLnJlcG9ydE1pc3MoKTtcbiAgICAgICAgcmV0dXJuIHN0cmlrZVJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gdGhlcmUgY291bGQgYmUgYSBwcm9ibGVtIHdpdGggcmV0dXJuaW5nIHRoZSB3aG9sZSBjbGFzcyBiZWNhdXNlIG9mIHRoZSBhdHRhY2sgZm4gYmVpbmcgb24gdGhlIHNhbWUgbGV2ZWxcbiAgICAvLyBhcyBjcHUgcGxheWVyIHdyYXBwZXIuIGNvbWUgYmFjayB0byB0aGlzLCBtYXliZSBkbyBub3Qgc3ByZWFkIHRoZSB3aG9sZSBjbGFzcyBidXQgcGllY2VzIG9mIGl0LlxuICAgIHJldHVybiB7XG4gICAgICAuLi5wbGF5ZXJDbGFzcy5wbGF5ZXJPYmosXG4gICAgICBhdHRhY2ssXG4gICAgICBwbGF5ZXJCb2FyZDogcGxheWVyQ2xhc3MucGxheWVyQm9hcmQsXG4gICAgICBpc0NQVTogcGxheWVyQ2xhc3MuaXNDUFUsXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwbGF5ZXJJbml0aWFsaXplcihwbGF5ZXJPYmopIHtcbiAgICBpZiAocGxheWVyT2JqLm51bWJlciA9PT0gMSkge1xuICAgICAgcGxheWVyMSA9IHBsYXllcihwbGF5ZXJPYmosIGdhbWVCb2FyZCgpKTtcbiAgICAgIGNvbnNvbGUuZGlyKHBsYXllcjEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGF5ZXIyID0gcGxheWVyKHBsYXllck9iaiwgZ2FtZUJvYXJkKCkpO1xuICAgICAgY29uc29sZS5kaXIocGxheWVyMik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hpcFBsYWNlclByb3h5KFxuICAgIG51bWJlcixcbiAgICBsZW5ndGgsXG4gICAgY29vcmRpbmF0ZXMsXG4gICAgb3JpZW50YXRpb24sXG4gICAgY2hlY2tvbmx5ID0gZmFsc2UsXG4gICkge1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPT09IG51bGwgfHwgbGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHdpbGwgbWFrZSBhbmQgcGxhY2UgdGhlIHNoaXBcbiAgICBjb25zdCBwbGF5ZXIgPSBudW1iZXIgPT09IDEgPyBwbGF5ZXIxIDogcGxheWVyMjtcbiAgICAvLyBmaXJzdCBjaGVjayB0aGUgY29vcmRpbmF0ZXNcbiAgICAvLyB0aGVuIG1ha2UgdGhlIHNoaXBcbiAgICAvLyB0aGVuIHBsYWNlIHRoZSBzaGlwXG4gICAgY29uc3QgY2FuRml0ID0gcGxheWVyLnBsYXllckJvYXJkLnNoaXBGaXRzKFxuICAgICAgbGVuZ3RoLFxuICAgICAgY29vcmRpbmF0ZXMsXG4gICAgICBvcmllbnRhdGlvbixcbiAgICApO1xuICAgIGlmICghY2FuRml0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghY2hlY2tvbmx5KSB7XG4gICAgICBjb25zdCBuZXdTaGlwID0gc2hpcChsZW5ndGgpO1xuICAgICAgcGxheWVyLnBsYXllckJvYXJkLmFkZFNoaXAobmV3U2hpcCwgY29vcmRpbmF0ZXMsIG9yaWVudGF0aW9uKTtcbiAgICAgIGNvbnNvbGUubG9nKHBsYXllci5wbGF5ZXJCb2FyZC5zaGlwR3JpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBnYW1lVHVybiBpcyBjYWxsZWQgYnkgZXZlbnQgaGFuZGxlciBvbiBVSSBpbnRlcmFjdGlvbiAtb3ItIGJ5IHJlY3Vyc2lvbiB3aGVuIGl0cyBjcHUgdHVyblxuICBmdW5jdGlvbiBnYW1lVHVybihjb29yZGluYXRlcyA9IFwiXCIsIHBsYXllckNsYXNzLCBlbmVteUNsYXNzKSB7XG4gICAgLy9yZXNwb25zZSB3aWxsIG11dGF0ZSBlbmVteSBib2FyZCBhbmQgc2hpcGNoZWNrIHJldHVybnMgIyBvZiBzaGlwcyByZW1haW5pbmdcbiAgICBjb25zdCByZXNwb25zZSA9IHBsYXllckNsYXNzLmF0dGFjayhjb29yZGluYXRlcywgZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZCk7XG4gICAgY29uc3Qgc2hpcENoZWNrID0gZW5lbXlDbGFzcy5wbGF5ZXJCb2FyZC5zaGlwc1JlbWFpbmluZygpO1xuICAgIGNvbnNvbGUubG9nKHNoaXBDaGVjayk7XG4gICAgaWYgKGdhbWVPdmVyKSB7XG4gICAgICByZXR1cm4gZW5kR2FtZSgpO1xuICAgIH1cbiAgICAvLyByZXR1cm4gdmFsdWUgYW55dGhpbmcgb3RoZXIgdGhhbiBudW0gPSBwbGF5ZXIgbG9zZXNcbiAgICBpZiAoaXNOYU4oc2hpcENoZWNrKSkge1xuICAgICAgZ2FtZU92ZXIgPSB0cnVlO1xuICAgICAgcmV0dXJuIGVuZEdhbWUoKTtcbiAgICB9XG4gICAgLy8gaG93IHRoZSBjcHUgcGxheWVyIGlzIGhhbmRsZWQgd2lsbCBuZWVkIHRvIGJlIHJlZmFjdG9yZWQgYXMgd2VsbC5cbiAgICBpZiAoY3VycmVudFBsYXllci5pc0NQVSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGdhbWVUdXJuKCk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIC8vIHdoaWxlIGdhbWUgaXMgbm90IG92ZXJcbiAgICBjb25zb2xlLmxvZyhcImdyZWV0aW5ncyBmcm9tIGdhbWVsb29wXCIpO1xuICAgIGNvbnNvbGUuZGlyKGN1cnJlbnRQbGF5ZXIpO1xuICAgIC8vIGNhbGwgdWkgc3RyaWtlc2NyZWVuIGZvciBjdXJyZW50IHBsYXllciBpZiBpdHMgYSBwZXJzb25cbiAgICB3aGlsZSAoZ2FtZU92ZXIgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoIWN1cnJlbnRQbGF5ZXIuaXNDcHUpIHtcbiAgICAgICAgY29uc3QgZW5lbXlDbGFzcyA9IGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEgPyBwbGF5ZXIyIDogcGxheWVyMTtcbiAgICAgICAgLy8gc3RyaWtlU2NyZWVuIHdpbGwgY2FsbCB0YWtlIHR1cm4gYW5kIGF3YWl0IHRoZSByZXN1bHRzXG4gICAgICAgIC8vIG9mIHRoYXQgc3RyaWtlLiB0aGVuIHdpbGwgcmV0dXJuIHRvIHRoaXMgb25jZSBpdHMgZG9uZVxuICAgICAgICBhd2FpdCB1aS5zdHJpa2VTY3JlZW4oY3VycmVudFBsYXllciwgZW5lbXlDbGFzcywgZ2FtZVR1cm4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZVR1cm4oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjEpIHtcbiAgICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjI7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRQbGF5ZXIgPT09IHBsYXllcjIpIHtcbiAgICAgICAgY3VycmVudFBsYXllciA9IHBsYXllcjE7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGNhbGwgdWkgZm4gdGhhdCB3aWxsIGVuZCB0aGUgZ2FtZVxuICAgIC8vIHVpIHNob3VsZCBhbGxvdyB0aGVtIHRvIHJlc2V0IHRoZSBnYW1lLlxuICAgIC8vIGNhbGwgaW5kZXggZm4gdGhhdCB3aWxsIHRoZSBnYW1lXG4gIH1cblxuICBmdW5jdGlvbiBnYW1lSW5pdGlhbGl6ZXIoKSB7XG4gICAgLy8gYWZ0ZXIgYWRkaW5nIHRoZSBzaGlwcyAsIGl0IHdpbGwgbmVlZCB0byBjaGVjayB3aG8gaXMgY3B1IGFuZCBpbml0aWFsaXplIHRoZSBjcHV3cmFwcGVyXG5cbiAgICBpZiAocGxheWVyMS5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMSB9O1xuICAgICAgcGxheWVyMSA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjIucGxheWVyQm9hcmQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyMi5pc0NQVSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4ucGxheWVyMiB9O1xuICAgICAgcGxheWVyMiA9IGNwdVBsYXllcldyYXBwZXIoY29weSwgY3B1QUksIHBsYXllcjEucGxheWVyQm9hcmQpO1xuICAgIH1cblxuICAgIGN1cnJlbnRQbGF5ZXIgPSBwbGF5ZXIxO1xuICAgIGNvbnNvbGUubG9nKGN1cnJlbnRQbGF5ZXIpO1xuICAgIGdhbWVMb29wKCk7XG5cbiAgICAvLyB3aWxsIGluaXRpYWxpemUgdGhlIGdhbWUgbG9vcCBmbiB0aGF0IHdpbGwgY2FsbCB1aSBmb3Igc3RyaWtlIHNjcmVlbnNcbiAgICAvLyBjcHUgdHVybnMgd2lsbCBiZSBoYW5kbGVkIGJ5IGdhbWVsb29wIGF1dG9tYXRpY2FsbHlcbiAgfVxuXG4gIGNvbnN0IHVpID0gdWlTY3JpcHQoc2hpcFBsYWNlclByb3h5LCBwbGF5ZXJJbml0aWFsaXplciwgZ2FtZUluaXRpYWxpemVyKTtcblxuICAvLyB0aGlzIGluaXRpYWxpemVzIGJ1dCB0aGUgZ2FtZSBsb29wIHBpY2tzIGJhY2sgdXAgd2hlbiB1aSBzY3JpcHQgY2FsbHMgZ2FtZWluaXRpYWxpemVyO1xuICBsZXQgcGxheWVyMSA9IHVuZGVmaW5lZDtcbiAgbGV0IHBsYXllcjIgPSB1bmRlZmluZWQ7XG4gIGxldCBjdXJyZW50UGxheWVyID0gdW5kZWZpbmVkO1xuICBjb25zdCBjcHVBSSA9IGNwdSgpO1xuICBsZXQgZ2FtZU92ZXIgPSBmYWxzZTtcbiAgdWkuc3RhcnRTY3JlZW4oKTtcblxuICAvLyAgY29uc3QgcGxheWVyMSA9IHBsYXllcihcIkRrXCIsIGdhbWVCb2FyZCgpKTtcbiAgLy8gIGxldCBwbGF5ZXIyID0gY3B1UGxheWVyV3JhcHBlcihcbiAgLy8gICAgcGxheWVyKFwiVUtcIiwgZ2FtZUJvYXJkKCksIHRydWUpLFxuICAvLyAgICBjcHVBSSxcbiAgLy8gICAgcGxheWVyMS5wbGF5ZXJCb2FyZCxcbiAgLy8gICk7XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSh3aW5uZXIpIHtcbiAgICAvLyBzb21lIHNoaXQgaGVyZSB0byBlbmQgdGhlIGdhbWVcbiAgICBjb25zb2xlLmxvZyhcInRoaXMgbWYgb3ZlciBsb2xcIik7XG4gIH1cblxuICBmdW5jdGlvbiBpc0dhbWVPdmVyKCkge1xuICAgIHJldHVybiBnYW1lT3ZlcjtcbiAgfVxuXG4gIHJldHVybiB7IGdhbWVUdXJuLCBpc0dhbWVPdmVyIH07XG59O1xuZ2FtZU1vZHVsZSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lTW9kdWxlO1xuIiwiLy8gdGhpcyB3aWxsIGRlbW9uc3RyYXRlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHdpdGggdGhlIG5lZWRlZCBtZXRob2RzIGZvciB0aGUgcGxheWVyIGJvYXJkIGFuZCBlbmVteSBib2FyZCByZWZcblxuY29uc3QgcGxheWVyID0gKHBsYXllck9iaiwgYm9hcmRGbikgPT4ge1xuICBjb25zdCBwbGF5ZXJCb2FyZCA9IGJvYXJkRm47XG4gIGNvbnN0IGlzQ1BVID0gcGxheWVyT2JqLnBsYXllciA9PT0gXCJwZXJzb25cIiA/IGZhbHNlIDogdHJ1ZTtcbiAgY29uc3Qgc3RyaWtlcyA9IHtcbiAgICBtaXNzZXM6IFtdLFxuICAgIGhpdHM6IFtdLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLmNhblN0cmlrZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2soY29vcmRpbmF0ZXMsIGVuZW15Qm9hcmQpIHtcbiAgICAvLyB3aWxsIG5lZWQgY29kZSBoZXJlIGZvciBkZXRlcm1pbmluZyBsZWdhbCBtb3ZlXG4gICAgaWYgKGNhblN0cmlrZShjb29yZGluYXRlcywgZW5lbXlCb2FyZCkpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soY29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gXCJ0cnkgYW5vdGhlciBhdHRhY2tcIjtcbiAgfVxuXG4gIHJldHVybiB7IC4uLnBsYXllck9iaiwgcGxheWVyQm9hcmQsIGNhblN0cmlrZSwgYXR0YWNrLCBpc0NQVSwgc3RyaWtlcyB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXI7XG5cbi8vIHRoZSBhdHRhY2sgZm4gYXMgb2Ygbm93IGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIGNwdSBwbGF5ZXIgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHJlZ2VuZXJhdGUgYW5vdGhlciBtb3ZlIHdpdGhvdXQgbGVhdmluZyBpdHMgY3VycmVudCBzY29wZVxuIiwiLy8gc2hpcHMgc2hvdWxkIGhhdmUgdGhlIGNob2ljZSBvZjpcbi8vIDUgbWFuLW8td2FyXG4vLyA0IGZyaWdhdGVcbi8vIDMgeCAzIHNjaG9vbmVyXG4vLyAyIHggMiBwYXRyb2wgc2xvb3BcbmNvbnN0IHNoaXAgPSAobGVuZ3RoKSA9PiB7XG4gIGxldCB0eXBlID0gXCJcIjtcbiAgbGV0IGRhbWFnZSA9IDA7XG4gIGxldCBjb29yZGluYXRlcyA9IFtdO1xuICBsZXQgb3JpZW50YXRpb24gPSBcIlwiO1xuXG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAyOlxuICAgICAgdHlwZSA9IFwiUGF0cm9sIFNsb29wXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICB0eXBlID0gXCJTY2hvb25lclwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgdHlwZSA9IFwiRnJpZ2F0ZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgdHlwZSA9IFwiTWFuLW8tV2FyXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hpcCB0eXBlIGV4Y2VwdGlvbjogbGVuZ3RoIG11c3QgYmUgMS01XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGl0KCkge1xuICAgIGRhbWFnZSsrO1xuICAgIC8vcmV0dXJuIGAke3R5cGV9IHdhcyBoaXQuICR7aGl0cG9pbnRzKCl9IGhpdHBvaW50cyByZW1haW5pbmdgO1xuICAgIHJldHVybiBgaGl0YDtcbiAgfVxuICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgcmV0dXJuIGRhbWFnZSA+PSBsZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gaGl0cG9pbnRzKCkge1xuICAgIHJldHVybiBsZW5ndGggLSBkYW1hZ2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eXBlLFxuICAgIGxlbmd0aCxcbiAgICBjb29yZGluYXRlcyxcbiAgICBvcmllbnRhdGlvbixcbiAgICBkYW1hZ2UsXG4gICAgaGl0cG9pbnRzLFxuICAgIGhpdCxcbiAgICBpc1N1bmssXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaXA7XG4iLCJjb25zdCBwbGF5ZXIgPSByZXF1aXJlKFwiLi9wbGF5ZXJcIik7XG5cbmNvbnN0IHVzZXJJbnRlcmZhY2UgPSAoc2hpcE1ha2VyUHJveHksIHBsYXllckluaXRTY3JpcHQsIGdhbWVJbml0U2NyaXB0KSA9PiB7XG4gIGNvbnN0IHBhZ2VDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBhZ2VDb250YWluZXJcIik7XG4gIGxldCBwMUNvdW50cnkgPSBcIlwiO1xuICBsZXQgcDJDb3VudHJ5ID0gXCJcIjtcblxuICBmdW5jdGlvbiBpbml0Q291bnRyeVNlbGVjdCgpIHtcbiAgICBjb25zdCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY291bnRyeUJveFwiKTtcbiAgICBub2RlTGlzdC5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMVwiKSB7XG4gICAgICAgICAgcDFDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LmNsYXNzTGlzdFsxXSA9PT0gXCJwMlwiKSB7XG4gICAgICAgICAgcDJDb3VudHJ5ID0gZWxlbWVudC5pZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBidWlsZHMgYSBwbGF5ZXJvYmogdGhhdCBjb250YWlucyBpbmZvcm1hdGlvbiB0byBpbml0aWFsaXplIHRoZSBnYW1lXG4gIGZ1bmN0aW9uIHBPYmpJbml0aWFsaXplcihmb3JtQ2xzc05tZSwgcDFzZWxlY3RpZCwgcDJzZWxlY3RpZCkge1xuICAgIGNvbnN0IHBsYXllckZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvcm1DbHNzTm1lKTtcbiAgICBjb25zdCBkcm9wZG93bmZpZWxkMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHAxc2VsZWN0aWQpO1xuICAgIGNvbnN0IGRyb3Bkb3duZmllbGQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocDJzZWxlY3RpZCk7XG4gICAgbGV0IHBsYXllcnMgPSBbXTtcblxuICAgIGNvbnN0IG1hbm93YXIgPSA1O1xuICAgIGNvbnN0IGZyaWdhdGUgPSA0O1xuICAgIGNvbnN0IHNjaG9vbmVyID0gMztcbiAgICBjb25zdCBzbG9vcCA9IDI7XG5cbiAgICAvLyBwbGF5ZXIgaXMgZWl0aGVyIFwiY3B1XCIgb3IgXCJwZXJzb25cIlxuICAgIGNvbnN0IHBsYXllcm9iaiA9IHtcbiAgICAgIHBsYXllcjogdW5kZWZpbmVkLFxuICAgICAgbnVtYmVyOiB1bmRlZmluZWQsXG4gICAgICBjb3VudHJ5OiB1bmRlZmluZWQsXG4gICAgICBzaGlwczogW1xuICAgICAgICBtYW5vd2FyLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBmcmlnYXRlLFxuICAgICAgICBzY2hvb25lcixcbiAgICAgICAgc2Nob29uZXIsXG4gICAgICAgIHNjaG9vbmVyLFxuICAgICAgICBzbG9vcCxcbiAgICAgICAgc2xvb3AsXG4gICAgICBdLFxuICAgIH07XG4gICAgY29uc3QgcGxheWVyMSA9IHsgLi4ucGxheWVyb2JqIH07XG4gICAgY29uc3QgcGxheWVyMiA9IHsgLi4ucGxheWVyb2JqIH07XG5cbiAgICBwbGF5ZXIxLnBsYXllciA9IGRyb3Bkb3duZmllbGQxLnZhbHVlO1xuICAgIHBsYXllcjEubnVtYmVyID0gMTtcbiAgICBwbGF5ZXIxLmNvdW50cnkgPSBwMUNvdW50cnk7XG5cbiAgICBwbGF5ZXIyLnBsYXllciA9IGRyb3Bkb3duZmllbGQyLnZhbHVlO1xuICAgIHBsYXllcjIubnVtYmVyID0gMjtcbiAgICBwbGF5ZXIyLmNvdW50cnkgPSBwMkNvdW50cnk7XG5cbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyMSwgcGxheWVyMik7XG5cbiAgICByZXR1cm4gcGxheWVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUNvb3JkKCkge1xuICAgIGNvbnN0IG1heCA9IDEwO1xuICAgIGNvbnN0IGNDb29yZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG4gICAgY29uc3QgckNvb3JkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbiAgICBjb25zdCByYW5jb29yZGluYXRlcyA9IFtdO1xuXG4gICAgcmFuY29vcmRpbmF0ZXMucHVzaChjQ29vcmQsIHJDb29yZCk7XG5cbiAgICByZXR1cm4gcmFuY29vcmRpbmF0ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopIHtcbiAgICBsZXQgc2hpcEFyciA9IFsuLi5wbGF5ZXJPYmouc2hpcHNdO1xuXG4gICAgc2hpcEFyci5mb3JFYWNoKChzaGlwTGVuZ3RoKSA9PiB7XG4gICAgICBsZXQgcGxhY2VkID0gZmFsc2U7XG4gICAgICB3aGlsZSAoIXBsYWNlZCkge1xuICAgICAgICAvLyByYW5kb20gZGlyZWN0aW9uIG9mIHNoaXAgcGxhY2VtZW50XG4gICAgICAgIGNvbnN0IHJhbmNvb3JkaW5hdGVzID0gcmFuZG9tQ29vcmQoKTtcbiAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMik7XG4gICAgICAgIGNvbnN0IGF4aXMgPSByYW5kb20gPT09IDAgPyBcImhcIiA6IFwidlwiO1xuXG4gICAgICAgIC8vIHJldHVybnMgZmFsc2UgaWYgd2FzIG5vdCBhYmxlIHRvIHBsYWNlIHNoaXAgYXQgcmFuZG9tIHNwb3QsIHRyeXMgYWdhaW5cbiAgICAgICAgcGxhY2VkID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgcGxheWVyT2JqLm51bWJlcixcbiAgICAgICAgICBzaGlwTGVuZ3RoLFxuICAgICAgICAgIHJhbmNvb3JkaW5hdGVzLFxuICAgICAgICAgIGF4aXMsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc29sZS5kaXIocGxheWVyT2JqKTtcbiAgfVxuICBmdW5jdGlvbiBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCBncmlkU2l6ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JpZFNpemU7IGkrKykge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHJvdy5jbGFzc0xpc3QuYWRkKFwicm93Q29udFwiKTtcbiAgICAgIGdyaWRDb250YWluZXIuYXBwZW5kQ2hpbGQocm93KTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBncmlkU2l6ZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJjZWxsXCIpO1xuICAgICAgICBjZWxsLmRhdGFzZXQuciA9IGk7XG4gICAgICAgIGNlbGwuZGF0YXNldC5jID0gajtcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKGNlbGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBncmlkU2hhZGVyKFxuICAgIGNvb3JkLFxuICAgIGxlbmd0aCxcbiAgICBvcmllbnRhdGlvbixcbiAgICBkcmFnRml0cyxcbiAgICBwbGFjZWQgPSBmYWxzZSxcbiAgICBncmlkQ29udGFpbmVyLFxuICApIHtcbiAgICBjb25zdCBvZmZzZXRyID0gb3JpZW50YXRpb24gPT09IFwiaFwiID8gMCA6IDE7XG4gICAgY29uc3Qgb2Zmc2V0YyA9IG9yaWVudGF0aW9uID09PSBcImhcIiA/IDEgOiAwO1xuICAgIGxldCBhZGRlZENsYXNzID0gXCJcIjtcbiAgICBjb25zdCBncmlkQ29udGFpbmVyTmFtZSA9IGdyaWRDb250YWluZXIuY2xhc3NMaXN0LnZhbHVlO1xuICAgIGNvbnNvbGUubG9nKGdyaWRDb250YWluZXJOYW1lKTtcblxuICAgIC8vIDMgc2hhZGluZyBwb3NzaWJsaXRpZXMgZml0cy9ub2ZpdHMvcGxhY2VkXG4gICAgaWYgKHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgYWRkZWRDbGFzcyA9IFwicGxhY2VkXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZGVkQ2xhc3MgPSBkcmFnRml0cyA9PT0gdHJ1ZSA/IFwiZml0c1wiIDogXCJub3RGaXRzXCI7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudENvb3JkID0gWy4uLmNvb3JkXTtcbiAgICBsZXQgY2VsbENvbGxlY3Rpb24gPSBbXTtcblxuICAgIC8vIHNoYWRlIGVhY2ggY2VsbCByZXByZXNlbnRpbmcgc2hpcCBsZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50Q2VsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuJHtncmlkQ29udGFpbmVyTmFtZX0gW2RhdGEtcj1cIiR7Y3VycmVudENvb3JkWzBdfVwiXVtkYXRhLWM9XCIke2N1cnJlbnRDb29yZFsxXX1cIl1gLFxuICAgICAgKTtcbiAgICAgIGNlbGxDb2xsZWN0aW9uLnB1c2goY3VycmVudENlbGwpO1xuXG4gICAgICBpZiAoY3VycmVudENlbGwgIT09IG51bGwpIHtcbiAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChgJHthZGRlZENsYXNzfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjdXJyZW50Q29vcmRbMF0gKz0gb2Zmc2V0cjtcbiAgICAgIGN1cnJlbnRDb29yZFsxXSArPSBvZmZzZXRjO1xuICAgIH1cbiAgICAvLyBhZnRlciBzaGFkZSwgZHJhZ2xlYXZlIGhhbmRsZXIgdG8gY2xlYXIgc2hhZGluZyB3aGVuIG5vdCBwbGFjZWRcbiAgICBjb25zdCBmaXJzdENlbGwgPSBjZWxsQ29sbGVjdGlvblswXTtcbiAgICBpZiAoZmlyc3RDZWxsID09PSBudWxsIHx8IGZpcnN0Q2VsbCA9PT0gdW5kZWZpbmVkIHx8IHBsYWNlZCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaXJzdENlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY2VsbENvbGxlY3Rpb24uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShgJHthZGRlZENsYXNzfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNoaXBTY3JlZW4ocGxheWVyT2JqKSB7XG4gICAgLy9pbmRleC5qcyBsb29wIHN1c3BlbmRlZCB1bnRpbCBlYWNoIHBsYXllciBwbGFjZXMgc2hpcHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIC8vIGNsZWFyIHBhZ2UgY29udGFpbmVyIGFuZCBwb3B1bGF0ZSB3aXRoIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJzaGlwU2NyZWVuQ29udFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJDb250XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5Q29udFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZENvbnRcIj5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBEaXNwbGF5Q29udFwiPlxuICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIGJlIGFsbCBib2F0cyBsaXN0ZWQgYW5kIGludGVyYWN0YWJsZVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgZGF0YS1pbmRleD1cIjVcIiBkcmFnZ2FibGU9XCJ0cnVlXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hpcENvdW50IG1hblwiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBCb3hcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBcIiBkYXRhLWluZGV4PVwiNFwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgZnJpZ1wiIGRyYWdnYWJsZT1cImZhbHNlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwQm94XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwXCIgIGRhdGEtaW5kZXg9XCIzXCIgZHJhZ2dhYmxlPVwidHJ1ZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInNoaXBDb3VudCBzY2hvb25cIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcEJveFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFwiICBkYXRhLWluZGV4PVwiMlwiIGRyYWdnYWJsZT1cInRydWVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaGlwQ291bnQgc2xvb3BcIiBkcmFnZ2FibGU9XCJmYWxzZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yaWVudGF0aW9uQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwib3JpZW50YXRpb25CdG5cIiBkYXRhLW9yaWVudGF0aW9uPVwiaFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZvb3RlckNvbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInR4dFwiPlxuICAgICAgICAgICAgICAgICAgUGxhY2UgeW91ciBzaGlwcyFcbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJyYW5kb21CdG5cIj5cbiAgICAgICAgICAgICAgICAgIFJhbmRvbWl6ZVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICBgO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcbiAgICAgIGNvbnNvbGUubG9nKFwiZG9tIGZpbmlzaGVkIGxvYWRpbmdcIik7XG5cbiAgICAgIC8vIG5lY2Vzc2FyeSBnbG9iYWxzIGZvciBtZXRob2RzIGluIHNoaXAgc2VsZWN0XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5ncmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBsZXQgYXJhZ1NoaXBMZW5ndGggPSAwO1xuICAgICAgbGV0IGRyYWdTaGlwID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGRyYWdGaXRzID0gZmFsc2U7XG4gICAgICBsZXQgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgIGxldCBjb29yZCA9IFtdO1xuICAgICAgbGV0IG1vd0NvdW50ID0gMTtcbiAgICAgIGxldCBmcmlnQ291bnQgPSAyO1xuICAgICAgbGV0IHNjaG9vbkNvdW50ID0gMztcbiAgICAgIGxldCBzbG9vcENvdW50ID0gMjtcbiAgICAgIGxldCBkZXBsZXRlZFNoaXAgPSBudWxsO1xuICAgICAgY29uc29sZS5sb2coYHRoZSBjdXJyZW50IHBsYXllciBpczogJHtwbGF5ZXJPYmoubnVtYmVyfWApO1xuXG4gICAgICBsZXQgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnNoaXBcIik7XG4gICAgICBsZXQgc2hpcENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcEJveFwiKTtcbiAgICAgIGxldCBwbGF5ZXJOYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5ZXJOYW1lXCIpO1xuICAgICAgbGV0IG1hbkNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zaGlwQ291bnQubWFuXCIpO1xuICAgICAgbGV0IGZyaWdDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LmZyaWdcIik7XG4gICAgICBsZXQgc2Nob29uQ291bnRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBDb3VudC5zY2hvb25cIik7XG4gICAgICBsZXQgc2xvb3BDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc2hpcENvdW50LnNsb29wXCIpO1xuXG4gICAgICBwbGF5ZXJOYW1lLnRleHRDb250ZW50ID0gYFBsYXllciAke3BsYXllck9iai5udW1iZXJ9YDtcbiAgICAgIG1hbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHttb3dDb3VudH1gO1xuICAgICAgZnJpZ0NvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtmcmlnQ291bnR9YDtcbiAgICAgIHNjaG9vbkNvdW50Qm94LnRleHRDb250ZW50ID0gYHggJHtzY2hvb25Db3VudH1gO1xuICAgICAgc2xvb3BDb3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2xvb3BDb3VudH1gO1xuICAgICAgLy8gYnVpbGQgdGhlIHZpc3VhbCBncmlkXG4gICAgICBncmlkQnVpbGRlcihncmlkQ29udGFpbmVyLCAxMCk7XG4gICAgICAvLyBjeWNsZSBzaGlwIHBsYWNlbWVudCBvcmllbnRhdGlvbiwgaW5pdGlhbGl6ZWQgdG8gXCJoXCJcbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5vcmllbnRhdGlvbkJ0blwiKTtcbiAgICAgIG9yaWVudGF0aW9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBpZiAob3JpZW50YXRpb24gPT09IFwiaFwiKSB7XG4gICAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPSBcInZcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbiA9IFwidlwiO1xuICAgICAgICAgIG9yaWVudGF0aW9uQnRuLnRleHRDb250ZW50ID0gXCJWZXJ0aWNhbFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGUuY3VycmVudFRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID0gXCJoXCI7XG4gICAgICAgICAgb3JpZW50YXRpb24gPSBcImhcIjtcbiAgICAgICAgICBvcmllbnRhdGlvbkJ0bi50ZXh0Q29udGVudCA9IFwiSG9yaXpvbnRhbFwiO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZ1bmN0aW9uIHJhbmRvbUJ0bkZuKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhwbGF5ZXJPYmopO1xuICAgICAgICBzaGlwUmFuZG9taXplcihwbGF5ZXJPYmopO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJhbmRvbUJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucmFuZG9tQnRuXCIpO1xuXG4gICAgICBjb25zb2xlLmxvZyhyYW5kb21CdG4pO1xuICAgICAgcmFuZG9tQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHJhbmRvbUJ0bkZuKCk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gbGVhdmVTY3JlZW4oKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICAvLyB0cmFuc2xhdGVzIFVJIGNlbGwgdG8gYSBjb29yZGluYXRlIG9uIGEgZHJhZ292ZXIgZXZlbnRcbiAgICAgIC8vIGNoZWNrcyBpZiB0aGUgc2hpcCBkcmFnZ2VkIHdpbGwgZml0XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNvbnN0IGRyYWdPdmVySGFuZGxlciA9IChlKSA9PiB7XG4gICAgICAgICAgaWYgKGRyYWdTaGlwTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwibW91c2VvdmVyXCIpO1xuXG4gICAgICAgICAgY29uc3QgciA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5yKTtcbiAgICAgICAgICBjb25zdCBjID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LmMpO1xuICAgICAgICAgIGNvb3JkID0gW3IsIGNdO1xuICAgICAgICAgIGRyYWdGaXRzID0gc2hpcE1ha2VyUHJveHkoXG4gICAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBjb29yZCBwb3N0IHNoaXBtYWtlcjogJHtjb29yZH1gKTtcbiAgICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAgIC8vIGFkZCBjbGFzc25hbWUgZm9yIGZpdHNcbiAgICAgICAgICAgIGdyaWRTaGFkZXIoXG4gICAgICAgICAgICAgIGNvb3JkLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgb3JpZW50YXRpb24sXG4gICAgICAgICAgICAgIGRyYWdGaXRzLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgZ3JpZENvbnRhaW5lcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFkZCBjbGFzc25hbWUgZm9yIG5vdCBmaXRzXG4gICAgICAgICAgICBncmlkU2hhZGVyKFxuICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgZHJhZ1NoaXBMZW5ndGgsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb29yZENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGNlbGwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZHJhZ092ZXJIYW5kbGVyKTtcbiAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIChlKSA9PiB7XG4gICAgICAgICAgY29vcmRDYWxjdWxhdGVkID0gZmFsc2U7XG4gICAgICAgICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwibW91c2VvdmVyXCIpO1xuICAgICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGRyYWdPdmVySGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNoaXBJTUcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIHNoaXBJTUcuc3JjID0gXCIuL2ltYWdlcy9zYWlsYm9hdC5wbmdcIjtcbiAgICAgIHNoaXBJTUcuY2xhc3NMaXN0LmFkZChcInNoaXBJTUdcIik7XG4gICAgICBzaGlwSU1HLnN0eWxlLndpZHRoID0gXCIxcmVtXCI7XG5cbiAgICAgIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgZnVuY3Rpb24gc2hpcERyYWdIYW5kbGVyKGUpIHtcbiAgICAgICAgICBkcmFnU2hpcExlbmd0aCA9IE51bWJlcihlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbmRleCk7XG5cbiAgICAgICAgICBjb25zdCBjbG9uZSA9IHNoaXAuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgIGRyYWdTaGlwID0gc2hpcDtcbiAgICAgICAgICAvLyBTZXQgdGhlIG9mZnNldCBmb3IgdGhlIGRyYWcgaW1hZ2VcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gMjA7IC8vIFNldCB5b3VyIGRlc2lyZWQgb2Zmc2V0IHZhbHVlXG4gICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGNsb25lLCAwLCAwKTtcbiAgICAgICAgICBzaGlwLmNsYXNzTGlzdC5hZGQoXCJkcmFnZ2luZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZSkgPT4ge1xuICAgICAgICAgIHNoaXBEcmFnSGFuZGxlcihlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2hpcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgc2hpcC5jbGFzc0xpc3QucmVtb3ZlKFwiZHJhZ2dpbmdcIik7XG5cbiAgICAgICAgICBpZiAoZHJhZ0ZpdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlZCA9IHNoaXBNYWtlclByb3h5KFxuICAgICAgICAgICAgICBwbGF5ZXJPYmoubnVtYmVyLFxuICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgY29vcmQsXG4gICAgICAgICAgICAgIG9yaWVudGF0aW9uLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChwbGFjZWQpIHtcbiAgICAgICAgICAgICAgZ3JpZFNoYWRlcihcbiAgICAgICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgICAgICBkcmFnU2hpcExlbmd0aCxcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbixcbiAgICAgICAgICAgICAgICBkcmFnRml0cyxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIGdyaWRDb250YWluZXIsXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NoaXBzID0gXCJcIjtcblxuICAgICAgICAgICAgICBzd2l0Y2ggKGRyYWdTaGlwTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBtb3dDb3VudDtcbiAgICAgICAgICAgICAgICAgIG1vd0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBtYW5Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7bW93Q291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gZnJpZ0NvdW50O1xuICAgICAgICAgICAgICAgICAgZnJpZ0NvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBmcmlnQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke2ZyaWdDb3VudH1gO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgPSBzY2hvb25Db3VudDtcbiAgICAgICAgICAgICAgICAgIHNjaG9vbkNvdW50IC09IDE7XG4gICAgICAgICAgICAgICAgICBzY2hvb25Db3VudEJveC50ZXh0Q29udGVudCA9IGB4ICR7c2Nob29uQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NoaXBzID0gc2xvb3BDb3VudDtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnQgLT0gMTtcbiAgICAgICAgICAgICAgICAgIHNsb29wQ291bnRCb3gudGV4dENvbnRlbnQgPSBgeCAke3Nsb29wQ291bnR9YDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IGludmFsaWQgc2hpcCBsZW5ndGggaW4gZHJhZ1NoaXBcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVtYWluaW5nU2hpcHMgLT0gMTtcblxuICAgICAgICAgICAgICBpZiAocmVtYWluaW5nU2hpcHMgPD0gMCkge1xuICAgICAgICAgICAgICAgIHNoaXAuY2xhc3NMaXN0LmFkZChcImRlcGxldGVkXCIpO1xuICAgICAgICAgICAgICAgIHNoaXAucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBzaGlwRHJhZ0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHNoaXAuZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZHJhZ1NoaXAgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgZHJhZ1NoaXBMZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbW93Q291bnQgPD0gMCAmJlxuICAgICAgICAgICAgZnJpZ0NvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNjaG9vbkNvdW50IDw9IDAgJiZcbiAgICAgICAgICAgIHNsb29wQ291bnQgPD0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJOZXh0XCI7XG4gICAgICAgICAgICBwYWdlQ29udGFpbmVyLmFwcGVuZENoaWxkKG5leHRCdG4pO1xuXG4gICAgICAgICAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgXCJ0aGVyZSBzaG91bGQgYmUgc29tZSByZXNvbHZpbmcgb2YgcHJvbWlzZXMgaGFwcGVuaW5nIHJpZ2h0IG5vd1wiLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIC8vIHBvc3NpYmx5IGZvciBjcHUsIHN0aWxsIGNhbGwgU1MgYnV0IGRvIG5vdCB3aXBlIGh0bWwgYW5kIGp1c3Qgc2hvdyB0aGUgZWZmZWN0IG9mIGhpdHRpbmcgb25lIG9mIHRoZSBvdGhlciBwbGF5ZXIgc2hpcHMuXG4gIC8vIGdhbWVUdXJuIHJlcXVpcmVzIGNvb3JkaW5hdGVzLCBwbGF5ZXJDbGFzcywgZW5lbXlDbGFzc1xuICBhc3luYyBmdW5jdGlvbiBzdHJpa2VTY3JlZW4ocGxheWVyQ2xhc3MsIGVuZW15Q2xhc3MsIGdhbWVUdXJuU2NyaXB0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBodG1sQ29udGVudCA9IGAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJOYW1lXCI+PC9kaXY+XG4gICAgICAgPC9kaXY+XG4gICAgICAgPGRpdiBjbGFzcz1cInN0cmlrZUNvbnRcIj5cbiAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0cmlrZUdyaWRDb250XCI+XG4gICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInN0cmlrZVJlc3VsdFwiPlN0cmlrZSBSZXN1bHQ8L3NwYW4+XG4gICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2hpcFBsYWNlZENvbnRcIj5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaGlwUGxhY2VkR3JpZFwiPjwvZGl2PlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNoaXBzUmVtYWluQ29udFwiPjwvZGl2PlxuICAgICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgcGFnZUNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sQ29udGVudDtcblxuICAgICAgY29uc3QgcGxheWVyTmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyTmFtZVwiKTtcbiAgICAgIGNvbnN0IHN0cmlrZVJlc3VsdENvbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnN0cmlrZVJlc3VsdFwiKTtcbiAgICAgIGNvbnN0IGdyaWRTaXplID0gMTA7XG4gICAgICBjb25zdCBncmlkQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdHJpa2VHcmlkQ29udFwiKTtcbiAgICAgIGNvbnN0IHNoaXBQbGFjZUdyaWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnNoaXBQbGFjZWRHcmlkXCIpO1xuICAgICAgbGV0IGFibGVUb1N0cmlrZSA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB0b29rVHVybiA9IGZhbHNlO1xuICAgICAgY29uc3QgaGl0U1ZHID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGhpdFNWRy5pbm5lckhUTUwgPSBgPHN2ZyBjbGFzcz1cImhpdEljb25cIiB4bWxucyA9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgLTk2MCA5NjAgOTYwXCIgd2lkdGg9XCIyNFwiPlxuICAgICAgICAgIDxwYXRoIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBkPVwibTI1Ni0yMDAtNTYtNTYgMjI0LTIyNC0yMjQtMjI0IDU2LTU2IDIyNCAyMjQgMjI0LTIyNCA1NiA1Ni0yMjQgMjI0IDIyNCAyMjQtNTYgNTYtMjI0LTIyNC0yMjQgMjI0WlwiLz5cbiAgICAgICAgPC9zdmc+YDtcbiAgICAgIGNvbnN0IG1pc3NTdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbWlzc1N2Zy5pbm5lckhUTUwgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAtOTYwIDk2MCA5NjBcIiB3aWR0aD1cIjI0XCI+PHBhdGggZD1cIk00ODAtNDgwWm0wIDI4MHEtMTE2IDAtMTk4LTgydC04Mi0xOThxMC0xMTYgODItMTk4dDE5OC04MnExMTYgMCAxOTggODJ0ODIgMTk4cTAgMTE2LTgyIDE5OHQtMTk4IDgyWm0wLTgwcTgzIDAgMTQxLjUtNTguNVQ2ODAtNDgwcTAtODMtNTguNS0xNDEuNVQ0ODAtNjgwcS04MyAwLTE0MS41IDU4LjVUMjgwLTQ4MHEwIDgzIDU4LjUgMTQxLjVUNDgwLTI4MFpcIi8+PC9zdmc+YDtcbiAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICBmdW5jdGlvbiBwcmV2U3RyaWtlUG9wdWxhdG9yKFxuICAgICAgICBwbGF5ZXJDbGFzcyxcbiAgICAgICAgaGl0U1ZHLFxuICAgICAgICBtaXNzU3ZnLFxuICAgICAgICBncmlkQ29udCxcbiAgICAgICAgaGl0c09ubHkgPSBmYWxzZSxcbiAgICAgICkge1xuICAgICAgICBjb25zdCBncmlkQ29udGFpbmVyTmFtZSA9IGdyaWRDb250LmNsYXNzTGlzdC52YWx1ZTtcbiAgICAgICAgY29uc3QgbWlzc0FyciA9IHBsYXllckNsYXNzLnN0cmlrZXMubWlzc2VzO1xuICAgICAgICBjb25zdCBoaXRzQXJyID0gcGxheWVyQ2xhc3Muc3RyaWtlcy5oaXRzO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWRDb250YWluZXJOYW1lKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZENvbnQpO1xuICAgICAgICAvLyBmb3Igdmlld2luZyB3aGljaCBvZiB5b3VyIHNoaXBzIGFyZSBoaXQsIHBhc3N0aHJvdWdoIGVuZW15Q2xhc3MgaW5zdGVhZCBvZiBjdXJyZW50IHBsYXllclxuICAgICAgICBpZiAoaGl0c09ubHkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgbWlzc0Fyci5mb3JFYWNoKChjb29yZFBhaXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY3VycmVudENlbGwpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcIm1pc3NcIik7XG4gICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGhpdHNBcnIuZm9yRWFjaCgoY29vcmRQYWlyKSA9PiB7XG4gICAgICAgICAgY29uc3QgY3VycmVudENlbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgYC4ke2dyaWRDb250YWluZXJOYW1lfSBbZGF0YS1yPVwiJHtjb29yZFBhaXJbMF19XCJdW2RhdGEtYz1cIiR7Y29vcmRQYWlyWzFdfVwiXWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50Q2VsbCk7XG4gICAgICAgICAgY3VycmVudENlbGwuY2xhc3NMaXN0LmFkZChcImhpdFwiKTtcbiAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IGhpdFNWRy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgY3VycmVudENlbGwuYXBwZW5kQ2hpbGQoY2xvbmVTVkcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHBsYXllck5hbWUudGV4dENvbnRlbnQgPSBgUGxheWVyICR7cGxheWVyQ2xhc3MubnVtYmVyfSBUdXJuYDtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzdHJpa2UgZ3JpZCAmJiBwb3B1bGF0ZSBwcmV2aW91cyBzdHJpa2VzIGlmIGFwcGxpY2FibGVcbiAgICAgIGdyaWRCdWlsZGVyKGdyaWRDb250YWluZXIsIDEwKTtcbiAgICAgIC8vIGJ1aWxkIHRoZSBzaGlwUGxhY2VkR3JpZFxuICAgICAgZ3JpZEJ1aWxkZXIoc2hpcFBsYWNlR3JpZCwgMTApO1xuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihwbGF5ZXJDbGFzcywgaGl0U1ZHLCBtaXNzU3ZnLCBncmlkQ29udGFpbmVyKTtcbiAgICAgIC8vIHBvcHVsYXRlIHdoaWNoIG9mIHlvdXIgc2hpcHMgYXJlIGhpdFxuICAgICAgcHJldlN0cmlrZVBvcHVsYXRvcihlbmVteUNsYXNzLCBoaXRTVkcsIG1pc3NTdmcsIHNoaXBQbGFjZUdyaWQsIHRydWUpO1xuICAgICAgY29uc29sZS5sb2coXCJ0aGlzIHMgY2FsbGVkIGFmdGVyIHN0cmlrZSBwb3B1bGF0b3JcIik7XG5cbiAgICAgIC8vIHRyYW5zbGF0ZXMgVUkgY2VsbCB0byBhIGNvb3JkaW5hdGVcbiAgICAgIC8vIGNoZWNrcyBpZiB0aGVyZSB3YXMgYWxyZWFkeSBhIGhpdCBpbiB0aGUgZ3JpZCBzcXVhcmVcblxuICAgICAgY29uc3QgY2VsbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNlbGxcIik7XG4gICAgICBjZWxscy5mb3JFYWNoKChjZWxsKSA9PiB7XG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIC8vIGlmIHN0cnVjayBhbHJlYWR5XG4gICAgICAgICAgaWYgKHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByID0gTnVtYmVyKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnIpO1xuICAgICAgICAgIGNvbnN0IGMgPSBOdW1iZXIoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYyk7XG4gICAgICAgICAgY29vcmQgPSBbciwgY107XG4gICAgICAgICAgLy8gcmVwbGFjZSB0aGlzIGZuIHdpdGggY2hlY2tlciBmb3IgcmVwZWF0IHN0cmlrZXNcbiAgICAgICAgICBjb25zb2xlLmxvZyhjb29yZCk7XG4gICAgICAgICAgLy8gdGhpcyBtaWdodCBicmVhayBpZiBwbGF5ZXIgY2Fuc3RyaWtlIGlzIHJlZmFjdG9yZWRcbiAgICAgICAgICBjb25zdCBjYW5TdHJpa2UgPSBwbGF5ZXJDbGFzcy5jYW5TdHJpa2UoXG4gICAgICAgICAgICBjb29yZCxcbiAgICAgICAgICAgIGVuZW15Q2xhc3MucGxheWVyQm9hcmQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoY2FuU3RyaWtlICYmICF0b29rVHVybikge1xuICAgICAgICAgICAgdG9va1R1cm4gPSB0cnVlO1xuICAgICAgICAgICAgLy8gc2VuZCBzaWduYWwgdG8gc3RyaWtlIHRvIGdhbWVUdXJuXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGdhbWVUdXJuU2NyaXB0KGNvb3JkLCBwbGF5ZXJDbGFzcywgZW5lbXlDbGFzcyk7XG4gICAgICAgICAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIHN0cmlrZVJlc3VsdENvbnQudGV4dENvbnRlbnQgPVxuICAgICAgICAgICAgICBzdHJpa2VSZXN1bHRDb250LnRleHRDb250ZW50ICsgXCI6IFwiICsgcmVzcG9uc2U7XG4gICAgICAgICAgICBuZXh0QnRuLnRleHRDb250ZW50ID0gXCJFbmQgVHVyblwiO1xuICAgICAgICAgICAgcGFnZUNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnRuKTtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlID09PSBcImhpdFwiKSB7XG4gICAgICAgICAgICAgIGNlbGwuY2xhc3NMaXN0LmFkZChcImhpdFwiKTtcbiAgICAgICAgICAgICAgY29uc3QgY2xvbmVTVkcgPSBoaXRTVkcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgICAgcGxheWVyQ2xhc3Muc3RyaWtlcy5oaXRzLnB1c2goY29vcmQpO1xuICAgICAgICAgICAgICBjb25zb2xlLmRpcihwbGF5ZXJDbGFzcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yOiBzdHJpa2UgcmVzcG9uc2UgZXhjZXB0aW9uXCIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJtaXNzXCIpO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZVNWRyA9IG1pc3NTdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICBjZWxsLmFwcGVuZENoaWxkKGNsb25lU1ZHKTtcbiAgICAgICAgICAgICAgcGxheWVyQ2xhc3Muc3RyaWtlcy5taXNzZXMucHVzaChjb29yZCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHBsYXllckNsYXNzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2hvdyB0aGUgYnV0dG9uIGZvciBuZXh0XG5cbiAgICAgICAgICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcInRoZXJlIHNob3VsZCBiZSBzb21lIHJlc29sdmluZyBvZiBwcm9taXNlcyBoYXBwZW5pbmcgcmlnaHQgbm93XCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHBsYWNlU2hpcHMocGxheWVyQ2xhc3MpIHtcbiAgICAgICAgY29uc3Qgc2hpcHNBcnJheSA9IHBsYXllckNsYXNzLnBsYXllckJvYXJkLnNoaXBzO1xuICAgICAgICBzaGlwc0FycmF5LmZvckVhY2goKHNoaXApID0+IHtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBzaGlwLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBjb29yZCA9IHNoaXAuY29vcmRpbmF0ZXM7XG4gICAgICAgICAgY29uc3Qgb3JpZW50YXRpb24gPSBzaGlwLm9yaWVudGF0aW9uO1xuXG4gICAgICAgICAgZ3JpZFNoYWRlcihjb29yZCwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgbnVsbCwgdHJ1ZSwgc2hpcFBsYWNlR3JpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcGxhY2VTaGlwcyhwbGF5ZXJDbGFzcyk7XG4gICAgfSk7XG4gIH1cbiAgYXN5bmMgZnVuY3Rpb24gc3RhcnRTY3JlZW4oKSB7XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5CYXR0bGVzaGlwPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJTZWxlY3RDb250XCI+XG4gICAgICAgICAgICAgICAgIDxmb3JtIGFjdGlvbj1cIlwiIGNsYXNzPVwicGxheWVyRm9ybVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwU2VsZWN0IHAxXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5TmFtZSBwMVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicFR4dCBwMVwiPlBsYXllciAxPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3REcm9wZG93biBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cInNlbGVjdHAxXCIgbmFtZT1cInNlbGVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZXJzb25cIiBzZWxlY3RlZD5QbGF5ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3B1XCI+Q1BVPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5U2VsZWN0Q29udCBwMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkdlcm1hbnlcIj5ERTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkRlbm1hcmtcIj5ESzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIlVLXCI+VUs8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJQb3J0dWdhbFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMVwiIGlkPVwiU3BhaW5cIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkl0YWx5XCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAxXCIgaWQ9XCJGcmVuY2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDFcIiBpZD1cIkR1dGNoXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBTZWxlY3QgcDJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlOYW1lIHAyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwVHh0IHAyXCI+UGxheWVyIDE8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlbGVjdERyb3Bkb3duIHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwic2VsZWN0cDJcIiBuYW1lPVwic2VsZWN0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcnNvblwiIHNlbGVjdGVkPlBsYXllcjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjcHVcIj5DUFU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlTZWxlY3RDb250IHAyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiR2VybWFueVwiPkRFPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRGVubWFya1wiPkRLPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiVUtcIj5VSzwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIlBvcnR1Z2FsXCI+UFQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb3VudHJ5Qm94IHAyXCIgaWQ9XCJTcGFpblwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiSXRhbHlcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvdW50cnlCb3ggcDJcIiBpZD1cIkZyZW5jaFwiPlBUPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY291bnRyeUJveCBwMlwiIGlkPVwiRHV0Y2hcIj5QVDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuQ29udFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5CZWdpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICA8L2Zvcm0+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuICAgIHBhZ2VDb250YWluZXIuaW5uZXJIVE1MID0gaHRtbENvbnRlbnQ7XG4gICAgY29uc3QgcGxheWVyRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWVyRm9ybVwiKTtcbiAgICBpbml0Q291bnRyeVNlbGVjdCgpO1xuICAgIHBsYXllckZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgcGxheWVycyA9IHBPYmpJbml0aWFsaXplcihcIi5wbGF5ZXJGb3JtXCIsIFwic2VsZWN0cDFcIiwgXCJzZWxlY3RwMlwiKTtcbiAgICAgIC8vIHBsYXllcm9iaiBzZW50IGJhY2sgdG8gZXh0ZW5kIGZ1bmN0aW9uYWxpdHkgd2l0aCBwbGF5ZXIgc2NyaXB0XG4gICAgICBhc3luYyBmdW5jdGlvbiBwcm9jZXNzUGxheWVycyhwbGF5ZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwbGF5ZXJzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQucGxheWVyID09PSBcInBlcnNvblwiKSB7XG4gICAgICAgICAgICBwbGF5ZXJJbml0U2NyaXB0KGVsZW1lbnQpO1xuICAgICAgICAgICAgYXdhaXQgc2hpcFNjcmVlbihlbGVtZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVySW5pdFNjcmlwdChlbGVtZW50KTtcbiAgICAgICAgICAgIHNoaXBSYW5kb21pemVyKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcHJvY2Vzc1BsYXllcnMocGxheWVycyk7XG4gICAgICAvLyBpbmRleCBnbG9iYWwgdmFyaWFibGVzIHNob3VsZCBiZSBwb3B1bGF0ZWQgd2l0aCBib3RoIHBsYXllcnNcbiAgICAgIC8vIGNhbGwgdG8gY29udGludWUgZ2FtZSBzaG91bGQgaGF2ZSBpbmRleCBhY2Nlc3NpbmcgZ2xvYmFsIHBsYXllclxuICAgICAgLy8gb2JqcyBhbmQgc2hvdWxkIHdvcmsgZmluZS4gYnV0IGl0IGlzIGtpbmRhIHNsb3BweVxuICAgICAgLy8gdGhpcyBwYXNzZXMgb3ZlciBjb250cm9sIGJhY2sgdG8gdGhlIGluZGV4IHNjcmlwdC5cbiAgICAgIGdhbWVJbml0U2NyaXB0KCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHsgc3RhcnRTY3JlZW4sIHBPYmpJbml0aWFsaXplciwgc3RyaWtlU2NyZWVuIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZXJJbnRlcmZhY2U7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=