const OPEN_DH_DOCS_PREVIEW = "openDeephavenDocsPreview";

chrome.contextMenus.create({
  id: OPEN_DH_DOCS_PREVIEW,
  title: "Open Deephaven Docs Preview",
  contexts: ["link"],
  documentUrlPatterns: ["https://github.com/deephaven/deephaven.io/pull/*"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === OPEN_DH_DOCS_PREVIEW && info.linkUrl) {
    const prNumber = info.pageUrl.match(/pull\/(\d+)/)[1];

    // The context menu apis don't provide the link text, only the link url.
    // We need the text to build the path to the preview url, so we inject a
    // script to get the text content of the link.
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: getLinkText,
        args: [info.linkUrl], // Pass linkUrl to the injected function
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const linkText = results[0].result;
          console.log("Link text:", linkText);

          if (!linkText.endsWith(".md")) {
            chrome.notifications.create("", {
              type: "basic",
              iconUrl: "icons/dh-light-48.png",
              title: "Unsupported file type",
              message: "Only Markdown files are supported for preview",
            });
            return;
          }

          const [product, ...rest] = linkText.split("/");
          const path = rest.join("/").replace(/\.md$/, "");

          console.log({
            product,
            prNumber,
            path,
          });

          const targetUrl = `https://preview.deephaven.io/${product}/pr-${prNumber}/${path}/`;

          // Open the new URL in a new tab
          chrome.tabs.create({ url: targetUrl });
        } else {
          console.error("Failed to get link text");
        }
      }
    );
  }
});

function getLinkText(linkUrl) {
  const hash = linkUrl.split("#")[1];
  console.log("Looking for link with hash:", hash);

  // Get link in the #files section. This should be the link in the header of
  // the expandable code diffs. The text content contains the path to the file.
  const labelEl = document.querySelector(`#files a[href="#${hash}"]`);

  // I don't think we need this, since the hash "should" match a link in the #files
  // container. Leaving uncommented for now for more testing.
  // If first match is in the sidebar, the target path is in the previous sibling element
  // if (labelEl.classList.contains("ActionList-content")) {
  //   labelEl = labelEl.previousElementSibling;
  // }

  return labelEl?.textContent.trim();
}
