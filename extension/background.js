let examTabId = null;
let isExamActive = false;
let retryAttempts = 0;
const MAX_RETRIES = 3;
let pendingSwitch = null;
let port = null;
// Initialize from storage
chrome.storage.local.get(['examState'], (result) => {
  if (result.examState) {
    isExamActive = result.examState.isExamActive;
    examTabId = result.examState.examTabId;
    if (isExamActive) {
      chrome.tabs.onRemoved.addListener(onTabRemoved);
    }
  }
});

function saveExamState() {
  chrome.storage.local.set({
    examState: {
      isExamActive,
      examTabId
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startExam":
      startExamMode().then(() => sendResponse({ success: true }));
      return true;
    case "stopExam":
      stopExamMode();
      sendResponse({ success: true });
      break;
    case "getExamStatus":
      sendResponse({ isExamActive, examTabId });
      break;
  }
});

async function startExamMode() {
  const tab = await chrome.tabs.create({ url: "https://colab.research.google.com/" });
  examTabId = tab.id;
  isExamActive = true;
  launchPythonScript();
  saveExamState();
  
  chrome.tabs.onRemoved.addListener(onTabRemoved);
  chrome.tabs.onCreated.addListener(onTabCreated);
  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.windows.onCreated.addListener(onWindowCreated);
  
  // Add copy-paste restriction and warning function
  await chrome.scripting.executeScript({
    target: { tabId: examTabId },
    func: () => {
      // Define the warning function
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

      // Prevent copy
      document.addEventListener('copy', (e) => {
        e.preventDefault();
        window.showWarning('⚠️ Copying is not allowed during the exam!');
      }, true);
      
      // Prevent paste
      document.addEventListener('paste', (e) => {
        e.preventDefault();
        window.showWarning('⚠️ Pasting is not allowed during the exam!');
      }, true);
      
      // Prevent cut
      document.addEventListener('cut', (e) => {
        e.preventDefault();
        window.showWarning('⚠️ Cutting is not allowed during the exam!');
      }, true);
      
      // Prevent right-click context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.showWarning('⚠️ Right-click is disabled during the exam!');
      }, true);
    }
  });
  
  console.log("Exam mode started. Tab ID:", examTabId);
}

function onTabRemoved(tabId) {
  if (tabId === examTabId) {
    console.log("Exam tab was closed");
    stopExamMode();
  }
}

function onTabCreated(tab) {
  if (isExamActive && tab.id !== examTabId) {
    // Immediately remove the tab
    chrome.tabs.remove(tab.id);
    // Show warning in exam tab
    chrome.scripting.executeScript({
      target: { tabId: examTabId },
      func: () => {
        window.showWarning('⚠️ Opening new tabs is not allowed during the exam!');
      }
    });
  }
}

function onTabUpdated(tabId, changeInfo, tab) {
  if (isExamActive && tabId !== examTabId && changeInfo.status === 'loading') {
    // Remove the tab as soon as it starts loading
    chrome.tabs.remove(tabId);
    // Show warning in exam tab
    chrome.scripting.executeScript({
      target: { tabId: examTabId },
      func: () => {
        window.showWarning('⚠️ Opening new tabs is not allowed during the exam!');
      }
    });
  }
}

function onWindowCreated(window) {
  if (isExamActive) {
    // Immediately close the new window
    chrome.windows.remove(window.id, () => {
      // Get the exam window and focus it
      chrome.windows.getCurrent((currentWindow) => {
        if (currentWindow) {
          chrome.windows.update(currentWindow.id, { focused: true });
          
          // Get the exam tab and make it active
          chrome.tabs.get(examTabId, (tab) => {
            if (tab) {
              chrome.tabs.update(examTabId, { active: true });
              
              // Send warning message to content script
              chrome.tabs.sendMessage(examTabId, {
                action: "showWarning",
                message: "⚠️ Opening new windows is not allowed during the exam!"
              });
            }
          });
        }
      });
    });
  }
}

function stopExamMode() {
  if (isExamActive) {

    
    isExamActive = false;
    chrome.tabs.onRemoved.removeListener(onTabRemoved);
    chrome.tabs.onCreated.removeListener(onTabCreated);
    chrome.tabs.onUpdated.removeListener(onTabUpdated);
    chrome.windows.onCreated.removeListener(onWindowCreated);
    //closePythonScript();
    if (examTabId) {
      chrome.tabs.remove(examTabId).catch(() => {});
    }
    
    examTabId = null;
    retryAttempts = 0;
    pendingSwitch = null;
    saveExamState();
    console.log("Exam mode stopped");
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isExamActive || activeInfo.tabId === examTabId) return;

  pendingSwitch = activeInfo;
  await handleTabSwitch();
});

async function handleTabSwitch() {
  if (!pendingSwitch) return;

  try {
    const examTab = await chrome.tabs.get(examTabId).catch(() => null);
    if (!examTab) {
      stopExamMode();
      return;
    }

    await chrome.tabs.update(examTabId, { active: true });
    console.log("Successfully switched back to exam tab");

    try {
      await chrome.scripting.executeScript({
        target: { tabId: examTabId },
        func: () => {
          window.showWarning('⚠️ Please remain on the exam tab!');
        }
      });
    } catch (scriptError) {
      console.log("Couldn't show warning:", scriptError);
    }

    retryAttempts = 0;
    pendingSwitch = null;
  } catch (error) {
    console.error("Tab switch error:", error);

    if (error.message.includes("dragging a tab") && retryAttempts < MAX_RETRIES) {
      retryAttempts++;
      console.log(`Retrying... Attempt ${retryAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 300 * retryAttempts));
      await handleTabSwitch();
    } else {
      console.error("Failed after retries");
      retryAttempts = 0;
      pendingSwitch = null;
    }
  }
}


// Helper function to show an alert in the exam tab
function showAlertInTab(tabId, message) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (msg) => {
      alert(msg);
    },
    args: [message]
  }).catch((error) => {
    console.error("Failed to show alert:", error);
  });
}

// Helper function to send a message via the port
function sendMessage(port, message, errorCallback) {
  try {
    port.postMessage(message);
    console.log(`Sent message: ${JSON.stringify(message)}`);
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    errorCallback(error);
  }
}

// Helper function to handle responses from the Python script
function handlePythonResponse(response, tabId) {
  console.log("Response from Python script:", response);
  if (response.status === "examStarted") {
    showAlertInTab(tabId, "Exam monitoring started successfully!");
  } else if (response.status === "examStopped") {
    console.log("Exam monitoring stopped successfully");
    showAlertInTab(tabId, "Exam monitoring stopped successfully!");
  } else {
    showAlertInTab(tabId, "Unexpected response: " + JSON.stringify(response));
  }
}

function launchPythonScript() {
  // Connect to the native messaging host
  console.log("Connecting to native messaging host to start Python script...");
  port = chrome.runtime.connectNative('eduguardianhost');

  // Send the startExam message
  sendMessage(port, { action: "startExam" }, (error) => {
    showAlertInTab(examTabId, "Failed to start exam monitoring: " + error.message);
  });

  // Listen for responses
  port.onMessage.addListener((response) => {
    handlePythonResponse(response, examTabId);
  });
}

function closePythonScript() {
  if (!port) {
    console.warn("No active port to send stop message to Python script");
    showAlertInTab(examTabId, "No active Python script to stop");
    return;
  }

  // Set up the disconnection handler before sending the stop message
  port.onDisconnect.addListener(() => {
    console.log("Disconnected from the Python script.");
    if (chrome.runtime.lastError) {
      console.error("Disconnection error:", chrome.runtime.lastError.message);
      showAlertInTab(examTabId, "Error during disconnection: " + (chrome.runtime.lastError?.message || "Unknown error"));
    }
    port = null; // Clear the port reference
  });

  // Send the stopExam message
  sendMessage(port, { action: "stopExam" }, (error) => {
    showAlertInTab(examTabId, "Failed to stop Python script: " + error.message);
  });

  // Forcefully disconnect the port after a delay
  setTimeout(() => {
    if (port) {
      try {
        port.disconnect();
        console.log("Port disconnected to terminate Python script");
      } catch (error) {
        console.error("Error disconnecting port:", error);
        showAlertInTab(examTabId, "Error disconnecting from Python script: " + error.message);
      }
    }
  }, 1000);
}