// gameboard will hold the coordinate grid for each players opposing grid and ship grid

const ship = require("../ship");
const gameboard = require("../gameboard");

const frigateTest = ship(4);
const schoonerTest = ship(3);
const testBoard = gameboard();
testBoard.addShip(frigateTest, [1, 2], 'h');

test("ship placed at coordinate", () => {
  expect(testBoard.shipGrid[1][2]).not.toBe(null);
});

test("reports if ship fits", () => {
  expect(testBoard.shipFits(4, [2, 1], 'h')).toBe(true);
});

test("notifies when ship will not fit", () => {
  expect(testBoard.shipFits(5, [1, 7], 'h')).toBe(false);
});

test("ship horizontally laid out", () => {
  expect(testBoard.shipGrid[1][3]).not.toBe(null);
  expect(testBoard.shipGrid[1][4]).not.toBe(null);
  expect(testBoard.shipGrid[1][5]).not.toBe(null);
});

test("ship vertically laid out", () => {
  testBoard.addShip(schoonerTest, [2, 2], 'v');
  expect(testBoard.shipGrid[2][2]).not.toBe(null);
  expect(testBoard.shipGrid[3][2]).not.toBe(null);
  expect(testBoard.shipGrid[4][2]).not.toBe(null);
});

test("receiveAttack hits a ship", () => {
  expect(testBoard.receiveAttack([1,4])).toBe('Frigate was hit. 3 hitpoints remaining');
  expect(testBoard.attacksReceived[1][4]).toBe(1);
});

test("records missed shot", () => {
  expect(testBoard.receiveAttack([1, 9])).toBe('miss');
  expect(testBoard.attacksReceived[1][9]).toBe(0);
});

test("reports sunk ship", () => {
  testBoard.receiveAttack([1, 2]);
  testBoard.receiveAttack([1, 3]);
  expect(testBoard.receiveAttack([1, 5])).toBe('Frigate has been sunk');
});

test("reports if all ships sunk", () => {
  testBoard.receiveAttack([2, 2]);
  testBoard.receiveAttack([3, 2]);
  testBoard.receiveAttack([4, 2]);
  expect(testBoard.shipsRemaining()).toBe('All ships have sunk');
});



