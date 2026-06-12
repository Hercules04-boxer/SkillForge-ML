// voice.js
// ----------------------------
// Simple voice recording logic
// ----------------------------

let recorder;
let audioStream;
let audioChunks = [];

const audioPlayer = document.getElementById("audio");
const startBtn = document.getElementById("startVoice");
const stopBtn = document.getElementById("stopVoice");

// Start voice recording
async function startVoiceRecording() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        recorder = new MediaRecorder(audioStream, {
            mimeType: "audio/webm"
        });

        audioChunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioURL = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioURL;
        };

        recorder.start();
        console.log("🎤 Voice recording started");

    } catch (error) {
        alert("❌ Microphone access denied or unavailable");
        console.error(error);
    }
}

// Stop voice recording
function stopVoiceRecording() {
    if (recorder && recorder.state !== "inactive") {
        recorder.stop();
        audioStream.getTracks().forEach(track => track.stop());
        console.log("⏹ Voice recording stopped");
    }
}

// Button listeners
startBtn.addEventListener("click", startVoiceRecording);
stopBtn.addEventListener("click", stopVoiceRecording);