const playerTest = require("../player");
const testBoard = require("../gameboard");
const shipTest = require("../ship");
const cpuPlayer = require("../cpuPlayer");

const p1 = playerTest("Dk", testBoard());
const p2 = playerTest("UK", testBoard());
const cpu = playerTest("PT", testBoard());
const sloopP1 = shipTest(2);
const frigateP1 = shipTest(4);
const sloopP2 = shipTest(2);
const frigateP2 = shipTest(4);

p1.playerBoard.addShip(sloopP1, [1, 2], "v");
p1.playerBoard.addShip(frigateP1, [2, 4], "h");
p2.playerBoard.addShip(sloopP2, [1, 2], "v");
p2.playerBoard.addShip(frigateP2, [2, 4], "h");

test("register hit on another player", () => {
  expect(p1.attack([1, 2], p2.playerBoard)).toBe(
    "Patrol Sloop was hit. 1 hitpoints remaining",
  );
});

test("reports sinking all ships", () => {
  p1.attack([2, 2], p2.playerBoard);
  p1.attack([2, 4], p2.playerBoard);
  p1.attack([2, 5], p2.playerBoard);
  p1.attack([2, 6], p2.playerBoard);
  p1.attack([2, 7], p2.playerBoard);
  expect(p2.playerBoard.shipsRemaining()).toBe("All ships have sunk");
});

test("prevents repeat attacks", () => {
  expect(p1.canStrike([1, 2], p2.playerBoard)).toBe(false);
});

test("cpu generates a valid random coordinate", () => {
  const randomCoordinate = cpuPlayer().randomMove();

  console.log("random strike: " + randomCoordinate);
  expect(randomCoordinate[0]).toBeGreaterThanOrEqual(0);
  expect(randomCoordinate[0]).toBeLessThanOrEqual(9);
  expect(randomCoordinate[1]).toBeGreaterThanOrEqual(0);
  expect(randomCoordinate[1]).toBeLessThanOrEqual(9);
});

test("cpu generates adjacent point after hit", () => {
  // helper code
  const cpuAiTest = cpuPlayer();
  const testStrike = cpu.attack([1, 2], p1.playerBoard);
  if (testStrike !== "miss") {
    cpuAiTest.reportHit([1, 2]);
  }
  const nextStrike = cpuAiTest.nextMove();
  console.log("adjacent strike: " + nextStrike);
  expect(nextStrike).not.toBe([1, 2]);
  expect(nextStrike[0]).toBeGreaterThanOrEqual(0);
  expect(nextStrike[0]).toBeLessThanOrEqual(2);
  expect(nextStrike[1]).toBeGreaterThanOrEqual(1);
  expect(nextStrike[1]).toBeLessThanOrEqual(3);
});
