
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

    if (actionType === "attack" && target.type === "enemy") {
        const damage = Math.floor(Math.random() * player.stats.str) + 5;
        target.health -= damage;
        appendMessage(`You attack the ${target.name} for ${damage} damage!`, document.getElementById("action-results"));
        if (target.health <= 0) {
            appendMessage(`The ${target.name} is defeated!`, document.getElementById("action-results"));
            scenes[currentScene].targets = scenes[currentScene].targets.filter(t => t !== target);
        } else {
            enemyTurn(target);
        }
    } else {
        appendMessage(`You attempt to ${actionType} the ${target.name}.`, document.getElementById("action-results"));
    }

    updateTargetDropdown(actionType);
}

// Function: Enemy Turn
function enemyTurn(enemy) {
    const damage = Math.floor(Math.random() * 10) + 5;
    player.health -= damage;
    appendMessage(`The ${enemy.name} attacks you for ${damage} damage!`, document.getElementById("action-results"));
    if (player.health <= 0) {
        appendMessage("You have been defeated. Game Over!", document.getElementById("action-results"));
    }
    updateHealthDisplay();
}

// Function: Update Health Display
function updateHealthDisplay() {
    const playerHealthDisplay = document.getElementById("player-health");
    const enemyHealthDisplay = document.getElementById("enemy-health");

    playerHealthDisplay.innerText = `Player Health: ${player.health}/${player.maxHealth}`;

    const currentEnemy = scenes[currentScene]?.targets.find(t => t.type === "enemy" && t.health > 0);
    enemyHealthDisplay.innerText = currentEnemy
        ? `${currentEnemy.name} Health: ${currentEnemy.health}/${currentEnemy.maxHealth}`
        : "No enemy present.";
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
