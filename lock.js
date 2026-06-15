const EXTENSION_ID = 'ahhafdnhbgogcocbeckccljlagddfkla';

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const boxes = Array.from(document.querySelectorAll('.pin-box'));
const statusEl = document.getElementById('status');

boxes[0].focus();

boxes.forEach((box, i) => {
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (box.value) {
        box.value = '';
      } else if (i > 0) {
        boxes[i - 1].value = '';
        boxes[i - 1].focus();
      }
    }
  });

  box.addEventListener('input', async () => {
    const digit = box.value.replace(/\D/g, '');
    box.value = digit ? digit[0] : '';
    if (!box.value) return;
    if (i < 3) {
      boxes[i + 1].focus();
    } else {
      const pin = boxes.map(b => b.value).join('');
      if (pin.length === 4) {
        boxes.forEach(b => { b.disabled = true; });
        statusEl.textContent = '';
        try {
          const pinHash = await hashPin(pin);
          chrome.runtime.sendMessage(EXTENSION_ID, { type: 'LOCK', pinHash }, (response) => {
            if (chrome.runtime.lastError || !response?.success) {
              statusEl.textContent = 'Could not connect to HoldMySession. Is the extension installed?';
              boxes.forEach(b => { b.disabled = false; });
              boxes[0].value = '';
              boxes[0].focus();
              return;
            }
            statusEl.className = 'status success';
            statusEl.textContent = 'Computer locked! You can close this tab.';
            window.close();
          });
        } catch (_) {
          statusEl.textContent = 'An error occurred. Please try again.';
          boxes.forEach(b => { b.disabled = false; });
          boxes[0].focus();
        }
      }
    }
  });
});
