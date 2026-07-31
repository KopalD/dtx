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
      busyMessage: 'Mazya kade vel nahi 😅… she\u2019s offline forever'
    },
    {
      id: 'nutan',
      name: 'Nutan',
      bio: 'Resident Calm cutie',
      avatar: '🥰',
      busyMessage: 'Nutan is busy playing UNO with her cousins … next lifetime shayad'
    },
    {
      id: 'thopte',
      name: 'Thopte',
      bio: 'Self-proclaimed wingman',
      avatar: '🧑‍🦱',
      busyMessage: 'Thopte is "busy" i.e. sleeping at 4pm 😴… wake him up next month'
    },
    {
      id: 'sneha',
      name: 'Sneha',
      bio: 'Chaos in human form 😈',
      avatar: '😈',
      busyMessage: 'Kaam karo, yeh sab kya kar rahe ho 🙃'
    }
    // 👉 PLUG IN MORE PEOPLE HERE, e.g.:
    // {
    //   id: 'rahul',
    //   name: 'Rahul',
    //   bio: 'Third wheel extraordinaire',
    //   avatar: '🧔',
    //   busyMessage: 'Rahul is "in a meeting" (he is not) 💼'
    // },
  ],

  dodgePhrases: [
    'Ek baar soch lo 🤔',
    'Aisa please mat karo 🥺',
    'Itni jaldi na mat bolo 😅',
    'Nice try 😏',
    'Nahi milega 😂',
    'Sabke sath hi jana hai!',
    'Cursor se door raho! 🏃',
    'Thoda toh sharam karo 😳',
    'Naa mane... NAA! 🙅‍♀️'
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
   STATE
   ========================================================================= */
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

  // initial resting position (roughly centered next to YES)
  let x = 0, y = 0;
  let lastMoveAt = 0;
  let lastMessageAt = 0;
  btnNo.style.position = 'absolute';
  btnNo.style.left = '58%';
  btnNo.style.top = '0';

  function dodge(clientX, clientY) {
    const rect = btnNo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const now = performance.now();

    if (dist >= CONFIG.dodgeRadiusPx) return;
    if (now - lastMoveAt <= CONFIG.dodgeMoveCooldownMs) return;
    lastMoveAt = now;

    const rowRect = row.getBoundingClientRect();
    const angle = Math.atan2(cy - clientY, cx - clientX);
    const jump = rand(90, 160);
    x = Math.max(-rowRect.width * 0.35, Math.min(rowRect.width * 0.55, x + Math.cos(angle) * jump));
    y = Math.max(-20, Math.min(20, y + Math.sin(angle) * jump * 0.3));

    btnNo.style.transform = `translate(${x}px, ${y}px) rotate(${rand(-12, 12)}deg)`;

    if (now - lastMessageAt > CONFIG.dodgeMessageCooldownMs) {
      lastMessageAt = now;
      showDodgeText(rect.left + rect.width / 2, rect.top);
    }
  }

  function showDodgeText(px, py) {
    const phrase = CONFIG.dodgePhrases[Math.floor(rand(0, CONFIG.dodgePhrases.length))];
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

  // in the vanishingly unlikely event it's ever "clicked", it doesn't act
  btnNo.addEventListener('click', e => e.preventDefault());
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
    spawnConfetti();
    $('#loader').classList.add('is-visible');
    setTimeout(() => {
      $('#loader').classList.remove('is-visible');
      goToScreen(2);
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
    card.addEventListener('click', () => markBusy(card));
    grid.appendChild(card);
  });
}

function markBusy(card) {
  if (card.classList.contains('is-busy')) return;

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
        goToScreen(3);
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
  setTimeout(() => $('.forgive-gif').classList.add('is-visible'), 400);
  setTimeout(() => $('#btn-retry').classList.add('is-visible'), 1000);
}

function setupRetryButton() {
  $('#btn-retry').addEventListener('click', () => window.location.reload());
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
  spawnParticles();
  spawnFloatyHearts();
  spawnBrokenHearts();
  setupCursorTrail();

  renderPeopleGrid();
  revealInviteCard();
  setupNoButtonDodge();
  setupYesButton();
  setupRetryButton();
}

document.addEventListener('DOMContentLoaded', init);
