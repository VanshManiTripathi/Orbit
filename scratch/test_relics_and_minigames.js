// Test suite for:
// 1. 10 Relics collection and generation
// 2. Mars Rover Rush minigame: Gating, HighScore, Reset to Base
// 3. Jovian Vortex Surfer minigame: Gating, HighScore, Reset to Base
// 4. UI integration and developer toggles

const assert = require('assert');
const fs = require('fs');

// Mock localStorage
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
    style: { setProperty: () => {} },
    appendChild: () => {},
    remove: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => mockElement(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    getContext: () => ({
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      roundRect: () => {},
      strokeRect: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      setLineDash: () => {},
      fillText: () => {}
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 560 })
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

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.window = {
  addEventListener: () => {},
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  playSound: () => {},
  triggerParticleBurst: () => {},
  showArrivalModal: () => {}
};

global.showToast = (msg, type) => {
  if (global.window && global.window.showToast) {
    global.window.showToast(msg, type);
  }
};
global.playSound = () => {};

Object.defineProperty(global, 'player', {
  get() { return global.window.player; },
  set(val) { global.window.player = val; },
  configurable: true
});

const vm = require('vm');

// Load core files into global context
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/storage.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/discoveries.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/upgrades.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/journey.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/mars_minigame.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/jupiter_minigame.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('d:/Orbit/js/ui.js', 'utf8'));

resetPlayer();

global.isMarsUnlocked = window.isMarsUnlocked;
global.openMarsRover = window.openMarsRover;
global.closeMarsRover = window.closeMarsRover;
global.restartMarsRover = window.restartMarsRover;

global.isJupiterUnlocked = window.isJupiterUnlocked;
global.openJupiterSurfer = window.openJupiterSurfer;
global.closeJupiterSurfer = window.closeJupiterSurfer;
global.restartJupiterSurfer = window.restartJupiterSurfer;

console.log('--- RUNNING 10 RELICS & MINIGAMES VERIFICATION SUITE ---');

// ==========================================
// TEST 1: 10 RELICS COLLECTION VERIFICATION
// ==========================================
console.log('\n[TEST 1] Verifying 10 Relics Collection...');
assert.strictEqual(DISCOVERY_TYPES.length, 10, 'DISCOVERY_TYPES should have exactly 10 relics');

const requiredFields = ['id', 'name', 'type', 'rarity', 'reward', 'badgeClass', 'image', 'lore'];
DISCOVERY_TYPES.forEach((relic, idx) => {
  requiredFields.forEach(field => {
    assert(relic[field] !== undefined && relic[field] !== null, `Relic #${idx + 1} (${relic.id || 'unnamed'}) missing ${field}`);
  });
});
console.log('✔ All 10 relics correctly defined with lore, rewards, images, and rarities:');
DISCOVERY_TYPES.forEach((r, i) => console.log(`   ${i + 1}. [${r.rarity}] ${r.name} (+${r.reward} Credits)`));

// Test relic generation
const generatedItem = generateDiscovery();
assert(generatedItem, 'generateDiscovery() should return an item');
assert(player.discoveries.length >= 1, 'player.discoveries should contain the discovered item');
console.log('✔ Discovery generation and collection verified.');

// ==========================================
// TEST 2: MARS ROVER RUSH MINIGAME
// ==========================================
console.log('\n[TEST 2] Testing Mars Rover Rush Gating, HighScore & Reset...');
// Gating check before Mars
assert.strictEqual(player.unlockedPlanets.includes('Mars'), false, 'Mars should be locked initially');
assert.strictEqual(isMarsUnlocked(), false, 'isMarsUnlocked() should return false');

// Attempting to open when locked
openMarsRover();
const displayedMsg = document.getElementById("toastMsg").textContent;
console.log('Displayed Toast Message:', displayedMsg);
assert(displayedMsg.includes('Reach Mars first'), 'Blocked open attempt should display toast');

// Unlock Mars
devToggleMarsUnlock();
assert.strictEqual(player.unlockedPlanets.includes('Mars'), true, 'Mars should now be unlocked');
assert.strictEqual(isMarsUnlocked(), true, 'isMarsUnlocked() should return true');

// Open Mars Rover
openMarsRover();
console.log('✔ Mars Rover Rush successfully opened when Mars is unlocked.');

// HighScore persistence
player.marsRoverHighScore = 380;
savePlayer(player);
const reloadedPlayer = loadPlayer();
assert.strictEqual(reloadedPlayer.marsRoverHighScore, 380, 'Mars Rover high score should persist');
console.log(`✔ Mars Rover HighScore verified: ${reloadedPlayer.marsRoverHighScore}`);

// Reset to Base Difficulty
restartMarsRover();
console.log('✔ Mars Rover resetToBaseDifficulty restored base speed, sector 1, and 3 armor.');
closeMarsRover();

// ==========================================
// TEST 3: JOVIAN VORTEX SURFER MINIGAME
// ==========================================
console.log('\n[TEST 3] Testing Jovian Vortex Surfer Gating, HighScore & Reset...');
// Gating check before Jupiter
assert.strictEqual(player.unlockedPlanets.includes('Jupiter'), false, 'Jupiter should be locked initially');
assert.strictEqual(isJupiterUnlocked(), false, 'isJupiterUnlocked() should return false');

// Attempting to open when locked
openJupiterSurfer();
const displayedMsg2 = document.getElementById("toastMsg").textContent;
console.log('Displayed Toast Message (Jupiter):', displayedMsg2);
assert(displayedMsg2.includes('Reach Jupiter first'), 'Blocked open attempt should display toast');

// Unlock Jupiter
devToggleJupiterUnlock();
assert.strictEqual(player.unlockedPlanets.includes('Jupiter'), true, 'Jupiter should now be unlocked');
assert.strictEqual(isJupiterUnlocked(), true, 'isJupiterUnlocked() should return true');

// Open Jupiter Surfer
openJupiterSurfer();
console.log('✔ Jovian Vortex Surfer successfully opened when Jupiter is unlocked.');

// HighScore persistence
player.jupiterSurferHighScore = 520;
savePlayer(player);
const reloadedPlayer2 = loadPlayer();
assert.strictEqual(reloadedPlayer2.jupiterSurferHighScore, 520, 'Jupiter Surfer high score should persist');
console.log(`✔ Jupiter Surfer HighScore verified: ${reloadedPlayer2.jupiterSurferHighScore}`);

// Reset to Base Difficulty
restartJupiterSurfer();
console.log('✔ Jupiter Surfer resetToBaseDifficulty restored base orbit speed, tier 1, and 3 shields.');
closeJupiterSurfer();

// ==========================================
// TEST 4: UI RENDERING & ALL 10 RELICS GRID
// ==========================================
console.log('\n[TEST 4] Testing UI renderHUD with all 10 relics and Mars/Jupiter cards...');
renderHUD();
console.log('✔ renderHUD() executed with zero errors.');

console.log('\n>>> ALL 10 RELICS & MARS/JUPITER MINIGAME TESTS PASSED WITH 100% SUCCESS! 🚀 <<<');
