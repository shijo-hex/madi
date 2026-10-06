/* ==========================================================================
   madi.me — shared engine
   Exposes window.Madi = { Engine, Character, Events, util, modes }
   Plain scripts (no bundler, no ES modules) so the prototype opens from disk too.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) document.body.classList.add("reduced-motion");
  var isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------------------------------------------------------------------
   * Tiny event bus — triggerEvent("plant-grow", payload) / Events.on(...)
   * ------------------------------------------------------------------- */
  var Events = (function () {
    var listeners = {};
    function on(name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return function off() {
        listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn; });
      };
    }
    function trigger(name, payload) {
      (listeners[name] || []).forEach(function (fn) { fn(payload); });
    }
    function clear() { listeners = {}; }
    return { on: on, trigger: trigger, clear: clear };
  })();

  /* ---------------------------------------------------------------------
   * Small DOM / animation helpers
   * ------------------------------------------------------------------- */
  var util = {
    reduceMotion: reduceMotion,
    isTouch: isTouch,
    el: function (tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    },
    rand: function (min, max) { return Math.random() * (max - min) + min; },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    },
    /* Floating feedback text ("BONK", "+1 ENERGY") anchored near an element */
    popText: function (anchorEl, text, container) {
      var host = container || anchorEl.parentElement || document.body;
      var r = anchorEl.getBoundingClientRect();
      var hostR = host.getBoundingClientRect();
      var n = util.el("span", "poptext", text);
      n.style.left = (r.left - hostR.left + r.width / 2) + "px";
      n.style.top = (r.top - hostR.top) + "px";
      n.style.transform = "translateX(-50%)";
      host.appendChild(n);
      setTimeout(function () { n.remove(); }, reduceMotion ? 50 : 950);
    },
    /* Fires a button-press/"hit" animation then removes the element */
    hitAndRemove: function (node, delay) {
      node.classList.add("-hit");
      setTimeout(function () { node.remove(); }, reduceMotion ? 10 : (delay || 400));
    },
    bounce: function (madi) { if (madi) madi.bounce(); }
  };

  /* ---------------------------------------------------------------------
   * Character — a small CSS-driven expressive sprite (no image assets)
   * ------------------------------------------------------------------- */
  function Character(container, opts) {
    opts = opts || {};
    this.el = util.el("div", "madi");
    this.el.setAttribute("aria-hidden", "true");
    this.el.dataset.state = "idle";
    this.el.innerHTML =
      '<div class="madi-shadow"></div>' +
      '<div class="madi-body" style="--madi-color:' + (opts.color || "#ff9f6b") + '">' +
      '<div class="madi-eye -l"></div><div class="madi-eye -r"></div>' +
      '<div class="madi-cheek -l"></div><div class="madi-cheek -r"></div>' +
      '<div class="madi-mouth"></div>' +
      "</div>";
    container.appendChild(this.el);
  }
  Character.prototype.setState = function (name) {
    this.el.dataset.state = name;
  };
  Character.prototype.bounce = function () {
    var el = this.el;
    el.classList.remove("-bounce"); void el.offsetWidth; el.classList.add("-bounce");
  };
  Character.prototype.shake = function () {
    var el = this.el;
    el.classList.remove("-shake"); void el.offsetWidth; el.classList.add("-shake");
  };
  Character.prototype.wobble = function (on) {
    this.el.classList.toggle("-wobble", !!on && !reduceMotion);
  };
  Character.prototype.say = function (dialogueEl, text, sub) {
    dialogueEl.innerHTML = text + (sub ? "<small>" + sub + "</small>" : "");
  };

  /* ---------------------------------------------------------------------
   * Engine — drives a mode's scene list. A "mode" is:
   *   { id, title, initialState(), scenes: [ { render(engine) } ], ending(engine) }
   * Each scene's render(engine) builds DOM into engine.stage and must call
   * engine.next() exactly once when its task completes. Register teardown
   * (timers/listeners) via engine.onCleanup(fn) so nothing double-fires.
   * ------------------------------------------------------------------- */
  function Engine(stageEl) {
    this.stage = stageEl;
    this.mode = null;
    this.state = null;
    this.sceneIndex = -1;
    this._cleanupFns = [];
    this._advancing = false;
  }
  Engine.prototype.start = function (mode) {
    Events.clear();
    this.mode = mode;
    this.state = mode.initialState();
    this.stage.dataset.mode = mode.id;
    this.sceneIndex = -1;
    this.next();
  };
  Engine.prototype.onCleanup = function (fn) { this._cleanupFns.push(fn); };
  Engine.prototype._teardown = function () {
    this._cleanupFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    this._cleanupFns = [];
  };
  Engine.prototype.next = function () {
    if (this._advancing) return; // guards double-advance from a double click/tap
    this._advancing = true;
    this._teardown();
    this.sceneIndex += 1;
    var scene = this.mode.scenes[this.sceneIndex];
    this.stage.innerHTML = "";
    if (!scene) {
      this.mode.ending(this);
      this._advancing = false;
      return;
    }
    var self = this;
    requestAnimationFrame(function () {
      scene.render(self);
      self._advancing = false;
    });
  };
  Engine.prototype.restart = function () { this.start(this.mode); };
  Engine.prototype.stop = function () {
    this._teardown();
    this.stage.innerHTML = "";
    this.stage.removeAttribute("data-mode");
    this.mode = null;
  };

  window.Madi = { Engine: Engine, Character: Character, Events: Events, util: util, modes: {} };
})();
