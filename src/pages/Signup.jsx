import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Phone, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

const BACKGROUNDS = [
  'B.Tech Computer Science', 'B.Tech IT', 'B.Tech Mechanical',
  'B.Tech Civil', 'B.Tech Electrical', 'B.Tech AI & ML',
  'B.Sc Data Science', 'BCA', 'MCA', 'M.Tech', 'Other'
]

export default function Signup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', background: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signup(form)
    setLoading(false)

    if (result.success) {
      navigate('/login')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-icon-wrapper">
          <div className="auth-icon signup-icon">
            <UserPlus size={24} />
          </div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start your AI-powered interview journey</p>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input id="name" type="text" className="input-field" placeholder="John Doe"
                value={form.name} onChange={update('name')} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} className="input-icon" />
              <input id="phone" type="tel" className="input-field" placeholder="+91 9876543210"
                value={form.phone} onChange={update('phone')} pattern="[0-9]{10}" style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="signup-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input id="signup-email" type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={update('email')} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="signup-password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input id="signup-password" type={showPassword ? 'text' : 'password'}
                className="input-field" placeholder="Min 6 characters"
                value={form.password} onChange={update('password')} required minLength={6}
                style={{ paddingLeft: '40px', paddingRight: '40px' }} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="background">Study Background</label>
            <div className="input-with-icon">
              <GraduationCap size={16} className="input-icon" />
              <select id="background" className="input-field"
                value={form.background} onChange={update('background')} required
                style={{ paddingLeft: '40px' }}>
                <option value="">Select your background</option>
                {BACKGROUNDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="btn-loading-spinner" /> : <>Create Account <UserPlus size={18} /></>}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}
