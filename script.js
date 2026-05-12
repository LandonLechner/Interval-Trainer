const NOTES = ["C","D","E","F","G","A","B"];

const SHARP_NOTES = ["C♯","D♯","E♯","F♯","G♯","A♯","B♯"];

const FLAT_NOTES = ["C♭","D♭","E♭","F♭","G♭","A♭","B♭"];

const ALL_NOTES = [
    ...SHARP_NOTES,
    ...NOTES,
    ...FLAT_NOTES
];

const NOTE_TO_SEMITONE = {
    "C":0,
    "B♯":0,

    "C♯":1,
    "D♭":1,

    "D":2,

    "D♯":3,
    "E♭":3,

    "E":4,
    "F♭":4,

    "F":5,
    "E♯":5,

    "F♯":6,
    "G♭":6,

    "G":7,

    "G♯":8,
    "A♭":8,

    "A":9,

    "A♯":10,
    "B♭":10,

    "B":11,
    "C♭":11
};

const INTERVALS = [
    {name:"♭2nd", degree:2, semitones:1},
    {name:"2nd", degree:2, semitones:2},
    {name:"♭3rd", degree:3, semitones:3},
    {name:"3rd", degree:3, semitones:4},
    {name:"4th", degree:4, semitones:5},
    {name:"♭5th", degree:5, semitones:6},
    {name:"5th", degree:5, semitones:7},
    {name:"♭6th", degree:6, semitones:8},
    {name:"6th", degree:6, semitones:9},
    {name:"♭7th", degree:7, semitones:10},
    {name:"7th", degree:7, semitones:11},
    {name:"♭9th", degree:9, semitones:13},
    {name:"9th", degree:9, semitones:14},
    {name:"#9th", degree:9, semitones:15},
    {name:"11th", degree:11, semitones:17},
    {name:"#11th", degree:11, semitones:18},
    {name:"♭13th", degree:13, semitones:20},
    {name:"13th", degree:13, semitones:21}
];

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const warningEl = document.getElementById("warning");

const sharpRow = document.getElementById("sharpRow");
const naturalRow = document.getElementById("naturalRow");
const flatRow = document.getElementById("flatRow");

const intervalGrid = document.getElementById("intervalGrid");

let currentQuestion = null;

let gameStarted = false;
let paused = false;

let correct = 0;
let incorrect = 0;

let timerInterval = null;

let currentMilliseconds = 0;

let totalCorrectMilliseconds = 0;

function makeNoteButton(note){
    const btn = document.createElement("button");
    btn.textContent = note;
    btn.addEventListener("click", ()=>{
        if(!gameStarted || paused) return;
        checkAnswer(note);
    });
    return btn;
}

function buildNoteButtons(){
    SHARP_NOTES.forEach(note=>{
        sharpRow.appendChild(makeNoteButton(note));
    });
    NOTES.forEach(note=>{
        naturalRow.appendChild(makeNoteButton(note));
    });
    FLAT_NOTES.forEach(note=>{
        flatRow.appendChild(makeNoteButton(note));
    });
}

function buildIntervalButtons(){
    INTERVALS.forEach(interval=>{
        const btn = document.createElement("button");
        btn.textContent = interval.name;
        btn.className = "interval-btn active";
        btn.dataset.interval = interval.name;
        btn.dataset.active = "true";
        btn.addEventListener("click", ()=>{
            const active = btn.dataset.active === "true";
            btn.dataset.active = (!active).toString();
            btn.classList.toggle("active");
            validateIntervals();
            saveSettings();
        });
        intervalGrid.appendChild(btn);
    });
}

function validateIntervals(){
    const enabled = getEnabledIntervals();
    if(enabled.length === 0){
        warningEl.textContent = "Please select at least one interval.";
    } else {
        warningEl.textContent = "";
    }
}

function getEnabledIntervals(){
    return [...document.querySelectorAll(".interval-btn")]
        .filter(btn=>btn.dataset.active === "true")
        .map(btn=>INTERVALS.find(i=>i.name === btn.dataset.interval));
}

function randomItem(arr){
    return arr[Math.floor(Math.random() * arr.length)];
}

function getDirection(){
    return document.querySelector(".direction-btn.active").dataset.direction;
}

function saveSettings(){

    const activeIntervals = [...document.querySelectorAll(".interval-btn")]
        .filter(btn=>btn.dataset.active === "true")
        .map(btn=>btn.dataset.interval);

    const direction = getDirection();

    localStorage.setItem("intervalTrainerSettings", JSON.stringify({
        activeIntervals,
        direction
    }));

}

function loadSettings(){

    const settings = JSON.parse(
        localStorage.getItem("intervalTrainerSettings")
    );

    if(!settings) return;

    document.querySelectorAll(".interval-btn").forEach(btn=>{

        const active = settings.activeIntervals.includes(btn.dataset.interval);

        btn.dataset.active = active;
        btn.classList.toggle("active", active);

    });

    document.querySelectorAll(".direction-btn").forEach(btn=>{

        btn.classList.remove("active");

        if(btn.dataset.direction === settings.direction){
            btn.classList.add("active");
        }

    });

}

function calculateAnswer(root, interval, direction){

    const letters = ["C","D","E","F","G","A","B"];

    const rootLetter = root[0];

    const rootIndex = letters.indexOf(rootLetter);

    let targetLetterIndex;

    if(direction === "above"){
        targetLetterIndex =
            (rootIndex + (interval.degree - 1)) % 7;
    } else {
        targetLetterIndex =
            (rootIndex - (interval.degree - 1) + 700) % 7;
    }

    const targetLetter = letters[targetLetterIndex];

    const rootSemi = NOTE_TO_SEMITONE[root];

    let targetSemi;

    if(direction === "above"){
        targetSemi = (rootSemi + interval.semitones) % 12;
    } else {
        targetSemi = (rootSemi - interval.semitones + 120) % 12;
    }

    return ALL_NOTES.filter(note=>{

        return note[0] === targetLetter &&
            NOTE_TO_SEMITONE[note] === targetSemi;

    });

}

function generateQuestion(){

    const enabled = getEnabledIntervals();

    if(enabled.length === 0){

        questionEl.innerHTML =
            "Select at least one interval.";

        return;

    }

    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";

    const root = randomItem(ALL_NOTES);

    const interval = randomItem(enabled);

    const mode = getDirection();

    let direction;

    if(mode === "both"){
        direction = Math.random() > .5
            ? "above"
            : "below";
    } else {
        direction = mode;
    }

    const answer =
        calculateAnswer(root, interval, direction);

    currentQuestion = {
        root,
        interval,
        direction,
        answer
    };

    questionEl.innerHTML = `
        What is a <strong>${interval.name}</strong>
        ${direction}
        <strong>${root}</strong>?
    `;

}

function checkAnswer(note){

    if(currentQuestion.answer.includes(note)){

        correct++;

        totalCorrectMilliseconds += currentMilliseconds;

        renderAverageTime();

        currentMilliseconds = 0;

        renderCurrentTimer();
        updateStats();

        feedbackEl.textContent = "Correct!";
        feedbackEl.className = "feedback correct";

        setTimeout(generateQuestion, 700);

    } else {

        incorrect++;

        updateStats();

        feedbackEl.textContent = "Incorrect. Try again.";
        feedbackEl.className = "feedback wrong";

    }

}

function updateStats(){

    document.getElementById("correctCount").textContent =
        correct;

    document.getElementById("incorrectCount").textContent =
        incorrect;

    const total = correct + incorrect;

    const accuracy = total === 0
        ? 0
        : Math.round((correct / total) * 100);

    document.getElementById("accuracy").textContent =
        accuracy + "%";

}

function formatTime(milliseconds){

    const seconds = Math.floor(milliseconds / 1000);

    const hundredths = Math.floor((milliseconds % 1000) / 10);

    return `${seconds}.${String(hundredths).padStart(2,"0")}`;

}

function renderCurrentTimer(){

    document.getElementById("timer").textContent =
        formatTime(currentMilliseconds);

}

function renderAverageTime(){

    if(correct === 0){

        document.getElementById("averageTime").textContent =
            "00:00";

        return;

    }

    const avg = Math.round(totalCorrectMilliseconds / correct);

    document.getElementById("averageTime").textContent =
        formatTime(avg);

}

function updateTimer(){

    currentMilliseconds += 10;

    renderCurrentTimer();

}

function startTimer(){

    clearInterval(timerInterval);

    timerInterval = setInterval(()=>{

        if(!paused){
            updateTimer();
        }

    },10);

}

document.querySelectorAll(".direction-btn").forEach(btn=>{

    btn.addEventListener("click", ()=>{

        document.querySelectorAll(".direction-btn")
            .forEach(b=>b.classList.remove("active"));

        btn.classList.add("active");

        saveSettings();

    });

});

document.getElementById("selectAll")
.addEventListener("click", ()=>{

    document.querySelectorAll(".interval-btn")
        .forEach(btn=>{

            btn.dataset.active = "true";

            btn.classList.add("active");

        });

    warningEl.textContent = "";

    saveSettings();

});

document.getElementById("deselectAll")
.addEventListener("click", ()=>{

    document.querySelectorAll(".interval-btn")
        .forEach(btn=>{

            btn.dataset.active = "false";

            btn.classList.remove("active");

        });

    validateIntervals();
    saveSettings();

});

document.getElementById("startGame")
.addEventListener("click", ()=>{

    if(getEnabledIntervals().length === 0){

        warningEl.textContent =
            "Please select at least one interval.";

        return;

    }

    gameStarted = true;

    paused = false;

    currentMilliseconds = 0;

    renderCurrentTimer();
    generateQuestion();
    startTimer();

});

document.getElementById("pauseGame")
.addEventListener("click", ()=>{

    if(!gameStarted) return;

    paused = !paused;

    document.getElementById("pauseGame").textContent =
        paused
            ? "Resume Timer"
            : "Pause Timer";

});

document.getElementById("resetGame")
.addEventListener("click", ()=>{

    correct = 0;
    incorrect = 0;

    currentMilliseconds = 0;

    totalCorrectMilliseconds = 0;

    paused = false;

    gameStarted = false;

    clearInterval(timerInterval);

    document.getElementById("pauseGame").textContent =
        "Pause Timer";

    renderCurrentTimer();
    renderAverageTime();
    updateStats();

    feedbackEl.textContent = "";

    questionEl.innerHTML =
        "Press <strong>Start Game</strong> to begin.";

});

buildNoteButtons();
buildIntervalButtons();
loadSettings();
validateIntervals();
updateStats();
renderCurrentTimer();
renderAverageTime();