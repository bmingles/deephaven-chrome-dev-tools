console.log("VDO background script loaded");

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("tab activated");
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    setDefaultBadgeText(tab);
  });
});

chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
  setDefaultBadgeText(tab);
});

function isSupportedUrl(tab) {
  return tab.url.startsWith("https://vdo.ninja/");
}

async function setDefaultBadgeText(tab) {
  if (isSupportedUrl(tab)) {
    chrome.action.setIcon({ path: "../icons/dh-32.png" });

    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });

    if (prevState === "") {
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: "OFF",
      });
    }
  } else {
    chrome.action.setIcon({ path: "../icons/dh-32-gray.png" });
    chrome.action.setBadgeText({
      tabId: tab.id,
      text: "",
    });
  }
}

/**
 * Copy any `data-sid` values from the video elements to their parent elements as
 * `data-userid` values. These are then targetted in tab.css to show username
 * overlays.
 */
function addUserIds() {
  const data = document.querySelectorAll("video[data-sid]");

  data.forEach((datum) => {
    datum.parentElement.dataset.userid = datum.dataset.sid;
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!isSupportedUrl(tab)) {
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === "ON" ? "OFF" : "ON";

  // Set the action badge to the next state
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState,
  });

  if (nextState === "ON") {
    await chrome.scripting.insertCSS({
      files: ["lib/tab.css"],
      target: { tabId: tab.id },
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: addUserIds,
    });
  } else if (nextState === "OFF") {
    await chrome.scripting.removeCSS({
      files: ["lib/tab.css"],
      target: { tabId: tab.id },
    });
  }
});
