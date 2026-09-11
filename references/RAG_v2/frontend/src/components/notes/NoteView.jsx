import { useState, useEffect } from "react"
import axios from "axios"
import {
  ArrowLeft,
  Edit,
  BookOpen,
  Calendar,
  Tag,
  Link as LinkIcon,
  FileText,
  Sparkles,
  Clock,
  User
} from "lucide-react"

import DashboardNav from "../dashboard/DashboardNav"

function NoteView({ filename, onBack, onEdit, onLogout, user }) {
  const [note, setNote] = useState(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNote()
  }, [])

  // Fetch note content with supabase authentication
  const loadNote = async () => {
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/notes/${filename}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        }
      )
      const raw = response.data.content
      // Parse frontmatter
      const noteData = {}
      const lines = raw.split("\n")
      
      lines.forEach(line => {
        if (line.startsWith("title:"))
          noteData.title = line.replace("title:", "").trim()
        if (line.startsWith("subject:"))
          noteData.subject = line.replace("subject:", "").trim()
        if (line.startsWith("created_at:"))
          noteData.created = line.replace("created_at:", "").trim()
        if (line.startsWith("tags:")) {
          try {
            noteData.tags = JSON.parse(line.replace("tags:", "").trim())
          } catch { noteData.tags = [] }
        }
        if (line.startsWith("referenced_urls:")) {
          const urlStr = line.replace("referenced_urls:", "").trim()
          noteData.urls = urlStr ? urlStr.split(",").map(u => u.trim()) : []
        }
      })

      // Extract content after frontmatter
      const contentStart = raw.indexOf("---", 3) + 3
      setContent(raw.slice(contentStart).trim())
      setNote(noteData)
    } catch {
      setContent("Failed to load note")
    } finally {
      setLoading(false)
    }
  }

  const getTagColor = (tag) => {
    const colors = [
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-emerald-100 text-emerald-700',
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-cyan-100 text-cyan-700'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-rose-500 animate-pulse" />
          </div>
        </div>
        <p className="text-rose-600 font-medium">Loading note...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <DashboardNav
        active="notes"
        onDashboard={onBack}
        onUpload={() => {}}
        onNotes={() => {}}
        onQuiz={() => {}}
        onRoadmap={() => {}}
        onAnalytics={() => {}}
        onAnalyticsV2={() => {}}
        onLogout={onLogout}
        onStudy={() => {}}
      />

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-10 space-y-8 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeUp">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                <FileText className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Note Details
              </h1>
            </div>
            <p className="text-rose-500/80 ml-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Viewing your note content
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Note
            </button>
          </div>
        </div>

        {/* Note Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 overflow-hidden animate-fadeUp">
          {/* Header Section */}
          <div className="p-8 border-b border-rose-200/30">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              {note?.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-gray-500">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span className="font-medium text-gray-700">{note?.subject}</span>
              </span>
              
              <span className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{note?.created}</span>
              </span>
              
              <span className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>{content.split(/\s+/).length} words</span>
              </span>
            </div>

            {/* Tags */}
            {note?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {note.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${getTagColor(tag)}`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-bold text-gray-700">Notes Content</h3>
            </div>
            
            <div className="bg-gradient-to-br from-rose-50/30 to-amber-50/30 rounded-xl p-6 border border-rose-200/20">
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {content || "No content available"}
              </p>
            </div>
          </div>

          {/* URLs Section */}
          {note?.urls?.length > 0 && (
            <div className="p-8 border-t border-rose-200/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-700">Reference URLs</h3>
                <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                  {note.urls.length} links
                </span>
              </div>
              
              <ul className="space-y-2">
                {note.urls.map((url, i) => (
                  <li key={i} className="group">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 hover:from-blue-100/50 hover:to-cyan-100/50 rounded-lg transition-all duration-200 border border-blue-200/20 group-hover:border-blue-200/50"
                    >
                      <span className="text-sm font-medium text-blue-600 truncate flex-1">
                        {url}
                      </span>
                      <span className="text-xs text-blue-400 group-hover:text-blue-600 transition-colors">
                        Open →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-6 bg-gradient-to-r from-rose-50/30 to-amber-50/30 border-t border-rose-200/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4 text-rose-400" />
              <span>Note ID: {filename}</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-rose-600 transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Notes
              </button>
              
              <button
                onClick={onEdit}
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Note
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeUp">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Characters</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {content.length.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-rose-100 rounded-lg">
                <FileText className="w-4 h-4 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Words</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {content.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Tags</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {note?.tags?.length || 0}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default NoteView