const playerTest = require("../player");
const testBoard = require("../gameboard");
const shipTest = require("../ship");
const cpuPlayer = require("../cpuPlayer");

const p1 = playerTest("Dk", testBoard());
const p2 = playerTest("UK", testBoard());
const cpu = playerTest("PT", testBoard());
const cpuAiTest = cpuPlayer();
const sloopP1 = shipTest(2);
const frigateP1 = shipTest(4);
const sloopP2 = shipTest(2);
const frigateP2 = shipTest(4);

p1.playerBoard.addShip(sloopP1, [2, 4], "h");
p1.playerBoard.addShip(frigateP1, [1, 2], "v");
p2.playerBoard.addShip(sloopP2, [2, 4], "h");
p2.playerBoard.addShip(frigateP2, [1, 2], "v");

test.skip("register hit on another player", () => {
  expect(p1.attack([1, 2], p2.playerBoard)).toBe(
    "Frigate was hit. 3 hitpoints remaining",
  );
});

test.skip("reports sinking all ships", () => {
  p1.attack([2, 2], p2.playerBoard);
  p1.attack([3, 2], p2.playerBoard);
  p1.attack([4, 2], p2.playerBoard);
  p1.attack([2, 4], p2.playerBoard);
  p1.attack([2, 5], p2.playerBoard);
  expect(p2.playerBoard.shipsRemaining()).toBe("All ships have sunk");
});

test.skip("prevents repeat attacks", () => {
  expect(p1.canStrike([1, 2], p2.playerBoard)).toBe(false);
});

test.skip("cpu generates a valid random coordinate", () => {
  const randomCoordinate = cpuPlayer().randomMove();

  console.log("random strike: " + randomCoordinate);
  expect(randomCoordinate[0]).toBeGreaterThanOrEqual(0);
  expect(randomCoordinate[0]).toBeLessThanOrEqual(9);
  expect(randomCoordinate[1]).toBeGreaterThanOrEqual(0);
  expect(randomCoordinate[1]).toBeLessThanOrEqual(9);
});



test.skip("cpu generates adjacent point after hit", () => {
  // helper code
  const testStrike = cpu.attack([2, 2], p1.playerBoard);
  if (testStrike !== "miss") {
    cpuAiTest.reportHit([2, 2]);
    // reportHit needs to have the resuls of isSunk
  }
  const nextStrike = cpuAiTest.nextMove();
  console.log("adjacent strike: " + nextStrike);
  expect(nextStrike).not.toBe([2, 2]);
  expect(nextStrike[0]).toBeGreaterThanOrEqual(0);
  expect(nextStrike[0]).toBeLessThanOrEqual(2);
  expect(nextStrike[1]).toBeGreaterThanOrEqual(1);
  expect(nextStrike[1]).toBeLessThanOrEqual(3);
});

test.skip("cpu generates inline strike after two hits", () => {
  const testStrike = cpu.attack([2, 2], p1.playerBoard);
  if (testStrike !== "miss") {
    cpuAiTest.reportHit([2, 2]);
    // reportHit needs to send the results of isSunk
  }
  const nextStrike = cpuAiTest.nextMove();
  console.log("inline strike: " + nextStrike);
  expect(nextStrike).not.toBe([2, 2]);
  expect(nextStrike[0]).toBeGreaterThanOrEqual(0);
  expect(nextStrike[0]).toBeLessThanOrEqual(3);
  expect(nextStrike[1]).toBe(2);
});

test("cpu sinks a ship with length of 4", () => {

  const testBattle = () => {
    let nextStrike = cpuAiTest.nextMove();
    while(cpu.canStrike(nextStrike, p1.playerBoard) === false){
      nextStrike = cpuAiTest.nextMove();
    }
    const strikeResult = cpu.attack(nextStrike, p1.playerBoard);

    console.log('strike coordinates' + nextStrike);
    console.log('Strike result: ' + strikeResult);

    if(strikeResult !== 'miss'){
      cpuAiTest.reportHit(nextStrike);
    } else if(strikeResult === 'miss'){
      cpuAiTest.reportMiss();
    }
    if(strikeResult === 'Frigate has been sunk'){
      return strikeResult;
    }
    return testBattle();
  }
  expect(testBattle()).toBe('Frigate has been sunk');
});
// report miss function? or going about after a miss
// report when a ship has sunk and returning to random firing
