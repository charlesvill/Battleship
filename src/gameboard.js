const gameBoard = () => {
  let grid = [];
  let ships = [];
  // initializer for the grid
  for(let i = 0; i < 10; i++){
    grid[i] = [];
    for(let j = 0; j < 10; j++){
      grid[i][j] = null;
    }
  }

  function shipFits(length, coordinates, orientation){

    const r = coordinates[0];
    const c = coordinates[1];
    let space = 0;

    // h horizontal : v vertical
    if(orientation = 'h'){
      space = grid[0].length;
    } else if(orientation = 'v'){

    }
  }

  function addShip(ship, coordinates){
    const length = ship.length;
    const row = coordinates[0];
    const column = coordinates[1];
    let orientation = 'v';
    // check if a move is legal per the coordinate
    grid[row][column] = ship;
  }
  return {grid, ships, addShip};
}
const test = gameBoard();
module.exports = gameBoard;
