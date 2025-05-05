console.log('[TESTING] Content script loaded');

const MSG_REQUEST_SET_THEME = 'io.deephaven.message.ThemeModel.requestSetTheme';

const dhIcon16Url = chrome.runtime.getURL('icons/dh-16.png');

const initialCssVars = {
  '--dh-color-bg': 'salmon',
  '--dh-color-fg': 'lemonchiffon',
};

const textAreaEl = createEl(
  'textarea',
  {
    name: 'themeVars',
  },
  JSON.stringify(initialCssVars, null, 2)
);

const panelEl = createEl(
  'div',
  { class: 'dh-dev-panel' },
  createEl(
    'form',
    { id: 'form-set-theme', onSubmit: onFormSubmit },
    createEl(
      'details',
      {},
      createEl(
        'summary',
        {},
        createEl('img', { src: dhIcon16Url, alt: 'Deephaven Icon' }),
        createEl('span', { class: 'label' }, 'Deephaven Dev Tools')
      ),
      createEl(
        'div',
        { class: 'content' },
        createEl(
          'a',
          { href: '?theme=external-theme&preloadTransparentTheme=true' },
          'Enable Theming'
        ),
        textAreaEl,
        createEl(
          'div',
          { class: 'buttons' },
          createEl(
            'button',
            { type: 'submit', onClick: onRandomClick },
            'Random'
          ),
          createEl('button', { type: 'submit' }, 'Set Theme')
        )
      )
    )
  )
);

// Load styles in shadow DOM
const link = createEl('link', {
  rel: 'stylesheet',
  href: chrome.runtime.getURL('content.css'),
});

// Use shadow DOM to encapsulate styles
const shadowContainerEl = createEl('div');
const shadow = shadowContainerEl.attachShadow({ mode: 'closed' });
shadow.appendChild(link);
shadow.appendChild(panelEl);

document.body.appendChild(shadowContainerEl);

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
  const randomThemeVars = getRandomThemeVarsStr();
  textAreaEl.value = randomThemeVars;
}

function onFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const themeVars = formData.get('themeVars');
  const cssVars = JSON.parse(themeVars);

  setTheme(cssVars);
}

function getRandomHexColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

function getRandomThemeVars() {
  const bgColor = getRandomHexColor();

  return {
    '--dh-color-bg': bgColor,
    '--dh-color-fg': getContrastColor(bgColor),
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
