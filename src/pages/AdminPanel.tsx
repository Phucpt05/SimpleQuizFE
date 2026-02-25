import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import api from '../services/api'
import type { Question, Quiz } from '../redux/slices/quizSlice'
import { useSnackbar } from 'notistack'

const AdminPanel = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useSelector((state: RootState) => state.auth)
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filterQuizId, setFilterQuizId] = useState('') // Filter state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state for new/edit question
  const [formData, setFormData] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    keywords: '',
    quizId: '' // Quiz context for creation
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [filterQuizId])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      if (filterQuizId) {
        // Fetch questions for specific quiz
        const response = await api.get(`/quizzes/${filterQuizId}`)
        const quizData = response.data.data || response.data
        setQuestions(quizData.questions || [])
      } else {
        // Fetch all questions
        const response = await api.get('/questions')
        setQuestions(response.data.data || response.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes')
      setQuizzes(response.data.data || response.data)
    } catch (err: any) {
      console.error('Failed to fetch quizzes', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('option-')) {
      const index = parseInt(name.split('-')[1])
      const newOptions = [...formData.options]
      newOptions[index] = value
      setFormData({ ...formData, options: newOptions })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingId && !formData.quizId) {
      setError('Please select a quiz for the new question')
      return
    }

    setLoading(true)
    try {
      const payload = {
        text: formData.text,
        options: formData.options,
        correctAnswerIndex: Number(formData.correctAnswerIndex),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }

      if (editingId) {
        await api.put(`/questions/${editingId}`, payload)
      } else {
        await api.post(`/quizzes/${formData.quizId}/question`, payload)
      }

      setFormData({
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        keywords: '',
        quizId: formData.quizId
      })
      setEditingId(null)
      fetchQuestions()
      setError(null)
      enqueueSnackbar(editingId ? 'Question updated!' : 'Question added!', { variant: 'success' })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save question'
      setError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (q: Question) => {
    setEditingId(q._id)
    setFormData({
      ...formData,
      text: q.text,
      options: [...q.options],
      correctAnswerIndex: q.correctAnswerIndex,
      keywords: q.keywords.join(', ')
    })
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    setLoading(true)
    try {
      await api.delete(`/questions/${id}`)
      fetchQuestions()
      enqueueSnackbar('Question deleted', { variant: 'info' })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete question'
      setError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!user?.admin) {
    return <div className="alert alert-danger mt-5">Access Denied. Admins only.</div>
  }

  return (
    <div className="mt-4">
      <h2 className="mb-4">Admin Dashboard - Manage Questions</h2>
      
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">{editingId ? 'Edit Question' : 'Add New Question'}</h5>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            {!editingId && (
              <div className="mb-3">
                <label className="form-label">Add to Quiz</label>
                <select 
                  name="quizId" 
                  className="form-select" 
                  value={formData.quizId} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select a Quiz --</option>
                  {quizzes.map(quiz => (
                    <option key={quiz._id} value={quiz._id}>{quiz.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label">Question Text</label>
              <textarea
                name="text"
                className="form-control"
                value={formData.text}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="row">
              {formData.options.map((option, index) => (
                <div key={index} className="col-md-6 mb-3">
                  <label className="form-label">Option {String.fromCharCode(65 + index)}</label>
                  <input
                    type="text"
                    name={`option-${index}`}
                    className="form-control"
                    value={option}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Correct Answer Index (0-3)</label>
                <input
                  type="number"
                  name="correctAnswerIndex"
                  className="form-control"
                  min="0"
                  max="3"
                  value={formData.correctAnswerIndex}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Keywords (comma separated)</label>
                <input
                  type="text"
                  name="keywords"
                  className="form-control"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g. math, science"
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ ...formData, text: '', options: ['', '', '', ''], correctAnswerIndex: 0, keywords: '' })
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Existing Questions</h4>
        <div className="d-flex align-items-center gap-2" style={{ minWidth: '300px' }}>
          <label className="text-nowrap mb-0">Filter by Quiz:</label>
          <select 
            className="form-select form-select-sm" 
            value={filterQuizId} 
            onChange={(e) => setFilterQuizId(e.target.value)}
          >
            <option value="">All Quizzes</option>
            {quizzes.map(quiz => (
              <option key={quiz._id} value={quiz._id}>{quiz.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover mt-3">
          <thead className="table-light">
            <tr>
              <th>Question</th>
              <th>Options</th>
              <th>Correct</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.length > 0 ? (
              questions.map((q) => (
                <tr key={q._id}>
                  <td>{q.text}</td>
                  <td>
                    <small>{q.options.join(', ')}</small>
                  </td>
                  <td>{String.fromCharCode(65 + q.correctAnswerIndex)}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(q)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(q._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  No questions found for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPanel
