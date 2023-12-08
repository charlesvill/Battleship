// tests for cpu player will be placed in player.test.js
// hit bool might not play a role, remember to delete if no role.
const cpuPlayer = () => {
  let state = 'random';
  let hit = false;
  let streak = false;
  let hitArr = [];


  function randomMove (){
    const max = 10;
    const cCoord = Math.floor(Math.random() * max);
    const rCoord = Math.floor(Math.random() * max);
    const randomCoord = [];

    randomCoord.push(cCoord, rCoord);

    return randomCoord;
  }

  // will need to implement the legal move -> dependency injection from gameboard script
  function adjacentMove (){
    // will return coordinate in either same row or column as lastHit
    const [lastHit, ] = hitArr;
    let adjacentMove = lastHit;
    // randomly choose either row or column to change
    const axis = Math.floor(Math.random() * 1);
    // 0 -> -1 will be added || 1 -> 1 will be added
    const binaryOffset = Math.floor(Math.random() * 1);
    const offsetValue = binaryOffset === 0 ? -1 : 1;
    adjacentMove[axis] += offsetValue;

    return adjacentMove;
  }
  function inlineMove (){

  }
  function nextMove(){

    switch(state){
      case 'random':
        return randomMove();
        break;
      case 'adjacent':
        return adjacentMove();
        break;
      case 'inline':
        return inlineMove();
        break;
      default:
        return "Error condition exception: nextMove";
    }
  }
  function reportHit(coordinate, isSunk){
    if(isSunk === true){
      hit = false;
      streak = true;
      mode = 'random';
    }
    hitArr.push(coordinate);
    if(hitArr.length === 1){
      state = 'adjacent';
    } else if(hitArr.length > 1){
      state = 'inline';
    }
  }
  return{randomMove, adjacentMove, inlineMove, nextMove, reportHit};
}

module.exports = cpuPlayer;


// attack on player class accepts a coordinate pair. how that pair gets formulated does not matter
// have a general nextMove function that will intelligently determine what function will be called 
// according to the current state of hits. 
// the information you would need record when you have two hits. if you have two hits you need to figure out the orientation of that ship and repeatedly (loop) strike inline until there is a sunk ship. 
//
// conclusion: there definitely needs to be a way for the gameboard to communicate back to the cpu script. 
//
// callback fns that check on each move? or is it fed to the cpu script by the gameloop? 
