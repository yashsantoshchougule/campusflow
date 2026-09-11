import { useState, useEffect } from "react"
import axios from "axios"
import {
  ArrowLeft,
  Save,
  Tag,
  Link as LinkIcon,
  BookOpen,
  FileText,
  Sparkles,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader,
  Hash,
  ExternalLink,
  Layers,
  Edit,
  Trash2,
  File,
  Download
} from "lucide-react"
import DashboardNav from "../dashboard/DashboardNav"
import ReactMarkdown from 'react-markdown'

function NoteEditor({ filename, onBack, onLogout, user }) {
  // Left side
  const [uploadContent, setUploadContent] = useState("")
  const [uploadFileInfo, setUploadFileInfo] = useState(null)
  
  // Right side - note fields
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState([])
  const [urls, setUrls] = useState([])
  const [urlInput, setUrlInput] = useState("")
  const [subjects, setSubjects] = useState([])
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [generatingTags, setGeneratingTags] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState([])
  const [allSubjectTags, setAllSubjectTags] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")
  const [wordCount, setWordCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  useEffect(() => {
    fetchSubjects()
    if (filename) {
      setIsEditing(true)
      loadExistingNote()
    }
  }, [])

  const fetchSubjects = async () => {
    const response = await axios.get(
      import.meta.env.VITE_API_URL + "/subjects"
    )
    setSubjects(response.data.subjects)
  }

  const loadExistingNote = async () => {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(
      import.meta.env.VITE_API_URL + `/notes/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const raw = response.data.content;
    const lines = raw.split("\n");

    lines.forEach(line => {
      if (line.startsWith("title:"))
        setTitle(line.replace("title:", "").trim());
      if (line.startsWith("subject:"))
        setSubject(line.replace("subject:", "").trim());
      if (line.startsWith("tags:")) {
        try {
          setTags(JSON.parse(line.replace("tags:", "").trim()));
        } catch {
          setTags([]);
        }
      }
    });

    const contentStart = raw.indexOf("---", 3) + 3
    setContent(raw.slice(contentStart).trim())
  }

  const handleSubjectChange = async (newSubject) => {
    setSubject(newSubject)
    console.log("Fetching upload for:", newSubject)
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/uploads/${newSubject}`
      )
      console.log("Upload response:", response.data)
      setUploadContent(response.data.content || "No upload found")
      
      // Extract file info if available
      if (response.data.filename) {
        setUploadFileInfo({
          name: response.data.filename,
          size: response.data.size || 0,
          uploaded: response.data.uploaded_at || new Date().toLocaleDateString()
        })
      }
    } catch (error) {
      console.log("Upload error:", error)
      setUploadContent("No upload found for this subject")
      setUploadFileInfo(null)
    }

    const tagsResponse = await axios.post(
      import.meta.env.VITE_API_URL + "/notes/generate-tags",
      { note_content: "placeholder", subject: newSubject }
    )
    setAllSubjectTags(tagsResponse.data.tags || [])
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setWordCount(e.target.value.split(" ").filter(w => w).length)
  }

  const handleGenerateTags = async () => {
    if (!content || !subject) {
      setMessage("Write some content and select subject first!")
      setMessageType("error")
      return
    }
    setGeneratingTags(true)
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/notes/generate-tags",
        { note_content: content, subject }
      )
      setSuggestedTags(response.data.tags)
      setTags(response.data.tags)
      setMessage("Tags generated successfully!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch {
      setMessage("Failed to generate tags")
      setMessageType("error")
    } finally {
      setGeneratingTags(false)
    }
  }

  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag))
    } else {
      if (tags.length >= 5) {
        setMessage("Maximum 5 tags allowed!")
        setMessageType("error")
        return
      }
      setTags([...tags, tag])
    }
    setMessage("")
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/notes/fetch-url",
        { url: urlInput }
      )
      setUrls([...urls, { 
        url: urlInput, 
        title: response.data.title 
      }])
      setUrlInput("")
    } catch {
      setUrls([...urls, { url: urlInput, title: urlInput }])
      setUrlInput("")
    }
  }

  const handleRemoveUrl = (index) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title || !subject || !content) {
      setMessage("Title, subject and content are required!")
      setMessageType("error")
      return
    }
    if (tags.length < 3) {
      setMessage("Please select at least 3 tags!")
      setMessageType("error")
      return
    }
    if (wordCount > 500) {
      setMessage("Content exceeds 500 word limit!")
      setMessageType("error")
      return
    }

    setLoading(true)
    const token = localStorage.getItem("access_token");

    try {
      if (isEditing) {
        await axios.put(
          import.meta.env.VITE_API_URL + `/notes/${filename}`,
          { title, content, tags, urls },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      } else {
        await axios.post(
          import.meta.env.VITE_API_URL + "/notes",
          { title, subject, content, tags, urls },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      }

      setMessage("✅ Note saved successfully!")
      setMessageType("success")
      setTimeout(() => onBack(), 1000)

    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to save note")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleDiscard = () => {
    if (title || content || tags.length > 0 || urls.length > 0) {
      setShowDiscardModal(true)
    } else {
      onBack()
    }
  }

  const wordLimitColor = wordCount > 500 
    ? "text-rose-500" 
    : wordCount > 400 
    ? "text-amber-500" 
    : "text-emerald-500"

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

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

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeUp">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={handleDiscard}
                className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6 text-rose-600" />
              </button>
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                {isEditing ? <Edit className="w-7 h-7 text-rose-600" /> : <FileText className="w-7 h-7 text-rose-600" />}
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                {isEditing ? "Edit Note" : "Create New Note"}
              </h1>
            </div>
            <p className="text-rose-500/80 ml-14 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {isEditing ? "Update your existing note" : "Write and organize your study notes"}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {message && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                messageType === "success" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : messageType === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {messageType === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message}
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>

        {/* Split Screen */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] animate-fadeUp">
          
          {/* LEFT — Upload Preview with Markdown Support */}
          <div className="lg:w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-rose-200/30 bg-gradient-to-r from-rose-50/30 to-amber-50/30">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Subject Reference
                  {subject && (
                    <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">
                      {subject}
                    </span>
                  )}
                </h3>
                {uploadFileInfo && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <File className="w-3.5 h-3.5" />
                    <span>{uploadFileInfo.name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{formatFileSize(uploadFileInfo.size)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {uploadContent ? (
                <div className="prose prose-rose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-800 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-6" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-3" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? 
                          <code className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-sm" {...props} /> :
                          <code className="block bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-rose-300 pl-4 italic text-gray-600 my-3" {...props} />,
                      a: ({node, ...props}) => <a className="text-rose-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      table: ({node, ...props}) => <table className="border-collapse border border-gray-200 w-full my-3" {...props} />,
                      th: ({node, ...props}) => <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-left" {...props} />,
                      td: ({node, ...props}) => <td className="border border-gray-200 px-3 py-2" {...props} />,
                    }}
                  >
                    {uploadContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-rose-50 rounded-full mb-4">
                    <Layers className="w-8 h-8 text-rose-400" />
                  </div>
                  <p className="text-gray-400 font-medium">No reference loaded</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Select a subject to load reference material
                  </p>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200/50 max-w-sm">
                    <p className="text-xs text-amber-600 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Supports Markdown (.md) files
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Note Editor */}
          <div className="lg:w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-200/20 border border-amber-200/30 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-amber-200/30 bg-gradient-to-r from-amber-50/30 to-orange-50/30 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                Note Editor
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {isEditing ? "✏️ Editing" : "✨ New"}
                </span>
                <button
                  onClick={handleDiscard}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors flex items-center gap-1 px-2 py-1 hover:bg-rose-50 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                  Discard
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-rose-200/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-transparent transition-all duration-200 bg-white/50"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full border border-amber-200/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all duration-200 bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEditing}
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  Notes
                  <span className="text-xs text-gray-400 font-normal ml-2">(Markdown supported)</span>
                </label>
                <textarea
                  placeholder="Write your notes here in Markdown... (max 500 words)"
                  value={content}
                  onChange={handleContentChange}
                  rows={6}
                  className="w-full border border-orange-200/50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-transparent transition-all duration-200 bg-white/50 font-mono"
                />
                <p className={`text-xs text-right mt-1 font-medium ${wordLimitColor}`}>
                  {wordCount}/500 words
                </p>
              </div>

              {/* URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                  Reference URLs
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Paste URL here..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 border border-blue-200/50 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200 bg-white/50"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-200/50 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {urls.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {urls.map((url, index) => (
                      <div key={index} 
                        className="flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-lg p-2.5 text-sm border border-blue-200/20"
                      >
                        <a href={url.url} target="_blank" 
                           className="text-blue-600 hover:underline truncate flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {url.title}
                        </a>
                        <button
                          onClick={() => handleRemoveUrl(index)}
                          className="text-rose-400 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    Tags ({tags.length}/5)
                  </label>
                  <button
                    onClick={handleGenerateTags}
                    disabled={generatingTags}
                    className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {generatingTags ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate Tags
                      </>
                    )}
                  </button>
                </div>

                {/* Selected tags as pills */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map((tag, i) => (
                      <span key={i}
                        onClick={() => handleTagToggle(tag)}
                        className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer hover:from-rose-600 hover:to-amber-600 transition-all duration-200 flex items-center gap-1.5 font-medium"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                        <X className="w-3 h-3 ml-0.5" />
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag checkboxes */}
                {suggestedTags.length > 0 && (
                  <div className="border border-purple-200/50 rounded-xl p-3 max-h-40 overflow-y-auto bg-purple-50/30">
                    <p className="text-xs text-purple-600 font-medium mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      AI Suggested:
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {suggestedTags.map((tag, i) => (
                        <label key={i} 
                          className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={tags.includes(tag)}
                            onChange={() => handleTagToggle(tag)}
                            className="w-4 h-4 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                          />
                          <span className="text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                    
                    {allSubjectTags.filter(t => !suggestedTags.includes(t)).length > 0 && (
                      <>
                        <p className="text-xs text-gray-500 mt-3 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          More tags from subject:
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {allSubjectTags.filter(t => !suggestedTags.includes(t)).map((tag, i) => (
                            <label key={i}
                              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={tags.includes(tag)}
                                onChange={() => handleTagToggle(tag)}
                                className="w-4 h-4 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                              />
                              <span className="text-gray-700">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tag limit warning */}
                {tags.length < 3 && tags.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Select at least 3 tags (currently {tags.length})
                  </p>
                )}
                {tags.length >= 5 && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Maximum 5 tags reached
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDiscardModal(false)}
          />
          
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-200/50 max-w-md w-full p-8 animate-fadeUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Discard Changes?</h2>
                <p className="text-sm text-gray-500">You have unsaved changes that will be lost</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to discard this note? All your progress will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Editing
              </button>
              <button
                onClick={() => {
                  setShowDiscardModal(false)
                  onBack()
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NoteEditor