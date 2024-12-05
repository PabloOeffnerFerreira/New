
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
    }
};

// Player State
let player = {
    health: 100,
    maxHealth: 100,
    stats: JSON.parse(localStorage.getItem("character"))?.stats || {
        str: 10, dex: 10, int: 10, wis: 10, cha: 10
    }
};

let playerState = { isStealthed: false };
let currentScene = "crossroads";

// Utility: Append Messages
function appendMessage(message, container) {
    const msg = document.createElement("p");
    msg.innerHTML = message;
    container.appendChild(msg);
}

// Utility: Find Target in Current Scene
function findTargetByName(name) {
    return scenes[currentScene]?.targets.find(t => t.name === name);
}

// Function: Update Target Dropdown
function updateTargetDropdown(actionType = "attack") {
    const targetContainer = document.getElementById("target-container");
    const targetSelect = document.getElementById("target-select");

    // Save the current selection
    const previousSelection = targetSelect.value;

    // Clear existing options
    targetSelect.innerHTML = "";

    // Get all targets in the current scene
    const targets = scenes[currentScene]?.targets || [];
    targets.forEach(target => {
        const option = document.createElement("option");
        option.value = target.name;
        option.textContent = `${target.type === "enemy" ? "Enemy" : "Object"}: ${target.name}`;

        // Disable options not valid for the current action
        if (
            (actionType === "attack" && target.type !== "enemy" && target.type !== "object") ||
            (actionType === "investigate" && target.type !== "object") ||
            (["persuade", "insight"].includes(actionType) && target.type !== "enemy")
        ) {
            option.disabled = true;
        }

        targetSelect.appendChild(option);
    });

    // Restore previous selection if valid
    const isSelectionValid = Array.from(targetSelect.options).some(option => option.value === previousSelection);
    if (isSelectionValid) {
        targetSelect.value = previousSelection;
    } else if (targetSelect.options.length > 0) {
        targetSelect.selectedIndex = 0; // Default to the first option
    }

    // Adjust visibility and feedback
    if (targets.length > 0) {
        targetContainer.style.display = "block";
        targetSelect.size = Math.min(targets.length, 5); // Show up to 5 options
    } else {
        targetContainer.style.display = "none";
        appendMessage("No valid targets available.", document.getElementById("action-results"));
    }

    console.log("Dropdown updated for action:", actionType, targets);
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

    const target = findTargetByName(selectedTarget.value);
    if (!target) {
        appendMessage("Target not found in the current scene.", document.getElementById("action-results"));
        return;
    }

    if (actionType === "attack") {
        if (target.type === "enemy") {
            const damage = Math.floor(Math.random() * player.stats.str) + 5; // Calculate damage
            target.health -= damage;
            appendMessage(`You attack the ${target.name} for ${damage} damage!`, document.getElementById("action-results"));

            if (target.health <= 0) {
                appendMessage(`The ${target.name} is defeated!`, document.getElementById("action-results"));
                scenes[currentScene].targets = scenes[currentScene].targets.filter(t => t !== target); // Remove defeated target
                updateTargetDropdown(actionType); // Refresh the dropdown
            } else {
                enemyTurn(target); // Enemy retaliates if still alive
            }
        } else if (target.type === "object") {
            triggerObjectScene(target); // Special logic for objects
        }
    } else {
        appendMessage(`You attempt to ${actionType} the ${target.name}.`, document.getElementById("action-results"));
    }

    updateHealthDisplay(); // Update health display after the action
}


function triggerObjectScene(object) {
    appendMessage(`You interact with the ${object.name}.`, document.getElementById("action-results"));

    if (object.name === "Chest") {
        appendMessage("You open the chest and find a Potion!", document.getElementById("action-results"));
        addItemToInventory("Potion");
    } else if (object.name === "Ancient Tree") {
        appendMessage("The tree whispers ancient secrets to you and gives you an Ancient Relic!", document.getElementById("action-results"));
        addItemToInventory("Ancient Relic");
    } else {
        appendMessage(`Nothing happens with the ${object.name}.`, document.getElementById("action-results"));
    }
}




// Function: Enemy Turn
function enemyTurn(enemy) {
    // Calculate enemy damage
    const damage = Math.floor(Math.random() * 10) + 5; // Example: random damage between 5 and 15
    player.health -= damage;

    // Log the enemy's attack
    appendMessage(
        `The ${enemy.name} attacks you for ${damage} damage!`,
        document.getElementById("action-results")
    );

    // Check if the player is dead
    if (player.health <= 0) {
        player.health = 0; // Prevent negative health
        appendMessage("You have been defeated. Game Over!", document.getElementById("action-results"));
        endGame();
        return;
    }

    // Update health display
    updateHealthDisplay();
}


// Function: Update Health Display
function updateHealthDisplay() {
    const playerHealthDisplay = document.getElementById("player-health");
    const enemyHealthDisplay = document.getElementById("enemy-health");
    const targetSelect = document.getElementById("target-select");

    // Update player health
    playerHealthDisplay.innerText = `Player Health: ${player.health}/${player.maxHealth}`;

    // Ensure there's a selected target
    const selectedTargetName = targetSelect.options[targetSelect.selectedIndex]?.value;
    const selectedTarget = scenes[currentScene]?.targets.find(t => t.name === selectedTargetName);

    if (selectedTarget && selectedTarget.type === "enemy") {
        if (selectedTarget.health > 0) {
            // Update enemy health if still alive
            enemyHealthDisplay.innerText = `${selectedTarget.name} Health: ${selectedTarget.health}/${selectedTarget.maxHealth}`;
        } else {
            // Clear enemy health display when defeated
            enemyHealthDisplay.innerText = "Enemy defeated!";
            setTimeout(() => {
                enemyHealthDisplay.innerText = ""; // Clear after delay
                updateTargetDropdown("attack"); // Refresh dropdown to remove defeated enemy
            }, 1000);
        }
    } else if (selectedTarget && selectedTarget.type === "object") {
        // Display interaction for objects
        enemyHealthDisplay.innerText = `Interacting with ${selectedTarget.name}`;
    } else {
        // Fallback for no valid target
        enemyHealthDisplay.innerText = "No target selected.";
    }
}

// Inventory System
let inventory = []; // Player's inventory

// Function: Toggle Inventory Modal
function toggleInventory() {
    const modal = document.getElementById("inventory-modal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    renderInventory(); // Update the inventory display
}

// Function: Add Item to Inventory
function addItemToInventory(item) {
    inventory.push(item);
    appendMessage(`You added ${item} to your inventory.`, document.getElementById("action-results"));
}

// Function: Remove Item from Inventory
function removeItemFromInventory(item) {
    const index = inventory.indexOf(item);
    if (index > -1) {
        inventory.splice(index, 1);
        appendMessage(`You removed ${item} from your inventory.`, document.getElementById("action-results"));
    }
}

// Function: Render Inventory
function renderInventory() {
    const inventoryList = document.getElementById("inventory-list");
    inventoryList.innerHTML = ""; // Clear existing inventory

    if (inventory.length === 0) {
        inventoryList.innerHTML = "<li>Your inventory is empty.</li>";
        return;
    }

    inventory.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        listItem.onclick = () => {
            appendMessage(`You selected ${item} from your inventory.`, document.getElementById("action-results"));
        };
        inventoryList.appendChild(listItem);
    });
}


function endGame() {
    const resultsContainer = document.getElementById("action-results");
    const choicesContainer = document.getElementById("choices");

    appendMessage("Your journey ends here...", resultsContainer);

    // Disable all action buttons and choices
    document.querySelectorAll("button").forEach(button => (button.disabled = true));
    choicesContainer.innerHTML = ""; // Clear navigation buttons
}

// Function: Toggle Stealth
function toggleStealth() {
    const resultsContainer = document.getElementById("action-results");

    if (playerState.isStealthed) {
        playerState.isStealthed = false;
        appendMessage("You step out of the shadows.", resultsContainer);
    } else {
        playerState.isStealthed = true;
        appendMessage("You slip into the shadows.", resultsContainer);
    }

    updateStealthButton();
}

// Function: Update Stealth Button
function updateStealthButton() {
    const stealthButton = document.getElementById("stealth-button");
    stealthButton.textContent = playerState.isStealthed ? "Leave Stealth" : "Go into Stealth";
    stealthButton.onclick = toggleStealth;
}

// Function: Make a Scene Choice
function makeChoice(destination) {
    const resultsContainer = document.getElementById("action-results");
    const scene = scenes[destination];

    if (!scene) {
        appendMessage("Invalid destination!", resultsContainer);
        return;
    }

    currentScene = destination;
    document.getElementById("story-text").innerText = scene.description;
    resultsContainer.innerHTML = "";
    appendMessage(`You move to the ${destination}.`, resultsContainer);

    updateTargetDropdown("attack");
}

// Initialize Game World
function initializeGameWorld() {
    appendMessage("Welcome to the crossroads. Your adventure begins!", document.getElementById("action-results"));
    makeChoice("crossroads");
    updateTargetDropdown("attack");
    updateStealthButton();
    updateHealthDisplay();
}

initializeGameWorld();
