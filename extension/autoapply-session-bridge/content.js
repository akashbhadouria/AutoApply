(function initAutoApplyBridge() {
  function notifyReady() {
    window.dispatchEvent(new CustomEvent("autoapply:extension-ready"));
  }

  async function handleCapture(detail) {
    const response = await chrome.runtime.sendMessage({
      type: "capture-session",
      platform: detail.platform,
    });

    if (!response?.ok) {
      window.dispatchEvent(
        new CustomEvent("autoapply:session-capture-error", {
          detail: {
            platform: detail.platform,
            error: response?.error ?? "Unknown extension capture error",
          },
        }),
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("autoapply:session-captured", {
        detail: response.payload,
      }),
    );
  }

  window.addEventListener("autoapply:ping", notifyReady);
  window.addEventListener("autoapply:capture-session", (event) => {
    const detail = event.detail ?? {};
    void handleCapture(detail);
  });

  notifyReady();
})();
