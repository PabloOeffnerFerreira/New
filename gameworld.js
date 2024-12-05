
// Scene Data
const scenes = {
    crossroads: {
        description: "You are at a crossroads. To the north lies a forest; to the east, a castle.",
        targets: [
            { name: "Goblin", type: "enemy", difficulty: 10 },
            { name: "Bandit", type: "enemy", difficulty: 12 },
            { name: "Chest", type: "object", difficulty: 8 }
        ]
    },
    forest: {
        description: "You step into the forest. It's dark and ominous.",
        targets: [
            { name: "Wolf", type: "enemy", difficulty: 14 },
            { name: "Ancient Tree", type: "object", difficulty: 10 }
        ]
    },
    castle: {
        description: "The castle is silent, but you hear faint footsteps inside.",
        targets: [
            { name: "Skeleton Guard", type: "enemy", difficulty: 16 },
            { name: "Broken Statue", type: "object", difficulty: 10 }
        ]
    }
};

let currentScene = "crossroads";
const character = JSON.parse(localStorage.getItem("character")) || {};
let playerState = { isStealthed: false };

// Update the target dropdown
function updateTargetDropdown(actionType) {
    const targetSelect = document.getElementById("target-select");
    targetSelect.innerHTML = ""; // Clear existing options

    const targets = scenes[currentScene]?.targets || [];
    let filteredTargets = [];

    if (actionType === "attack") {
        filteredTargets = targets; // Attack can target all
    } else if (["persuade", "insight"].includes(actionType)) {
        filteredTargets = targets.filter(target => target.type === "enemy"); // Only enemies
    } else if (actionType === "investigate") {
        filteredTargets = targets.filter(target => target.type === "object"); // Only objects
    }

    filteredTargets.forEach(target => {
        const option = document.createElement("option");
        option.value = target.name;
        option.dataset.difficulty = target.difficulty;
        option.textContent = target.name;
        targetSelect.appendChild(option);
    });

    // Default dropdown size
    targetSelect.size = Math.min(filteredTargets.length, 5) || 1; // Show up to 5 options or at least 1
}

// Handle action change
function handleActionChange() {
    const actionType = document.getElementById("action-select").value;
    const targetContainer = document.getElementById("target-container");

    if (["attack", "persuade", "investigate", "insight"].includes(actionType)) {
        targetContainer.style.display = "block";
        updateTargetDropdown(actionType);
    } else {
        targetContainer.style.display = "none";
    }
}

// Perform action
function performAction() {
    const actionType = document.getElementById("action-select").value;
    const targetSelect = document.getElementById("target-select");
    const selectedTarget = targetSelect.options[targetSelect.selectedIndex];
    const resultsContainer = document.getElementById("action-results");

    if (!selectedTarget) {
        appendMessage("Please select a valid target!", resultsContainer);
        return;
    }

    const targetName = selectedTarget.value;
    const targetDifficulty = parseInt(selectedTarget.dataset.difficulty);
    const skillMap = { attack: "str", persuade: "cha", investigate: "int", insight: "wis" };
    const roll = Math.floor(Math.random() * 20) + 1;
    const skillValue = character.stats[skillMap[actionType]] || 0;
    const total = roll + skillValue;
    const success = total >= targetDifficulty;

    appendMessage(
        success
            ? `You successfully ${actionType} the ${targetName}.`
            : `You fail to ${actionType} the ${targetName}.`,
        resultsContainer
    );

    if (actionType === "attack" && playerState.isStealthed) {
        leaveStealth();
    }
}

// Stealth logic
function goIntoStealth() {
    if (playerState.isStealthed) {
        appendMessage("You are already in stealth mode.", document.getElementById("action-results"));
        return;
    }
    playerState.isStealthed = true;
    document.getElementById("stealth-indicator").style.display = "block";
    updateStealthButton();
    appendMessage("You slip into the shadows.", document.getElementById("action-results"));
}

function leaveStealth() {
    if (!playerState.isStealthed) {
        appendMessage("You are not in stealth mode.", document.getElementById("action-results"));
        return;
    }
    playerState.isStealthed = false;
    document.getElementById("stealth-indicator").style.display = "none";
    updateStealthButton();
    appendMessage("You step out of the shadows.", document.getElementById("action-results"));
}

// Update the stealth button
function updateStealthButton() {
    const stealthButton = document.getElementById("stealth-button");
    if (playerState.isStealthed) {
        stealthButton.textContent = "Leave Stealth";
        stealthButton.onclick = leaveStealth;
    } else {
        stealthButton.textContent = "Go into Stealth";
        stealthButton.onclick = goIntoStealth;
    }
}

// Append a message to results
function appendMessage(message, container) {
    const msg = document.createElement("p");
    msg.innerHTML = message;
    container.appendChild(msg);
}

// Make a scene choice
function makeChoice(destination) {
    if (!scenes[destination]) {
        appendMessage("Invalid destination!", document.getElementById("action-results"));
        return;
    }
    currentScene = destination;
    document.getElementById("story-text").innerText = scenes[destination].description;
    updateTargetDropdown("attack");
}

// Initialize game world
function initializeGameWorld() {
    makeChoice("crossroads");
    updateTargetDropdown("attack"); // Ensure targets are populated on start
    updateStealthButton();
}

initializeGameWorld();
