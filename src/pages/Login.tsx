import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { setAuth, setLoading, setError } from '../redux/slices/authSlice'
import type { RootState } from '../redux/store'
import api from '../services/api'
import { useSnackbar } from 'notistack'

const Login = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        dispatch(setAuth({
          user: response.data.data.user,
          token: response.data.data.token
        }))
        enqueueSnackbar('Login successful!', { variant: 'success' })
        navigate('/')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed'
      dispatch(setError(message))
      enqueueSnackbar(message, { variant: 'error' })
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow mt-5">
          <div className="card-body">
            <h2 className="text-center mb-4">Login</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
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
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div className="mt-3 text-center">
              Don't have an account? <Link to="/signup">Signup</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
