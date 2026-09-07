// ORBIT // Savings System with Daily Caps and Rules

function recordSaving(amount, sourceLabel = "Quick Save") {
    amount = Number(amount);

    // Rule 1: Basic validation
    if (isNaN(amount) || amount <= 0) {
        if (typeof showToast === "function") {
            showToast("Please enter an amount greater than ₹0.", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    // Rule 2: Single transaction maximum is ₹50
    if (amount > 50) {
        if (typeof showToast === "function") {
            showToast("Maximum single save is ₹50 at a time.", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    // Ensure daily limits object exists and is reset if it's a new day
    if (typeof checkDailyReset === "function") {
        checkDailyReset(player);
    }

    // Rule 3: Max 6 savings deposits per day
    const depositsToday = player.dailyLimits.depositsCountToday || 0;
    if (depositsToday >= 6) {
        if (typeof showToast === "function") {
            showToast("Daily limit reached! Max 6 saves per day (6/6 used). Come back tomorrow!", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    // Rule 4: Max ₹250 total saved per day
    const savedToday = player.dailyLimits.savedToday || 0;
    const remainingDaily = 250 - savedToday;

    if (remainingDaily <= 0) {
        if (typeof showToast === "function") {
            showToast("Daily goal reached! You've already saved ₹250 today (maximum daily limit).", "info");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    if (amount > remainingDaily) {
        if (typeof showToast === "function") {
            showToast(`Daily limit is ₹250. You can only save up to ₹${remainingDaily} more today.`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    // --- All Validations Passed! Process the Saving ---

    // 1. Update Daily Limits
    player.dailyLimits.savedToday = savedToday + amount;
    player.dailyLimits.depositsCountToday = depositsToday + 1;

    // 2. Add to total savings
    player.savings.total += amount;

    // 3. Add 1:1 Mission Credits (for Upgrades)
    player.credits += amount;

    // 4. Add 1:1 Rocket Fuel (for Launching)
    player.fuelReady = (player.fuelReady || 0) + amount;

    // 5. Record transaction history
    player.savings.history.unshift({
        amount: amount,
        label: sourceLabel,
        date: new Date().toISOString()
    });
    if (player.savings.history.length > 50) {
        player.savings.history.pop();
    }

    // 6. Update Streak
    const today = new Date().toISOString().split("T")[0];
    const lastDate = player.streak.lastSaveDate ? player.streak.lastSaveDate.split("T")[0] : null;

    if (!lastDate) {
        player.streak.current = 1;
    } else if (lastDate === today) {
        // Maintained
    } else {
        const diffDays = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            player.streak.current += 1;
        } else if (diffDays > 1) {
            // Shield level 2+ absorbs 1 missed day
            if (player.rocket.shield >= 2) {
                player.streak.current += 1;
                if (typeof showToast === "function") {
                    showToast("Shield saved your streak from resetting!", "info");
                }
            } else {
                player.streak.current = 1;
            }
        }
    }
    player.streak.longest = Math.max(player.streak.longest || 1, player.streak.current);
    player.streak.lastSaveDate = new Date().toISOString();

    // 7. Daily Challenges
    player.missions.dailySave = true;
    player.missions.depositsToday = player.dailyLimits.depositsCountToday;
    if (player.dailyLimits.depositsCountToday >= 2) {
        player.missions.saveTwice = true;
    }

    // 8. Save state
    savePlayer(player);

    console.log(`Saved ₹${amount}. Saved Today: ₹${player.dailyLimits.savedToday}/250 (${player.dailyLimits.depositsCountToday}/6 deposits)`);

    // 9. Interactive Celebratory Feedback
    if (typeof playSound === "function") {
        playSound("click");
    }

    if (typeof triggerParticleBurst === "function") {
        triggerParticleBurst();
    }

    const remainingNow = 250 - player.dailyLimits.savedToday;
    const savesLeft = 6 - player.dailyLimits.depositsCountToday;

    if (typeof showToast === "function") {
        if (remainingNow === 0 || savesLeft === 0) {
            showToast(`Saved ₹${amount}! Daily saving goal complete! 🏆 (₹250 / 6 saves)`, "success");
        } else {
            showToast(`Saved ₹${amount}! (+${amount} Credits, +${amount} Fuel) • ₹${remainingNow} left today`, "success");
        }
    }

    if (typeof renderHUD === "function") {
        renderHUD();
    }

    return true;
}