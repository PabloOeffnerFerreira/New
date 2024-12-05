
let pointsRemaining = 10;
let characterStats = {
    str: 0,
    con: 0,
    dex: 0,
    int: 0,
    wis: 0,
    cha: 0
};

function updatePointsRemaining() {
    const totalPointsUsed = Object.values(characterStats).reduce((acc, value) => acc + value, 0);
    pointsRemaining = 10 - totalPointsUsed;
    document.getElementById("remaining-points").innerText = pointsRemaining;
}

function adjustPoints(stat, delta) {
    if (pointsRemaining === 0 && delta === 1) {
        return; // Prevent adding points if no points are left
    }
    if (characterStats[stat] + delta >= 0) { // Prevent negative points
        characterStats[stat] += delta;
        document.getElementById(`${stat}-points`).innerText = characterStats[stat];
        updatePointsRemaining();
    }
}

function createCharacter() {
    const name = document.getElementById("name").value.trim();
    const selectedClass = document.getElementById("class").value;

    if (!name) {
        alert("Please enter a valid name for your character.");
        return;
    }

    if (pointsRemaining > 0) {
        alert("Please assign all stat points before proceeding.");
        return;
    }

    const character = {
        name: name,
        class: selectedClass,
        race: "Unknown",
        stats: characterStats
    };

    localStorage.setItem("character", JSON.stringify(character));
    window.location.href = "race.html";
}
