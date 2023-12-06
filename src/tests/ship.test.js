// tests for game components will live here
const ship = require("../ship");
const schooner = ship(3);

test("hit", () => {
  expect(schooner.hit()).toBe(
    `${schooner.type} was hit. ${schooner.hitpoints()} hitpoints remaining`,
  );
});

test("is sunk?", () => {
  // repeat hit 2x to test isSunk function
  for (let i = 0; i < 2; i++) {
    schooner.hit();
  }
  expect(schooner.isSunk()).toEqual(true);
});
