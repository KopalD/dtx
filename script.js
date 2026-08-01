'use strict';

/* =========================================================================
   CONFIG — everything you'll want to tweak or "plug in" more of lives here.
   Add a new person by pushing another object into CONFIG.invitees; the
   screen-2 grid renders itself from this array, so no HTML/CSS edit needed.
   ========================================================================= */
const CONFIG = {

  invitees: [
    {
      id: 'prashant',
      name: 'Prashant',
      bio: 'Best buddy',
      avatar: '🧑',
      busyMessage: 'Prashant is busy with his kids and sarkar 👨‍👩‍👧‍👦… maybe next year?'
    },
    {
      id: 'shweta',
      name: 'Shweta',
      bio: 'Coffee & JIRA expert',
      avatar: '👩',
      busyMessage: 'Mazya kade ved nahi 😅… she needs to feed her husband!'
    },
    {
      id: 'nutan',
      name: 'Nutan',
      bio: 'Resident Calm & Sweet',
      avatar: '🥰',
      busyMessage: 'Nutan is busy playing UNO with her cousins… 🃏'
    },
    {
      id: 'sneha',
      name: 'Sneha',
      bio: 'Chaos in human form',
      avatar: '😈',
      busyMessage: 'Kaam karo, yeh sab kya kar rahe ho 🙃'
    },
    {
      id: 'thopate',
      name: 'Thopate',
      bio: 'Self-proclaimed wingman',
      avatar: '🧑‍🦱',
      busyMessage: 'Thopate is "busy" i.e. shopping at Dmart with family for rashan 🛒'
    }
  ],

  dodgePhrases: [
    'Nice try 😏',
    'Sabke sath hi jana hai!',
    'Ek baar soch lo 🤔',
    'Aisa please mat karo 🥺',
    'Itni jaldi na mat bolo 😅',
    'Cursor se door raho! ',
    'Thoda toh sharam karo 😳',
    'Naa mane... NAA! 😑'
  ],

  dodgeRadiusPx: 110,
  dodgeMoveCooldownMs: 120,
  dodgeMessageCooldownMs: 2000,
  particleCount: { sky: 26, void: 22 },
  floatyHeartCount: 14,
  brokenHeartCount: 16,
  cursorTrailEnabled: window.matchMedia('(pointer: fine)').matches,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

/* =========================================================================
   ANALYTICS — session id, per-page timing, NO-button chase stats, invite
   clicks, and a page-by-page log submitted to Formspree. A fresh session
   is created every time the page loads/refreshes (nothing is persisted in
   browser storage), and everything is also mirrored to the console.
   ========================================================================= */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mgogjyzp';

function makeSessionId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

const Analytics = {
  sessionId: makeSessionId(),
  sessionStartedAt: new Date(),
  currentPage: null,
  page4Reached: false,
  finalized: false,

  pages: {
    1: { name: 'opening-yes-no', enteredAt: null, exitedAt: null, durationSeconds: null },
    2: { name: 'invite-others', enteredAt: null, exitedAt: null, durationSeconds: null },
    3: { name: 'plan-cancelled', enteredAt: null, exitedAt: null, durationSeconds: null, clickedTryAgain: false, clickedBinaSabKeSath: false },
    4: { name: 'just-us-then', enteredAt: null, exitedAt: null, durationSeconds: null, reached: false },
  },

  // internal-only, raw ms timestamps used purely to compute durations — not submitted
  _rawEnteredAt: {},

  noButton: { chaseCount: 0, clickCount: 0 },
  yesNoSequence: [],
  invitesClicked: [],
  events: [],

  log(type, data = {}) {
    const entry = { ts: Date.now(), time: new Date().toLocaleTimeString(), type, ...data };
    this.events.push(entry);
    console.log(`%c💌 [${this.sessionId.slice(0, 8)}] ${type}`, 'color:#FF4D8D;font-weight:600;', entry);
    return entry;
  },

  enterPage(n) {
    this.currentPage = n;
    const now = Date.now();
    this._rawEnteredAt[n] = now;
    this.pages[n].enteredAt = new Date(now).toLocaleString();
    this.log('page_enter', { page: n, pageName: this.pages[n].name, enteredAt: this.pages[n].enteredAt });
  },

  exitPage(n) {
    const p = this.pages[n];
    if (!this._rawEnteredAt[n] || p.exitedAt) return;
    const now = Date.now();
    p.exitedAt = new Date(now).toLocaleString();
    p.durationSeconds = +((now - this._rawEnteredAt[n]) / 1000).toFixed(1);
    this.log('page_exit', { page: n, pageName: p.name, durationSeconds: p.durationSeconds });
    submitPage(`page-${n}-${p.name}`, this.pagePayload(n));
  },

  // only the data that belongs to that specific page — no other pages,
  // no full-session dump.
  pagePayload(n) {
    const p = this.pages[n];
    const base = {
      sessionId: this.sessionId,
      page: n,
      pageName: p.name,
      enteredAt: p.enteredAt,
      exitedAt: p.exitedAt,
      durationSeconds: p.durationSeconds,
      submittedAt: new Date().toLocaleString(),
    };
    if (n === 1) {
      base.noButtonChaseCount = this.noButton.chaseCount;
      base.noButtonClickCount = this.noButton.clickCount;
      base.yesNoSequence = this.yesNoSequence;
    }
    if (n === 2) {
      base.invitesClicked = this.invitesClicked;
    }
    if (n === 3) {
      base.clickedTryAgain = p.clickedTryAgain;
      base.clickedBinaSabKeSath = p.clickedBinaSabKeSath;
    }
    if (n === 4) {
      base.reached = p.reached;
    }
    return base;
  },

  recordYesNo(type) {
    const entry = { type, time: new Date().toLocaleTimeString() };
    this.yesNoSequence.push(entry);
    this.log(type, entry);
  },

  recordChase() {
    this.noButton.chaseCount++;
    this.recordYesNo('no_chase');
  },

  recordNoClick() {
    this.noButton.clickCount++;
    this.recordYesNo('no_click');
  },

  recordInviteClick(person) {
    const entry = {
      id: person.id,
      name: person.name,
      order: this.invitesClicked.length + 1,
      time: new Date().toLocaleTimeString(),
    };
    this.invitesClicked.push(entry);
    this.log('invite_click', entry);
  },

  recordRetryClick() {
    this.pages[3].clickedTryAgain = true;
    this.log('retry_click', {});
  },

  recordBinaClick() {
    this.pages[3].clickedBinaSabKeSath = true;
    this.log('bina_sab_ke_sath_click', {});
  },

  markPage4Reached() {
    this.page4Reached = true;
    this.pages[4].reached = true;
    this.log('page4_reached', {});
  },

};

function submitPage(label, payload) {
  const body = JSON.stringify({ _subject: `Date Plan — ${label}`, label, ...payload });
  console.log(`%c📤 submitting → ${label}`, 'color:#6FA8FF;font-weight:600;', JSON.parse(body));
  fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true,
  }).catch(err => console.warn('[date-plan] analytics submit failed', err));
}

function submitPageBeacon(label, payload) {
  const body = JSON.stringify({ _subject: `Date Plan — ${label}`, label, ...payload });
  console.log(`%c📤 beacon → ${label}`, 'color:#6FA8FF;font-weight:600;', JSON.parse(body));
  if (navigator.sendBeacon) {
    navigator.sendBeacon(FORMSPREE_ENDPOINT, new Blob([body], { type: 'application/json' }));
  } else {
    submitPage(label, payload);
  }
}

function finalizeSession(reason) {
  if (Analytics.finalized) return;
  Analytics.finalized = true;

  const n = Analytics.currentPage;
  if (!n) return;

  const p = Analytics.pages[n];
  if (Analytics._rawEnteredAt[n] && !p.exitedAt) {
    const now = Date.now();
    p.exitedAt = new Date(now).toLocaleString();
    p.durationSeconds = +((now - Analytics._rawEnteredAt[n]) / 1000).toFixed(1);
  }

  const payload = { ...Analytics.pagePayload(n), reason, page4Reached: Analytics.page4Reached };
  console.log('%c🏁 session end', 'color:#8A83A0;font-weight:700;', payload);
  submitPageBeacon(`session-end-page-${n}`, payload);
}

window.addEventListener('pagehide', () => finalizeSession('pagehide'));
window.addEventListener('beforeunload', () => finalizeSession('beforeunload'));


const state = {
  screen: 1,
  busyCount: 0,
};

/* =========================================================================
   UTIL
   ========================================================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const rand = (min, max) => Math.random() * (max - min) + min;

function goToScreen(n) {
  $$('.screen').forEach(s => s.classList.remove('is-active'));
  $(`#screen-${n}`).classList.add('is-active');
  state.screen = n;
}

/* =========================================================================
   AMBIENT PARTICLE FIELD (shared, re-styled per active screen)
   ========================================================================= */
function spawnParticles() {
  if (CONFIG.reducedMotion) return;
  const field = $('#particle-field');
  const count = CONFIG.particleCount.sky;
  const colors = ['#FF9EC4', '#FFD9C2', '#E7D9F7', '#FFFFFF'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = rand(3, 8);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${rand(0, 100)}vw`;
    p.style.bottom = `${rand(-20, 100)}vh`;
    p.style.background = colors[Math.floor(rand(0, colors.length))];
    p.style.setProperty('--dx', `${rand(-40, 40)}px`);
    p.style.animationDuration = `${rand(10, 22)}s`;
    p.style.animationDelay = `${rand(0, 10)}s`;
    field.appendChild(p);
  }
}

function darkenParticles() {
  $$('.particle', $('#particle-field')).forEach(p => {
    p.style.background = '#8A83A0';
    p.style.opacity = '.35';
  });
}

/* =========================================================================
   SCREEN 1 — floating hearts, teddy intro, paper → card, YES/NO buttons
   ========================================================================= */
function spawnFloatyHearts() {
  if (CONFIG.reducedMotion) return;
  const layer = $('.floaty-hearts');
  const hearts = ['💕', '💗', '💓', '💖'];
  for (let i = 0; i < CONFIG.floatyHeartCount; i++) {
    const h = document.createElement('span');
    h.textContent = hearts[Math.floor(rand(0, hearts.length))];
    h.style.left = `${rand(0, 100)}%`;
    h.style.animationDuration = `${rand(6, 12)}s`;
    h.style.animationDelay = `${rand(0, 8)}s`;
    layer.appendChild(h);
  }
}

function revealInviteCard() {
  // no more splash delay — the card fades straight in on load
  requestAnimationFrame(() => {
    $('#invite-card').classList.add('is-visible');
  });
}

function setupNoButtonDodge() {
  const btnNo = $('#btn-no');
  const row = $('.button-row');

  let x = 0, y = 0;
  let lastMoveAt = 0;
  let lastMessageAt = 0;
  let phraseIndex = 0;

  // NO is a normal flex item the whole time — same box, same size, same
  // line as YES. Dodging is done purely with `transform`, which moves it
  // visually without ever touching layout/position, so there's no risk of
  // capturing a mid-animation size/position and freezing it.

  const btnYes = $('#btn-yes');
  const overlapBuffer = 14;

  function performDodge(clientX, clientY) {
    const rect = btnNo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const now = performance.now();
    const rowRect = row.getBoundingClientRect();
    const yesRect = btnYes.getBoundingClientRect();

    const naturalLeft = rect.left - x;
    const minX = Math.ceil((yesRect.right + overlapBuffer) - naturalLeft);
    const maxX = rowRect.width * 0.55;

    // if the cursor/tap is dead-center on the button, pick a random
    // escape direction instead of atan2(0,0) which would be undefined
    const angle = (clientX === cx && clientY === cy)
      ? rand(0, Math.PI * 2)
      : Math.atan2(cy - clientY, cx - clientX);
    const jump = rand(90, 160);
    x = Math.max(minX, Math.min(maxX, x + Math.cos(angle) * jump));
    y = Math.max(-20, Math.min(20, y + Math.sin(angle) * jump * 0.3));

    btnNo.style.transform = `translate(${x}px, ${y}px) rotate(${rand(-12, 12)}deg)`;
    lastMoveAt = now;

    if (now - lastMessageAt > CONFIG.dodgeMessageCooldownMs) {
      lastMessageAt = now;
      showDodgeText(rect.left + rect.width / 2, rect.top);
    }
  }

  function dodge(clientX, clientY) {
    const rect = btnNo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const now = performance.now();

    if (dist >= CONFIG.dodgeRadiusPx) return;
    if (now - lastMoveAt <= CONFIG.dodgeMoveCooldownMs) return;
    Analytics.recordChase();
    performDodge(clientX, clientY);
  }

  function showDodgeText(px, py) {
    const phrase = CONFIG.dodgePhrases[phraseIndex % CONFIG.dodgePhrases.length];
    phraseIndex++;
    const el = document.createElement('div');
    el.className = 'dodge-text';
    el.textContent = phrase;
    el.style.left = `${px}px`;
    el.style.top = `${py - 30}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  window.addEventListener('mousemove', e => {
    if (state.screen !== 1) return;
    dodge(e.clientX, e.clientY);
  });
  window.addEventListener('touchmove', e => {
    if (state.screen !== 1) return;
    const t = e.touches[0];
    if (t) dodge(t.clientX, t.clientY);
  }, { passive: true });

  // if it's ever actually clicked/tapped, don't act on it — just make it flee
  btnNo.addEventListener('click', e => {
    e.preventDefault();
    Analytics.recordNoClick();
    performDodge(e.clientX, e.clientY);
  });
  btnNo.addEventListener('touchstart', e => {
    e.preventDefault();
    Analytics.recordNoClick();
    const t = e.touches[0];
    if (t) performDodge(t.clientX, t.clientY);
  }, { passive: false });
}

function spawnConfetti() {
  if (CONFIG.reducedMotion) return;
  const colors = ['#FF4D8D', '#FFD9C2', '#E7D9F7', '#6FA8FF', '#FFC2D9'];
  const scene = $('#screen-1 .scene');
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const size = rand(6, 12);
    c.style.width = `${size}px`;
    c.style.height = `${size * 0.4}px`;
    c.style.left = `${rand(0, 100)}%`;
    c.style.background = colors[Math.floor(rand(0, colors.length))];
    c.style.animationDuration = `${rand(1.2, 2)}s`;
    c.style.animationDelay = `${rand(0, .4)}s`;
    scene.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }
}

function setupYesButton() {
  $('#btn-yes').addEventListener('click', () => {
    Analytics.recordYesNo('yes_click');
    spawnConfetti();
    $('#loader').classList.add('is-visible');
    setTimeout(() => {
      $('#loader').classList.remove('is-visible');
      Analytics.exitPage(1);
      goToScreen(2);
      Analytics.enterPage(2);
      darkenParticles();
    }, 1500);
  });
}

/* =========================================================================
   SCREEN 2 — dynamically rendered invitee cards
   ========================================================================= */
function renderPeopleGrid() {
  const grid = $('#people-grid');
  grid.innerHTML = '';

  CONFIG.invitees.forEach(person => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.dataset.id = person.id;
    card.innerHTML = `
      <div class="person-avatar">${person.avatar}</div>
      <div class="person-name">${person.name}</div>
      <div class="person-bio">${person.bio}</div>
      <div class="person-badge">Available</div>
      <div class="person-message">${person.busyMessage}</div>
    `;
    card.addEventListener('click', () => markBusy(card, person));
    grid.appendChild(card);
  });
}

function markBusy(card, person) {
  if (card.classList.contains('is-busy')) return;
  Analytics.recordInviteClick(person);

  card.classList.add('is-shaking');
  setTimeout(() => card.classList.remove('is-shaking'), 500);

  setTimeout(() => {
    card.classList.add('is-busy');
    const badge = $('.person-badge', card);
    badge.textContent = 'Busy 😔';
    badge.classList.add('is-busy');
    state.busyCount++;

    if (state.busyCount >= CONFIG.invitees.length) {
      setTimeout(() => {
        Analytics.exitPage(2);
        goToScreen(3);
        Analytics.enterPage(3);
        runEndingSequence();
      }, 1500);
    }
  }, 150);
}

/* =========================================================================
   SCREEN 3 — broken hearts, typewriter reveal, retry
   ========================================================================= */
function spawnBrokenHearts() {
  if (CONFIG.reducedMotion) return;
  const layer = $('.broken-hearts');
  for (let i = 0; i < CONFIG.brokenHeartCount; i++) {
    const h = document.createElement('span');
    h.textContent = '💔';
    h.style.left = `${rand(0, 100)}%`;
    h.style.animationDuration = `${rand(6, 12)}s`;
    h.style.animationDelay = `${rand(0, 8)}s`;
    layer.appendChild(h);
  }
}

function typewrite(el, text, speed = 38) {
  return new Promise(resolve => {
    if (CONFIG.reducedMotion) {
      el.textContent = text;
      resolve();
      return;
    }
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        setTimeout(tick, speed);
      } else {
        resolve();
      }
    };
    tick();
  });
}

let endingHasRun = false;
async function runEndingSequence() {
  if (endingHasRun) return;
  endingHasRun = true;

  const lines = $$('.type-line');
  for (const line of lines) {
    await typewrite(line, line.dataset.text);
    await new Promise(r => setTimeout(r, 350));
  }
  $('.fade-line').classList.add('is-visible');
  setTimeout(() => {
    $('#btn-retry').classList.add('is-visible');
    $('#btn-bina').classList.add('is-visible');
  }, 700);
}

function setupRetryButton() {
  const btn = $('#btn-retry');
  btn.addEventListener('click', () => {
    Analytics.recordRetryClick();
    $('#retry-note').classList.add('is-visible');
    setTimeout(() => {
      btn.disabled = true;
    }, 1600);
  });
}

function setupBinaButton() {
  $('#btn-bina').addEventListener('click', () => {
    Analytics.recordBinaClick();
    Analytics.exitPage(3);
    goToScreen(4);
    Analytics.enterPage(4);
    Analytics.markPage4Reached();
    spawnCelebrateParticles();
  });
}

/* =========================================================================
   SCREEN 4 — Just Us Then! (happy alternate ending)
   ========================================================================= */
function spawnCelebrateParticles() {
  if (CONFIG.reducedMotion) return;
  const layer = $('.celebrate-particles');
  if (!layer || layer.childElementCount) return; // only seed once
  const icons = ['🎉', '💕', '✨', '🥳', '💖'];
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('span');
    s.textContent = icons[Math.floor(rand(0, icons.length))];
    s.style.left = `${rand(0, 100)}%`;
    s.style.animationDuration = `${rand(5, 10)}s`;
    s.style.animationDelay = `${rand(0, 6)}s`;
    layer.appendChild(s);
  }
}

/* =========================================================================
   CURSOR HEART TRAIL (desktop only)
   ========================================================================= */
function setupCursorTrail() {
  if (!CONFIG.cursorTrailEnabled || CONFIG.reducedMotion) return;
  const layer = $('#cursor-trail');
  let last = 0;

  window.addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - last < 60) return;
    last = now;
    const heart = document.createElement('span');
    heart.className = 'trail-heart';
    heart.textContent = '💗';
    heart.style.left = `${e.clientX}px`;
    heart.style.top = `${e.clientY}px`;
    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
  });
}

/* =========================================================================
   INIT
   ========================================================================= */
function init() {
  const openedAt = Analytics.sessionStartedAt.toLocaleString();
  Analytics.log('session_start', {
    sessionId: Analytics.sessionId,
    openedAt,
  });
  submitPage('page-1-opened', {
    sessionId: Analytics.sessionId,
    event: 'site_opened',
    openedAt,
  });
  Analytics.enterPage(1);

  spawnParticles();
  spawnFloatyHearts();
  spawnBrokenHearts();
  setupCursorTrail();

  renderPeopleGrid();
  revealInviteCard();
  setupNoButtonDodge();
  setupYesButton();
  setupRetryButton();
  setupBinaButton();
}

document.addEventListener('DOMContentLoaded', init);
