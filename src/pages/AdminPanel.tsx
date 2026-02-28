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

  // Quiz Management State
  const [quizFormData, setQuizFormData] = useState({ title: '', description: '' })
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)

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

  const handleQuizEdit = (quiz: Quiz) => {
    setEditingQuizId(quiz._id)
    setQuizFormData({ title: quiz.title, description: quiz.description || '' })
    window.scrollTo(0, 0)
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuizLoading(true)
    try {
      if (editingQuizId) {
        await api.put(`/quizzes/${editingQuizId}`, quizFormData)
        enqueueSnackbar('Quiz updated!', { variant: 'success' })
      } else {
        await api.post('/quizzes', quizFormData)
        enqueueSnackbar('New Quiz created!', { variant: 'success' })
      }
      setQuizFormData({ title: '', description: '' })
      setEditingQuizId(null)
      fetchQuizzes()
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || `Failed to ${editingQuizId ? 'update' : 'create'} quiz`, { variant: 'error' })
    } finally {
      setQuizLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz and ALL its questions?')) return
    try {
      await api.delete(`/quizzes/${quizId}`)
      fetchQuizzes()
      if (filterQuizId === quizId) setFilterQuizId('')
      enqueueSnackbar('Quiz deleted', { variant: 'info' })
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete quiz', { variant: 'error' })
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
    return <div className="container mt-5"><div className="alert alert-danger">Access Denied. Admins only.</div></div>
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="row">
        {/* Quiz Management Section */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">{editingQuizId ? 'Edit Quiz' : 'Manage Quizzes'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleQuizSubmit} className="mb-4">
                <div className="mb-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Quiz Title" 
                    value={quizFormData.title}
                    onChange={(e) => setQuizFormData({...quizFormData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-2">
                  <textarea 
                    className="form-control form-control-sm" 
                    placeholder="Description" 
                    rows={2}
                    value={quizFormData.description}
                    onChange={(e) => setQuizFormData({...quizFormData, description: e.target.value})}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm w-100" disabled={quizLoading}>
                    {quizLoading ? (editingQuizId ? 'Updating...' : 'Creating...') : (editingQuizId ? 'Update Quiz' : 'Create New Quiz')}
                  </button>
                  {editingQuizId && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => {
                        setEditingQuizId(null)
                        setQuizFormData({ title: '', description: '' })
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              
              <h6>Existing Quizzes</h6>
              <div className="list-group list-group-flush border-top">
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div className="text-truncate mr-2">
                      <strong>{quiz.title}</strong>
                    </div>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-link text-primary p-0 me-2" 
                        onClick={() => handleQuizEdit(quiz)}
                        title="Edit Quiz"
                      >
                        <i className="bi bi-pencil">Edit</i>
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-danger p-0" 
                        onClick={() => deleteQuiz(quiz._id)}
                        title="Delete Quiz"
                      >
                        <i className="bi bi-trash">Delete</i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Question Management Section */}
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
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
                    <label className="form-label">Correct Answer (Index 0-3)</label>
                    <select
                      name="correctAnswerIndex"
                      className="form-select"
                      value={formData.correctAnswerIndex}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="0">A</option>
                      <option value="1">B</option>
                      <option value="2">C</option>
                      <option value="3">D</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Keywords</label>
                    <input
                      type="text"
                      name="keywords"
                      className="form-control"
                      value={formData.keywords}
                      onChange={handleInputChange}
                      placeholder="math, logic, ..."
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
            <div className="d-flex align-items-center gap-2" style={{ minWidth: '250px' }}>
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

          <div className="table-responsive bg-white rounded shadow-sm">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Question</th>
                  <th>Answers</th>
                  <th>Correct</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.length > 0 ? (
                  questions.map((q) => (
                    <tr key={q._id}>
                      <td><div className="text-wrap" style={{ maxWidth: '300px' }}>{q.text}</div></td>
                      <td>
                        <small className="text-muted">{q.options.join(' | ')}</small>
                      </td>
                      <td><span className="badge bg-info">{String.fromCharCode(65 + q.correctAnswerIndex)}</span></td>
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
                      No questions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
