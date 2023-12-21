const userInterface = (shipMakerProxy, playerInitScript, gameInitScript) => {
  const pageContainer = document.querySelector(".pageContainer");
  let p1Country = "";
  let p2Country = "";

  function initCountrySelect() {
    const nodeList = document.querySelectorAll(".countryBox");
    nodeList.forEach((element) => {
      element.addEventListener("click", () => {
        if (element.classList[1] === "p1") {
          p1Country = element.id;
          console.log("p1 country added " + p1Country);
        } else if (element.classList[1] === "p2") {
          p2Country = element.id;
          console.log("p2 country added " + p2Country);
        }
      });
    });
  }
  function startScreen(gameScriptFn) {
    const htmlContent = `
      <div class="title">Battleship</div>
              <div class="playerSelectCont">
                 <form action="" class="playerForm">
                      <div class="pSelect p1">
                          <div class="countryName p1"></div>
                          <div class="pTxt p1">Player 1</div>
                          <div class="selectDropdown p1">
                              <select id="selectp1" name="select">
                                  <option value="person" selected>Player</option>
                                  <option value="cpu">CPU</option>
                              </select>
                          </div>
                          <div class="countrySelectCont p1">
                              <div class="countryBox p1" id="Germany">DE</div>
                              <div class="countryBox p1" id="Denmark">DK</div>
                              <div class="countryBox p1" id="UK">UK</div>
                              <div class="countryBox p1" id="Portugal">PT</div>
                              <div class="countryBox p1" id="Spain">PT</div>
                              <div class="countryBox p1" id="Italy">PT</div>
                              <div class="countryBox p1" id="French">PT</div>
                              <div class="countryBox p1" id="Dutch">PT</div>
                          </div>
                      </div>
                      <div class="pSelect p2">
                          <div class="countryName p2"></div>
                          <div class="pTxt p2">Player 1</div>
                          <div class="selectDropdown p2">
                              <select id="selectp2" name="select">
                                  <option value="person" selected>Player</option>
                                  <option value="cpu">CPU</option>
                              </select>
                          </div>
                          <div class="countrySelectCont p2">
                              <div class="countryBox p2" id="Germany">DE</div>
                              <div class="countryBox p2" id="Denmark">DK</div>
                              <div class="countryBox p2" id="UK">UK</div>
                              <div class="countryBox p2" id="Portugal">PT</div>
                              <div class="countryBox p2" id="Spain">PT</div>
                              <div class="countryBox p2" id="Italy">PT</div>
                              <div class="countryBox p2" id="French">PT</div>
                              <div class="countryBox p2" id="Dutch">PT</div>
                          </div>
                      </div>
                      <div class="btnCont">
                          <button type="submit">Begin</button>
                      </div>
                 </form>

              </div>
              <div class="footer">
              </div>
      `;
    pageContainer.innerHTML = htmlContent;
    const playerForm = document.querySelector(".playerForm");
    initCountrySelect();
    playerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const players = pObjInitializer(
        gameScriptFn,
        ".playerForm",
        "selectp1",
        "selectp2",
      );

      players.forEach((element) => {
        if (element.player === "person") {
          playerInitScript(element);
          // shipScreen(element);
        } else {
          playerInitScript(element);
          shipRandomizer(element);
        }
      });
      // trigger the next screen
    });
  }

  function randomCoord() {
    const max = 10;
    const cCoord = Math.floor(Math.random() * max);
    const rCoord = Math.floor(Math.random() * max);
    const coordinates = [];

    coordinates.push(cCoord, rCoord);

    console.log("random coord: " + coordinates);

    return coordinates;
  }

  function shipScreen(player0bj) {}
  function shipRandomizer(playerObj) {
    let shipArr = [...playerObj.ships];
    let player;
    shipArr.forEach((shipLength) => {
      let placed = false;
      while (!placed) {
        // random direction of ship placement
        const coordinates = randomCoord();
        const random = Math.floor(Math.random() * 2);
        const axis = random === 0 ? "h" : "v";

        // shipMakerProxy returns false if was not able to place ship at random spot, trys again
        placed = shipMakerProxy(
          playerObj.number,
          shipLength,
          coordinates,
          axis,
        );
      }
    });
  }

  function shipPos(playerArr) {
    // pass through the array of objects and shift each one and call a different function depending on if its a cpu or a person and route
    let newPlayerArr = [];
    while (playerArr.length > 0) {
      const current = playerArr.shift();

      if (current.player === "person") {
        let tmpObj = shipScreen(current.player);
        newPlayerArr.push(tmpObj);
      } else {
        let tmpObj = shipRandomizer(current.player);
        newPlayerArr.push(tmpObj);
      }
    }

    // call the game init fn passing the new player array
    // call fn that goes to the actual play screen
  }
  // builds a playerobj that contains information to initialize the game
  function pObjInitializer(gameScriptFn, formClssNme, p1selectid, p2selectid) {
    // build the obj and export to
    const playerForm = document.querySelector(formClssNme);
    const dropdownfield1 = document.getElementById(p1selectid);
    const dropdownfield2 = document.getElementById(p2selectid);
    let players = [];

    const manowar = 5;
    const frigate = 4;
    const schooner = 3;
    const sloop = 2;

    const playerobj = {
      player: undefined,
      number: undefined,
      country: undefined,
      ships: [
        manowar,
        frigate,
        frigate,
        schooner,
        schooner,
        schooner,
        sloop,
        sloop,
      ],
    };

    const player1 = { ...playerobj };
    const player2 = { ...playerobj };

    player1.player = dropdownfield1.value;
    player1.number = 1;
    player1.country = p1Country;

    player2.player = dropdownfield2.value;
    player2.number = 2;
    player2.country = p2Country;

    players.push(player1, player2);

    return players;
  }

  function UItoCoord() {}
  function sendMove() {}
  function checkSpace(coordinates) {}
  startScreen();
  return { pObjInitializer, sendMove };
};

module.exports = userInterface;
