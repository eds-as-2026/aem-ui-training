import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname : '/content/footer';

  // dual-fetch: the configured/content path first, then the site-root default
  let fragment = await loadFragment(footerPath);
  if (!fragment) fragment = await loadFragment('/footer');

  block.textContent = '';
  const footer = document.createElement('div');

  // The fragment may arrive as bare section divs (EDS/DA pipeline) or wrapped
  // in body/header/main/footer (raw plain.html on local preview). Normalise to
  // the real content divs by unwrapping an inner <main> if present.
  const innerMain = fragment.querySelector('main');
  const source = innerMain || fragment;
  [...source.children]
    .filter((el) => el.tagName === 'DIV')
    .forEach((el) => footer.append(el));

  const sections = [...footer.children];
  const text = (el) => (el ? el.textContent.trim() : '');

  // Classify each fragment section by its content signature.
  let reserve;
  let legal;
  const columns = [];

  sections.forEach((sec) => {
    sec.classList.add('footer-section');
    const hasList = sec.querySelector('ul');
    const links = sec.querySelectorAll('a');
    const secText = text(sec).toLowerCase();

    if (hasList) {
      sec.classList.add('footer-column');
      columns.push(sec);
    } else if (links.length === 1 && /reserve/i.test(text(links[0]))) {
      reserve = sec;
      sec.classList.add('footer-reserve');
    } else if (/rights reserved|©|privacy/i.test(secText)) {
      legal = sec;
      sec.classList.add('footer-legal');
    } else {
      sec.classList.add('footer-brand');
    }
  });

  // ── Columns: first paragraph becomes the heading ──
  columns.forEach((col) => {
    const heading = col.querySelector('p');
    if (heading) {
      const h4 = document.createElement('h4');
      h4.textContent = text(heading);
      heading.replaceWith(h4);
    }
  });

  // ── Legal: split into copyright (left) and privacy (right) ──
  if (legal) {
    const wrapper = legal.querySelector('div') || legal;
    const paras = [...wrapper.querySelectorAll('p')];
    const privacyIdx = paras.findIndex((p) => /privacy/i.test(p.textContent));
    const copyParas = privacyIdx >= 0 ? paras.slice(0, privacyIdx) : paras;
    const privacyParas = privacyIdx >= 0 ? paras.slice(privacyIdx) : [];

    wrapper.textContent = '';
    const copyright = document.createElement('div');
    copyright.className = 'footer-copyright';
    copyParas.forEach((p) => copyright.append(p));
    const privacy = document.createElement('div');
    privacy.className = 'footer-privacy';
    privacyParas.forEach((p) => privacy.append(p));
    wrapper.append(copyright, privacy);
  }

  // ── Reserve pill: mark the link ──
  if (reserve) {
    const link = reserve.querySelector('a');
    if (link) link.classList.add('footer-reserve-link');
  }

  // ── Layout: sitemap columns on the left, reserve pill on the right ──
  const top = document.createElement('div');
  top.className = 'footer-top';
  if (columns.length) {
    const cols = document.createElement('div');
    cols.className = 'footer-columns';
    columns.forEach((c) => cols.append(c));
    top.append(cols);
  }
  if (reserve) top.append(reserve);
  footer.prepend(top);

  block.append(footer);
}
