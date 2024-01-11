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
    const rancoordinates = [];

    rancoordinates.push(cCoord, rCoord);

    return rancoordinates;
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
    let orientation = "h";
    let coord = [];
    let mowCount = 1;
    let frigCount = 2;
    let schoonCount = 3;
    let sloopCount = 2;

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
      let addedClass = "";

      // 3 shading possiblities fits/nofits/placed
      if (placed === true) {
        addedClass = "placed";
      } else {
        addedClass = dragFits === true ? "fits" : "notFits";
      }

      const currentCoord = [...coord];
      let cellCollection = [];

      // shade each cell representing ship length
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
        currentCoord[0] += offsetr;
        currentCoord[1] += offsetc;
      }
      // after shade, dragleave handler to clear shading when not placed
      const firstCell = cellCollection[0];
      if (firstCell === null || firstCell === undefined || placed === true) {
        return;
      }
      firstCell.addEventListener("dragleave", (e) => {
        e.preventDefault();
        cellCollection.forEach((element) => {
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
        console.log(`coord before proxy: ${coord}`);
        dragFits = shipMakerProxy(
          playerObj.number,
          dragShipLength,
          coord,
          orientation,
          true,
        );
        console.log(`coord post shipmaker: ${coord}`);
        if (dragFits) {
          // add classname for fits
          gridShader(coord, dragShipLength, orientation, dragFits, false);
        } else {
          // add classname for not fits
          gridShader(coord, dragShipLength, orientation, dragFits, false);
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
      const shipDragHandler = (e) => {
        dragShipLength = Number(e.currentTarget.dataset.index);
        let remainingShips = "";
        switch (dragShipLength) {
          case 5:
            remainingShips = mowCount;
            mowCount -= 1;
            break;
          case 4:
            remainingShips = frigCount;
            frigCount -= 1;
            break;
          case 3:
            remainingShips = schoonCount;
            schoonCount -= 1;
            break;
          case 2:
            remainingShips = sloopCount;
            sloopCount -= 1;
            break;
          default:
            console.error("error: invalid ship length in dragShip");
        }
        if (remainingShips > 0) {
          const clone = ship.cloneNode(true);
          dragShip = ship;
          // Set the offset for the drag image
          const offsetX = 20; // Set your desired offset value
          e.dataTransfer.setDragImage(clone, 0, 0);
          ship.classList.add("dragging");
          remainingShips -= 1;
        }
        if (remainingShips <= 0) {
          console.log("no more ships remaining");
          // add effect to grey out the ship
          // remove the draghandler
          ship.classList.add("depleted");
          ship.removeEventListener("dragstart", shipDragHandler);
        }
      };

      ship.addEventListener("dragstart", shipDragHandler);

      ship.addEventListener("dragend", () => {
        ship.classList.remove("dragging");

        if (dragFits) {
          console.log(`coord before placing is : ${coord}`);
          const placed = shipMakerProxy(
            playerObj.number,
            dragShipLength,
            coord,
            orientation,
            false,
          );

          console.log(`coord after placing is : ${coord}`);
          if (placed) {
            gridShader(coord, dragShipLength, orientation, dragFits, true);
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
        const rancoordinates = randomCoord();
        const random = Math.floor(Math.random() * 2);
        const axis = random === 0 ? "h" : "v";

        // shipMakerProxy returns false if was not able to place ship at random spot, trys again
        placed = shipMakerProxy(
          playerObj.number,
          shipLength,
          rancoordinates,
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
  startScreen();
  return { pObjInitializer, sendMove };
};

module.exports = userInterface;
