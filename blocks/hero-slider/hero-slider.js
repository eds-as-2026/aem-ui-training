import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_DELAY = 6000;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

/**
 * Returns true when the given URL points at a video file.
 * @param {string} url
 */
function isVideo(url) {
  return !!url && VIDEO_EXT.test(url);
}

/**
 * Builds a responsive media element (picture or video) for a slide.
 * Desktop and mobile sources are swapped with a single 769px breakpoint.
 * Videos are lazy (preload="none"), muted, inline and get a poster.
 * @param {string} desktopSrc primary media (image or video) URL
 * @param {string} mobileSrc optional mobile media URL
 * @param {string} alt alternative text (falls back to the slide title)
 * @param {string} poster optional poster image for videos
 * @param {boolean} eager whether this is the first slide (LCP candidate)
 */
function buildMedia(desktopSrc, mobileSrc, alt, poster, eager) {
  const media = document.createElement('div');
  media.className = 'hero-slider-media';

  if (isVideo(desktopSrc)) {
    const video = document.createElement('video');
    video.className = 'hero-slider-video';
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    // First slide loads a frame immediately so it is never blank (no poster);
    // later slides stay lazy until activated.
    video.preload = eager ? 'metadata' : 'none';
    video.setAttribute('aria-label', alt || '');
    if (poster) video.poster = poster;

    // append a media fragment so a first frame renders even before playback
    const frameHint = desktopSrc.includes('#') ? '' : '#t=0.1';
    const deskSource = document.createElement('source');
    deskSource.src = desktopSrc + frameHint;
    deskSource.media = '(min-width: 769px)';
    video.append(deskSource);

    const mobSource = document.createElement('source');
    mobSource.src = (mobileSrc || desktopSrc) + frameHint;
    mobSource.media = '(max-width: 768px)';
    video.append(mobSource);

    media.append(video);
    return media;
  }

  // image media: two <picture> elements toggled by CSS at the breakpoint
  if (desktopSrc) {
    const desk = createOptimizedPicture(desktopSrc, alt, eager, [{ width: '1600' }]);
    desk.classList.add('hero-slider-desktop');
    media.append(desk);
  }
  if (mobileSrc) {
    const mob = createOptimizedPicture(mobileSrc, alt, eager, [{ width: '750' }]);
    mob.classList.add('hero-slider-mobile');
    media.append(mob);
  }
  return media;
}

/**
 * Builds a single slide element from an authored row.
 * Expected cells: media | mobileMedia | text(richtext) | disclaimer
 * @param {Element} row the authored row
 * @param {number} index zero-based slide index
 */
/**
 * Reads a media URL from a cell: prefers an <a href> (asset/video link),
 * then an <img src>. Returns '' when the cell has no media.
 * @param {Element} cell
 */
function mediaSrc(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a');
  if (a) return a.getAttribute('href');
  const img = cell.querySelector('img');
  if (img) return img.getAttribute('src');
  return '';
}

/** True when a cell holds authored copy (heading or paragraph). */
function isContentCell(cell) {
  return !!cell && !!cell.querySelector('h1, h2, h3, h4, h5, h6, p, ul, ol');
}

/**
 * True when a cell is purely media: an <img>, or a bare asset/video link whose
 * only child is an <a> (not a content cell that happens to contain a CTA link).
 * @param {Element} cell
 */
function isMediaCell(cell) {
  if (!cell || isContentCell(cell)) return false;
  return !!cell.querySelector('img') || !!cell.querySelector('a[href]');
}

function buildSlide(row, index) {
  const cells = [...row.children];

  // Detect cells by their content instead of relying on a rigid column order,
  // so the block is resilient to how authors fill the table (empty cells, etc.).
  // Content is resolved first so a CTA link inside it is never mistaken for media.
  const contentCell = cells.find(isContentCell);
  const mediaCells = cells.filter(isMediaCell);
  // a non-empty, non-media, non-content cell is treated as the disclaimer
  const disclaimerCell = cells.find(
    (c) => c !== contentCell && !isMediaCell(c) && !isContentCell(c) && c.textContent.trim(),
  );

  const slide = document.createElement('li');
  slide.className = 'hero-slider-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'Slide');
  moveInstrumentation(row, slide);

  // first media cell = desktop, second (if any) = mobile
  const desktopCell = mediaCells[0];
  const mobileCell = mediaCells[1];
  const desktopSrc = mediaSrc(desktopCell);
  const mobileSrc = mediaSrc(mobileCell);
  const poster = desktopCell?.querySelector('img')?.getAttribute('src');

  // content (title / tagline / CTA)
  const content = document.createElement('div');
  content.className = 'hero-slider-content';
  const inner = document.createElement('div');
  inner.className = 'hero-slider-wrap';
  if (contentCell) {
    moveInstrumentation(contentCell, inner);
    while (contentCell.firstElementChild) inner.append(contentCell.firstElementChild);
  }
  content.append(inner);

  // derive alt text: intentional fix for missing alt on source image slides
  const title = inner.querySelector('h1, h2, h3, h4, h5, h6');
  const altText = title ? title.textContent.trim() : `Slide ${index + 1}`;

  // style the CTA link(s) as buttons
  inner.querySelectorAll('a').forEach((a) => a.classList.add('button'));

  const media = buildMedia(desktopSrc, mobileSrc, altText, poster, index === 0);

  slide.append(media, content);

  // optional disclaimer
  const disclaimerText = disclaimerCell?.textContent.trim();
  if (disclaimerText) {
    const disc = document.createElement('p');
    disc.className = 'hero-slider-disclaimer';
    disc.innerHTML = disclaimerCell.innerHTML;
    slide.append(disc);
  }

  return slide;
}

/**
 * Builds prev/next arrows, pagination bullets, and the pause/play toggle.
 * @param {number} total number of slides
 */
function buildControls(total) {
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'hero-slider-arrow hero-slider-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'hero-slider-arrow hero-slider-next';
  next.setAttribute('aria-label', 'Next slide');

  const pagination = document.createElement('div');
  pagination.className = 'hero-slider-pagination';
  pagination.setAttribute('role', 'tablist');
  pagination.setAttribute('aria-label', 'Choose slide to display');
  const bullets = [];
  for (let i = 0; i < total; i += 1) {
    const bullet = document.createElement('button');
    bullet.type = 'button';
    bullet.className = 'hero-slider-bullet';
    bullet.setAttribute('role', 'tab');
    bullet.setAttribute('aria-label', `Go to slide ${i + 1}`);
    bullets.push(bullet);
    pagination.append(bullet);
  }

  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'hero-slider-pause';
  pause.setAttribute('aria-label', 'Pause slideshow');
  pause.innerHTML = '<span class="hero-slider-pause-label">Pause</span>';

  return {
    prev, next, pagination, bullets, pause,
  };
}

export default function decorate(block) {
  const rows = [...block.children];
  const slides = rows.map((row, i) => buildSlide(row, i));

  const list = document.createElement('ul');
  list.className = 'hero-slider-track';
  list.append(...slides);

  const viewport = document.createElement('div');
  viewport.className = 'hero-slider-viewport';
  viewport.append(list);

  const {
    prev, next, pagination, bullets, pause,
  } = buildControls(slides.length);

  const liveRegion = document.createElement('div');
  liveRegion.className = 'hero-slider-live';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured vehicles');
  block.replaceChildren(viewport, prev, next, pagination, pause, liveRegion);

  // no-JS / single slide: show first slide statically, hide controls
  if (slides.length < 2) {
    [prev, next, pagination, pause].forEach((el) => { el.hidden = true; });
    slides[0]?.classList.add('is-active');
    slides[0]?.removeAttribute('aria-hidden');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let playing = !reduceMotion;
  let timer;

  function announce(i) {
    liveRegion.textContent = `Slide ${i + 1} of ${slides.length}`;
  }

  function playActiveVideo() {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (i === current) {
        // ensure sources load only when this slide becomes active
        if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    bullets.forEach((b, i) => {
      const active = i === current;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    });
    announce(current);
    playActiveVideo();
  }

  function stop() {
    clearInterval(timer);
    timer = undefined;
  }

  function start() {
    stop();
    if (reduceMotion) return;
    timer = setInterval(() => show(current + 1), AUTOPLAY_DELAY);
  }

  function setPlaying(nextPlaying) {
    playing = nextPlaying;
    pause.classList.toggle('is-paused', !playing);
    pause.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
    pause.querySelector('.hero-slider-pause-label').textContent = playing ? 'Pause' : 'Play';
    if (playing) start(); else stop();
  }

  prev.addEventListener('click', () => { show(current - 1); if (playing) start(); });
  next.addEventListener('click', () => { show(current + 1); if (playing) start(); });
  bullets.forEach((b, i) => b.addEventListener('click', () => { show(i); if (playing) start(); }));
  pause.addEventListener('click', () => setPlaying(!playing));

  // keyboard: arrow keys move between slides when a bullet is focused
  pagination.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); bullets[current].focus(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); bullets[current].focus(); }
  });

  // pause on hover / focus, resume on leave / blur
  block.addEventListener('pointerenter', () => { if (playing) stop(); });
  block.addEventListener('pointerleave', () => { if (playing) start(); });
  block.addEventListener('focusin', () => { if (playing) stop(); });
  block.addEventListener('focusout', (e) => {
    if (playing && !block.contains(e.relatedTarget)) start();
  });

  // pause autoplay + videos when the carousel scrolls off-screen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (playing) start();
          playActiveVideo();
        } else {
          stop();
          slides.forEach((s) => s.querySelector('video')?.pause());
        }
      });
    }, { threshold: 0.25 });
    io.observe(block);
  }

  show(0);
  setPlaying(playing);
}
