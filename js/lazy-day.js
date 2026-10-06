/* ==========================================================================
   madi.me — Version A: MADI'S VERY LAZY DAY
   Comedy + character interaction. The quickest fully playable version.
   ========================================================================== */
(function () {
  "use strict";
  var M = window.Madi, util = M.util;

  function shell(engine, clock) {
    var scene = util.el("div", "scene");
    var clockEl = util.el("div", "scene-clock", clock);
    var room = util.el("div", "room");
    room.style.background = "var(--a-surface)";
    var charWrap = util.el("div");
    var dialogue = util.el("p", "dialogue");
    var actions = util.el("div", "scene-actions");
    room.appendChild(charWrap);
    scene.appendChild(clockEl);
    scene.appendChild(room);
    scene.appendChild(dialogue);
    scene.appendChild(actions);
    engine.stage.appendChild(scene);
    var madi = new M.Character(charWrap, { color: "#ff9f6b" });
    return { scene: scene, room: room, dialogue: dialogue, actions: actions, madi: madi };
  }

  function continueBtn(actions, label, onClick) {
    var btn = util.el("button", "action-btn -solid", "<span>" + label + "</span>");
    btn.addEventListener("click", onClick);
    actions.appendChild(btn);
    btn.focus();
    return btn;
  }

  function placeRandom(node) {
    node.style.left = util.rand(10, 70) + "%";
    node.style.top = util.rand(15, 60) + "%";
  }

  /* ---------------- Scene 0: Wake Up ---------------- */
  var wakeUp = {
    render: function (engine) {
      var ui = shell(engine, "10:47 AM");
      ui.madi.setState("sleeping");
      ui.madi.say(ui.dialogue, "ZZZZZ&hellip;");

      var alarm = util.el("button", "prop -moving", "\u23F0");
      alarm.setAttribute("aria-label", "Alarm clock — tap to stop it");
      placeRandom(alarm);
      ui.room.appendChild(alarm);

      var lines = ["five more minutes.", "okay, maybe ten.", "BONK"];
      var tries = 0;
      var done = false;

      function onTap() {
        if (done) return;
        tries++;
        ui.madi.shake();
        if (tries < 3) {
          ui.madi.setState("annoyed");
          ui.madi.say(ui.dialogue, '"' + lines[tries - 1] + '"');
          placeRandom(alarm);
          return;
        }
        done = true;
        ui.madi.setState("annoyed");
        util.popText(alarm, "BONK");
        alarm.remove();
        ui.room.classList.add("-bright");
        setTimeout(function () {
          ui.madi.say(ui.dialogue, "\u201CFine.\u201D");
          engine.state.energy += 1;
          util.popText(ui.dialogue, "+1 ENERGY");
          continueBtn(ui.actions, "Get up", function () { engine.next(); });
        }, util.reduceMotion ? 10 : 450);
      }
      alarm.addEventListener("click", onTap);
      engine.onCleanup(function () { alarm.removeEventListener("click", onTap); });
    }
  };

  /* ---------------- Scene 1: Breakfast Disaster ---------------- */
  var breakfast = {
    render: function (engine) {
      var ui = shell(engine, "11:02 AM");
      ui.madi.setState("idle");
      ui.madi.say(ui.dialogue, "Time for breakfast.");

      var steps = [
        { emoji: "\uD83C\uDF5E", label: "Catch the toast", pop: "CATCH" },
        { emoji: "\u2615", label: "Stop the cup", pop: "STOP" },
        { emoji: "\uD83E\uDD5B", label: "Save the milk", pop: "SAVED" }
      ];
      var step = 0;
      var done = false;

      function renderStep() {
        var old = ui.room.querySelector(".prop");
        if (old) old.remove();
        if (step >= steps.length) {
          ui.madi.setState("happy");
          ui.madi.say(ui.dialogue, "Madi finally eats.");
          engine.state.energy += 2; engine.state.mood += 1;
          util.popText(ui.dialogue, "+2 ENERGY \u00B7 +1 MOOD");
          setTimeout(function () {
            continueBtn(ui.actions, "Head out", function () { engine.next(); });
          }, util.reduceMotion ? 10 : 500);
          return;
        }
        var s = steps[step];
        ui.madi.setState("surprised");
        ui.madi.say(ui.dialogue, s.label + "!");
        var prop = util.el("button", "prop -moving", s.emoji);
        prop.setAttribute("aria-label", s.label);
        placeRandom(prop);
        ui.room.appendChild(prop);
        function onTap() {
          if (done) return;
          util.popText(prop, s.pop);
          util.hitAndRemove(prop, 380);
          ui.madi.bounce();
          step++;
          setTimeout(renderStep, util.reduceMotion ? 10 : 420);
        }
        prop.addEventListener("click", onTap);
        engine.onCleanup(function () { prop.removeEventListener("click", onTap); });
      }
      engine.onCleanup(function () { done = true; });
      renderStep();
    }
  };

  /* ---------------- Scene 2: Lost Sock ---------------- */
  var lostSock = {
    render: function (engine) {
      var ui = shell(engine, "11:40 AM");
      ui.madi.setState("confused");
      ui.madi.say(ui.dialogue, "Where is my other sock?");

      var spots = [
        { icon: "\uD83E\uDEB4", name: "under the bed", line: "just dust." },
        { icon: "\uD83E\uDEB4", name: "behind the plant", line: "not here." },
        { icon: "\uD83D\uDDC4\uFE0F", name: "the drawer", line: "old receipt." },
        { icon: "\uD83D\uDCA1", name: "the lamp", line: "why would it be here?" },
        { icon: "\uD83E\uDE91", name: "the chair", line: "just a sweater." },
        { icon: "\uD83D\uDCDA", name: "the bookshelf", line: "a very old sandwich." }
      ];
      var sockAt = Math.floor(util.rand(0, spots.length));

      var grid = util.el("div", "hotspots");
      ui.scene.insertBefore(grid, ui.dialogue.nextSibling);
      var found = false;

      spots.forEach(function (spot, i) {
        var btn = util.el("button", "hotspot", spot.icon);
        btn.setAttribute("aria-label", "Check " + spot.name);
        grid.appendChild(btn);
        function onTap() {
          if (found) return;
          if (i === sockAt) {
            found = true;
            btn.textContent = "\uD83E\uDDE6";
            ui.madi.setState("excited"); ui.madi.bounce();
            ui.madi.say(ui.dialogue, "Found it!");
            setTimeout(startChase, util.reduceMotion ? 10 : 700);
          } else {
            btn.classList.add("-found");
            ui.madi.say(ui.dialogue, '"' + spot.line + '"');
          }
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });

      function startChase() {
        grid.remove();
        ui.madi.say(ui.dialogue, "A cat steals it and runs.");
        var cat = util.el("button", "prop -moving", "\uD83D\uDC08");
        cat.setAttribute("aria-label", "Chase the cat");
        placeRandom(cat);
        ui.room.appendChild(cat);
        var taps = 0;
        function onCatTap() {
          taps++;
          ui.madi.shake();
          if (taps < 3) {
            placeRandom(cat);
            util.popText(cat, util.pick(["zoom!", "nope!", "too slow!"]));
            return;
          }
          cat.remove();
          ui.madi.setState("confused");
          ui.madi.say(ui.dialogue, '"...worth it."');
          engine.state.discoveries.push("a very fast cat");
          util.popText(ui.dialogue, "+1 DISCOVERY");
          setTimeout(function () {
            continueBtn(ui.actions, "Let it go", function () { engine.next(); });
          }, util.reduceMotion ? 10 : 500);
        }
        cat.addEventListener("click", onCatTap);
        engine.onCleanup(function () { cat.removeEventListener("click", onCatTap); });
      }
    }
  };

  /* ---------------- Scene 3: Clean the Mess ---------------- */
  var cleanMess = {
    render: function (engine) {
      var ui = shell(engine, "12:10 PM");
      ui.madi.setState("idle");
      ui.madi.say(ui.dialogue, "Maybe I should clean this.", "Pick a thing, then pick where it goes.");

      var items = [
        { icon: "\uD83D\uDC55", name: "shirt", home: "closet" },
        { icon: "\uD83D\uDCDA", name: "book", home: "shelf" },
        { icon: "\u2615", name: "mug", home: "sink" },
        { icon: "\uD83D\uDCF1", name: "phone", home: "desk" }
      ];
      var zones = ["closet", "shelf", "sink", "desk"];

      var pool = util.el("div", "hotspots");
      var zoneWrap = util.el("div", "hotspots");
      ui.scene.insertBefore(zoneWrap, ui.dialogue.nextSibling);
      ui.scene.insertBefore(pool, zoneWrap);

      var selected = null;
      var placedCount = 0;

      items.forEach(function (item) {
        var btn = util.el("button", "hotspot", item.icon);
        btn.setAttribute("aria-label", item.name);
        btn.dataset.home = item.home;
        pool.appendChild(btn);
        function onTap() {
          if (btn.classList.contains("-found")) return;
          Array.prototype.forEach.call(pool.children, function (c) { c.style.outline = ""; });
          selected = btn;
          btn.style.outline = "3px solid currentColor";
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });

      zones.forEach(function (zone) {
        var btn = util.el("button", "hotspot", "\u2B1C\n" + zone);
        btn.style.fontSize = "13px";
        btn.setAttribute("aria-label", "Put it in the " + zone);
        zoneWrap.appendChild(btn);
        function onTap() {
          if (!selected) { ui.madi.say(ui.dialogue, "Pick something up first."); return; }
          if (selected.dataset.home === zone) {
            util.popText(btn, "\u2728");
            selected.classList.add("-found");
            ui.madi.bounce();
            placedCount++;
            selected = null;
            if (placedCount >= items.length) finish();
          } else {
            ui.madi.setState("confused");
            ui.madi.say(ui.dialogue, '"That isn\u2019t helping."');
            ui.madi.setState("idle");
          }
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });

      function finish() {
        ui.madi.setState("happy");
        ui.madi.say(ui.dialogue, "Noticeably cleaner.");
        setTimeout(function () {
          continueBtn(ui.actions, "Almost ready", function () { engine.next(); });
        }, util.reduceMotion ? 10 : 500);
      }
    }
  };

  /* ---------------- Scene 4: Leave the House ---------------- */
  var leaveHouse = {
    render: function (engine) {
      var ui = shell(engine, "6:55 PM");
      ui.madi.setState("idle");
      ui.madi.say(ui.dialogue, "Wait.", "Phone, keys, water — find all three.");

      var needed = ["\uD83D\uDCF1", "\uD83D\uDD11", "\uD83D\uDCA7"];
      var spots = ["\uD83D\uDECB\uFE0F", "\uD83D\uDECF\uFE0F", "\uD83E\uDDFA", "\uD83D\uDCDA", "\uD83D\uDDC4\uFE0F", "\uD83D\uDECA"];
      var assigned = util.shuffle(spots).slice(0, needed.length);
      var map = {};
      needed.forEach(function (n, i) { map[assigned[i]] = n; });

      var grid = util.el("div", "hotspots");
      ui.scene.insertBefore(grid, ui.dialogue.nextSibling);
      var packed = 0;

      spots.forEach(function (icon) {
        var btn = util.el("button", "hotspot", icon);
        grid.appendChild(btn);
        function onTap() {
          if (btn.classList.contains("-packed")) return;
          if (map[icon]) {
            btn.textContent = map[icon];
            btn.classList.add("-packed");
            util.popText(btn, "packed");
            ui.madi.bounce();
            packed++;
            if (packed >= needed.length) finish();
          } else {
            ui.madi.say(ui.dialogue, '"Not here."');
          }
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      });

      function finish() {
        ui.madi.setState("excited");
        ui.madi.say(ui.dialogue, "The door opens.");
        setTimeout(function () { engine.next(); }, util.reduceMotion ? 10 : 700);
      }
    }
  };

  /* ---------------- Ending ---------------- */
  function ending(engine) {
    var ui = shell(engine, "7:21 PM");
    ui.room.style.background = "linear-gradient(180deg, #ffb37b, var(--a-surface))";
    ui.madi.setState("happy");
    ui.madi.say(ui.dialogue, "\u201CThat wasn\u2019t so bad.\u201D", "\u201CTomorrow?\u201D");
    var stats = util.el(
      "p", "hint",
      "Energy " + engine.state.energy + " \u00B7 Mood " + engine.state.mood + " \u00B7 Discoveries " + engine.state.discoveries.length
    );
    ui.scene.insertBefore(stats, ui.actions);
    continueBtn(ui.actions, "Do it again", function () { engine.restart(); });
  }

  M.modes.lazyDay = {
    id: "lazy-day",
    title: "Madi's Very Lazy Day",
    initialState: function () { return { energy: 0, mood: 0, discoveries: [] }; },
    scenes: [wakeUp, breakfast, lostSock, cleanMess, leaveHouse],
    ending: ending
  };
})();
