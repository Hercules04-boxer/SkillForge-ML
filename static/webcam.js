const video = document.getElementById('video');
const snapBtn = document.getElementById('snap');
const canvas = document.getElementById('canvas');
const snapshotImg = document.getElementById('snapshot');
const testWebcamBtn = document.getElementById('testWebcam'); // new button

// Start webcam stream
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Error accessing webcam: ", err);
  });

// Capture snapshot
snapBtn.onclick = () => {
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  snapshotImg.src = canvas.toDataURL('image/png');
};

// Test Webcam button → opens webcamtests.com
testWebcamBtn.onclick = () => {
  window.open(
    "https://webcamtests.com/",
    "WebcamTest",
    "width=900,height=700,scrollbars=yes,resizable=yes"
  );
};