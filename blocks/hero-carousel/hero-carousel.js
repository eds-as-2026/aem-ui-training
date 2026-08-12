import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_DELAY = 6000;

/**
 * Builds a single slide from its authored row.
 * @param {Element} row row containing image, theme, backgroundColor and text divs
 * @param {number} index zero-based position of the slide
 */
function buildSlide(row, index) {
  const [imageDiv, themeDiv, colorDiv, textDiv] = row.children;

  const slide = document.createElement('li');
  slide.className = 'hero-carousel-slide';
  moveInstrumentation(row, slide);

  const theme = themeDiv?.textContent.trim().toLowerCase() === 'dark' ? 'dark' : 'light';
  slide.dataset.theme = theme;

  const backgroundColor = colorDiv?.textContent.trim();
  if (backgroundColor) slide.style.setProperty('--hero-carousel-bg', backgroundColor);

  const content = document.createElement('div');
  content.className = 'hero-carousel-content';
  if (textDiv) {
    moveInstrumentation(textDiv, content);
    while (textDiv.firstElementChild) content.append(textDiv.firstElementChild);
  }

  const media = document.createElement('div');
  media.className = 'hero-carousel-media';
  const img = imageDiv?.querySelector('img');
  if (img) {
    const optimizedPic = createOptimizedPicture(
      img.src,
      img.alt,
      index === 0,
      [{ media: '(min-width: 600px)', width: '1600' }, { width: '900' }],
    );
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    media.append(optimizedPic);
  }

  slide.append(content, media);
  return slide;
}

/**
 * Builds the prev/next/counter/play-pause controls for the carousel.
 * @param {number} total total number of slides
 */
function buildControls(total) {
  const controls = document.createElement('div');
  controls.className = 'hero-carousel-controls';

  const nav = document.createElement('div');
  nav.className = 'hero-carousel-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'hero-carousel-arrow hero-carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.innerHTML = '<span class="icon icon-arrow-left"></span>';

  const counter = document.createElement('div');
  counter.className = 'hero-carousel-counter';
  counter.innerHTML = '<span class="hero-carousel-current">1</span>/<span class="hero-carousel-total"></span>';
  counter.querySelector('.hero-carousel-total').textContent = total;

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'hero-carousel-arrow hero-carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  next.innerHTML = '<span class="icon icon-arrow-right"></span>';

  nav.append(prev, counter, next);

  const playPause = document.createElement('button');
  playPause.type = 'button';
  playPause.className = 'hero-carousel-playpause';
  playPause.innerHTML = '<span class="hero-carousel-playpause-label">Pause</span><span class="icon icon-pause"></span>';

  controls.append(nav, playPause);

  return {
    controls, prev, next, playPause, counter,
  };
}

export default function decorate(block) {
  const rows = [...block.children];
  const slides = rows.map((row, index) => buildSlide(row, index));

  const list = document.createElement('ul');
  list.className = 'hero-carousel-slides';
  list.append(...slides);

  const {
    controls, prev, next, playPause, counter,
  } = buildControls(slides.length);

  block.replaceChildren(list, controls);
  decorateIcons(block);

  if (slides.length < 2) {
    controls.hidden = true;
    slides[0]?.classList.add('hero-carousel-slide-active');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let playing = !reduceMotion;
  let timer;

  const currentCounter = counter.querySelector('.hero-carousel-current');
  const playPauseLabel = playPause.querySelector('.hero-carousel-playpause-label');
  const playPauseIcon = playPause.querySelector('.icon');

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const isActive = i === current;
      slide.classList.toggle('hero-carousel-slide-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
    });
    currentCounter.textContent = current + 1;
  }

  function stopAutoplay() {
    clearInterval(timer);
    timer = undefined;
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => showSlide(current + 1), AUTOPLAY_DELAY);
  }

  function setPlaying(nextPlaying) {
    playing = nextPlaying;
    playPause.setAttribute('aria-pressed', String(playing));
    playPause.setAttribute('aria-label', playing ? 'Pause carousel' : 'Play carousel');
    playPauseLabel.textContent = playing ? 'Pause' : 'Play';
    playPauseIcon.className = `icon ${playing ? 'icon-pause' : 'icon-play'}`;
    playPauseIcon.innerHTML = '';
    decorateIcons(playPauseIcon.parentElement);
    if (playing) startAutoplay();
    else stopAutoplay();
  }

  prev.addEventListener('click', () => {
    showSlide(current - 1);
    if (playing) startAutoplay();
  });

  next.addEventListener('click', () => {
    showSlide(current + 1);
    if (playing) startAutoplay();
  });

  playPause.addEventListener('click', () => setPlaying(!playing));

  block.addEventListener('pointerenter', () => { if (playing) stopAutoplay(); });
  block.addEventListener('pointerleave', () => { if (playing) startAutoplay(); });
  block.addEventListener('focusin', () => { if (playing) stopAutoplay(); });
  block.addEventListener('focusout', (e) => {
    if (playing && !block.contains(e.relatedTarget)) startAutoplay();
  });

  showSlide(0);
  setPlaying(playing);
}
