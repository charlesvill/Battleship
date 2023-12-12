const gameModule = require("../index.js");
// once the game initialization code is made, this will need to be refactored to make custom initializer.
const game = gameModule();

test("gameLoop correctly handles input from mock UI & CPU player", () => {
  const mockUIinputTest = () => {
    const mockPlayerGuesses = [
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [8, 4],
      [8, 5],
      [2, 4],
      [2, 5],
    ];
    while (!game.isGameOver()) {
      // pulls first guess and sends it gameloop as its strike guess
      // because gameModule uses recursion to trigger cpu turn
      // it is not necessary to call a cpu turn
      game.gameLoop(mockPlayerGuesses.shift());
    }
    if (game.isGameOver()) {
      return "game succesfully ended";
    }
  };

  expect(mockUIinputTest()).toBe("game succesfully ended");
});
