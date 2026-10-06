/* ==========================================================================
   madi.me — app boot: renders the selector screen and wires it to the engine
   ========================================================================== */
(function () {
  "use strict";
  var M = window.Madi, util = M.util;
  var stage = document.getElementById("stage");
  var menuLink = document.getElementById("menu-link");
  var engine = new M.Engine(stage);

  var CARDS = [
    {
      mode: "lazyDay", cls: "-a", shape: "-sleep",
      title: "Very Lazy Day", blurb: '"Five minutes." A comedy about getting through the morning.'
    },
    {
      mode: "littleWorld", cls: "-b", shape: "-leaf",
      title: "Little World", blurb: "Build a tiny world, one small task at a time."
    },
    {
      mode: "monster", cls: "-c", shape: "-monster",
      title: "Procrastination Monster", blurb: 'Defeat the thing that keeps saying "later."'
    }
  ];

  function showSelector() {
    engine.stop();
    menuLink.hidden = true;
    stage.innerHTML = "";
    var wrap = util.el("div", "selector");
    wrap.innerHTML =
      "<h1>What kind of day is it?</h1>" +
      '<p class="sub">Small tasks. Tiny adventures. Pick one.</p>';
    var grid = util.el("div", "mode-grid");
    wrap.appendChild(grid);

    CARDS.forEach(function (c) {
      var card = util.el("div", "mode-card " + c.cls);
      card.innerHTML =
        '<div class="icon"><div class="preview-shape ' + c.shape + '"></div></div>' +
        "<h2>" + c.title + "</h2>" +
        '<p class="desc">' + c.blurb + "</p>";
      var btn = util.el("button", "action-btn play-btn", "<span>Play</span>");
      btn.addEventListener("click", function () { playMode(c.mode); });
      card.appendChild(btn);
      grid.appendChild(card);
    });

    stage.appendChild(wrap);
  }

  function playMode(key) {
    var mode = M.modes[key];
    if (!mode) return;
    menuLink.hidden = false;
    engine.start(mode);
  }

  menuLink.addEventListener("click", function (e) {
    e.preventDefault();
    showSelector();
  });

  showSelector();
})();
