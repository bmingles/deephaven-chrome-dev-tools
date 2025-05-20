console.log('[TESTING] Content script loaded');

const MSG_REQUEST_SET_THEME = 'io.deephaven.message.ThemeModel.requestSetTheme';

const dhIcon16Url = chrome.runtime.getURL('icons/dh-16.png');

const a = createEl.bind(null, 'a');
const button = createEl.bind(null, 'button');
const details = createEl.bind(null, 'details');
const div = createEl.bind(null, 'div');
const form = createEl.bind(null, 'form');
const img = createEl.bind(null, 'img');
const input = createEl.bind(null, 'input');
const link = createEl.bind(null, 'link');
const span = createEl.bind(null, 'span');
const summary = createEl.bind(null, 'summary');
const textarea = createEl.bind(null, 'textarea');

const initialBg = '#FA8072'; // salmon
const initialFg = '#FFFACD'; // lemonchiffon

const initialCssVars = {
  '--dh-color-bg': initialBg,
  '--dh-color-fg': initialFg,
  '--dh-color-random-area-plot-animation-bg': initialBg,
  '--dh-color-random-area-plot-animation-fg-stroke': initialFg,
};

const themeVarsEl = div(
  { class: 'theme-vars' },
  ...createThemeVarsFields(initialCssVars)
);

const panelEl = div(
  { class: 'dh-dev-panel' },
  form(
    { id: 'form-set-theme', onSubmit: onFormSubmit },
    details(
      {},
      summary(
        {},
        img({ src: dhIcon16Url, alt: 'Deephaven Icon' }),
        span({ class: 'label' }, 'Deephaven Dev Tools')
      ),
      div(
        { class: 'content' },
        location.search.includes(
          'theme=external-theme&preloadTransparentTheme=true'
        )
          ? [
              themeVarsEl,
              div(
                { class: 'buttons' },
                button({ type: 'submit', onClick: onRandomClick }, 'Random'),
                button({ type: 'submit' }, 'Set Theme')
              ),
            ]
          : a(
              { href: '?theme=external-theme&preloadTransparentTheme=true' },
              'Enable Theming'
            )
      )
    )
  )
);

// Load styles in shadow DOM
const shadowLink = link({
  rel: 'stylesheet',
  href: chrome.runtime.getURL('content.css'),
});

// Use shadow DOM to encapsulate styles
const shadowContainerEl = createEl('div');
const shadow = shadowContainerEl.attachShadow({ mode: 'closed' });
shadow.appendChild(shadowLink);
shadow.appendChild(panelEl);

document.body.appendChild(shadowContainerEl);

/** Create theme var label + input pairs */
function createThemeVarsFields(cssVars) {
  return Object.keys(cssVars).map((key) => [
    input({
      type: 'color',
      value: cssVars[key],
      name: key,
    }),
    span({}, key),
  ]);
}

/** Explicitly set theme vars */
function setTheme(cssVars) {
  window.postMessage(
    {
      message: MSG_REQUEST_SET_THEME,
      payload: {
        name: 'Iframe External Theme',
        cssVars,
      },
    },
    location.origin
  );
}

function onRandomClick() {
  const cssVars = getRandomThemeVars();
  const children = createThemeVarsFields(cssVars).flat();
  themeVarsEl.replaceChildren(...children);
}

function onFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const cssVars = formData.keys().reduce((acc, key) => {
    acc[key] = formData.get(key);
    return acc;
  }, {});

  console.log('Setting theme vars:', cssVars);

  setTheme(cssVars);
}

function getRandomHexColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

function getRandomThemeVars() {
  const bgColor = getRandomHexColor();
  const fgColor = getContrastColor(bgColor);

  return {
    '--dh-color-bg': bgColor,
    '--dh-color-fg': fgColor,
    '--dh-color-random-area-plot-animation-bg': bgColor,
    '--dh-color-random-area-plot-animation-fg-stroke': fgColor,
  };
}

function getRandomThemeVarsStr() {
  return JSON.stringify(getRandomThemeVars(), null, 2);
}

function getContrastColor(hexColor) {
  // Remove # if present
  hexColor = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexColor.substr(0, 2), 16) / 255;
  const g = parseInt(hexColor.substr(2, 2), 16) / 255;
  const b = parseInt(hexColor.substr(4, 2), 16) / 255;

  // Calculate relative luminance (WCAG formula)
  const luminance =
    0.2126 * getLinearizedValue(r) +
    0.7152 * getLinearizedValue(g) +
    0.0722 * getLinearizedValue(b);

  // Return black for light backgrounds, white for dark backgrounds
  // Threshold of 0.179 is common for WCAG contrast
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

// Helper function to linearize RGB values
function getLinearizedValue(value) {
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function createEl(tag, attrs = {}, ...children) {
  // Create the DOM element
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      // Handle event listeners (e.g., onclick)
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      // Set regular attributes
      element.setAttribute(key, value);
    }
  }

  // Append children (text, elements, or arrays)
  children.flat().forEach((child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}
