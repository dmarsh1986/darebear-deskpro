"use strict";

/*
 * DareBear OS v3.0
 *
 * Required files:
 *   logo.png
 *   roar.mp3
 *   melt-your-bass-face.mp3
 */

const SETTINGS = {
  messageIntervalMs: 5000,
  statusRefreshMs: 60000,
  tripleTapWindowMs: 1500,
  terminalSpeedMs: 31,

  webexStatusUrl:
    "https://status.webex.com/summary.json",

  epicStatusUrl:
    "https://status.epicgames.com/api/v2/summary.json",

  awsTestUrl:
    "https://aws.amazon.com/favicon.ico",

  networkTestUrl:
    "https://www.cloudflare.com/cdn-cgi/trace",

  githubTestUrl:
    "https://dmarsh1986.github.io/darebear-deskpro/"
};

let tapCount = 0;
let tapTimer = null;

let afterHoursEnabled = false;
let djModeEnabled = false;
let transitionRunning = false;
let lastMessage = "";

const bearLogo =
  document.getElementById("bear-logo");

const speechBubble =
  document.getElementById("speech-bubble");

const bootOverlay =
  document.getElementById("boot-overlay");

const terminalText =
  document.getElementById("terminal-text");

const afterHoursButtons =
  document.getElementById("after-hours-buttons");

const musicControls =
  document.getElementById("music-controls");

const modeLabel =
  document.getElementById("mode-label");

const roarAudio =
  document.getElementById("roar-audio");

const musicAudio =
  document.getElementById("music-audio");

const normalMessages = [
  "Bass levels holding steady.",
  "Need another coffee?",
  "Another TAC case?",
  "Checking cloud services...",
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
  "Fortnite status looks important.",
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

/* Clock and greeting */

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

  const title =
    document.getElementById("greeting-title");

  const text =
    document.getElementById("greeting-text");

  const weekend =
    day === 0 || day === 6;

  if (weekend) {
    title.textContent =
      "🐻 Weekend Mode";

    text.textContent =
      "No TAC today. Time to relax or make some music.";

    return;
  }

  if (hour < 12) {
    title.textContent =
      "☀️ Good Morning, Darren";

    text.textContent =
      "Coffee level check complete. Engineer Mode is ready.";

    return;
  }

  if (hour < 17) {
    title.textContent =
      "🛠️ Good Afternoon, Darren";

    text.textContent =
      "Cloud services are being monitored. Let's finish strong.";

    return;
  }

  title.textContent =
    "🌙 Good Evening, Darren";

  text.textContent =
    "Professional hours complete. The Bear Den is waiting.";
}

/* DareBear rotating messages */

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
  const pool = getMessagePool();

  let selected =
    pool[
      Math.floor(Math.random() * pool.length)
    ];

  while (
    selected === lastMessage &&
    pool.length > 1
  ) {
    selected =
      pool[
        Math.floor(Math.random() * pool.length)
      ];
  }

  lastMessage = selected;

  return selected;
}

function getStatusCaption() {
  const hour =
    new Date().getHours();

  if (!navigator.onLine) {
    return "Network: Offline";
  }

  if (hour >= 17 || hour < 6) {
    return "After Hours Mode available";
  }

  return "Monitoring services";
}

function rotateBearMessage() {
  if (
    afterHoursEnabled ||
    transitionRunning ||
    djModeEnabled
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
  }, 280);
}

/* Status helpers */

function setStatus(
  prefix,
  state,
  label,
  detail
) {
  const dot =
    document.getElementById(`${prefix}-dot`);

  const status =
    document.getElementById(`${prefix}-status`);

  const statusDetail =
    document.getElementById(`${prefix}-detail`);

  dot.className =
    `status-dot ${state}`;

  status.textContent = label;
  statusDetail.textContent = detail;
}

function normalizeStatusIndicator(indicator) {
  const value =
    String(indicator || "")
      .toLowerCase();

  if (
    value.includes("none") ||
    value.includes("operational") ||
    value.includes("ok")
  ) {
    return {
      css: "operational",
      label: "Operational"
    };
  }

  if (
    value.includes("minor") ||
    value.includes("maintenance") ||
    value.includes("degraded")
  ) {
    return {
      css: "degraded",
      label: "Degraded"
    };
  }

  if (
    value.includes("major") ||
    value.includes("critical") ||
    value.includes("outage")
  ) {
    return {
      css: "outage",
      label: "Service Issue"
    };
  }

  return {
    css: "unknown",
    label: "Unknown"
  };
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 8000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

/* Internet and latency */

async function checkInternetAndLatency() {
  if (!navigator.onLine) {
    setStatus(
      "internet",
      "outage",
      "Offline",
      "Browser reports no network connection"
    );

    setStatus(
      "latency",
      "outage",
      "Unavailable",
      "No active internet connection"
    );

    return;
  }

  setStatus(
    "internet",
    "checking",
    "Testing...",
    "Checking outbound connectivity"
  );

  setStatus(
    "latency",
    "checking",
    "Testing...",
    "Measuring approximate response time"
  );

  const started =
    performance.now();

  try {
    await fetchWithTimeout(
      `${SETTINGS.networkTestUrl}?t=${Date.now()}`,
      {
        mode: "no-cors"
      },
      7000
    );

    const elapsed =
      Math.round(
        performance.now() - started
      );

    setStatus(
      "internet",
      "operational",
      "Online",
      "Outbound connectivity detected"
    );

    let latencyState = "operational";
    let latencyLabel = `${elapsed} ms`;

    if (elapsed > 1500) {
      latencyState = "degraded";
      latencyLabel = `${elapsed} ms`;
    }

    setStatus(
      "latency",
      latencyState,
      latencyLabel,
      "Approximate HTTPS response time"
    );
  } catch (error) {
    setStatus(
      "internet",
      "degraded",
      "Limited",
      "The browser is online, but the test timed out"
    );

    setStatus(
      "latency",
      "unknown",
      "Unavailable",
      "Network test could not complete"
    );
  }
}

/* Webex status */

async function checkWebexStatus() {
  setStatus(
    "webex",
    "checking",
    "Checking...",
    "Contacting Webex status service"
  );

  try {
    const response =
      await fetchWithTimeout(
        `${SETTINGS.webexStatusUrl}?t=${Date.now()}`
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    const indicator =
      data.status?.indicator ||
      data.indicator ||
      data.status ||
      "unknown";

    const description =
      data.status?.description ||
      data.description ||
      "Webex status response received";

    const normalized =
      normalizeStatusIndicator(indicator);

    setStatus(
      "webex",
      normalized.css,
      normalized.label,
      description
    );
  } catch (error) {
    /*
     * RoomOS WebEngine may block cross-origin JSON.
     * This does not necessarily mean Webex is down.
     */

    setStatus(
      "webex",
      "unknown",
      "Unable to Query",
      "Status API blocked or unavailable"
    );
  }
}

/* Fortnite / Epic status */

async function checkFortniteStatus() {
  setStatus(
    "fortnite",
    "checking",
    "Checking...",
    "Contacting Epic status service"
  );

  try {
    const response =
      await fetchWithTimeout(
        `${SETTINGS.epicStatusUrl}?t=${Date.now()}`
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    const indicator =
      data.status?.indicator ||
      "unknown";

    const description =
      data.status?.description ||
      "Epic status response received";

    const normalized =
      normalizeStatusIndicator(indicator);

    setStatus(
      "fortnite",
      normalized.css,
      normalized.label,
      description
    );
  } catch (error) {
    setStatus(
      "fortnite",
      "unknown",
      "Unable to Query",
      "Epic API blocked or unavailable"
    );
  }
}

/* AWS endpoint reachability */

async function checkAwsReachability() {
  setStatus(
    "aws",
    "checking",
    "Checking...",
    "Testing AWS public endpoint"
  );

  const started =
    performance.now();

  try {
    await fetchWithTimeout(
      `${SETTINGS.awsTestUrl}?t=${Date.now()}`,
      {
        mode: "no-cors"
      },
      7000
    );

    const elapsed =
      Math.round(
        performance.now() - started
      );

    setStatus(
      "aws",
      "operational",
      "Reachable",
      `AWS endpoint responded in about ${elapsed} ms`
    );
  } catch (error) {
    setStatus(
      "aws",
      "degraded",
      "Unreachable",
      "Public AWS endpoint did not respond"
    );
  }
}

/* GitHub Pages reachability */

async function checkGithubStatus() {
  setStatus(
    "github",
    "checking",
    "Checking...",
    "Testing hosted dashboard"
  );

  const started =
    performance.now();

  try {
    const response =
      await fetchWithTimeout(
        `${SETTINGS.githubTestUrl}?health=${Date.now()}`,
        {
          method: "HEAD"
        },
        7000
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const elapsed =
      Math.round(
        performance.now() - started
      );

    setStatus(
      "github",
      "operational",
      "Reachable",
      `Dashboard responded in about ${elapsed} ms`
    );
  } catch (error) {
    setStatus(
      "github",
      "degraded",
      "Unavailable",
      "GitHub dashboard test failed"
    );
  }
}

/* Refresh all status cards */

async function refreshStatuses() {
  document.getElementById(
    "refresh-status-button"
  ).textContent = "Checking...";

  await Promise.allSettled([
    checkInternetAndLatency(),
    checkWebexStatus(),
    checkFortniteStatus(),
    checkAwsReachability(),
    checkGithubStatus()
  ]);

  document.getElementById(
    "last-checked"
  ).textContent =
    new Date().toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
      }
    );

  document.getElementById(
    "refresh-status-button"
  ).textContent = "Refresh";
}

/* Triple-tap After Hours sequence */

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function typeTerminalText(
  text,
  speed = SETTINGS.terminalSpeedMs
) {
  terminalText.textContent = "";

  for (const character of text) {
    terminalText.textContent += character;

    await sleep(speed);
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

> Preparing Audio Systems...
████████████████ 100%

> After Hours Mode Activated.

Welcome back, Darren.`;

  await typeTerminalText(bootText);

  await sleep(850);

  bootOverlay.style.display = "none";

  enableAfterHoursMode();

  transitionRunning = false;
}

function enableAfterHoursMode() {
  afterHoursEnabled = true;

  modeLabel.textContent =
    "AFTER HOURS MODE";

  modeLabel.style.color =
    "#ff7b00";

  modeLabel.style.borderColor =
    "rgba(255,123,0,.65)";

  modeLabel.style.background =
    "rgba(255,123,0,.10)";

  document.body.style.background =
    "radial-gradient(" +
    "circle at center," +
    "#5a006e," +
    "#1b002b 50%," +
    "#020003 100%" +
    ")";

  bearLogo.style.filter =
    "drop-shadow(0 0 36px #ff7b00) " +
    "drop-shadow(0 0 88px #a600ff)";

  speechBubble.innerHTML =
    "🐻 AFTER HOURS MODE" +
    "<br><br>" +
    "Bass Levels: MAXIMUM" +
    "<br>" +
    "Vibes: LEGENDARY" +
    "<br><br>" +
    "ENTER THE BEAR DEN";

  speechBubble.style.background =
    "rgba(10,10,14,.94)";

  speechBubble.style.color =
    "#00ffe1";

  speechBubble.style.boxShadow =
    "0 0 28px #ff7b00, " +
    "0 0 70px #a600ff";

  afterHoursButtons.style.display =
    "flex";
}

function disableAfterHoursMode() {
  stopDjMode();

  afterHoursEnabled = false;

  modeLabel.textContent =
    "ENGINEER MODE";

  modeLabel.style.color =
    "#00ffe1";

  modeLabel.style.borderColor =
    "rgba(0,255,225,.4)";

  modeLabel.style.background =
    "rgba(0,255,225,.08)";

  document.body.style.background =
    "radial-gradient(" +
    "circle at top left," +
    "#25104f," +
    "#07000c 58%," +
    "#020003 100%" +
    ")";

  bearLogo.style.filter =
    "drop-shadow(0 0 18px #00ffe1) " +
    "drop-shadow(0 0 45px #a600ff)";

  speechBubble.innerHTML =
    "Welcome Darren." +
    "<br>" +
    "Bass Levels: Nominal" +
    "<br>" +
    "Vibes Detected";

  speechBubble.style.background =
    "rgba(255,255,255,.97)";

  speechBubble.style.color =
    "#251240";

  speechBubble.style.boxShadow =
    "0 0 18px #00ffe1, " +
    "0 0 40px #a600ff";

  afterHoursButtons.style.display =
    "none";

  musicControls.style.display =
    "none";
}

function handleBearTap() {
  if (transitionRunning) {
    return;
  }

  tapCount++;

  clearTimeout(tapTimer);

  tapTimer =
    setTimeout(() => {
      tapCount = 0;
    }, SETTINGS.tripleTapWindowMs);

  if (tapCount < 3) {
    return;
  }

  tapCount = 0;

  if (afterHoursEnabled) {
    disableAfterHoursMode();
  } else {
    startAfterHoursSequence();
  }
}

/* ROAR */

async function activateRoar() {
  try {
    roarAudio.currentTime = 0;

    await roarAudio.play();
  } catch (error) {
    console.error(
      "Unable to play roar audio:",
      error
    );
  }

  document.body.classList.remove(
    "flash"
  );

  bearLogo.classList.remove(
    "shake"
  );

  /*
   * Restart animations reliably.
   */
  void document.body.offsetWidth;
  void bearLogo.offsetWidth;

  document.body.classList.add(
    "flash"
  );

  bearLogo.classList.add(
    "shake"
  );

  speechBubble.innerHTML =
    "🐻 RAAWR... GRRRR!" +
    "<br><br>" +
    "Bass Pressure: Critical" +
    "<br>" +
    "Diva Levels: Fabulous";

  setTimeout(() => {
    document.body.classList.remove(
      "flash"
    );

    bearLogo.classList.remove(
      "shake"
    );
  }, 700);
}

/* DJ Mode */

async function startDjMode() {
  djModeEnabled = true;

  document.body.classList.add(
    "dj-active"
  );

  musicControls.style.display =
    "block";

  speechBubble.innerHTML =
    "🎧 DJ MODE ENGAGED" +
    "<br><br>" +
    "Now Playing:" +
    "<br>" +
    "Melt Your Bass Face";

  speechBubble.style.background =
    "rgba(8,5,12,.94)";

  speechBubble.style.color =
    "#ff7b00";

  speechBubble.style.boxShadow =
    "0 0 30px #ff7b00, " +
    "0 0 75px #ff00ff, " +
    "0 0 105px #00ffe1";

  try {
    musicAudio.currentTime = 0;

    /*
     * Set to false if you only want one playthrough.
     */
    musicAudio.loop = true;

    await musicAudio.play();

    document.getElementById(
      "pause-music-button"
    ).textContent = "Pause";
  } catch (error) {
    console.error(
      "Unable to play song:",
      error
    );

    speechBubble.innerHTML =
      "🎧 DJ LIGHTS ACTIVE" +
      "<br><br>" +
      "Audio could not start." +
      "<br>" +
      "Tap DJ MODE again.";
  }
}

function toggleMusicPause() {
  const button =
    document.getElementById(
      "pause-music-button"
    );

  if (musicAudio.paused) {
    musicAudio
      .play()
      .then(() => {
        button.textContent = "Pause";
      })
      .catch(error => {
        console.error(
          "Unable to resume music:",
          error
        );
      });

    return;
  }

  musicAudio.pause();

  button.textContent = "Resume";
}

function stopDjMode() {
  djModeEnabled = false;

  document.body.classList.remove(
    "dj-active"
  );

  musicAudio.pause();
  musicAudio.currentTime = 0;

  musicControls.style.display =
    "none";

  if (afterHoursEnabled) {
    speechBubble.innerHTML =
      "🐻 AFTER HOURS MODE" +
      "<br><br>" +
      "Bass Levels: MAXIMUM" +
      "<br>" +
      "Vibes: LEGENDARY" +
      "<br><br>" +
      "ENTER THE BEAR DEN";

    speechBubble.style.background =
      "rgba(10,10,14,.94)";

    speechBubble.style.color =
      "#00ffe1";

    speechBubble.style.boxShadow =
      "0 0 28px #ff7b00, " +
      "0 0 70px #a600ff";
  }
}

/* Button and browser events */

function configureEvents() {
  bearLogo.addEventListener(
    "click",
    handleBearTap
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
      startDjMode
    );

  document
    .getElementById("pause-music-button")
    .addEventListener(
      "click",
      toggleMusicPause
    );

  document
    .getElementById("stop-music-button")
    .addEventListener(
      "click",
      stopDjMode
    );

  document
    .getElementById("refresh-status-button")
    .addEventListener(
      "click",
      refreshStatuses
    );

  window.addEventListener(
    "online",
    refreshStatuses
  );

  window.addEventListener(
    "offline",
    refreshStatuses
  );

  musicAudio.addEventListener(
    "error",
    () => {
      console.error(
        "Song file failed to load. " +
        "Confirm the filename is exactly " +
        "melt-your-bass-face.mp3"
      );
    }
  );

  roarAudio.addEventListener(
    "error",
    () => {
      console.error(
        "Roar file failed to load. " +
        "Confirm the filename is exactly roar.mp3"
      );
    }
  );
}

/* Start */

configureEvents();

updateClock();
updateGreeting();
refreshStatuses();

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
  SETTINGS.messageIntervalMs
);

setInterval(
  refreshStatuses,
  SETTINGS.statusRefreshMs
);
