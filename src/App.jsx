import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import About from './pages/About'
import InterviewSetup from './pages/InterviewSetup'
import InterviewLive from './pages/InterviewLive'
import InterviewResults from './pages/InterviewResults'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-mesh" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/interview" element={
            <ProtectedRoute><InterviewSetup /></ProtectedRoute>
          } />
          <Route path="/interview/live" element={
            <ProtectedRoute><InterviewLive /></ProtectedRoute>
          } />
          <Route path="/interview/results" element={
            <ProtectedRoute><InterviewResults /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
