import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Inline SVG social icons (Kia uses an icon font / CSS shapes; we reproduce
// equivalent white vector glyphs so no raster assets are needed).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.53-1.5H17V3.6c-.3 0-1.3-.1-2.46-.1-2.44 0-4.1 1.49-4.1 4.22V9.9H7.7V13h2.74v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 3h3l-6.55 7.48L21.7 21h-5.9l-4.24-5.54L6.7 21H3.7l7-8.01L2.6 3h6.05l3.83 5.06zm-1.05 16.1h1.66L7.6 4.8H5.82z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.17 8.8 2.16 12 2.16zm0 1.98c-3.15 0-3.5.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.6-.07 4.75s.01 3.5.07 4.75c.05 1.15.24 1.77.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.6.07 4.75.07s3.5-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.6.07-4.75s-.01-3.5-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.6-.07-4.75-.07zm0 3.37a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 7.42a2.92 2.92 0 1 0 0-5.84 2.92 2.92 0 0 0 0 5.84zm5.73-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 12s0-3.2-.4-4.72a2.5 2.5 0 0 0-1.77-1.77C19.28 5.1 12 5.1 12 5.1s-7.28 0-8.83.4A2.5 2.5 0 0 0 1.4 7.28C1 8.8 1 12 1 12s0 3.2.4 4.72a2.5 2.5 0 0 0 1.77 1.77c1.55.41 8.83.41 8.83.41s7.28 0 8.83-.4a2.5 2.5 0 0 0 1.77-1.78C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2 .03-2.86.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.48c0-1.39.8-2.42 1.8-2.42.85 0 1.26.64 1.26 1.4 0 .86-.54 2.14-.82 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.14-1.87 3.14-4.57 0-2.39-1.72-4.06-4.17-4.06-2.84 0-4.51 2.13-4.51 4.33 0 .86.33 1.78.74 2.28.08.1.1.19.07.29-.08.32-.26 1-.29 1.14-.05.19-.15.23-.35.14-1.3-.6-2.11-2.5-2.11-4.02 0-3.28 2.38-6.29 6.86-6.29 3.6 0 6.4 2.57 6.4 6 0 3.58-2.26 6.46-5.39 6.46-1.05 0-2.04-.55-2.38-1.2l-.65 2.47c-.23.9-.86 2.03-1.29 2.72.97.3 2 .46 3.07.46 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>',
};

// The Kia wordmark logo, inline SVG (from kia.com — viewBox 0 0 68 34).
const KIA_LOGO = '<svg data-name="Kia" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 34" width="68" height="34" aria-hidden="true"><path fill="currentColor" d="M39.4,23.11c0,0.12,0.04,0.2,0.11,0.2c0.05,0,0.1-0.02,0.16-0.06L60.65,9.62c0.37-0.24,0.71-0.37,1.21-0.37h4.61c0.71,0,1.18,0.47,1.18,1.18v8.8c0,1.06-0.24,1.68-1.18,2.25l-5.59,3.36c-0.07,0.05-0.13,0.07-0.19,0.07c-0.07,0-0.13-0.05-0.13-0.24l0-10.28c0-0.11-0.04-0.2-0.11-0.2c-0.05,0-0.1,0.02-0.16,0.06l-15.34,9.96c-0.43,0.28-0.78,0.36-1.18,0.36H33.61c-0.71,0-1.18-0.47-1.18-1.18V10.71c0-0.09-0.04-0.18-0.11-0.18c-0.05,0-0.1,0.02-0.16,0.06l-10.11,6.08c-0.1,0.06-0.13,0.11-0.13,0.16c0,0.04,0.02,0.08,0.09,0.16l7.22,7.22c0.1,0.1,0.16,0.17,0.16,0.25c0,0.09-0.11,0.12-0.23,0.12l-6.54,0c-0.51,0-0.91-0.08-1.18-0.35l-4.38-4.38c-0.04-0.04-0.08-0.07-0.13-0.07c-0.04,0-0.09,0.02-0.14,0.05l-7.33,4.4c-0.44,0.27-0.75,0.35-1.18,0.35H1.53c-0.71,0-1.18-0.47-1.18-1.18v-8.64c0-1.06,0.24-1.67,1.18-2.24l5.63-3.38C7.21,9.1,7.26,9.09,7.31,9.09c0.09,0,0.13,0.09,0.13,0.28v11.55c0,0.12,0.03,0.18,0.11,0.18c0.05,0,0.1-0.03,0.17-0.07L26.73,9.61c0.45-0.27,0.73-0.35,1.25-0.35h10.23c0.71,0,1.18,0.47,1.18,1.18V23.11z"/></svg>';

// Home breadcrumb icon (matches Kia's footer breadcrumb).
const HOME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2 3 10.5V21h6v-6h6v6h6V10.5L12 3.2zm0 2.57 5 4.06V19h-2v-6H9v6H7v-9.17l5-4.06z"/></svg>';

function iconFor(name) {
  const key = name.trim().toLowerCase();
  if (key.includes('facebook')) return SOCIAL_ICONS.facebook;
  if (key.includes('twitter') || key === 'x') return SOCIAL_ICONS.twitter;
  if (key.includes('instagram')) return SOCIAL_ICONS.instagram;
  if (key.includes('youtube')) return SOCIAL_ICONS.youtube;
  if (key.includes('pinterest')) return SOCIAL_ICONS.pinterest;
  return '';
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // dual-fetch: metadata/aem-up path first, then the local content path
  let fragment = await loadFragment(footerPath);
  if (!fragment) fragment = await loadFragment('/content/footer');

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

  // classify the sections built from the fragment
  sections.forEach((sec) => {
    sec.classList.add('footer-section');
    const heading = sec.querySelector('p, h4');
    const label = heading ? heading.textContent.trim().toLowerCase() : '';

    if (label === 'kia motors') {
      sec.classList.add('footer-logo');
    } else if (label === 'kia social media links') {
      sec.classList.add('footer-social');
    } else if (label === 'quick links') {
      sec.classList.add('footer-quicklinks');
    } else if (sec.querySelector('h4')) {
      sec.classList.add('footer-column');
    } else {
      sec.classList.add('footer-legal');
    }
  });

  // logo: keep the anchor, drop the plain-text label paragraph, and swap the
  // link text for the inline Kia wordmark SVG (keep an accessible label)
  const logo = footer.querySelector('.footer-logo');
  if (logo) {
    const link = logo.querySelector('a');
    logo.textContent = '';
    if (link) {
      const label = link.textContent.trim() || 'Kia Motors';
      link.classList.add('footer-logo-link');
      link.setAttribute('aria-label', label);
      link.innerHTML = `${KIA_LOGO}<span class="footer-visually-hidden">${label}</span>`;
      logo.append(link);
    }
  }

  // social: replace each link's text with an inline SVG icon (keep a11y label)
  const social = footer.querySelector('.footer-social');
  if (social) {
    social.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim();
      const svg = iconFor(label);
      if (svg) {
        a.setAttribute('aria-label', label);
        a.innerHTML = `${svg}<span class="footer-visually-hidden">${label}</span>`;
        a.classList.add('footer-social-link');
      }
    });
  }

  // bottom legal: swap the "Home" breadcrumb link's text for a home icon,
  // then group the remaining contact/copyright paragraphs so the band reads
  // like Kia — Home icon on the left, contact info on the right.
  const legal = footer.querySelector('.footer-legal');
  if (legal) {
    const wrapper = legal.querySelector('div') || legal;
    const paras = [...wrapper.children].filter((el) => el.tagName === 'P');
    const homePara = paras.find((p) => {
      const a = p.querySelector('a');
      return a && a.textContent.trim().toLowerCase() === 'home';
    });

    if (homePara) {
      const homeLink = homePara.querySelector('a');
      const label = homeLink.textContent.trim();
      homeLink.setAttribute('aria-label', label);
      homeLink.innerHTML = `${HOME_ICON}<span class="footer-visually-hidden">${label}</span>`;
      homeLink.classList.add('footer-home-link');
      homePara.classList.add('footer-legal-home');
    }

    // group everything that isn't the Home breadcrumb into a centred contact
    // block; the assistance line + copyright share one row (as on Kia), with
    // the EV assistance line below.
    const rest = paras.filter((p) => p !== homePara);
    const contact = document.createElement('div');
    contact.className = 'footer-legal-contact';

    const evPara = rest.find((p) => /ev assistance/i.test(p.textContent));
    const topRow = document.createElement('div');
    topRow.className = 'footer-legal-row';
    rest.filter((p) => p !== evPara).forEach((p) => topRow.append(p));
    contact.append(topRow);
    if (evPara) contact.append(evPara);

    wrapper.append(contact);
  }

  // Lay out the columns exactly like Kia: a 6-column row where the FIRST column
  // stacks Quick Links + Social vertically, followed by the five heading
  // columns (Cars, Buy, Owners, Discover Kia, Legal).
  const quicklinks = footer.querySelector('.footer-quicklinks');
  const socialCol = footer.querySelector('.footer-social');
  const headingCols = [...footer.querySelectorAll('.footer-column')];

  if (quicklinks || headingCols.length) {
    const grid = document.createElement('div');
    grid.className = 'footer-columns';
    (quicklinks || socialCol || headingCols[0]).before(grid);

    // first column: Quick Links stacked above Social
    const primary = document.createElement('div');
    primary.className = 'footer-col-primary';
    if (quicklinks) primary.append(quicklinks);
    if (socialCol) primary.append(socialCol);
    grid.append(primary);

    // remaining columns: the heading/accordion columns
    headingCols.forEach((c) => grid.append(c));
  }

  // On mobile the heading columns collapse into accordions (matches source).
  // Wire a tap handler on each heading that toggles the column open/closed.
  // The handler only intercepts the tap while the accordion layout is active
  // (checked via a CSS custom flag on the heading), so on desktop the heading
  // link keeps navigating normally.
  footer.querySelectorAll('.footer-column').forEach((col) => {
    const heading = col.querySelector('h4');
    if (!heading) return;
    heading.addEventListener('click', (e) => {
      const accordionActive = getComputedStyle(heading)
        .getPropertyValue('cursor')
        .trim() === 'pointer';
      if (!accordionActive) return; // desktop: let the link navigate
      e.preventDefault();
      col.classList.toggle('is-open');
    });
  });

  block.append(footer);
}
