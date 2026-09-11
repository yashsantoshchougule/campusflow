import { useState, useEffect } from "react"
import axios from "axios"
import {
  Plus,
  ArrowLeft,
  BookOpen,
  Tag,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  Search,
  Trash2,
  Eye,
  Edit,
  Sparkles,
  Database,
  Clock
} from "lucide-react"
// import DashboardNav from "../Dashboard/DashboardNav"
import ModuleNav from "../common/ModuleNav"

function NotesScreen({ onBack, onCreateNote, onEditNote, onViewNote, onLogout, user }) {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isIngesting, setIsIngesting] = useState(false)

  useEffect(() => {
    fetchSubjects()
    fetchNotes()
  }, [])

  const fetchSubjects = async () => {
    const response = await axios.get(
      import.meta.env.VITE_API_URL + "/subjects"
    )
    setSubjects(response.data.subjects)
  }

  const fetchNotes = async (subject = "") => {
    setLoading(true)
    const token = localStorage.getItem("access_token")
    const url = subject
      ? import.meta.env.VITE_API_URL + `/notes?subject=${subject}`
      : import.meta.env.VITE_API_URL + "/notes"
    
    console.log("TOKEN:", token)
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    setNotes(response.data.notes)
    setLoading(false)
  }

  const handleSubjectFilter = (subject) => {
    setSelectedSubject(subject)
    fetchNotes(subject)
  }

  const handleDelete = async (filename) => {
    if (!confirm("Delete this note?")) return

    const token = localStorage.getItem("access_token")

    try {
      await axios.delete(
        import.meta.env.VITE_API_URL + `/notes/${filename}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      fetchNotes(selectedSubject)
    } catch (error) {
      console.error(error)
      alert("Failed to delete note")
    }
  }

  const handleIngest = async () => {
    const token = localStorage.getItem("access_token")
    setIsIngesting(true)

    try {
      await axios.post(
        import.meta.env.VITE_API_URL + "/notes/ingest",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      alert("Notes ingested successfully!")
      fetchNotes(selectedSubject)
    } catch (error) {
      console.error(error)
      alert("Failed to ingest notes")
    } finally {
      setIsIngesting(false)
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTagColor = (tag) => {
    const colors = [
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-emerald-100 text-emerald-700',
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

     <ModuleNav
  active="notes" // or "study", "upload", "roadmap", 
  onDashboard={onBack}
  onStudy={() => {}}
  onUpload={() => {}}
  onNotes={() => {}}
  onRoadmap={() => {}}
  onAnalyticsV2={() => {}}
  onLogout={onLogout}
  user={user}
/>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-fadeUp">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                <FileText className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                My Notes
              </h1>
            </div>
            <p className="text-rose-500/80 ml-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Create, manage, and organize your study notes
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleIngest}
              disabled={isIngesting}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                isIngesting
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-200/50 hover:scale-[1.02]'
              }`}
            >
              {isIngesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Ingest Notes
                </>
              )}
            </button>
            
            <button
              onClick={onCreateNote}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeUp">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Notes</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{notes.length}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-amber-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Subjects</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{subjects.length}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Words</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {notes.reduce((acc, note) => acc + (note.word_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Ingested</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {notes.filter(n => n.ingested).length}/{notes.length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Subject Filter + Search */}
        <div className="flex flex-col md:flex-row gap-4 animate-fadeUp">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-rose-400 w-5 h-5" />
              <input
                placeholder="Search notes by title or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSubjectFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedSubject === ""
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200/50"
                  : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-rose-200/30"
              }`}
            >
              All
            </button>
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectFilter(subject)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSubject === subject
                    ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200/50"
                    : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-rose-200/30"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/30 animate-pulse">
                <div className="w-12 h-12 bg-rose-200 rounded-xl mb-4" />
                <div className="h-6 bg-rose-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-rose-100 rounded w-1/2 mb-4" />
                <div className="flex gap-2 mb-4">
                  <div className="h-5 bg-rose-100 rounded w-16" />
                  <div className="h-5 bg-rose-100 rounded w-12" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-9 bg-rose-200 rounded-lg" />
                  <div className="flex-1 h-9 bg-rose-200 rounded-lg" />
                  <div className="flex-1 h-9 bg-rose-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-200/30 animate-fadeUp">
            <div className="text-6xl mb-4">📓</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? "Try a different search term" 
                : "Create your first note to get started!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeUp">
            {filteredNotes.map((note, index) => (
              <div
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/30 shadow-sm hover:shadow-xl hover:shadow-rose-200/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Title */}
                <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                  {note.title}
                </h3>

                {/* Subject + Date */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {note.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {note.created}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {note.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag)}`}
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs text-gray-400 font-medium">
                      +{note.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Word count + ingested */}
                <div className="flex justify-between items-center text-xs mb-4">
                  <span className="text-gray-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {note.word_count} words
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    note.ingested 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {note.ingested ? '✅ Ingested' : '⏳ Pending'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewNote(note.filename)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>

                  <button
                    onClick={() => onEditNote(note.filename)}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(note.filename)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default NotesScreen