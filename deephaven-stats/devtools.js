chrome.devtools.panels.create(
  "Deephaven Stats",
  "icons/dh-32.png",
  "statspanel.html",
  () => {
    console.log("user switched to this panel");
  }
);

async function getDHCServerConfigValues() {
  if (typeof dh === "undefined") {
    return;
  }

  console.log("Deephaven Dev - Stats");

  const client = new dh.CoreClient(location.origin);
  await client.login({
    type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS,
  });

  const config = await client.getServerConfigValues();
  client.disconnect();

  return config;
}

chrome.devtools.inspectedWindow.eval(
  `(${getDHCServerConfigValues.toString()})().then(config => {
    window.dhConfig = config;
  });`
);

chrome.devtools.panels.elements.createSidebarPane(
  "Deephaven Stats",
  function (sidebar) {
    function updateElementProperties() {
      sidebar.setExpression("window.dhConfig", "Stats");
    }

    updateElementProperties();
  }
);
