chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOCK') {
    handleLock(message.pinHash).then(sendResponse);
    return true;
  }
  if (message.type === 'CHECK_PIN') {
    handleCheckPin(message.pinHash).then(sendResponse);
    return true;
  }
  if (message.type === 'UNLOCK') {
    handleUnlock().then(sendResponse);
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOCK') {
    handleLock(message.pinHash).then(sendResponse);
    return true;
  }
});

async function handleLock(pinHash) {
  const existing = await chrome.storage.session.get('lockoutWindowId');
  if (existing.lockoutWindowId != null) {
    return { success: false, reason: 'already_locked' };
  }
  await chrome.storage.session.set({ pinHash });
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('lockout.html'),
    state: 'fullscreen',
    type: 'popup'
  });
  await chrome.storage.session.set({ lockoutWindowId: win.id });
  await chrome.action.disable();
  return { success: true };
}

async function handleCheckPin(pinHash) {
  const data = await chrome.storage.session.get('pinHash');
  return { success: pinHash === data.pinHash };
}

async function handleUnlock() {
  const data = await chrome.storage.session.get('lockoutWindowId');
  if (data.lockoutWindowId != null) {
    try {
      await chrome.windows.remove(data.lockoutWindowId);
    } catch (_) {
      // Window may already be closed
    }
  }
  await chrome.storage.session.remove(['pinHash', 'lockoutWindowId']);
  await chrome.action.enable();
  return { success: true };
}
