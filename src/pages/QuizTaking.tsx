import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentQuiz, setLoading, setError } from '../redux/slices/quizSlice'
import type { RootState } from '../redux/store'
import api from '../services/api'
import { useSnackbar } from 'notistack'

const QuizTaking = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentQuiz, loading, error } = useSelector((state: RootState) => state.quiz)
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const fetchQuiz = async () => {
      dispatch(setLoading(true))
      try {
        const response = await api.get(`/quizzes/${quizId}`)
        const quizData = response.data.data || response.data
        
        if (!quizData || !quizData.questions) {
          throw new Error('Invalid quiz data: missing questions')
        }

        dispatch(setCurrentQuiz(quizData))
        // Initialize user answers with -1
        setUserAnswers(new Array(quizData.questions.length).fill(-1))
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to load quiz'
        dispatch(setError(message))
        enqueueSnackbar(message, { variant: 'error' })
      }
    }

    fetchQuiz()

    return () => {
      dispatch(setCurrentQuiz(null))
    }
  }, [quizId, dispatch])

  const handleOptionSelect = (optionIndex: number) => {
    const newUserAnswers = [...userAnswers]
    newUserAnswers[currentQuestionIndex] = optionIndex
    setUserAnswers(newUserAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentQuiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      calculateScore()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = () => {
    let correct = 0
    currentQuiz!.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswerIndex) {
        correct++
      }
    })
    setScore(correct)
    setShowResult(true)
    enqueueSnackbar('Quiz completed!', { variant: 'success' })
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="alert alert-danger mt-5">{error}</div>
  if (!currentQuiz) return <div className="mt-5 text-center">Quiz not found</div>
  if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
    return <div className="mt-5 text-center alert alert-warning">This quiz has no questions yet.</div>
  }

  if (showResult) {
    return (
      <div className="row justify-content-center mt-5">
        <div className="col-md-8 text-center">
          <div className="card shadow py-5">
            <div className="card-body">
              <h1 className="display-4 text-success mb-4">Quiz Finished!</h1>
              <h3>Your Score: {score} / {currentQuiz.questions.length}</h3>
              <p className="lead mt-3">
                {score === currentQuiz.questions.length ? "Perfect Score! Well done!" : 
                 score > currentQuiz.questions.length / 2 ? "Good job!" : "Keep practicing!"}
              </p>
              <button className="btn btn-primary btn-lg mt-4" onClick={() => navigate('/')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <div className="alert alert-danger mt-5">
        Question data is missing. This quiz might be corrupted.
        <button className="btn btn-outline-danger ms-3" onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-9">
        <div className="progress mb-4" style={{ height: '10px' }}>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</h5>
            <span className="badge bg-secondary">{currentQuiz.title}</span>
          </div>
          <div className="card-body">
            <h3 className="mb-4">{currentQuestion.text}</h3>
            <div className="list-group">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={`list-group-item list-group-item-action mb-2 rounded-3 border ${
                    userAnswers[currentQuestionIndex] === index ? 'active bg-primary border-primary' : ''
                  }`}
                  onClick={() => handleOptionSelect(index)}
                >
                  <span className="me-3 fw-bold">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="card-footer bg-white d-flex justify-content-between p-3">
            <button 
              className="btn btn-outline-secondary" 
              onClick={handlePrevious} 
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <button 
              className="btn btn-primary px-4" 
              onClick={handleNext}
              disabled={userAnswers[currentQuestionIndex] === -1}
            >
              {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizTaking
