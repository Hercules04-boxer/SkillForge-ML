import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, BarChart3, ArrowRight, RotateCcw, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import './InterviewResults.css'

export default function InterviewResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { results, config } = location.state || {}
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!results) {
      navigate('/interview')
      return
    }

    // Save interview result
    const avgScore = results.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0) / results.length
    fetch('/api/save-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        interviewName: config?.interviewName || 'Interview',
        score: avgScore,
        totalQuestions: results.length
      })
    }).catch(console.error)

    // Animate score
    const target = Math.round(avgScore * 10)
    let current = 0
    const interval = setInterval(() => {
      current += 1
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(interval)
      } else {
        setAnimatedScore(current)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [results])

  if (!results) return null

  const avgScore = results.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0) / results.length
  const maxScore = 10
  const percentage = (avgScore / maxScore) * 100

  const getGrade = () => {
    if (percentage >= 80) return { label: 'Excellent', icon: <Trophy size={20} />, color: 'emerald' }
    if (percentage >= 60) return { label: 'Good', icon: <CheckCircle size={20} />, color: 'blue' }
    if (percentage >= 40) return { label: 'Average', icon: <AlertTriangle size={20} />, color: 'amber' }
    return { label: 'Needs Work', icon: <XCircle size={20} />, color: 'rose' }
  }

  const grade = getGrade()

  return (
    <div className="results-page">
      <div className="results-container page-container medium">
        {/* Score Overview */}
        <motion.div
          className="results-hero glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="results-title">Interview Complete! 🎉</h1>
          <p className="results-topic">{config?.interviewName}</p>

          {/* Animated Score Gauge */}
          <div className="score-gauge">
            <svg viewBox="0 0 200 200" className="gauge-svg">
              <circle className="gauge-bg" cx="100" cy="100" r="85" />
              <circle
                className={`gauge-fill gauge-${grade.color}`}
                cx="100" cy="100" r="85"
                style={{
                  strokeDasharray: `${2 * Math.PI * 85}`,
                  strokeDashoffset: `${2 * Math.PI * 85 * (1 - animatedScore / 100)}`
                }}
              />
            </svg>
            <div className="gauge-center">
              <span className="gauge-value">{animatedScore}</span>
              <span className="gauge-percent">%</span>
            </div>
          </div>

          <div className={`grade-badge grade-${grade.color}`}>
            {grade.icon}
            <span>{grade.label}</span>
          </div>

          <div className="results-stats">
            <div className="result-stat">
              <span className="result-stat-value">{results.length}</span>
              <span className="result-stat-label">Questions</span>
            </div>
            <div className="result-stat-divider" />
            <div className="result-stat">
              <span className="result-stat-value">{avgScore.toFixed(1)}</span>
              <span className="result-stat-label">Avg Score</span>
            </div>
            <div className="result-stat-divider" />
            <div className="result-stat">
              <span className="result-stat-value">{config?.duration}s</span>
              <span className="result-stat-label">Per Q</span>
            </div>
          </div>
        </motion.div>

        {/* Per-Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="breakdown-title">
            <BarChart3 size={20} /> Question Breakdown
          </h2>

          <div className="breakdown-list">
            {results.map((r, i) => (
              <motion.div
                key={i}
                className="breakdown-item glass-card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div
                  className="breakdown-header"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <div className="breakdown-left">
                    <span className={`breakdown-score score-${
                      r.evaluation?.score >= 7 ? 'high' :
                      r.evaluation?.score >= 4 ? 'mid' : 'low'
                    }`}>
                      {r.evaluation?.score || 0}/10
                    </span>
                    <span className="breakdown-question">Q{i + 1}: {r.question}</span>
                  </div>
                  {expandedIndex === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {expandedIndex === i && (
                  <motion.div
                    className="breakdown-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="detail-section">
                      <h4>Your Answer</h4>
                      <p className="detail-answer">{r.transcription || 'No transcription available'}</p>
                    </div>
                    <div className="detail-section">
                      <h4>AI Feedback</h4>
                      <p>{r.evaluation?.feedback || 'No feedback'}</p>
                    </div>
                    {r.evaluation?.strengths?.length > 0 && (
                      <div className="detail-section">
                        <h4>✅ Strengths</h4>
                        {r.evaluation.strengths.map((s, j) => <p key={j}>• {s}</p>)}
                      </div>
                    )}
                    {r.evaluation?.improvements?.length > 0 && (
                      <div className="detail-section">
                        <h4>💡 Improvements</h4>
                        {r.evaluation.improvements.map((s, j) => <p key={j}>• {s}</p>)}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="results-actions">
          <Link to="/interview">
            <button className="btn btn-secondary btn-lg">
              <RotateCcw size={18} /> New Interview
            </button>
          </Link>
          <Link to="/">
            <button className="btn btn-primary btn-lg">
              Back to Home <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
