import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

/**
 * Returns true when the given URL points at a video file.
 * @param {string} url
 */
function isVideo(url) {
  return !!url && VIDEO_EXT.test(url);
}

/**
 * True when a URL points at an asset we treat as slide media
 * (image, video, or a DAM asset path) rather than a navigational CTA link.
 * @param {string} url
 */
function isAssetUrl(url) {
  if (!url) return false;
  return VIDEO_EXT.test(url) || IMAGE_EXT.test(url) || url.includes('/content/dam/');
}

/**
 * Builds the media element (picture or video) for a slide.
 * A separate mobile source is swapped in below 769px; when empty it falls back
 * to the desktop source. Videos are muted, inline, and lazy except the first
 * slide (which preloads a frame so it is never blank).
 * @param {string} desktopSrc desktop media (image or video) URL
 * @param {string} mobileSrc optional mobile media URL
 * @param {string} alt alternative text (falls back to the slide title)
 * @param {string} poster optional poster image for videos
 * @param {boolean} eager whether this is the first slide (LCP candidate)
 */
function buildMedia(desktopSrc, mobileSrc, alt, poster, eager) {
  const media = document.createElement('div');
  media.className = 'hero-slider-media';
  if (!desktopSrc) return media;

  if (isVideo(desktopSrc)) {
    const video = document.createElement('video');
    video.className = 'hero-slider-video';
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = eager ? 'metadata' : 'none';
    video.setAttribute('aria-label', alt || '');
    if (poster) video.poster = poster;

    const frame = (u) => (u.includes('#') ? u : `${u}#t=0.1`);
    const deskSource = document.createElement('source');
    deskSource.src = frame(desktopSrc);
    deskSource.media = '(min-width: 769px)';
    video.append(deskSource);
    const mobSource = document.createElement('source');
    mobSource.src = frame(mobileSrc || desktopSrc);
    mobSource.media = '(max-width: 768px)';
    video.append(mobSource);

    media.append(video);
    return media;
  }

  const desk = createOptimizedPicture(desktopSrc, alt, eager, [{ width: '1600' }]);
  desk.classList.add('hero-slider-desktop');
  media.append(desk);
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
  const img = cell.querySelector('img');
  if (img) return img.getAttribute('src');
  const a = cell.querySelector('a[href]');
  if (a && isAssetUrl(a.getAttribute('href'))) return a.getAttribute('href');
  return '';
}

/**
 * True when a cell is media: it contains an <img>, or a link whose target is an
 * asset (image/video/DAM path). This is independent of how EDS wraps the link
 * (e.g. in a <p class="button-container">), so a media cell is never mistaken
 * for content just because its link got wrapped in a paragraph.
 * @param {Element} cell
 */
function isMediaCell(cell) {
  if (!cell) return false;
  if (cell.querySelector('img')) return true;
  const a = cell.querySelector('a[href]');
  return !!a && isAssetUrl(a.getAttribute('href'));
}

/**
 * The content cell holds the title/tagline/CTA — identified by a heading or a
 * (non-asset) link.
 * @param {Element} cell
 */
function isContentCell(cell) {
  if (!cell || isMediaCell(cell)) return false;
  return !!cell.querySelector('h1, h2, h3, h4, h5, h6') || !!cell.querySelector('a[href]');
}

const isDisclaimerText = (el) => /^\s*(disclaimer|#?t&?c|terms|\*)/i.test(el.textContent.trim());

function buildSlide(row, index) {
  const cells = [...row.children];

  // CTA-background enum cell resolved first (exact keyword) so it is never
  // mistaken for content or media.
  const ctaCell = cells.find(
    (c) => !isMediaCell(c) && /^(white|navy)$/i.test(c.textContent.trim()),
  );
  const whiteCta = ctaCell?.textContent.trim().toLowerCase() === 'white';

  // Content = a cell with a heading or link that isn't the enum cell.
  const contentCell = cells.find((c) => c !== ctaCell && isContentCell(c));
  const mediaCells = cells.filter(isMediaCell);

  const slide = document.createElement('li');
  slide.className = 'hero-slider-slide';
  slide.dataset.button = whiteCta ? 'light' : 'dark';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'Slide');
  moveInstrumentation(row, slide);

  // separate desktop + mobile media (mobile falls back to desktop when empty)
  const desktopSrc = mediaSrc(mediaCells[0]);
  const mobileSrc = mediaSrc(mediaCells[1]);
  const poster = mediaCells[0]?.querySelector('img')?.getAttribute('src');

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

  // disclaimer/fine-print paragraphs (typed in Content) render small + aligned
  inner.querySelectorAll('p').forEach((p) => {
    if (!p.querySelector('a') && isDisclaimerText(p)) {
      p.classList.add('hero-slider-disclaimer');
    }
  });

  inner.querySelectorAll('a').forEach((a) => a.classList.add('button'));

  const media = buildMedia(desktopSrc, mobileSrc, altText, poster, index === 0);

  slide.append(media, content);

  return slide;
}

/**
 * Builds the prev/next arrows. The source carousel has no pagination bullets
 * or pause/play control, so we only build arrows.
 */
function buildControls() {
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'hero-slider-arrow hero-slider-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'hero-slider-arrow hero-slider-next';
  next.setAttribute('aria-label', 'Next slide');

  return { prev, next };
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

  const { prev, next } = buildControls();

  const liveRegion = document.createElement('div');
  liveRegion.className = 'hero-slider-live';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured vehicles');
  block.replaceChildren(viewport, prev, next, liveRegion);

  // no-JS / single slide: show first slide statically, hide arrows
  if (slides.length < 2) {
    [prev, next].forEach((el) => { el.hidden = true; });
    slides[0]?.classList.add('is-active');
    slides[0]?.removeAttribute('aria-hidden');
    return;
  }

  let current = 0;

  function playActiveVideo() {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (i === current) {
        if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function show(index) {
    current = Math.max(0, Math.min(index, slides.length - 1));
    // slide the track horizontally to the active slide
    list.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    // non-looping arrows: hide prev on the first slide, next on the last
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    liveRegion.textContent = `Slide ${current + 1} of ${slides.length}`;
    playActiveVideo();
  }

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  // pause offscreen videos to save resources
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) playActiveVideo();
        else slides.forEach((s) => s.querySelector('video')?.pause());
      });
    }, { threshold: 0.25 });
    io.observe(block);
  }

  show(0);
}
