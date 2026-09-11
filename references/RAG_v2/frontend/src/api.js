import axios from "axios"
import { supabase } from "./supabaseClient"

const API_URL = import.meta.env.VITE_API_URL

// Helper to get auth headers
const getHeaders = async () => {
  const { data, error } = await supabase.auth.getSession()
  console.log("Error:", error)
  const token = data.session?.access_token
  return {
    "Authorization": `Bearer ${token}`
  }
}
// Quiz
export const generateQuiz = async (subject) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/generate-quiz`, { subject }, { headers })
}

export const evaluateAnswers = async (quiz, answers, subject) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/evaluate`, { quiz, answers, subject }, { headers })
}

// Q&A
export const askQuestion = async (question) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/ask`, { question }, { headers })
}

// Notes
export const getNotes = async (subject = null) => {
  const headers = await getHeaders()
  const url = subject 
    ? `${API_URL}/notes?subject=${subject}` 
    : `${API_URL}/notes`
  return axios.get(url, { headers })
}

export const createNote = async (data) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/notes`, data, { headers })
}

export const updateNote = async (filename, data) => {
  const headers = await getHeaders()
  return axios.put(`${API_URL}/notes/${filename}`, data, { headers })
}

export const deleteNote = async (filename) => {
  const headers = await getHeaders()
  return axios.delete(`${API_URL}/notes/${filename}`, { headers })
}

export const generateTags = async (content, subject) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/notes/generate-tags`, 
    { note_content: content, subject }, { headers })
}

export const ingestNotes = async () => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/notes/ingest`, {}, { headers })
}

// Roadmap
export const generateRoadmap = async (data) => {
  const headers = await getHeaders()
  return axios.post(`${API_URL}/roadmap`, data, { headers })
}

export const getRoadmap = async (subject) => {
  const headers = await getHeaders()
  return axios.get(`${API_URL}/roadmap/${subject}`, { headers })
}

export const deleteRoadmap = async (subject) => {
  const headers = await getHeaders()
  return axios.delete(`${API_URL}/roadmap/${subject}`, { headers })
}

export const extendRoadmap = async (subject, date) => {
  const headers = await getHeaders()
  return axios.put(`${API_URL}/roadmap/${subject}/extend`, 
    { new_target_date: date }, { headers })
}

export const completeTopic = async (subject, week, topic) => {
  const headers = await getHeaders()
  return axios.put(`${API_URL}/roadmap/${subject}/complete-topic`,
    { week, topic_name: topic }, { headers })
}

// Analytics
export const getAnalytics = async (subject) => {
  const headers = await getHeaders()
  return axios.get(`${API_URL}/analytics/${subject}`, { headers })
}

// Upload
export const ingestFile = async (file) => {
  const headers = await getHeaders()
  const formData = new FormData()
  formData.append("file", file)
  return axios.post(`${API_URL}/ingest`, formData, { headers })
}

export const getSubjects = async () => {
  const headers = await getHeaders()
  return axios.get(`${API_URL}/subjects`, { headers })
}



