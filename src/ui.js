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
        } else if (element.classList[1] === "p2") {
          p2Country = element.id;
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
          shipScreen(element);
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

  function shipScreen(playerObj) {
    // clear page container and populate with ship select
    const htmlContent = `
      <div class="shipScreenCont">
          <div class="headerCont">
              <div class="playerName">
              </div>
          </div>
          <div class="bodyCont">
              <div class="gridCont">

              </div>
              <div class="shipDisplayCont">
                  this will be all boats listed and interactable
                <div class="shipBox">
                    <div class="ship" data-index="5" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship" data-index="4" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="3" draggable="true"></div>
                </div>
                <div class="shipBox">
                    <div class="ship"  data-index="2" draggable="true"></div>
                </div>

                  <div class="orientationCont">
                    <button class="orientationBtn" data-orientation="h">
                        Horizontal
                    </button>
                </div>
              </div>
          </div>
          <div class="footerCont">
              <div class="txt">
                  Place your ships!
              </div>
          </div>
      </div>
     `;
    pageContainer.innerHTML = "";
    pageContainer.innerHTML = htmlContent;

    // necessary globals for methods in ship select
    const gridContainer = document.querySelector(".gridCont");
    const gridSize = 10;
    let dragShipLength = 0;
    let dragShip = undefined;
    let dragFits = false;
    let coordinates = undefined;
    let orientation = "h";
    let coord = [];

    let ships = document.querySelectorAll(".ship");
    let shipContainer = document.querySelector(".shipBox");

    // build the visual grid
    for (let i = 0; i < gridSize; i++) {
      const row = document.createElement("div");
      row.classList.add("rowCont");
      gridContainer.appendChild(row);

      for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.r = i;
        cell.dataset.c = j;
        row.appendChild(cell);
      }
    }

    // cycle ship placement orientation, initialized to "h"
    const orientationBtn = document.querySelector(".orientationBtn");
    orientationBtn.addEventListener("click", (e) => {
      if (orientation === "h") {
        e.currentTarget.dataset.orientation = "v";
        orientation = "v";
        orientationBtn.textContent = "Vertical";
      } else {
        e.currentTarget.dataset.orientation = "h";
        orientation = "h";
        orientationBtn.textContent = "Horizontal";
      }
    });

    const gridShader = (
      coord,
      length,
      orientation,
      dragFits,
      placed = false,
    ) => {
      const offsetr = orientation === "h" ? 0 : 1;
      const offsetc = orientation === "h" ? 1 : 0;
      const addedClass = dragFits === true ? "fits" : "notFits";
      const currentCoord = [...coord];
      let cellCollection = [];

      for (let i = 0; i < length; i++) {
        const currentCell = document.querySelector(
          `[data-r="${currentCoord[0]}"][data-c="${currentCoord[1]}"]`,
        );
        cellCollection.push(currentCell);
        if (currentCell !== null) {
          currentCell.classList.add(`${addedClass}`);
        } else {
          continue;
        }
        console.log(
          `The coordinate ${currentCoord} should have got added with ${currentCell} element`,
        );
        currentCoord[0] += offsetr;
        currentCoord[1] += offsetc;
      }
      const firstCell = cellCollection[0];
      if (firstCell === null || firstCell === undefined) {
        console.log("there was no cell to revert classList");
        return;
      }
      firstCell.addEventListener("dragleave", (e) => {
        e.preventDefault();
        cellCollection.forEach((element) => {
          console.log(`class ${addedClass} being removed`);
          if (element !== null) {
            element.classList.remove(`${addedClass}`);
          }
        });
      });
    };

    const cells = document.querySelectorAll(".cell");

    // translates UI cell to a coordinate on a dragover event
    // checks if the ship dragged will fit
    cells.forEach((cell) => {
      const dragOverHandler = (e) => {
        e.preventDefault();

        cell.classList.add("mouseover");

        const r = Number(e.currentTarget.dataset.r);
        const c = Number(e.currentTarget.dataset.c);
        coord = [r, c];
        console.log(coord);
        dragFits = shipMakerProxy(
          playerObj.number,
          dragShipLength,
          coord,
          orientation,
          true,
        );
        if (dragFits) {
          // add classname for fits
          coordinates = coord;
          gridShader(coordinates, dragShipLength, orientation, dragFits, false);
        } else {
          // add classname for not fits
          coordinates = coord;
          gridShader(coordinates, dragShipLength, orientation, dragFits, false);
        }
        coordCalculated = true;
        cell.removeEventListener("dragover", dragOverHandler);
      };

      cell.addEventListener("dragover", dragOverHandler);
      cell.addEventListener("dragleave", (e) => {
        coordCalculated = false;
        cell.classList.remove("mouseover");
        cell.addEventListener("dragover", dragOverHandler);
      });
    });

    const shipIMG = new Image();
    shipIMG.src = "./images/sailboat.png";
    shipIMG.classList.add("shipIMG");
    shipIMG.style.width = "1rem";

    ships.forEach((ship) => {
      ship.addEventListener("dragstart", (e) => {
        const clone = ship.cloneNode(true);
        dragShipLength = Number(e.currentTarget.dataset.index);
        console.log("length: " + dragShipLength);
        dragShip = ship;

        // Set the offset for the drag image
        const offsetX = 20; // Set your desired offset value
        e.dataTransfer.setDragImage(clone, 0, 0);
        ship.classList.add("dragging");
      });

      ship.addEventListener("dragend", () => {
        ship.classList.remove("dragging");

        if (dragFits) {
          const placed = shipMakerProxy(
            playerObj.number,
            dragShipLength,
            coord,
            orientation,
          );
          if (placed) {
            console.log("a ship was placed ");
            // trigger the function to color the tiles where ship is placed.
            // temp until visual indicator of placed ship
          }
        }
        dragShip = undefined;
      });
    });

    // create method for checking the coordinate space on a hover event
    // create method for adding the ship to the location on the click event.
  }

  function shipRandomizer(playerObj) {
    let shipArr = [...playerObj.ships];

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
