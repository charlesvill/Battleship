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
