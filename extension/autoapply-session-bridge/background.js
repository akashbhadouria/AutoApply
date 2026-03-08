const PLATFORM_CONFIG = {
  linkedin: {
    cookieDomain: ".linkedin.com",
    tabPatterns: ["https://www.linkedin.com/*", "https://*.linkedin.com/*"],
  },
  naukri: {
    cookieDomain: ".naukri.com",
    tabPatterns: ["https://www.naukri.com/*", "https://*.naukri.com/*"],
  },
  instahyre: {
    cookieDomain: ".instahyre.com",
    tabPatterns: ["https://www.instahyre.com/*", "https://*.instahyre.com/*"],
  },
  hirist: {
    cookieDomain: ".hirist.tech",
    tabPatterns: ["https://www.hirist.tech/*", "https://*.hirist.tech/*"],
  },
};

async function findPlatformTab(platform) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const tabs = await chrome.tabs.query({ url: config.tabPatterns });
  const activeTab = tabs.find((tab) => tab.active) ?? tabs[0];

  if (!activeTab?.id) {
    throw new Error(`No logged-in ${platform} tab found. Open ${platform} in Chrome first.`);
  }

  return activeTab;
}

async function capturePageStorage(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      function toPlainObject(storage) {
        const result = {};
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (!key) continue;
          result[key] = storage.getItem(key) ?? "";
        }
        return result;
      }

      return {
        localStorage: toPlainObject(window.localStorage),
        sessionStorage: toPlainObject(window.sessionStorage),
        pageUrl: window.location.href,
        pageTitle: document.title,
        userAgent: navigator.userAgent,
      };
    },
  });

  return result?.result ?? {
    localStorage: {},
    sessionStorage: {},
    pageUrl: "",
    pageTitle: "",
    userAgent: "",
  };
}

async function capturePlatformSession(platform) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const tab = await findPlatformTab(platform);
  const cookies = await chrome.cookies.getAll({ domain: config.cookieDomain });
  if (cookies.length === 0) {
    throw new Error(`No ${platform} cookies found. Log into ${platform} in this Chrome profile first.`);
  }

  const storage = await capturePageStorage(tab.id);

  return {
    platform,
    cookies: cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate,
    })),
    localStorage: storage.localStorage ?? {},
    sessionStorage: storage.sessionStorage ?? {},
    userAgent: storage.userAgent ?? "",
    metadata: {
      pageUrl: storage.pageUrl ?? "",
      pageTitle: storage.pageTitle ?? "",
      capturedFromTabId: tab.id,
    },
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "capture-session" || !message.platform) {
    return false;
  }

  capturePlatformSession(message.platform)
    .then((payload) => sendResponse({ ok: true, payload }))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown capture error" }));

  return true;
});
