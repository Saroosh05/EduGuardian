document.addEventListener('DOMContentLoaded', function() {
  const startExamBtn = document.getElementById('startExam');
  const stopExamBtn = document.getElementById('stopExam');

  // Check initial status
  chrome.runtime.sendMessage({ action: 'getExamStatus' }, function(response) {
      if (response) {
          updateUI(response.isExamActive);
      }
  });

  // Listen for status changes
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.action === 'statusUpdate') {
          updateUI(message.isExamActive);
      }
  });

  function updateUI(isActive) {
      try {
          if (isActive) {
              startExamBtn.disabled = true;
              stopExamBtn.disabled = false;
          } else {
              startExamBtn.disabled = false;
              stopExamBtn.disabled = true;
          }
      } catch (error) {
          console.error('Error updating UI:', error);
      }
  }

  startExamBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'startExam' }, function(response) {
          if (response && response.success) {
              updateUI(true);
          }
      });
  });

  stopExamBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'stopExam' }, function(response) {
          if (response && response.success) {
              updateUI(false);
          }
      });
  });
});
