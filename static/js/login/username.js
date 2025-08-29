var minifigure = document.querySelector(".minifigure");
var faces = document.querySelector(".faces");
var upperBody = document.querySelector(".upper-body");
var lowerBody = document.querySelector(".lower-body");
var submit = document.querySelector(".randomize");
// var submit = document.querySelector(".submit");

const expressions = [
  "Classic",
  "Smile",
  "Large Smile",
  "Worried",
  "Frown",
  "Surprised",
];
const colors = [
  { name: "Red", hsl: "hsl(0, 100%, 50%)" },
  { name: "Orange", hsl: "hsl(30, 100%, 50%)" },
  { name: "Yellow", hsl: "hsl(60, 100%, 50%)" },
  { name: "Green", hsl: "hsl(120, 100%, 50%)" },
  { name: "Blue", hsl: "hsl(240, 100%, 50%)" },
  { name: "Purple", hsl: "hsl(270, 100%, 50%)" },
  { name: "Pink", hsl: "hsl(300, 100%, 70%)" },
  { name: "Brown", hsl: "hsl(30, 50%, 30%)" },
  { name: "Gray", hsl: "hsl(0, 0%, 50%)" },
  { name: "White", hsl: "hsl(0, 0%, 90%)" },
  { name: "Black", hsl: "hsl(0, 0%, 10%)" },
];

let currentExpression = 0;
let currentUpperColor = 9;
let currentLowerColor = 9;

// randomize.addEventListener("click", randomizeInputs);
submit.addEventListener("click", submitUsername);

document.querySelectorAll(".arrow").forEach((button) => {
  button.addEventListener("click", handleArrowClick);
});

function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function randomizeInputs() {
  currentExpression = getRandomNum(0, expressions.length);
  currentUpperColor = getRandomNum(0, colors.length);
  currentLowerColor = getRandomNum(0, colors.length);

  updateDisplay();
  setExpression();
  setColors();
}

function submitUsername() {
  let username = `${currentExpression}${currentUpperColor}${currentLowerColor}`;
  fetch("/login/username", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  })
    .then((res) => res.json()) // parse JSON here
    .then((data) => {
      if (data.success) {
        window.location.href = "/login/password";
      }
    })
    .catch((err) => console.error("Fetch error:", err));
}

function handleArrowClick(event) {
  const target = event.target.getAttribute("data-target");
  const direction = event.target.classList.contains("left") ? -1 : 1;

  if (target === "expression") {
    currentExpression =
      (currentExpression + direction + expressions.length) % expressions.length;
    setExpression();
  } else if (target === "upper-color") {
    currentUpperColor =
      (currentUpperColor + direction + colors.length) % colors.length;
    setColors();
  } else if (target === "lower-color") {
    currentLowerColor =
      (currentLowerColor + direction + colors.length) % colors.length;
    setColors();
  }
}

function setExpression() {
  const expressionVal = currentExpression * 100;
  faces.style.transform = "translateX(-" + expressionVal + "%)";
}

function setColors() {
  upperBody.style.color = colors[currentUpperColor].hsl;
  lowerBody.style.color = colors[currentLowerColor].hsl;
}

setExpression();
setColors();
