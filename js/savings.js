function recordSaving(amount) {

    if (amount <= 0) {
        console.log("Invalid saving amount.");
        return;
    }

    // Add to total savings
    player.savings.total += amount;

    // Record the transaction
    player.savings.history.push({
        amount: amount,
        date: new Date().toISOString()
    });

    // ₹1 saved = 1 Mission Credit
    player.credits += amount;

    // Save everything to localStorage
    savePlayer(player);

    console.log(`Saved ₹${amount}`);
    console.log(`Total savings: ₹${player.savings.total}`);
    console.log(`Mission Credits: ${player.credits}`);
}