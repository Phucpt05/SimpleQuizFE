import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface Question {
    _id: string
    text: string
    options: string[]
    keywords: string[]
    correctAnswerIndex: number
}

interface Quiz {
    _id: string
    title: string
    description: string
    questions: Question[]
}

interface QuizState {
    quizzes: Quiz[]
    currentQuiz: Quiz | null
    loading: boolean
    error: string | null
}

const initialState: QuizState = {
    quizzes: [],
    currentQuiz: null,
    loading: false,
    error: null
}

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        setQuizzes: (state, action: PayloadAction<Quiz[]>) => {
            state.quizzes = action.payload
            state.loading = false
            state.error = null
        },
        setCurrentQuiz: (state, action: PayloadAction<Quiz | null>) => {
            state.currentQuiz = action.payload
            state.loading = false
            state.error = null
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
            state.loading = false
        }
    }
})

export const { setQuizzes, setCurrentQuiz, setLoading, setError } = quizSlice.actions
export default quizSlice.reducer
export type { Quiz, Question }
