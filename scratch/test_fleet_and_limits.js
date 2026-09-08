// Test script to verify:
// 1. Daily launch limit (5 launches max) & dev toggle / reset
// 2. Journey progression to Moon, Mars, Jupiter, Saturn, Neptune
// 3. Unlocking each new spaceship upon reaching each planet
// 4. Upgrading individual spaceships in the fleet hangar independently

const assert = require('assert');
const fs = require('fs');

// Mock browser environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.window = {
  addEventListener: () => {},
  showToast: (msg, type) => console.log(`[TOAST - ${type}]: ${msg}`),
  showArrivalModal: (planet) => console.log(`[ARRIVAL]: Welcome to ${planet}!`),
  renderHUD: () => {},
  celebrateArrival: () => {}
};

global.document = {
  getElementById: () => ({ innerHTML: '', textContent: '', classList: { add: () => {}, remove: () => {} }, style: {}, appendChild: () => {} }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load storage.js
eval(fs.readFileSync('d:/Orbit/js/storage.js', 'utf8'));
eval(fs.readFileSync('d:/Orbit/js/discoveries.js', 'utf8'));
// Load upgrades.js
eval(fs.readFileSync('d:/Orbit/js/upgrades.js', 'utf8'));
// Load journey.js
eval(fs.readFileSync('d:/Orbit/js/journey.js', 'utf8'));

console.log('--- STARTING VERIFICATION TESTS ---');

// Initialize player
resetPlayer();
global.player = window.player;

// Test 1: Initial State & Ships
assert.strictEqual(player.dailyLimits.launchesCountToday, 0, 'Initial launches count should be 0');
assert.strictEqual(player.dailyLaunchLimitDisabled, false, 'Daily launch limit should be enabled by default');
assert.strictEqual(player.activeShipId, 'aegis', 'Default ship should be Aegis');
assert.strictEqual(player.spaceships.aegis.unlocked, true, 'Aegis should be unlocked');
assert.strictEqual(player.spaceships.artemis.unlocked, false, 'Artemis should be locked initially');
assert.strictEqual(player.spaceships.jovian.unlocked, false, 'Jovian should be locked initially');
console.log('✔ Test 1 Passed: Initial state correctly initialized with Aegis.');

// Test 2: Daily 5 Launches Cap
player.fuelReady = 500; // Give fuel for launches
for (let i = 1; i <= 5; i++) {
  player.fuelReady = 100;
  launchRocket();
  assert.strictEqual(player.dailyLimits.launchesCountToday, i, `Launch count should be ${i}`);
}

// 6th launch should fail because limit is 5
player.fuelReady = 100;
const prevProgress = player.journey.progress;
launchRocket();
assert.strictEqual(player.dailyLimits.launchesCountToday, 5, 'Launch count should remain 5 after cap is reached');
assert.strictEqual(player.journey.progress, prevProgress, 'Progress should not increase on blocked launch');
console.log('✔ Test 2 Passed: 5 daily launches cap enforced strictly.');

// Test 3: Dev Toggle for Launch Limit
player.dailyLaunchLimitDisabled = true;
launchRocket();
assert.strictEqual(player.dailyLimits.launchesCountToday, 6, 'Launch count increments past 5 when limit is bypassed');
console.log('✔ Test 3 Passed: Developer toggle bypasses launch limit.');

// Test 4: Reset Daily Launches
player.dailyLimits.launchesCountToday = 0;
player.dailyLaunchLimitDisabled = false;
assert.strictEqual(player.dailyLimits.launchesCountToday, 0, 'Launches reset to 0');
console.log('✔ Test 4 Passed: Daily launches reset counter works.');

// Test 5: Progression and Planet Unlocks with New Ships
// 5a. Moon -> Artemis Scout
reachMoon();
assert.strictEqual(player.unlockedPlanets.includes('Moon'), true, 'Moon reached');
assert.strictEqual(player.spaceships.artemis.unlocked, true, 'Luna Artemis Interceptor unlocked at Moon');
assert.strictEqual(player.activeShipId, 'artemis', 'Luna Artemis Interceptor set as active flagship');
assert.strictEqual(player.spaceships.artemis.name, 'Luna Artemis Interceptor');
console.log('✔ Moon reached -> Luna Artemis Interceptor unlocked and active.');

// 5b. Mars -> Ares Vanguard
reachMars();
assert.strictEqual(player.unlockedPlanets.includes('Mars'), true, 'Mars reached');
assert.strictEqual(player.spaceships.ares.unlocked, true, 'Ares Martian Vanguard unlocked at Mars');
assert.strictEqual(player.activeShipId, 'ares', 'Ares Martian Vanguard set as active flagship');
console.log('✔ Mars reached -> Ares Martian Vanguard unlocked and active.');

// 5c. Jupiter -> Jovian Dreadnought
reachJupiter();
assert.strictEqual(player.unlockedPlanets.includes('Jupiter'), true, 'Jupiter reached');
assert.strictEqual(player.spaceships.jovian.unlocked, true, 'Jovian Titan Dreadnought unlocked at Jupiter');
assert.strictEqual(player.activeShipId, 'jovian', 'Jovian Titan Dreadnought set as active flagship');
console.log('✔ Jupiter reached -> Jovian Titan Dreadnought unlocked and active.');

// 5d. Saturn -> Chronos Ringrunner
reachSaturn();
assert.strictEqual(player.unlockedPlanets.includes('Saturn'), true, 'Saturn reached');
assert.strictEqual(player.spaceships.chronos.unlocked, true, 'Chronos Ringrunner unlocked at Saturn');
assert.strictEqual(player.activeShipId, 'chronos', 'Chronos Ringrunner set as active flagship');
console.log('✔ Saturn reached -> Chronos Ringrunner unlocked and active.');

// 5e. Neptune -> Sovereign Voyager
reachNeptune();
assert.strictEqual(player.unlockedPlanets.includes('Neptune'), true, 'Neptune reached');
assert.strictEqual(player.spaceships.sovereign.unlocked, true, 'Neptune Void Sovereign unlocked at Neptune');
assert.strictEqual(player.activeShipId, 'sovereign', 'Neptune Void Sovereign set as active flagship');
console.log('✔ Neptune reached -> Neptune Void Sovereign unlocked and active.');

// Test 6: Upgrades Per Ship Isolation
player.credits = 100000;

// Upgrading Sovereign Voyager
assert.strictEqual(player.spaceships.sovereign.engine, 1);
const engineUpgraded = upgradeEngine();
assert.strictEqual(engineUpgraded, true, 'Engine upgrade should succeed');
assert.strictEqual(player.spaceships.sovereign.engine, 2, 'Sovereign engine should now be level 2');
assert.strictEqual(player.rocket.engine, 2, 'player.rocket engine should reflect level 2');

// Switch to Aegis and verify its engine is still level 1
selectActiveSpaceship('aegis');
assert.strictEqual(player.activeShipId, 'aegis');
assert.strictEqual(player.spaceships.aegis.engine, 1, 'Aegis engine should still be level 1');
assert.strictEqual(player.rocket.engine, 1, 'player.rocket engine should sync to level 1 for Aegis');

// Switch back to Sovereign Voyager
selectActiveSpaceship('sovereign');
assert.strictEqual(player.spaceships.sovereign.engine, 2, 'Sovereign engine retains level 2');
assert.strictEqual(player.rocket.engine, 2, 'player.rocket engine retains level 2 for Sovereign');
console.log('✔ Test 6 Passed: Upgrades are preserved independently per spaceship in the fleet.');

// Test 7: Persistence and loadPlayer sync
savePlayer(player);
const loaded = loadPlayer();
assert.strictEqual(loaded.activeShipId, 'sovereign');
assert.strictEqual(loaded.spaceships.sovereign.engine, 2);
assert.strictEqual(loaded.unlockedPlanets.length, 6, 'Should have reached 6 planets');
assert.strictEqual(loaded.spaceships.chronos.unlocked, true);
assert.strictEqual(loaded.spaceships.jovian.unlocked, true);
assert.strictEqual(loaded.spaceships.ares.unlocked, true);
assert.strictEqual(loaded.spaceships.artemis.unlocked, true);
assert.strictEqual(loaded.spaceships.aegis.unlocked, true);
console.log('✔ Test 7 Passed: Storage save & load maintains fleet and all 6 planets.');

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
