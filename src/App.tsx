import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from './redux/store'

// Pages

import AdminPanel from './pages/AdminPanel'

import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import QuizTaking from './pages/QuizTaking'

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
          
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/quiz/:quizId" element={isAuthenticated ? <QuizTaking /> : <Navigate to="/login" />} />
          
          <Route path="/admin" element={isAuthenticated && user?.admin ? <AdminPanel /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
