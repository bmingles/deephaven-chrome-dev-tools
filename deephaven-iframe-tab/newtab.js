const MSG_REQUEST_GET_THEME =
  'io.deephaven.message.ThemeModel.requestParentTheme';
const MSG_REQUEST_SET_THEME = 'io.deephaven.message.ThemeModel.requestSetTheme';

const initialCssVars = {
  '--dh-color-bg': 'salmon',
  '--dh-color-fg': 'lemonchiffon',
};

const dhOrigin = 'http://localhost:4000';

/** Handle `postMessage` events */
function handleMessage({ data, origin, source }) {
  if (origin !== dhOrigin) {
    return;
  }

  // Deephaven will request the parent theme when it loads
  if (data.message === MSG_REQUEST_GET_THEME) {
    source.postMessage(
      {
        id: data.id,
        payload: {
          name: 'Iframe Parent Theme',
          cssVars: initialCssVars,
        },
      },
      dhOrigin
    );
  }
}

/** Explicitly set theme vars */
function setTheme(cssVars) {
  iframeEl.contentWindow?.postMessage(
    {
      message: MSG_REQUEST_SET_THEME,
      payload: {
        name: 'Iframe Parent Theme',
        cssVars,
      },
    },
    dhOrigin
  );
}

function onRandomClick() {
  const randomThemeVars = getRandomThemeVarsStr();
  themeVarsEl.value = randomThemeVars;
}

function onFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const themeVars = formData.get('themeVars');
  const cssVars = JSON.parse(themeVars);

  setTheme(cssVars);
}

window.addEventListener('message', handleMessage);

const iframeEl = document.createElement('iframe');
iframeEl.src = `${dhOrigin}?theme=parent-theme&preloadTransparentTheme=true`;
document.body.appendChild(iframeEl);

const themeVarsEl = document.getElementById('txtThemeVars');
themeVarsEl.value = JSON.stringify(initialCssVars, null, 2);

const randomEl = document.getElementById('btnRandom');
randomEl.addEventListener('click', onRandomClick);

const formEl = document.getElementById('form-set-theme');
formEl.addEventListener('submit', onFormSubmit);

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
