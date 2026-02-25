import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { logout } from '../redux/slices/authSlice'

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Quiz App</Link>
        <div className="navbar-nav me-auto">
          {isAuthenticated && user?.admin && (
            <Link className="nav-item nav-link" to="/admin">Admin Panel</Link>
          )}
        </div>
        <div className="navbar-nav ms-auto">
          {isAuthenticated ? (
            <>
              <span className="nav-item nav-link text-light me-3">
                Welcome, {user?.username} {user?.admin && <span className="badge bg-danger">Admin</span>}
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="nav-item nav-link" to="/login">Login</Link>
              <Link className="nav-item nav-link" to="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
