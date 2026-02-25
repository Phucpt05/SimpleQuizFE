import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { setQuizzes, setLoading, setError } from '../redux/slices/quizSlice'
import type { RootState } from '../redux/store'
import api from '../services/api'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { quizzes, loading, error } = useSelector((state: RootState) => state.quiz)

  useEffect(() => {
    const fetchQuizzes = async () => {
      dispatch(setLoading(true))
      try {
        const response = await api.get('/quizzes')
        // The backend might return an array directly or { success, data }
        // Based on my previous implementation, it returns the array of quizzes directly
        dispatch(setQuizzes(Array.isArray(response.data) ? response.data : response.data.data))
      } catch (err: any) {
        dispatch(setError(err.response?.data?.message || 'Failed to fetch quizzes'))
      }
    }

    fetchQuizzes()
  }, [dispatch])

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="alert alert-danger mt-5">{error}</div>

  return (
    <div className="mt-4">
      <h2 className="mb-4">Available Quizzes</h2>
      <div className="row">
        {quizzes.length === 0 ? (
          <div className="col">
            <p>No quizzes available yet.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{quiz.title}</h5>
                  <p className="card-text text-muted">{quiz.description}</p>
                  <p className="small">Questions: {quiz.questions?.length || 0}</p>
                </div>
                <div className="card-footer bg-transparent border-top-0">
                  <Link to={`/quiz/${quiz._id}`} className="btn btn-primary w-100">Take Quiz</Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
