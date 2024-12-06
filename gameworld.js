let currentScene = "crossroads"; // Start in the crossroads scene
console.log("Current Scene Initialized:", currentScene); // Debugging

// Player Initialization
let player = {
    stats: JSON.parse(localStorage.getItem("character"))?.stats || {
        str: 10, dex: 10, int: 10, wis: 10, cha: 10, con: 10
    },
    maxHealth: 100,
    health: 100
};
// Inventory System
let inventory = [];
console.log("Inventory Initialized:", inventory); // Debugging

player.maxHealth = 100 + player.stats.con;
player.health = player.maxHealth;
console.log("Player Health Initialized:", player.health, "/", player.maxHealth);

// Scene Data
const scenes = {
    crossroads: {
        description: "You are at a crossroads. To the north lies a forest; to the east, a castle.",
        targets: [
            { name: "Goblin", type: "enemy", difficulty: 10, health: 50, maxHealth: 50 },
            { name: "Bandit", type: "enemy", difficulty: 12, health: 60, maxHealth: 60 },
            { name: "Chest", type: "object", difficulty: 8 }
        ]
    },
    forest: {
        description: "You step into the forest. It's dark and ominous.",
        targets: [
            { name: "Wolf", type: "enemy", difficulty: 14, health: 70, maxHealth: 70 },
            { name: "Ancient Tree", type: "object", difficulty: 10 }
        ]
    },
    castle: {
        description: "The castle is silent, but you hear faint footsteps inside.",
        targets: [
            { name: "Skeleton Guard", type: "enemy", difficulty: 16, health: 80, maxHealth: 80 },
            { name: "Broken Statue", type: "object", difficulty: 10 }
        ]
    },
    village: {
        description: "Test",
        targets: [
            { name: "Skeleton Guard", type: "enemy", difficulty: 16, health: 80, maxHealth: 80 },
            { name: "Broken Statue", type: "object", difficulty: 10 }
        ]
    }
};

function updateTargetDropdown(actionType = "attack") {
    const targetSelect = document.getElementById("target-select");
    const targetContainer = document.getElementById("target-container");

    targetSelect.innerHTML = ""; // Clear dropdown

    const targets = scenes[currentScene]?.targets || [];
    console.log("Targets in Current Scene:", targets);

    const filteredTargets = targets.filter(target => {
        if (actionType === "attack") return target.type === "enemy" || target.type === "object";
        if (actionType === "investigate") return target.type === "object";
        if (["persuade", "insight"].includes(actionType)) return target.type === "enemy";
        return false;
    });

    filteredTargets.forEach(target => {
        const option = document.createElement("option");
        option.value = target.name;
        option.textContent = `${target.type === "enemy" ? "Enemy" : "Object"}: ${target.name}`;
        targetSelect.appendChild(option);
    });

    if (filteredTargets.length > 0) {
        targetContainer.style.display = "block";
        targetSelect.size = Math.min(filteredTargets.length, 5);
    } else {
        targetContainer.style.display = "none";
        appendMessage("No valid targets available.", document.getElementById("action-results"));
    }
}

// Function: Update Health Display
function updateHealthDisplay() {
    const playerHealthDisplay = document.getElementById("player-health");
    const enemyHealthDisplay = document.getElementById("enemy-health");

    // Update player health
    playerHealthDisplay.innerText = `Player Health: ${player.health}/${player.maxHealth}`;

    const targetSelect = document.getElementById("target-select");
    const selectedTargetName = targetSelect.options[targetSelect.selectedIndex]?.value;
    const selectedTarget = scenes[currentScene]?.targets.find(t => t.name === selectedTargetName);

    if (selectedTarget?.type === "enemy") {
        enemyHealthDisplay.innerText = `${selectedTarget.name} Health: ${selectedTarget.health}/${selectedTarget.maxHealth}`;
    } else if (selectedTarget?.type === "object") {
        enemyHealthDisplay.innerText = `Interacting with ${selectedTarget.name}`;
    } else {
        enemyHealthDisplay.innerText = "No enemy present.";
    }
}

// Debugging logs
console.log("Player Stats:", player.stats);
console.log("Constitution:", player.stats.con);
console.log("Max Health:", player.maxHealth);
console.log("Scenes Object:", scenes);

if (typeof currentScene !== "undefined") {
    console.log("Targets in Current Scene:", scenes[currentScene]?.targets);
}

let playerState = { isStealthed: false };

function goIntoStealth() {
    const resultsContainer = document.getElementById("action-results");

    if (player.isStealthed) {
        appendMessage("You are already in stealth mode.", resultsContainer);
        return;
    }

    player.isStealthed = true;
    document.getElementById("stealth-indicator").style.display = "block";
    appendMessage("You slip into the shadows, becoming harder to detect.", resultsContainer);

    updateStealthButton();
}

// Function: Append Messages
function appendMessage(message, container) {
    const msg = document.createElement("p");
    msg.innerHTML = message;
    container.appendChild(msg);
    console.log(`Message: ${message}`); // Debugging
}

// Function: Add Item to Inventory
function addItemToInventory(item) {
    if (!item || item === "undefined") {
        console.error("Invalid item detected:", item);
        return;
    }
    inventory.push(item);
    console.log("Current Inventory:", inventory);
}

// Function: Render Inventory Items
function renderInventory() {
    const inventoryList = document.getElementById("inventory-list");
    if (!inventoryList) {
        console.error("Inventory list element not found!");
        return;
    }

    inventoryList.innerHTML = ""; // Clear the current display

    if (inventory.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "Your inventory is empty.";
        inventoryList.appendChild(emptyMessage);
    } else {
        inventory.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = item;
            inventoryList.appendChild(listItem);
        });
    }
    console.log("Rendered Inventory:", inventory); // Debugging
}

// Function: Toggle Inventory Modal
function toggleInventory() {
    const modal = document.getElementById("inventory-modal");

    if (!modal) {
        console.error("Inventory modal not found!");
        return;
    }

    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    if (modal.style.display === "flex") {
        renderInventory();
    }
}

// Loot Tables
const lootTables = {
    Goblin: ["Gold Coin", "Dagger", "Health Potion"],
    Bandit: ["Gold Coin", "Short Sword", "Lockpick"],
    Chest: ["Ancient Relic", "Gold Coin", "Potion"],
    Wolf: ["Wolf Pelt", "Claw", "Gold Coin"],
    "Ancient Tree": ["Ancient Relic", "Potion", "Gold Coin"],
    "Skeleton Guard": ["Bone Shard", "Rusty Sword", "Gold Coin"],
    "Broken Statue": ["Ancient Relic", "Gold Coin"]
};

// Function: Generate Loot with Drop Chance
function generateLoot(source) {
    if (!source) {
        console.error("No source provided for loot generation!");
        return [];
    }

    const lootTable = lootTables[source];
    if (!lootTable) {
        console.error(`No loot table found for source: ${source}`);
        return [];
    }

    return lootTable.filter(() => Math.random() < 0.05); // 5% drop chance
}

function handleDefeatedEnemy(enemy) {
    if (!enemy) {
        console.error("No enemy provided to handleDefeatedEnemy!");
        return;
    }

    // Log the defeated enemy for debugging
    console.log("Enemy Defeated:", enemy);
    console.log("Current Scene Targets Before Removal:", scenes[currentScene].targets);

    // Append message for enemy defeat
    appendMessage(`The ${enemy.name} is defeated!`, document.getElementById("action-results"));

    // Generate loot for the defeated enemy
    const loot = generateLoot(enemy.name); // Pass the enemy's name as the source
    if (loot.length > 0) {
        loot.forEach(item => addItemToInventory(item));
        appendMessage(`You looted: ${loot.join(", ")}.`, document.getElementById("action-results"));
    } else {
        appendMessage(`The ${enemy.name} had nothing to loot.`, document.getElementById("action-results"));
    }

    // Remove the defeated enemy from the scene's targets array
    scenes[currentScene].targets = scenes[currentScene].targets.filter(t => t !== enemy);

    // Debugging logs after removal
    console.log("Current Scene Targets After Removal:", scenes[currentScene].targets);

    // Update the target dropdown and health display
    updateTargetDropdown("attack");
    updateHealthDisplay();
}

//More Debugging
console.log("Current Scene Targets:", scenes[currentScene]?.targets);




// Function: Interact with Object
function triggerObjectScene(object) {
    appendMessage(`You interact with the ${object.name}.`, document.getElementById("action-results"));

    const loot = generateLoot(object.name); // Generate loot based on the object name
    if (loot.length > 0) {
        loot.forEach(item => addItemToInventory(item));
        appendMessage(`You found: ${loot.join(", ")}.`, document.getElementById("action-results"));
    } else {
        appendMessage(`The ${object.name} was empty.`, document.getElementById("action-results"));
    }
}

// Function: Perform Action
function performAction() {
    const actionType = document.getElementById("action-select").value;
    const targetSelect = document.getElementById("target-select");
    const selectedTarget = targetSelect.options[targetSelect.selectedIndex];

    if (!selectedTarget) {
        appendMessage("Please select a valid target!", document.getElementById("action-results"));
        return;
    }

    const target = scenes[currentScene]?.targets.find(t => t.name === selectedTarget.value);
    if (!target) {
        appendMessage("Target not found in the current scene.", document.getElementById("action-results"));
        return;
    }

    if (actionType === "attack") {
        if (target.type === "enemy") {
            const damage = Math.floor(Math.random() * player.stats.str) + 5;
            target.health -= damage;
            appendMessage(`You attack the ${target.name} for ${damage} damage!`, document.getElementById("action-results"));

            if (target.health <= 0) {
                handleDefeatedEnemy(target);
            } else {
                enemyTurn(target);
            }
        } else if (target.type === "object") {
            triggerObjectScene(target);
        }
    } else {
        appendMessage(`You attempt to ${actionType} the ${target.name}.`, document.getElementById("action-results"));
    }

    updateHealthDisplay();
}


function handleActionChange() {
    const actionType = document.getElementById("action-select").value;
    updateTargetDropdown(actionType);
}   


// Function: Enemy Turn
function enemyTurn(enemy) {
    const damage = Math.floor(Math.random() * 10) + 5;
    player.health -= damage;

    appendMessage(`The ${enemy.name} attacks you for ${damage} damage!`, document.getElementById("action-results"));

    if (player.health <= 0) {
        player.health = 0;
        appendMessage("You have been defeated. Game Over!", document.getElementById("action-results"));
        endGame();
    }

    updateHealthDisplay();
}

// Function: Make a Scene Choice
function makeChoice(destination) {
    const resultsContainer = document.getElementById("action-results");
    const scene = scenes[destination];

    if (!scene) {
        appendMessage("Invalid destination!", resultsContainer);
        return;
    }

    currentScene = destination; // Update the current scene
    console.log("Navigating to:", destination); // Debugging

    // Update UI
    document.getElementById("story-text").innerText = scene.description;
    resultsContainer.innerHTML = ""; // Clear previous results
    appendMessage(`You move to the ${destination}.`, resultsContainer);

    updateTargetDropdown("attack"); // Populate dropdown with valid targets
    updateHealthDisplay(); // Update health display
}


// Calculate health dynamically
player.maxHealth = 100 + player.stats.con; // Base health of 100 + Constitution
player.health = player.maxHealth; // Set current health to max health
console.log("Player Initialized:", player); // Debugging

function updateStealthButton() {
    const stealthButton = document.getElementById("stealth-button");
    stealthButton.textContent = player.isStealthed ? "Leave Stealth" : "Go into Stealth";
    stealthButton.onclick = player.isStealthed ? leaveStealth : goIntoStealth;
}

function leaveStealth() {
    const resultsContainer = document.getElementById("action-results");

    if (!player.isStealthed) {
        appendMessage("You are not in stealth mode.", resultsContainer);
        return;
    }

    player.isStealthed = false;
    document.getElementById("stealth-indicator").style.display = "none";
    appendMessage("You step out of the shadows, revealing yourself.", resultsContainer);

    updateStealthButton();
}
// Calculate Player Health
player.maxHealth = 100 + player.stats.con; // Constitution modifier added
player.health = player.maxHealth; // Set current health to max health

console.log(`Player Health Initialized: ${player.health}/${player.maxHealth}`);

// Update health display during game initialization
function initializeGameWorld() {
    console.log("Initializing Game World...");

    // Recalculate health immediately
    player.maxHealth = 100 + player.stats.con;
    player.health = player.maxHealth;

    appendMessage("Welcome to the crossroads. Your adventure begins!", document.getElementById("action-results"));

    makeChoice("crossroads");
    updateTargetDropdown("attack");
    updateHealthDisplay(); // Refresh health UI immediately
    updateStealthButton();
}

initializeGameWorld();