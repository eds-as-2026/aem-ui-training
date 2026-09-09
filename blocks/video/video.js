import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Extracts a video source URL from a block row.
 * A DAM video reference is rendered either as an anchor (link to the asset)
 * or as plain text containing the URL.
 * @param {Element} row The row element to inspect
 * @returns {string} The video URL, or an empty string if none found
 */
function getVideoSource(row) {
  if (!row) return '';
  const anchor = row.querySelector('a');
  if (anchor) return anchor.href;
  return row.textContent.trim();
}

/**
 * Reads a boolean value authored as text ("true"/"false").
 * Defaults to the provided fallback when the row is empty.
 * @param {Element} row The row element to inspect
 * @param {boolean} fallback Value to use when the row has no content
 * @returns {boolean}
 */
function getBoolean(row, fallback) {
  const value = row?.textContent.trim().toLowerCase();
  if (!value) return fallback;
  return value === 'true' || value === 'yes';
}

/**
 * loads and decorates the video block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [videoRow, posterRow, posterAltRow, loopRow, controlsRow] = rows;

  const src = getVideoSource(videoRow);
  const posterImg = posterRow?.querySelector('img');
  const posterAlt = posterAltRow?.textContent.trim() || '';
  const loop = getBoolean(loopRow, true);
  const controls = getBoolean(controlsRow, false);

  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  if (loop) video.loop = true;
  if (controls) video.controls = true;
  video.setAttribute('aria-label', posterAlt || 'Video');

  if (posterImg) {
    const optimized = createOptimizedPicture(posterImg.src, posterAlt, false, [{ width: '1600' }]);
    video.poster = optimized.querySelector('img').src;
  }

  if (src) {
    const source = document.createElement('source');
    source.src = src;
    if (src.toLowerCase().includes('.webm')) source.type = 'video/webm';
    else source.type = 'video/mp4';
    video.append(source);
  }

  moveInstrumentation(videoRow, video);
  block.replaceChildren(video);

  // Autoplay may be blocked until the element is ready; retry on load.
  video.addEventListener('canplay', () => {
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => {});
  });
}
