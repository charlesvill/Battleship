// tests for cpu player will be placed in player.test.js
// hit bool might not play a role, remember to delete if no role.
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

  function getNextInline(lastHit){
    // will need to guess next one until you have a legal one that hasnt been used yet
    const binaryOffset = Math.floor(Math.random() * 2);
    const offsetValue = binaryOffset === 0 ? -1 : 1;
    let inlineStrike = [...lastHit];

    if(pursuitAxis === 'h'){
      inlineStrike[1] += offsetValue;
      return inlineStrike;
    } else if(pursuitAxis === 'v'){
      inlineStrike[0] += offsetValue;
      return inlineStrike;
    }
  }

  function inlineMove() {
    // finds the axis by comparing hits and calls an inline guess
    if(pursuitAxis === null){
      const [c1, c2] = hitArr;
      if(c1[0] === c2[0] && c1[1] !== c2[1]){
        pursuitAxis = 'h';
        return getNextInline(c2);
      } else if (c1[0] !== c2[0] && c1[1] === c2[1]){
        pursuitAxis = 'v';
        return getNextInline(c2);
      }
    } else {
      if(streak === false){
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
  function reportMiss(){
    streak = false;
  }
  // report miss function?
  return { randomMove, adjacentMove, inlineMove, nextMove, reportHit, reportMiss, hitArr };
};
const test = cpuPlayer();
test.hitArr.push([1, 2]);
test.adjacentMove();
module.exports = cpuPlayer;

// attack on player class accepts a coordinate pair. how that pair gets formulated does not matter
// have a general nextMove function that will intelligently determine what function will be called
// according to the current state of hits.
// the information you would need record when you have two hits. if you have two hits you need to figure out the orientation of that ship and repeatedly (loop) strike inline until there is a sunk ship.
//
// conclusion: there definitely needs to be a way for the gameboard to communicate back to the cpu script.
//
// callback fns that check on each move? or is it fed to the cpu script by the gameloop?
