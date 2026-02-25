import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { setAuth, setLoading, setError } from '../redux/slices/authSlice'
import type { RootState } from '../redux/store'
import api from '../services/api'
import { useSnackbar } from 'notistack'

const Signup = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await api.post('/auth/signup', { 
        username, 
        email, 
        password,
        admin: isAdmin 
      })
      if (response.data.success) {
        dispatch(setAuth({
          user: response.data.data.user,
          token: response.data.data.token
        }))
        enqueueSnackbar('Account created successfully!', { variant: 'success' })
        navigate('/')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Signup failed'
      dispatch(setError(message))
      enqueueSnackbar(message, { variant: 'error' })
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow mt-5">
          <div className="card-body">
            <h2 className="text-center mb-4">Signup</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isAdminCheckbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isAdminCheckbox">
                  Register as Admin
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Signup'}
              </button>
            </form>
            <div className="mt-3 text-center">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
