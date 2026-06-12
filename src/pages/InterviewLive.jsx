import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Mic, MicOff, Clock, ChevronRight, Volume2, SkipForward, AlertCircle } from 'lucide-react'
import './InterviewLive.css'

export default function InterviewLive() {
  const location = useLocation()
  const navigate = useNavigate()
  const { questions, config } = location.state || {}

  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config?.duration || 60)
  const [isRecording, setIsRecording] = useState(false)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('ready') // ready, answering, evaluating, feedback
  const [currentFeedback, setCurrentFeedback] = useState(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const webcamRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  // Redirect if no questions
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/interview')
    }
  }, [questions, navigate])

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Webcam error:', err)
      }
    }
    startWebcam()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (phase === 'answering' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleSubmitAnswer()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start()
    recorderRef.current = recorder
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          resolve(blob)
        }
        recorderRef.current.stop()
        setIsRecording(false)
      } else {
        resolve(null)
      }
    })
  }, [])

  const handleStartAnswering = () => {
    setPhase('answering')
    setTimeLeft(config?.duration || 60)
    startRecording()
  }

  const handleSubmitAnswer = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('evaluating')

    const blob = await stopRecording()

    let transcription = ''

    // Upload and transcribe
    if (blob) {
      try {
        const formData = new FormData()
        formData.append('audio', blob, 'interview_video.webm')

        const uploadRes = await fetch('/api/upload-audio', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })
        const uploadData = await uploadRes.json()
        transcription = uploadData.transcription || ''
      } catch (err) {
        console.error('Upload error:', err)
        transcription = 'Could not transcribe audio'
      }
    }

    // Evaluate answer with AI
    let evaluation = { score: 0, feedback: 'No evaluation available', strengths: [], improvements: [] }

    if (transcription && !transcription.startsWith('Error') && !transcription.startsWith('Could not')) {
      try {
        const evalRes = await fetch('/api/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            question: questions[currentIndex],
            answer: transcription
          })
        })
        const evalData = await evalRes.json()
        if (evalData.evaluation) {
          evaluation = evalData.evaluation
        }
      } catch (err) {
        console.error('Evaluation error:', err)
      }
    }

    const result = {
      question: questions[currentIndex],
      transcription,
      evaluation,
      questionIndex: currentIndex
    }

    setResults(prev => [...prev, result])
    setCurrentFeedback(result)
    setPhase('feedback')
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      // All questions done — go to results
      const finalResults = [...results]
      if (currentFeedback && !results.find(r => r.questionIndex === currentIndex)) {
        finalResults.push(currentFeedback)
      }
      navigate('/interview/results', {
        state: {
          results: finalResults,
          config
        }
      })
    } else {
      setCurrentIndex(prev => prev + 1)
      setCurrentFeedback(null)
      setPhase('ready')
      setTimeLeft(config?.duration || 60)
    }
  }

  const playQuestion = async () => {
    setIsPlayingAudio(true)
    try {
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: questions[currentIndex] })
      })
      if (res.ok) {
        const audioBlob = await res.blob()
        const audio = new Audio(URL.createObjectURL(audioBlob))
        audio.onended = () => setIsPlayingAudio(false)
        audio.onerror = () => setIsPlayingAudio(false)
        audio.play()
      } else {
        setIsPlayingAudio(false)
      }
    } catch {
      setIsPlayingAudio(false)
    }
  }

  if (!questions) return null

  const progress = ((currentIndex + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100
  const timerPercent = (timeLeft / (config?.duration || 60)) * 100
  const isTimeLow = timeLeft <= 10

  return (
    <div className="live-page">
      {/* Progress Bar */}
      <div className="live-progress-bar">
        <div className="live-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="live-layout">
        {/* Main Content */}
        <div className="live-main">
          {/* Question Counter */}
          <div className="question-counter">
            <span className="counter-current">{currentIndex + 1}</span>
            <span className="counter-divider">/</span>
            <span className="counter-total">{questions.length}</span>
          </div>

          <AnimatePresence mode="wait">
            {/* Question Card */}
            {(phase === 'ready' || phase === 'answering') && (
              <motion.div
                key={`question-${currentIndex}`}
                className="question-card glass-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="question-header">
                  <span className="question-label">Question {currentIndex + 1}</span>
                  <button
                    className="btn btn-ghost play-btn"
                    onClick={playQuestion}
                    disabled={isPlayingAudio}
                  >
                    <Volume2 size={16} /> {isPlayingAudio ? 'Playing...' : 'Listen'}
                  </button>
                </div>

                <h2 className="question-text">{questions[currentIndex]}</h2>

                {/* Timer */}
                {phase === 'answering' && (
                  <div className="timer-section">
                    <div className={`timer-ring ${isTimeLow ? 'low' : ''}`}>
                      <svg viewBox="0 0 100 100">
                        <circle className="timer-bg" cx="50" cy="50" r="44" />
                        <circle
                          className="timer-progress"
                          cx="50" cy="50" r="44"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 44}`,
                            strokeDashoffset: `${2 * Math.PI * 44 * (1 - timerPercent / 100)}`
                          }}
                        />
                      </svg>
                      <span className={`timer-value ${isTimeLow ? 'low' : ''}`}>{timeLeft}</span>
                    </div>
                    <div className="recording-indicator">
                      <div className="rec-dot" />
                      <span>Recording</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="question-actions">
                  {phase === 'ready' && (
                    <button className="btn btn-primary btn-lg" onClick={handleStartAnswering} style={{ width: '100%' }}>
                      <Mic size={18} /> Start Answering
                    </button>
                  )}
                  {phase === 'answering' && (
                    <button className="btn btn-success btn-lg" onClick={handleSubmitAnswer} style={{ width: '100%' }}>
                      <ChevronRight size={18} /> Submit Answer
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Evaluating */}
            {phase === 'evaluating' && (
              <motion.div
                key="evaluating"
                className="evaluating-card glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="evaluating-content">
                  <div className="evaluating-spinner" />
                  <h3>AI is analyzing your answer...</h3>
                  <p>Transcribing audio and evaluating response quality</p>
                </div>
              </motion.div>
            )}

            {/* Feedback */}
            {phase === 'feedback' && currentFeedback && (
              <motion.div
                key="feedback"
                className="feedback-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="feedback-score-section">
                  <div className={`feedback-score ${
                    currentFeedback.evaluation.score >= 7 ? 'high' :
                    currentFeedback.evaluation.score >= 4 ? 'mid' : 'low'
                  }`}>
                    <span className="score-value">{currentFeedback.evaluation.score}</span>
                    <span className="score-max">/10</span>
                  </div>
                </div>

                <p className="feedback-text">{currentFeedback.evaluation.feedback}</p>

                {currentFeedback.transcription && (
                  <div className="feedback-transcript">
                    <h4>Your Answer:</h4>
                    <p>{currentFeedback.transcription}</p>
                  </div>
                )}

                {currentFeedback.evaluation.strengths?.length > 0 && (
                  <div className="feedback-list strengths">
                    <h4>✅ Strengths</h4>
                    {currentFeedback.evaluation.strengths.map((s, i) => (
                      <p key={i}>• {s}</p>
                    ))}
                  </div>
                )}

                {currentFeedback.evaluation.improvements?.length > 0 && (
                  <div className="feedback-list improvements">
                    <h4>💡 Areas to Improve</h4>
                    {currentFeedback.evaluation.improvements.map((s, i) => (
                      <p key={i}>• {s}</p>
                    ))}
                  </div>
                )}

                <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%', marginTop: '16px' }}>
                  {currentIndex + 1 >= questions.length ? (
                    <>View Results <ChevronRight size={18} /></>
                  ) : (
                    <>Next Question <ChevronRight size={18} /></>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Webcam PiP */}
        <div className="webcam-pip">
          <video ref={webcamRef} autoPlay muted playsInline className="webcam-video" />
          <div className="webcam-status">
            <Camera size={12} />
            {isRecording ? (
              <>
                <div className="rec-dot-small" />
                <span>Live</span>
              </>
            ) : (
              <span>Camera</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
