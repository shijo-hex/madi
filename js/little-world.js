/* ==========================================================================
   madi.me — Version B: MADI'S LITTLE WORLD
   Cozy world-building. Every task visibly and permanently changes the
   shared world scene (re-derived from state on every render).
   ========================================================================== */
(function () {
  "use strict";
  var M = window.Madi, util = M.util;

  function shell(engine, clock) {
    var scene = util.el("div", "scene");
    var clockEl = util.el("div", "scene-clock", clock);
    var world = util.el("div", "world-scene");
    var dialogue = util.el("p", "dialogue");
    var actions = util.el("div", "scene-actions");
    scene.appendChild(clockEl);
    scene.appendChild(world);
    scene.appendChild(dialogue);
    scene.appendChild(actions);
    engine.stage.appendChild(scene);
    return { scene: scene, world: world, dialogue: dialogue, actions: actions };
  }

  function continueBtn(actions, label, onClick) {
    var btn = util.el("button", "action-btn -solid", "<span>" + label + "</span>");
    btn.addEventListener("click", onClick);
    actions.appendChild(btn);
    btn.focus();
    return btn;
  }

  function renderWorld(world, state) {
    world.innerHTML = "";
    world.classList.toggle("-dusk", state.timeOfDay === "dusk");
    world.classList.toggle("-night", state.timeOfDay === "night");

    var house = util.el("div", "w-house");
    var window1 = util.el("div", "w-window" + (state.windowClean ? " -lit" : ""));
    house.appendChild(window1);
    world.appendChild(house);

    var plant = util.el("div", "w-plant");
    var stageHeight = [0, 14, 26, 40][state.plantStage || 0];
    var stageColor = ["#7fb685", "#7fb685", "#6fae7a", "#e07a5f"][state.plantStage || 0];
    var leaf = document.createElement("i");
    leaf.style.height = stageHeight + "px";
    leaf.style.background = stageColor;
    plant.appendChild(leaf);
    world.appendChild(plant);

    if (state.friendsHelped > 0) {
      for (var p = 0; p < state.friendsHelped; p++) {
        var extra = util.el("div", "w-plant");
        extra.style.left = (58 + p * 8) + "%";
        var leaf2 = document.createElement("i");
        leaf2.style.height = "30px"; leaf2.style.background = "#c9b8e8";
        extra.appendChild(leaf2);
        world.appendChild(extra);
      }
    }

    var shelf = util.el("div", "w-shelf");
    var book = util.el("div", "w-book");
    book.style.left = "8px";
    book.style.height = state.shelfBook ? "22px" : "0px";
    shelf.appendChild(book);
    world.appendChild(shelf);

    var rug = util.el("div", "w-rug");
    rug.style.left = "50%"; rug.style.transform = "translateX(-50%)";
    rug.style.width = state.rugDone ? "160px" : "0px";
    world.appendChild(rug);

    if (state.timeOfDay === "night") {
      for (var s = 0; s < 14; s++) {
        var star = util.el("div", "w-star");
        star.style.left = util.rand(4, 96) + "%";
        star.style.top = util.rand(4, 40) + "%";
        star.style.opacity = "1";
        world.appendChild(star);
      }
    }
  }

  /* ---------------- Scene 0: Water the Plant ---------------- */
  var waterPlant = {
    render: function (engine) {
      var ui = shell(engine, "MORNING");
      renderWorld(ui.world, engine.state);
      ui.dialogue.textContent = "The garden feels a little empty. Water the plant \u2014 tap it a few times.";

      var tapBtn = util.el("button", "prop", "\uD83D\uDEBF");
      tapBtn.setAttribute("aria-label", "Water the plant");
      tapBtn.style.position = "absolute";
      tapBtn.style.left = "44%"; tapBtn.style.bottom = "8%";
      ui.world.appendChild(tapBtn);

      function onTap() {
        if (engine.state.plantStage >= 3) return;
        engine.state.plantStage++;
        util.popText(tapBtn, "\uD83D\uDCA7");
        renderWorld(ui.world, engine.state);
        ui.world.appendChild(tapBtn);
        if (engine.state.plantStage >= 3) {
          ui.dialogue.textContent = "It bloomed.";
          setTimeout(function () {
            continueBtn(ui.actions, "Keep going", function () { engine.next(); });
          }, util.reduceMotion ? 10 : 500);
        }
      }
      tapBtn.addEventListener("click", onTap);
      engine.onCleanup(function () { tapBtn.removeEventListener("click", onTap); });
    }
  };

  /* ---------------- Scene 1: Clean the House ---------------- */
  var cleanHouse = {
    render: function (engine) {
      var ui = shell(engine, "MIDDAY");
      renderWorld(ui.world, engine.state);
      ui.dialogue.textContent = "A window, a shelf, a floor \u2014 fix each one.";

      var grid = util.el("div", "hotspots");
      ui.scene.insertBefore(grid, ui.dialogue);

      var tasks = [
        { icon: "\uD83E\uDEDF", label: "clean window", key: "windowClean" },
        { icon: "\uD83D\uDCDA", label: "add a book", key: "shelfBook" },
        { icon: "\uD83E\uDDF9", label: "lay the rug", key: "rugDone" }
      ];
      var doneCount = 0;
      tasks.forEach(function (t) {
        var btn = util.el("button", "hotspot", t.icon);
        btn.setAttribute("aria-label", t.label);
        grid.appendChild(btn);
        function onTap() {
          if (engine.state[t.key]) return;
          engine.state[t.key] = true;
          btn.classList.add("-found");
          renderWorld(ui.world, engine.state);
          doneCount++;
          if (doneCount >= tasks.length) {
            ui.dialogue.textContent = "I made this.";
            setTimeout(function () {
              continueBtn(ui.actions, "Keep going", function () { engine.next(); });
            }, util.reduceMotion ? 10 : 500);
          }
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });
    }
  };

  /* ---------------- Scene 2: Help a Neighbor ---------------- */
  var helpNeighbor = {
    render: function (engine) {
      var ui = shell(engine, "AFTERNOON");
      renderWorld(ui.world, engine.state);
      ui.dialogue.textContent = '"I lost my blue umbrella\u2026 have you seen it?"';

      var grid = util.el("div", "hotspots");
      ui.scene.insertBefore(grid, ui.dialogue);
      var spots = ["\uD83C\uDF33", "\uD83D\uDECB\uFE0F", "\uD83D\uDDC4\uFE0F", "\uD83E\uDDFA", "\uD83D\uDECA"];
      var umbrellaAt = Math.floor(util.rand(0, spots.length));
      var found = false;

      spots.forEach(function (icon, i) {
        var btn = util.el("button", "hotspot", icon);
        grid.appendChild(btn);
        function onTap() {
          if (found) return;
          if (i === umbrellaAt) {
            found = true;
            btn.textContent = "\u2614";
            util.popText(btn, "found it!");
            engine.state.friendsHelped++;
            renderWorld(ui.world, engine.state);
            grid.appendChild(btn);
            ui.dialogue.textContent = '"Thank you \u2014 take this for your garden."';
            setTimeout(function () {
              continueBtn(ui.actions, "Evening falls", function () { engine.next(); });
            }, util.reduceMotion ? 10 : 700);
          } else {
            btn.classList.add("-found");
          }
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });
    }
  };

  /* ---------------- Scene 3: Night Falls ---------------- */
  var nightFalls = {
    render: function (engine) {
      var ui = shell(engine, "EVENING");
      engine.state.timeOfDay = "dusk";
      renderWorld(ui.world, engine.state);
      ui.dialogue.textContent = "The sky changes.";
      setTimeout(function () {
        engine.state.timeOfDay = "night";
        renderWorld(ui.world, engine.state);
        ui.dialogue.textContent = "The lights come on.";
        setTimeout(function () {
          continueBtn(ui.actions, "See your world", function () { engine.next(); });
        }, util.reduceMotion ? 10 : 700);
      }, util.reduceMotion ? 10 : 1100);
    }
  };

  /* ---------------- Ending ---------------- */
  function ending(engine) {
    var ui = shell(engine, "NIGHT");
    engine.state.timeOfDay = "night";
    renderWorld(ui.world, engine.state);
    ui.dialogue.textContent = "YOUR LITTLE WORLD";
    var stats = util.el(
      "p", "hint",
      "1 plant grown \u00B7 " + engine.state.friendsHelped + " friend helped \u00B7 3 chores done"
    );
    ui.scene.insertBefore(stats, ui.actions);
    continueBtn(ui.actions, "Keep exploring", function () { engine.restart(); });
  }

  M.modes.littleWorld = {
    id: "little-world",
    title: "Madi's Little World",
    initialState: function () {
      return { plantStage: 0, windowClean: false, shelfBook: false, rugDone: false, friendsHelped: 0, timeOfDay: "day" };
    },
    scenes: [waterPlant, cleanHouse, helpNeighbor, nightFalls],
    ending: ending
  };
})();
