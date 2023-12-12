// index houses the driver code including the game loop
const player = require("./player");
const gameBoard = require("./gameboard");
const ship = require("./ship");
const cpu = require("./cpuPlayer");

// global variables for the dom such as the player variables and have events from the ui
// call the gameModule and assign the game elements

const gameModule = () => {
  // temporary initializers that will be wrapped in a function that will assign game elements
  // the output should be the playerclasses (player wrappper for cpu)

  const p1 = player("Dk", gameBoard());
  let p2 = player("UK", gameBoard(), true);
  const cpuAI = cpu();
  const sloopP1 = ship(2);
  const frigateP1 = ship(4);
  const sloopP2 = ship(2);
  const frigateP2 = ship(4);
  let currentPlayer = p1;
  let gameOver = false;

  p1.playerBoard.addShip(sloopP1, [2, 4], "h");
  p1.playerBoard.addShip(sloopP1, [6, 4], "h");
  p1.playerBoard.addShip(frigateP1, [3, 2], "v");
  p2.playerBoard.addShip(sloopP2, [2, 4], "h");
  p2.playerBoard.addShip(sloopP2, [8, 4], "h");
  p2.playerBoard.addShip(frigateP2, [1, 2], "v");

  // the game initializer will use this function to build the player element
  const cpuPlayerWrapper = (playerClass, cpuAI, enemyBoard) => {
    const isCPU = true;
    function attack() {
      let nextStrike = cpuAI.nextMove();
      while (playerClass.canStrike(nextStrike) === false) {
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

    return { attack, isCPU, ...playerClass };
  };
  // helper code for the tests. needs to be refactored once game initializer is made
  const tmp = p2;
  p2 = cpuPlayerWrapper(p2, cpuAI, p1.enemyBoard);

  // part of the game initializer
  // helper code to override the assingmnet of the player so that the attack function call will funnel to the cpu player wrapper and correctly make a move on the part of the AI.

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
      if (p2.playerBoard.shipsRemaining() === 0) {
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
  return { uiInitializer, gameLoop, gameOver };
};
module.exports = gameModule;
