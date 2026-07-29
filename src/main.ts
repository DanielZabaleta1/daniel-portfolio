import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import './style.css';

// --- project filter chips ---
const chips = document.querySelectorAll<HTMLButtonElement>('.chip');
const grid = document.getElementById('grid');
const cards = grid?.querySelectorAll<HTMLElement>('.proj') ?? [];

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    grid?.classList.add('filtering');
    setTimeout(() => {
      cards.forEach((card) => {
        const roles = card.dataset.roles?.split(' ') ?? [];
        card.style.display = filter === 'all' || roles.includes(filter ?? '') ? '' : 'none';
      });
      grid?.classList.remove('filtering');
    }, 170);
  });
});

// --- the wall (localStorage demo; replaced by /api/comments in Phase 3) ---
type Comment = { t: string };

const WALL_KEY = 'dz_wall_pf';
const seedComments: Comment[] = [
  { t: 'this glassy dark look is slick' },
  { t: 'clean and easy to scan' },
  { t: 'systems-thinking angle is strong' },
  { t: 'keep it up' },
];

const wallBox = document.getElementById('wall-comments');
const wallInput = document.getElementById('wall-input') as HTMLInputElement | null;
const wallError = document.getElementById('wall-error');

const URL_PATTERN = /(https?:\/\/|www\.)/i;
const DOMAIN_PATTERN = /\b[a-z0-9-]+\.(com|net|org|io|co|dev|app|me|ai|gg|xyz|info)\b/i;
const containsUrl = (s: string) => URL_PATTERN.test(s) || DOMAIN_PATTERN.test(s);

function loadComments(): Comment[] {
  try {
    const raw = localStorage.getItem(WALL_KEY);
    return raw ? (JSON.parse(raw) as Comment[]) : seedComments;
  } catch {
    return seedComments;
  }
}

function renderComments(list: Comment[]) {
  if (!wallBox) return;
  wallBox.innerHTML = '';
  list
    .slice()
    .reverse()
    .forEach((c) => {
      const el = document.createElement('div');
      el.className = 'cmt';
      el.textContent = c.t;
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = 'Anonymous';
      el.appendChild(who);
      wallBox.appendChild(el);
    });
}

function showWallError(message: string) {
  if (!wallError) return;
  wallError.textContent = message;
  wallError.style.display = message ? 'block' : 'none';
}

let comments = loadComments();
renderComments(comments);

function postComment() {
  const value = wallInput?.value.trim() ?? '';
  if (!value) {
    showWallError('Say something first.');
    return;
  }
  if (value.length > 80) {
    showWallError('Keep it under 80 characters.');
    return;
  }
  if (containsUrl(value)) {
    showWallError('No links, please.');
    return;
  }
  showWallError('');
  comments.push({ t: value });
  localStorage.setItem(WALL_KEY, JSON.stringify(comments));
  renderComments(comments);
  if (wallInput) wallInput.value = '';
}

document.getElementById('wall-post')?.addEventListener('click', postComment);
wallInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') postComment();
});

// --- reveal on scroll ---
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll<HTMLElement>('.reveal');

if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 5, 4) * 40}ms`;
    io.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// --- dot grid background + cursor parallax ---
const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d') ?? null;

if (canvas && ctx && !reduceMotion) {
  let dots: { x: number; y: number }[] = [];
  let w = 0;
  let h = 0;
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;
  const GAP = 46;

  function build() {
    w = canvas!.width = innerWidth;
    h = canvas!.height = innerHeight;
    dots = [];
    for (let x = GAP / 2; x < w; x += GAP) {
      for (let y = GAP / 2; y < h; y += GAP) {
        dots.push({ x, y });
      }
    }
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    for (const d of dots) {
      const dist = Math.hypot(d.x - mx, d.y - my);
      const near = Math.max(0, 1 - dist / 220);
      const px = d.x + tx * 0.012 * (d.x / w - 0.5) * 40;
      const py = d.y + ty * 0.012 * (d.y / h - 0.5) * 40;
      ctx!.beginPath();
      ctx!.arc(px, py, 1 + near * 1.4, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(120,150,255,${0.07 + near * 0.5})`;
      ctx!.fill();
    }
    requestAnimationFrame(draw);
  }

  addEventListener('resize', build);
  addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  build();
  mx = w / 2;
  my = h / 2;
  draw();
}
