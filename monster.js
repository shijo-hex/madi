/* ==========================================================================
   madi.me — Version C: MADI VS THE PROCRASTINATION MONSTER
   The most "game-like" version: an HP bar, decoy distractions, and a
   final four-step sequence that finishes the monster off — cute, not scary.
   ========================================================================== */
(function () {
  "use strict";
  var M = window.Madi, util = M.util;

  function shell(engine, clock) {
    var scene = util.el("div", "scene");
    var clockEl = util.el("div", "scene-clock", clock);
    var hud = util.el("div", "c-hud");
    var madiWrap = util.el("div");
    var monsterWrap = util.el("div", "monster");
    monsterWrap.innerHTML =
      '<div class="monster-body"></div><div class="monster-eye -l"></div><div class="monster-eye -r"></div>';
    var row = util.el("div");
    row.style.cssText = "display:flex;gap:40px;align-items:flex-end;justify-content:center;";
    row.appendChild(madiWrap);
    row.appendChild(monsterWrap);
    var dialogue = util.el("p", "dialogue");
    var actions = util.el("div", "scene-actions");
    scene.appendChild(clockEl);
    scene.appendChild(hud);
    scene.appendChild(row);
    scene.appendChild(dialogue);
    scene.appendChild(actions);
    engine.stage.appendChild(scene);
    var madi = new M.Character(madiWrap, { color: "#4c7cff" });
    renderHud(hud, engine.state);
    return { scene: scene, hud: hud, dialogue: dialogue, actions: actions, madi: madi, monster: monsterWrap };
  }

  function renderHud(hud, state) {
    hud.innerHTML =
      '<div class="bar-wrap"><span>Madi energy</span><div class="c-bar -energy"><i style="width:' + state.energy + '%"></i></div></div>' +
      '<div class="bar-wrap"><span>Procrastination monster</span><div class="c-bar -monster"><i style="width:' + state.monsterHp + '%"></i></div></div>';
  }

  function continueBtn(actions, label, onClick) {
    var btn = util.el("button", "action-btn -solid", "<span>" + label + "</span>");
    btn.addEventListener("click", onClick);
    actions.appendChild(btn);
    btn.focus();
    return btn;
  }

  function hitMonster(engine, ui, amount, hitLabel) {
    engine.state.monsterHp = Math.max(0, engine.state.monsterHp - amount);
    engine.state.energy = Math.min(100, engine.state.energy + Math.round(amount / 2));
    renderHud(ui.hud, engine.state);
    ui.monster.classList.remove("-shrink"); void ui.monster.offsetWidth; ui.monster.classList.add("-shrink");
    var scale = 0.4 + (engine.state.monsterHp / 100) * 0.6;
    ui.monster.style.transform = "scale(" + scale + ")";
    util.popText(ui.monster, hitLabel || "DIRECT HIT");
    ui.madi.setState("excited"); ui.madi.bounce();
  }

  /* A round: one real target among a few harmless decoys. Decoys never punish,
     they just make the monster gloat — per brief, "do not punish heavily". */
  function distractionRound(engine, ui, opts) {
    var options = util.shuffle(opts.decoys.concat([{ real: true, label: opts.realLabel, icon: opts.realIcon }]));
    var wrap = util.el("div", "scene-actions");
    ui.scene.insertBefore(wrap, ui.dialogue.nextSibling);
    var done = false;
    options.forEach(function (opt) {
      var btn = util.el("button", "distraction-btn" + (opt.real ? "" : " -decoy"), (opt.icon ? opt.icon + " " : "") + opt.label);
      wrap.appendChild(btn);
      function onTap() {
        if (done) return;
        if (opt.real) {
          done = true;
          wrap.remove();
          hitMonster(engine, ui, opts.damage, opts.hitLabel);
          setTimeout(opts.onDone, util.reduceMotion ? 10 : 550);
        } else {
          ui.madi.setState("confused"); ui.madi.shake();
          util.popText(btn, "monster laughs");
        }
      }
      btn.addEventListener("click", onTap);
      engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
    });
  }

  /* ---------------- Scene 0: Get Up ---------------- */
  var getUp = {
    render: function (engine) {
      var ui = shell(engine, "7:00 AM");
      ui.madi.setState("sleeping");
      ui.monster.classList.add("-wobble");
      ui.dialogue.textContent = '"Stay in bed," says the monster.';
      distractionRound(engine, ui, {
        decoys: [{ label: "five more minutes" }, { label: "just one more dream" }],
        realLabel: "Get up", realIcon: "\u2600\uFE0F",
        damage: 25, hitLabel: "SLAP",
        onDone: function () { engine.next(); }
      });
    }
  };

  /* ---------------- Scene 1: Drink Water ---------------- */
  var drinkWater = {
    render: function (engine) {
      var ui = shell(engine, "7:20 AM");
      ui.madi.setState("idle");
      ui.dialogue.textContent = "The monster throws out a few distractions.";
      distractionRound(engine, ui, {
        decoys: [{ label: "check phone" }, { label: "one more video" }, { label: "scroll a bit" }],
        realLabel: "Drink water", realIcon: "\uD83D\uDCA7",
        damage: 25, hitLabel: "SPLASH",
        onDone: function () { engine.next(); }
      });
    }
  };

  /* ---------------- Scene 2: Clean Room ---------------- */
  var cleanRoom = {
    render: function (engine) {
      var ui = shell(engine, "7:40 AM");
      ui.madi.setState("idle");
      ui.dialogue.textContent = "The monster splits into smaller excuses.";
      distractionRound(engine, ui, {
        decoys: [{ label: "just check this", icon: "\uD83D\uDCF1" }, { label: "five minutes", icon: "\uD83C\uDFAE" }, { label: "come back to bed", icon: "\uD83D\uDECF\uFE0F" }],
        realLabel: "Tidy up", realIcon: "\uD83E\uDDF9",
        damage: 25, hitLabel: "TIDY",
        onDone: function () { engine.next(); }
      });
    }
  };

  /* ---------------- Scene 3: Final sequence — Go Outside ---------------- */
  var finalSequence = {
    render: function (engine) {
      var ui = shell(engine, "8:05 AM");
      ui.madi.setState("confused");
      ui.dialogue.textContent = "The monster gets huge. Finish the sequence.";

      var steps = [
        { icon: "\uD83D\uDC5F", label: "Put on shoes" },
        { icon: "\uD83D\uDD11", label: "Get keys" },
        { icon: "\uD83D\uDEAA", label: "Open door" },
        { icon: "\uD83D\uDEB6", label: "Walk" }
      ];
      var i = 0;
      var wrap = util.el("div", "scene-actions");
      ui.scene.insertBefore(wrap, ui.dialogue.nextSibling);

      function renderStep() {
        wrap.innerHTML = "";
        if (i >= steps.length) {
          ui.dialogue.textContent = '"...fine." *poof*';
          engine.state.monsterHp = 0;
          ui.monster.classList.add("-gone");
          renderHud(ui.hud, engine.state);
          setTimeout(function () { engine.next(); }, util.reduceMotion ? 10 : 800);
          return;
        }
        var s = steps[i];
        var btn = util.el("button", "distraction-btn", s.icon + " " + s.label);
        wrap.appendChild(btn);
        function onTap() {
          hitMonster(engine, ui, 20, s.label.toUpperCase());
          i++;
          renderStep();
        }
        btn.addEventListener("click", onTap);
        engine.onCleanup(function () { btn.removeEventListener("click", onTap); });
      }
      renderStep();
    }
  };

  /* ---------------- Ending ---------------- */
  function ending(engine) {
    var ui = shell(engine, "8:10 AM");
    ui.monster.style.transform = "scale(.3)"; /* tiny now, but still around — Madi keeps it */
    ui.madi.setState("happy");
    ui.dialogue.innerHTML = '"See you tomorrow," says the tiny monster.';
    var stats = util.el("p", "hint", "Monster defeated \u00B7 Energy " + engine.state.energy);
    ui.scene.insertBefore(stats, ui.actions);
    continueBtn(ui.actions, "Go again", function () { engine.restart(); });
  }

  M.modes.monster = {
    id: "monster",
    title: "Madi vs the Procrastination Monster",
    initialState: function () { return { energy: 10, monsterHp: 100 }; },
    scenes: [getUp, drinkWater, cleanRoom, finalSequence],
    ending: ending
  };
})();
