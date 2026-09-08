const assert = require('assert');
const fs = require('fs');

global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

const domElements = {};
function mockElement() {
  return {
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    style: {
      setProperty: () => {}
    },
    appendChild: () => {},
    remove: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => mockElement(),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
}

global.document = {
  documentElement: mockElement(),
  body: mockElement(),
  createElement: () => mockElement(),
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = mockElement();
    return domElements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  playSound: () => {},
  triggerParticleBurst: () => {},
  showArrivalModal: () => {}
};

Object.defineProperty(global, 'player', {
  get() { return global.window.player; },
  set(val) { global.window.player = val; },
  configurable: true
});

// Load dependencies
eval(fs.readFileSync('d:/Orbit/js/storage.js', 'utf8'));
eval(fs.readFileSync('d:/Orbit/js/upgrades.js', 'utf8'));
eval(fs.readFileSync('d:/Orbit/js/journey.js', 'utf8'));
eval(fs.readFileSync('d:/Orbit/js/ui.js', 'utf8'));

resetPlayer();

console.log('Testing devToggleLaunchLimit...');
assert.strictEqual(player.dailyLaunchLimitDisabled, false);
devToggleLaunchLimit();
assert.strictEqual(player.dailyLaunchLimitDisabled, true);
devToggleLaunchLimit();
assert.strictEqual(player.dailyLaunchLimitDisabled, false);

console.log('Testing devResetLaunchCount...');
player.dailyLimits.launchesCountToday = 5;
devResetLaunchCount();
assert.strictEqual(player.dailyLimits.launchesCountToday, 0);

console.log('Testing devUnlockAllPlanetsAndShips...');
devUnlockAllPlanetsAndShips();
assert.strictEqual(player.unlockedPlanets.length, 6);
assert.strictEqual(player.spaceships.aegis.unlocked, true);
assert.strictEqual(player.spaceships.artemis.unlocked, true);
assert.strictEqual(player.spaceships.ares.unlocked, true);
assert.strictEqual(player.spaceships.jovian.unlocked, true);
assert.strictEqual(player.spaceships.chronos.unlocked, true);
assert.strictEqual(player.spaceships.sovereign.unlocked, true);

console.log('Testing renderHUD with all 6 planets unlocked...');
renderHUD();
console.log('renderHUD completed with zero errors!');

console.log('ALL DEV BUTTONS & UI RENDER TESTS PASSED! 🎉');
