// gameboard will hold the coordinate grid for each players opposing grid and ship grid

const ship = require("../ship");
const gameboard = require("../gameboard");

const frigateTest = ship(4);
const testBoard = gameboard();

test("ship placed at coordinate", () => {
  testBoard.addShip(frigateTest, [1, 2]);
  expect(testBoard.grid[1][2]).not.toBe(null);
});


test("ship correctly laid out", () => {

});

test("recieve Attack hits a ship", () => {

})
