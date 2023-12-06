// gameboard will hold the coordinate grid for each players opposing grid and ship grid

const ship = require("../ship");
const gameboard = require("../gameboard");

const frigateTest = ship(4);
const testBoard = gameboard();

test("ship placed at coordinate", () => {
  frigateTest.addShip(frigateTest, 1, 2);
  expect(frigateTest.checkGrid(1, 2)).not.toBe(null);
});
