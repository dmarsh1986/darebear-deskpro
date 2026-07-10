"use strict";

const MESSAGE_INTERVAL_MS = 5000;
const TRIPLE_TAP_WINDOW_MS = 1500;
const TERMINAL_SPEED_MS = 36;

let tapCount = 0;
let tapTimer = null;
let afterHoursModeEnabled = false;
let transitionRunning = false;
let lastMessage = "";

const bearLogo = document.getElementById("bear-logo");
const speechBubble = document.getElementById("speech-bubble");
const bootOverlay = document.getElementById("boot-overlay");
const terminalText = document.getElementById("terminal-text");
const afterHoursButtons =
  document.getElementById("after-hours-buttons");

const internetStatus =
  document.getElementById("internet-status");

const normalMessages = [
  "Bass levels holding steady.",
  "Need another coffee?",
  "Another TAC case?",
  "Checking room status...",
  "Control Hub is behaving today.",
  "Systems operating normally.",
  "Ready for another deployment?",
  "Don't forget to commit your changes.",
  "Did you reboot it yet?",
  "Cisco TAC fears this engineer.",
  "RoomOS looking healthy.",
  "Vibes detected.",
  "One more firmware upgrade...",
  "Engineer Mode active.",
  "Remember to hydrate.",
  "Coffee level: LOW.",
  "Monitoring bass pressure.",
  "Searching for bugs...",
  "Building awesome things.",
  "Professional by day. DJ by night.",
  "Everything looks nominal.",
  "Let's make a conference room amazing."
];

const morningMessages = [
  "Good morning, Darren.",
  "Coffee first. Configurations second.",
  "Engineer Mode is ready.",
  "Let's start the day clean.",
  "No alerts yet. Enjoy it."
];

const afternoonMessages = [
  "Good afternoon, Darren.",
  "Finish strong.",
  "Another deployment?",
  "Lunch status: hopefully completed.",
  "Systems are holding steady."
];

const eveningMessages = [
  "Good evening, Darren.",
  "After Hours Mode is waiting.",
  "Bass pressure is increasing.",
  "Professional hours nearly complete.",
  "Ready to Enter the Bear Den?"
];

const weekendMessages = [
  "Weekend Mode detected.",
  "No TAC today.",
  "Time to make some music.",
  "Work can wait. Bass cannot.",
  "Enjoy the weekend, Darren."
];

function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent =
    now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

  document.getElementById("date").textContent =
    now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const greetingTitle =
    document.getElementById("greeting-title");

  const greetingText =
    document.getElementById("greeting-text");

  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    greetingTitle.textContent =
      "🐻 Weekend Mode";

    greetingText.textContent =
      "No TAC today. Time to relax or make some music.";

    return;
  }

  if (hour < 12) {
    greetingTitle.textContent =
      "☀️ Good Morning, Darren";

    greetingText.textContent =
      "Coffee level check complete. Engineer Mode is ready.";

    return;
  }

  if (hour < 17) {
    greetingTitle.textContent =
      "🛠️ Good Afternoon, Darren";

    greetingText.textContent =
      "Systems are online. Let's finish strong.";

    return;
  }

  greetingTitle.textContent =
    "🌙 Good Evening, Darren";

  greetingText.textContent =
    "Professional hours complete. The Bear Den is waiting.";
}

function updateConnectivity() {
  if (navigator.onLine) {
    internetStatus.textContent = "Online";
    internetStatus.className = "status-value";
  } else {
    internetStatus.textContent = "Offline";
    internetStatus.className =
      "status-value offline";
  }
}

function getMessagePool() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (day === 0 || day === 6) {
    return [
      ...normalMessages,
      ...weekendMessages
    ];
  }

  if (hour < 12) {
    return [
      ...normalMessages,
      ...morningMessages
    ];
  }

  if (hour < 17) {
    return [
      ...normalMessages,
      ...afternoonMessages
    ];
  }

  return [
    ...normalMessages,
    ...eveningMessages
  ];
}

function chooseMessage() {
  const messagePool = getMessagePool();

  let selectedMessage =
    messagePool[
      Math.floor(Math.random() * messagePool.length)
    ];

  while (
    selectedMessage === lastMessage &&
    messagePool.length > 1
  ) {
    selectedMessage =
      messagePool[
        Math.floor(Math.random() * messagePool.length)
      ];
  }

  lastMessage = selectedMessage;

  return selectedMessage;
}

function getStatusCaption() {
  const hour = new Date().getHours();

  if (!navigator.onLine) {
    return "Network: Offline";
  }

  if (hour >= 17 || hour < 6) {
    return "After Hours Mode available";
  }

  return "Systems: Online";
}

function rotateBearMessage() {
  if (
    afterHoursModeEnabled ||
    transitionRunning
  ) {
    return;
  }

  speechBubble.style.opacity = "0";

  setTimeout(() => {
    speechBubble.innerHTML =
      `${chooseMessage()}` +
      `<br><br>` +
      `<span class="small-text">` +
      `${getStatusCaption()}` +
      `</span>`;

    speechBubble.style.opacity = "1";
  }, 300);
}

function showTemporaryMessage(title, detail) {
  if (
    afterHoursModeEnabled ||
    transitionRunning
  ) {
    return;
  }

  speechBubble.style.opacity = "0";

  setTimeout(() => {
    speechBubble.innerHTML =
      `${title}` +
      `<br><br>` +
      `<span class="small-text">` +
      `${detail}` +
      `</span>`;

    speechBubble.style.opacity = "1";
  }, 250);
}

function openTool(url) {
  if (!url) {
    showTemporaryMessage(
      "Tool unavailable",
      "No URL was configured."
    );

    return;
  }

  window.location.href = url;
}

function runNetworkTest() {
  updateConnectivity();

  const result = navigator.onLine
    ? "Internet connectivity detected."
    : "No internet connectivity detected.";

  showTemporaryMessage(
    "🌐 Network Test",
    result
  );
}

async function typeTerminalText(
  text,
  speed = TERMINAL_SPEED_MS
) {
  terminalText.textContent = "";

  for (const character of text) {
    terminalText.textContent += character;

    await new Promise(resolve => {
      setTimeout(resolve, speed);
    });
  }
}

async function startAfterHoursSequence() {
  if (transitionRunning) {
    return;
  }

  transitionRunning = true;
  bootOverlay.style.display = "flex";

  const bootText =
`> Initializing DareBear OS...

> Connecting to Bass Engine...
████████████████ 100%

> Scanning Vibes...
████████████████ 100%

> Loading Mischief...
████████████████ 100%

> After Hours Mode Activated.

Welcome back, Darren.`;

  await typeTerminalText(bootText);

  await new Promise(resolve => {
    setTimeout(resolve, 900);
  });

  bootOverlay.style.display = "none";

  enableAfterHoursMode();

  transitionRunning = false;
}

function enableAfterHoursMode() {
  afterHoursModeEnabled = true;

  document.body.style.background =
    "radial-gradient(" +
    "circle at center," +
    "#ff6a00," +
    "#6a00ff," +
    "#000000 80%" +
    ")";

  bearLogo.style.animation =
    "bear-float 3s infinite ease-in-out";

  bearLogo.style.transform =
    "scale(1.08) rotate(-3deg)";

  bearLogo.style.filter =
    "drop-shadow(0 0 45px #ff7b00) " +
    "drop-shadow(0 0 95px #6a00ff)";

  speechBubble.style.opacity = "1";

  speechBubble.innerHTML =
    "🐻 AFTER HOURS MODE" +
    "<br><br>" +
    "Bass Levels: MAXIMUM" +
    "<br>" +
    "Vibes: LEGENDARY" +
    "<br><br>" +
    "ENTER THE BEAR DEN";

  speechBubble.style.background = "#141414";
  speechBubble.style.color = "#00ffe1";

  speechBubble.style.boxShadow =
    "0 0 30px #ff7b00, " +
    "0 0 80px #6a00ff";

  afterHoursButtons.style.display = "flex";
}

function disableAfterHoursMode() {
  afterHoursModeEnabled = false;

  document.body.style.background =
    "radial-gradient(" +
    "circle at top left," +
    "#241047," +
    "#050008 70%" +
    ")";

  bearLogo.style.animation =
    "bear-pulse 1.8s infinite alternate, " +
    "bear-float 5s infinite ease-in-out";

  bearLogo.style.transform = "scale(1)";

  bearLogo.style.filter =
    "drop-shadow(0 0 20px #00ffe1) " +
    "drop-shadow(0 0 50px #a600ff)";

  speechBubble.style.opacity = "1";

  speechBubble.innerHTML =
    "Welcome Darren." +
    "<br>" +
    "Bass Levels: Nominal" +
    "<br>" +
    "Vibes Detected";

  speechBubble.style.background =
    "rgba(255, 255, 255, 0.97)";

  speechBubble.style.color = "#231447";

  speechBubble.style.boxShadow =
    "0 0 20px #00ffe1, " +
    "0 0 45px #a600ff";

  afterHoursButtons.style.display = "none";
}

function activateRoar() {
  document.body.classList.add("flash");
  bearLogo.classList.add("shake");

  speechBubble.innerHTML =
    "🐻 ROOOAAARRR!" +
    "<br><br>" +
    "Bass Pressure: Critical" +
    "<br>" +
    "Vibes: Uncontained";

  setTimeout(() => {
    document.body.classList.remove("flash");
    bearLogo.classList.remove("shake");
  }, 550);
}

function activateDjMode() {
  speechBubble.innerHTML =
    "🎧 DJ MODE ARMED" +
    "<br><br>" +
    "Decks: Ready" +
    "<br>" +
    "Bass Face: Engaged" +
    "<br>" +
    "ENTER THE BEAR DEN";
}

function handleBearTap() {
  if (transitionRunning) {
    return;
  }

  tapCount++;

  clearTimeout(tapTimer);

  tapTimer = setTimeout(() => {
    tapCount = 0;
  }, TRIPLE_TAP_WINDOW_MS);

  if (tapCount < 3) {
    return;
  }

  tapCount = 0;

  if (afterHoursModeEnabled) {
    disableAfterHoursMode();
  } else {
    startAfterHoursSequence();
  }
}

function configureButtons() {
  document
    .querySelectorAll(".tool[data-url]")
    .forEach(button => {
      button.addEventListener("click", () => {
        openTool(button.dataset.url);
      });
    });

  document
    .getElementById("network-test")
    .addEventListener(
      "click",
      runNetworkTest
    );

  document
    .getElementById("roar-button")
    .addEventListener(
      "click",
      activateRoar
    );

  document
    .getElementById("dj-button")
    .addEventListener(
      "click",
      activateDjMode
    );

  bearLogo.addEventListener(
    "click",
    handleBearTap
  );
}

window.addEventListener(
  "online",
  updateConnectivity
);

window.addEventListener(
  "offline",
  updateConnectivity
);

configureButtons();
updateClock();
updateGreeting();
updateConnectivity();

setInterval(
  updateClock,
  1000
);

setInterval(
  updateGreeting,
  60000
);

setInterval(
  rotateBearMessage,
  MESSAGE_INTERVAL_MS
);
