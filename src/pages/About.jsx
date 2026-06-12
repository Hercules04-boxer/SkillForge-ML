import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, Mic, BarChart3, Users } from 'lucide-react'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <motion.div
        className="about-container page-container medium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="about-card glass-card">
          <h1 className="about-title">
            About <span className="text-gradient">SkillsForge ML</span>
          </h1>

          <div className="about-content">
            <p>
              SkillsForge ML is an innovative AI-powered interview automation system designed to transform
              the way organizations assess candidates. Our mission is to create a smarter, faster, and unbiased
              recruitment experience by leveraging the power of machine learning.
            </p>

            <p>
              With SkillsForge ML, traditional interviews are enhanced — or even replaced — by automated AI-driven
              assessments through text, voice, or video interactions. The system analyzes communication skills,
              technical knowledge, behavioural traits, and more.
            </p>

            <p>
              Using NLP, speech analysis, and classification algorithms, the platform provides accurate insights,
              generates relevant questions, adapts to responses, parses resumes, and evaluates candidate suitability.
            </p>

            <p>
              By automating repetitive interview tasks, SkillsForge ML helps HR teams save time and maintain fairness,
              scalability, and performance throughout the recruitment process.
            </p>
          </div>

          <div className="about-features">
            <div className="about-feature">
              <Brain size={24} />
              <span>AI Question Generation</span>
            </div>
            <div className="about-feature">
              <Mic size={24} />
              <span>Voice Analysis</span>
            </div>
            <div className="about-feature">
              <BarChart3 size={24} />
              <span>Smart Scoring</span>
            </div>
            <div className="about-feature">
              <Users size={24} />
              <span>Team Management</span>
            </div>
          </div>

          <Link to="/" className="btn btn-secondary" style={{ marginTop: '24px' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
