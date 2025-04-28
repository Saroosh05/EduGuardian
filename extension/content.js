// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showWarning") {
    showWarning(message.message || '⚠️ Please remain on the exam tab!');
    sendResponse({ success: true });
  }
  return true;
});

// Show warning when trying to switch tabs or open new windows
window.showWarning = function(message = '⚠️ Please remain on the exam tab!') {
  const warning = document.createElement('div');
  warning.style.position = 'fixed';
  warning.style.top = '20px';
  warning.style.left = '50%';
  warning.style.transform = 'translateX(-50%)';
  warning.style.backgroundColor = '#ff4444';
  warning.style.color = 'white';
  warning.style.padding = '15px';
  warning.style.borderRadius = '5px';
  warning.style.zIndex = '9999';
  warning.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  warning.textContent = message;
  
  document.body.appendChild(warning);
  setTimeout(() => warning.remove(), 3000);
};

// Prevent keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // List of keys to block
  const blockedKeys = [
    'Control', 'Alt', 'Shift', 'Escape', // Modifier keys
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', // Function keys
    'Tab', // Tab key
    'Meta', // Windows/Command key
    'ContextMenu' // Right-click key
  ];

  // Check if the pressed key is in our blocked list
  if (blockedKeys.includes(e.key)) {
    e.preventDefault();
    showWarning('⚠️ Keyboard shortcuts are not allowed during the exam!');
    return false;
  }

  // Block Ctrl + any key combinations
  if (e.ctrlKey) {
    e.preventDefault();
    showWarning('⚠️ Ctrl key combinations are not allowed during the exam!');
    return false;
  }

  // Block Alt + any key combinations
  if (e.altKey) {
    e.preventDefault();
    showWarning('⚠️ Alt key combinations are not allowed during the exam!');
    return false;
  }

  // Block Shift + any key combinations
  if (e.shiftKey) {
    e.preventDefault();
    showWarning('⚠️ Shift key combinations are not allowed during the exam!');
    return false;
  }
}, true);