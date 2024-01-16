// index houses the driver code including the game loop
const player = require("./player");
const gameBoard = require("./gameboard");
const ship = require("./ship");
const cpu = require("./cpuPlayer");
const uiScript = require("./ui");

const gameModule = () => {
  // temporary initializers that will be wrapped in a function that will assign game elements
  // the game initializer will use this function for connecting cpu AI to other functions
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
    } else {
      player2 = player(playerObj.country, gameBoard(), isCPU);
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

  function gameLoop() {
    // while game is not over
    // call ui strikescreen for current player if its a person
  }

  function gameInitializer() {
    // after adding the ships , it will need to check who is cpu and initialize the cpuwrapper
    // may need a loop fn as driver for the ui strikescreens
    // ui strikes will be handled by this driver fn for the turn taking and
    // cpu turns will be handled by gameloop automatically
    // only really need to handle the person turn and sending that persons
    // coordinates to gameloop
    // should rename gameloop to "taking turn" or something bc its not
    // actually looping. and it probably should not loop.
  }

  const ui = uiScript(shipPlacerProxy, playerInitializer, gameInitializer);

  // this initializes but the game loop picks back up when ui script calls gameinitializer;
  ui.startScreen();
  const cpuAI = cpu();

  let gameOver = false;
  //  const p1 = player("Dk", gameBoard());
  //  let p2 = cpuPlayerWrapper(
  //    player("UK", gameBoard(), true),
  //    cpuAI,
  //    p1.playerBoard,
  //  );
  // let currentPlayer = p1;

  function endGame(winner) {
    // some shit here to end the game
    console.log("this mf over lol");
  }
  // gameTurn is called by event handler on UI interaction -or- by recursion when its cpu turn
  function gameTurn(coordinates = "") {
    if (gameOver) {
      return endGame();
    }

    if (currentPlayer === p1) {
      const strike = p1.attack(coordinates, p2.playerBoard);
      // return value anything other than num = player loses
      if (isNaN(p2.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p2;
    } else if (currentPlayer === p2) {
      const strike = p2.attack(coordinates, p1.playerBoard);
      // check this line for errors, this was refactored differently
      if (isNaN(p1.playerBoard.shipsRemaining())) {
        gameOver = true;
        return endGame(p1);
      }
      currentPlayer = p1;
    }
    if (currentPlayer.isCPU === true) {
      return gameTurn();
    }
  }
  function isGameOver() {
    return gameOver;
  }
  return { gameTurn, isGameOver };
};
gameModule();
module.exports = gameModule;
