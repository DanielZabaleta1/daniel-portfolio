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

// --- clickable project cards (built projects only; "In progress" cards opt out via not-built) ---
document.querySelectorAll<HTMLElement>('.proj[data-href]').forEach((card) => {
  card.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) return;
    const href = card.dataset.href;
    if (href) window.open(href, '_blank', 'noopener');
  });
});

// --- VSL (intro video) ---
// Empty VITE_VSL_URL keeps the inert "coming soon" placeholder from Phase 2.
// Once set, the play button loads the embed on click (no third-party iframe
// weight until the visitor actually asks for it).
function toEmbedUrl(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.hostname.includes('youtube.com')) {
    if (u.pathname.startsWith('/embed/')) return rawUrl;
    const id = u.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (u.hostname === 'youtu.be') {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (u.hostname.includes('vimeo.com')) {
    if (u.hostname.startsWith('player.')) return rawUrl;
    const id = u.pathname.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

const vslUrl = (import.meta.env.VITE_VSL_URL ?? '').trim();
const vslDuration = (import.meta.env.VITE_VSL_DURATION ?? '').trim();
const vslEmbedUrl = vslUrl ? toEmbedUrl(vslUrl) : null;
const vslBadge = document.getElementById('vsl-badge');
const vslPlay = document.getElementById('vsl-play');
const vslBody = vslPlay?.parentElement ?? null;

if (vslEmbedUrl && vslBadge && vslPlay && vslBody) {
  vslBadge.textContent = vslDuration ? `live · ${vslDuration}` : 'live';
  vslBadge.classList.add('is-live');
  vslPlay.removeAttribute('aria-disabled');

  const playVsl = () => {
    const iframe = document.createElement('iframe');
    iframe.src = `${vslEmbedUrl}${vslEmbedUrl.includes('?') ? '&' : '?'}autoplay=1`;
    iframe.title = 'Daniel Zabaleta — intro video';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    vslBody.replaceChildren(iframe);
  };

  vslPlay.addEventListener('click', playVsl);
  vslPlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playVsl();
    }
  });
}

// --- the wall ---
// Backed by /api/comments (Vercel KV) when configured; falls back to
// localStorage (like the Phase 2 demo) if the API isn't available, so the
// build and the page never break just because KV hasn't been set up yet.
type Comment = { id?: string; t: string };

const WALL_KEY = 'dz_wall_pf';
const seedComments: Comment[] = [
  { t: 'this glassy dark look is slick' },
  { t: 'clean and easy to scan' },
  { t: 'systems-thinking angle is strong' },
  { t: 'keep it up' },
];

const wallBox = document.getElementById('wall-comments');
const wallInput = document.getElementById('wall-input') as HTMLInputElement | null;
const wallPostBtn = document.getElementById('wall-post') as HTMLButtonElement | null;
const wallError = document.getElementById('wall-error');

const URL_PATTERN = /(https?:\/\/|www\.)/i;
const DOMAIN_PATTERN = /\b[a-z0-9-]+\.(com|net|org|io|co|dev|app|me|ai|gg|xyz|info)\b/i;
const containsUrl = (s: string) => URL_PATTERN.test(s) || DOMAIN_PATTERN.test(s);

let serverMode = false;
let comments: Comment[] = [];

function loadLocalComments(): Comment[] {
  try {
    const raw = localStorage.getItem(WALL_KEY);
    return raw ? (JSON.parse(raw) as Comment[]) : seedComments;
  } catch {
    return seedComments;
  }
}

function renderComments(list: Comment[], newestFirst: boolean) {
  if (!wallBox) return;
  wallBox.innerHTML = '';
  const ordered = newestFirst ? list : list.slice().reverse();
  ordered.forEach((c) => {
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

async function initWall() {
  try {
    const res = await fetch('/api/comments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.comments)) {
        serverMode = true;
        comments = data.comments;
        renderComments(comments, true);
        return;
      }
    }
  } catch {
    // network error / API not deployed yet — fall through to local mode
  }
  serverMode = false;
  comments = loadLocalComments();
  renderComments(comments, false);
}

async function postComment() {
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

  if (serverMode) {
    if (wallPostBtn) wallPostBtn.disabled = true;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
      if (res.status === 429) {
        showWallError('Slow down a bit — try again in a few seconds.');
        return;
      }
      if (!res.ok) {
        showWallError('Could not post right now — try again.');
        return;
      }
      const data = await res.json();
      comments = [data.comment, ...comments];
      renderComments(comments, true);
      if (wallInput) wallInput.value = '';
    } catch {
      showWallError('Could not post right now — try again.');
    } finally {
      if (wallPostBtn) wallPostBtn.disabled = false;
    }
    return;
  }

  comments.push({ t: value });
  localStorage.setItem(WALL_KEY, JSON.stringify(comments));
  renderComments(comments, false);
  if (wallInput) wallInput.value = '';
}

initWall();
wallPostBtn?.addEventListener('click', postComment);
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
// Skipped on touch/coarse-pointer devices: the effect is driven entirely by
// mousemove, so it's dead weight (a 60fps rAF loop over hundreds of dots)
// on phones that can never trigger it.
const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d') ?? null;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

if (canvas && ctx && !reduceMotion && !isCoarsePointer) {
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
