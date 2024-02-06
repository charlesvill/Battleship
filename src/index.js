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
