import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Zap, LogOut, Shield, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link to="/" className="navbar-brand">
        <Zap size={22} className="brand-icon" />
        <span className="brand-text">SkillsForge<span className="brand-accent">ML</span></span>
      </Link>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About</Link>
        {user ? (
          <>
            <Link to="/interview" className="nav-link" onClick={() => setMenuOpen(false)}>Interview</Link>
            {user.is_admin && (
              <Link to="/admin" className="nav-link admin-link" onClick={() => setMenuOpen(false)}>
                <Shield size={14} /> Admin
              </Link>
            )}
            <div className="nav-user">
              <User size={14} />
              <span className="user-name">{user.name}</span>
            </div>
            <button className="btn btn-ghost nav-logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>
              <button className="btn btn-primary btn-nav-signup">Sign Up</button>
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
