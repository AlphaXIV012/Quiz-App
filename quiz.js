// index.js
const questionElement = document.getElementById("question");
const answerContainer = document.getElementById("answers");
const nextButton = document.getElementById("next-btn");
const currentQuestionText = document.getElementById("current-question");
const initBox = document.getElementById("init-box");
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result-box");
const scoreText = document.getElementById("score-text");
const restartBtn = document.getElementById("restart-btn");
const categorySelect = document.getElementById("category-select");
const difficultySelect = document.getElementById("difficulty-select");
const startBtn = document.getElementById("start-btn");
const timeElement = document.getElementById("time");
const highScoreDisplay = document.getElementById("high-score-display");
const darkModeBtn = document.getElementById("dark-mode-btn");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval = null;
let highScore = Number(localStorage.getItem("highScore") || 0);

// initialize UI
highScoreDisplay.innerText = `High Score: ${highScore}`;
startBtn.disabled = true; // require user to pick both selects

// enable start only when both selections are made
function checkSelections() {
  startBtn.disabled = !(categorySelect.value && difficultySelect.value);
}
categorySelect.addEventListener("change", checkSelections);
difficultySelect.addEventListener("change", checkSelections);

// start quiz
startBtn.addEventListener("click", fetchQuestions);

// fetch 15 questions with chosen category & difficulty
async function fetchQuestions() {
  if (!categorySelect.value || !difficultySelect.value) {
    alert("Please select both a category and a difficulty to start.");
    return;
  }

  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const apiUrl = `https://opentdb.com/api.php?amount=15&type=multiple&category=${category}&difficulty=${difficulty}`;

  try {
    startBtn.disabled = true;
    startBtn.innerText = "Loading...";
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No questions returned for this selection. Try another combination.");
    }
    questions = data.results;
    currentQuestionIndex = 0;
    score = 0;
    initBox.style.display = "none";
    quizBox.classList.remove("hide");
    resultBox.classList.add("hide");
    showQuestion();
  } catch (err) {
    alert(err.message || "Failed to load questions. Try again.");
    initBox.style.display = "block";
  } finally {
    startBtn.innerText = "Start Quiz";
    checkSelections();
  }
}

function showQuestion() {
  resetState();
  const currentQuestion = questions[currentQuestionIndex];
  currentQuestionText.innerText = currentQuestionIndex + 1;
  questionElement.innerHTML = decodeHTML(currentQuestion.question);
  questionElement.classList.remove("fade");
  void questionElement.offsetWidth; // force reflow to restart animation
  questionElement.classList.add("fade");

  const answers = [...currentQuestion.incorrect_answers, currentQuestion.correct_answer];
  shuffleArray(answers);

  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerHTML = decodeHTML(answer);
    if (answer === currentQuestion.correct_answer) btn.dataset.correct = "true";
    btn.addEventListener("click", selectAnswer);
    answerContainer.appendChild(btn);
  });

  startTimer();
}

function resetState() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 15;
  timeElement.textContent = timeLeft;
  timeElement.classList.remove("low-time");
  nextButton.classList.add("hide");
  answerContainer.innerHTML = "";
}

function startTimer() {
  timeLeft = 15;
  timeElement.textContent = timeLeft;
  timeElement.classList.remove("low-time");

  timerInterval = setInterval(() => {
    timeLeft--;
    timeElement.textContent = timeLeft;

    if (timeLeft <= 5) timeElement.classList.add("low-time");
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeIsUp();
    }
  }, 1000);
}

function timeIsUp() {
  const currentButtons = document.querySelectorAll(".answer-btn");
  currentButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add("disabled");
    if (btn.dataset.correct === "true") btn.classList.add("correct");
  });
  nextButton.classList.remove("hide");
}

function selectAnswer(e) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const selectedBtn = e.currentTarget;
  const isCorrect = selectedBtn.dataset.correct === "true";

  if (isCorrect) {
    score++;
    selectedBtn.classList.add("correct");
  } else {
    selectedBtn.classList.add("wrong");
  }

  // reveal correct answer and disable all
  Array.from(answerContainer.children).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === "true") btn.classList.add("correct");
  });

  nextButton.classList.remove("hide");
}

// next question / finish
nextButton.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
});

function endQuiz() {
  clearInterval(timerInterval);
  timerInterval = null;
  quizBox.classList.add("hide");
  resultBox.classList.remove("hide");
  scoreText.innerText = `${score} / ${questions.length}`;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreDisplay.innerText = `High Score: ${highScore}`;
  }
}

// restart quiz: show selection screen again
restartBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  initBox.style.display = "flex";
  quizBox.classList.add("hide");
  resultBox.classList.add("hide");
  // reset selects to placeholder
  categorySelect.selectedIndex = 0;
  difficultySelect.selectedIndex = 0;
  checkSelections();
});

// dark mode toggle
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// utilities
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
