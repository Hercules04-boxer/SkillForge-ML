import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Brain, Mic, BarChart3, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

export default function Landing() {
  const { user } = useAuth()

  const features = [
    { icon: <Brain size={28} />, title: 'AI-Generated Questions', desc: 'Powered by LLaMA 3.1 to create tailored interview questions based on your topics.' },
    { icon: <Mic size={28} />, title: 'Voice & Video Recording', desc: 'Record your answers with webcam and mic. Get transcriptions via Whisper AI.' },
    { icon: <BarChart3 size={28} />, title: 'Smart Scoring', desc: 'AI evaluates your answers in real-time with detailed feedback and scoring.' },
    { icon: <Clock size={28} />, title: 'Timed Questions', desc: 'Trivia-style one-by-one questions with countdown timer for realistic pressure.' },
    { icon: <Sparkles size={28} />, title: 'Instant Feedback', desc: 'Get strengths and improvement areas after each answer.' },
    { icon: <Shield size={28} />, title: 'Secure & Private', desc: 'Your data stays safe. Admin dashboard for complete oversight.' },
  ]

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }} />
          ))}
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap size={14} /> AI-Powered Interview Platform
          </motion.div>

          <h1 className="hero-title">
            Master Your Interview<br />
            <span className="text-gradient">With Machine Learning</span>
          </h1>

          <p className="hero-subtitle">
            SkillsForge ML uses advanced AI to generate questions, record your answers,
            and provide real-time scoring — one question at a time, just like a real interview.
          </p>

          <div className="hero-actions">
            {user ? (
              user.is_admin ? (
                <Link to="/admin">
                  <button className="btn btn-primary btn-lg hero-cta">
                    Admin Dashboard <ArrowRight size={18} />
                  </button>
                </Link>
              ) : (
                <Link to="/interview">
                  <button className="btn btn-primary btn-lg hero-cta">
                    Start Interview <ArrowRight size={18} />
                  </button>
                </Link>
              )
            ) : (
              <>
                <Link to="/signup">
                  <button className="btn btn-primary btn-lg hero-cta">
                    Get Started Free <ArrowRight size={18} />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-secondary btn-lg">
                    Login
                  </button>
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">AI</span>
              <span className="stat-label">Powered</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">Scoring</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">1-by-1</span>
              <span className="stat-label">Questions</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="features-section">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Everything You Need to <span className="text-gradient">Ace Interviews</span>
        </motion.h2>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <motion.div
          className="cta-card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Ready to Transform Your Interview Skills?</h2>
          <p>Join SkillsForge ML and experience AI-driven interview preparation like never before.</p>
          <Link to={user ? (user.is_admin ? "/admin" : "/interview") : "/signup"}>
            <button className="btn btn-primary btn-lg">
              {user ? (user.is_admin ? 'Go to Admin Dashboard' : 'Start an Interview') : 'Create Free Account'} <ArrowRight size={18} />
            </button>
          </Link>
        </motion.div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 SkillsForge ML — Built with AI</p>
      </footer>
    </div>
  )
}
