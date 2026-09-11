import { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../common/Footer";
import DashboardNav from "../dashboard/DashboardNav";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ArrowLeft,
  Sparkles,
  Database,
  ChevronDown
} from "lucide-react";

function UploadScreen({ onSuccess, onBack, onLogout, user }) {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // info, success, error

  const API_URL = import.meta.env.VITE_API_URL;
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(API_URL + "/uploads");
      setSubjects(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpload = async () => {
    if (!file || !subject) {
      setMessage("Please select a file and enter subject name");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(API_URL + "/ingest", formData);
      setMessage(`${response.data.chunks_created} chunks created!`);
      setMessageType("success");
      setTimeout(() => onSuccess(subject.toLocaleLowerCase()), 1000);
    } catch (error) {
      setMessage("❌ Upload failed. Is your backend running?");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = () => {
    if (subject) {
      onSuccess(subject.toLocaleLowerCase());
    } else {
      setMessage("Please select a subject");
      setMessageType("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <DashboardNav
        active="upload"
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
        <div className="flex items-center gap-4 animate-fadeUp">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="w-6 h-6 text-rose-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Upload Study Notes
            </h1>
            <p className="text-rose-500/80 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Upload your knowledge base and ingest it into the AI
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-8 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl">
              <Upload className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Upload New Material</h2>
              <p className="text-sm text-gray-500">Upload a Markdown (.md) knowledge base</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Markdown File
              </label>
              <div className={`
                relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
                ${file 
                  ? 'border-emerald-400 bg-emerald-50/30' 
                  : 'border-rose-200 hover:border-rose-300 bg-rose-50/20'
                }
              `}>
                <input
                  type="file"
                  accept=".md"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-emerald-500" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click or drag to upload .md file</p>
                      <p className="text-sm text-gray-400 mt-1">Maximum file size: 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject Name
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="text"
                  placeholder="e.g., AI, DBMS, Java..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-rose-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`
                w-full py-3.5 rounded-xl font-semibold transition-all duration-300
                ${loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.01]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload & Ingest
                </span>
              )}
            </button>

            {/* Message */}
            {message && (
              <div className={`
                rounded-xl p-4 flex items-center gap-3
                ${messageType === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                  : messageType === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
                }
              `}>
                {messageType === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Subjects Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-200/20 border border-amber-200/30 p-8 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Use Existing Subject</h2>
              <p className="text-sm text-gray-500">Select from previously uploaded subjects</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full appearance-none bg-white/50 border border-amber-200/50 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                <option value="">Select Existing Subject</option>
                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
            </div>

            <button
              onClick={handleUseExisting}
              disabled={!subject}
              className={`
                w-full py-3.5 rounded-xl font-semibold transition-all duration-300
                ${subject 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg hover:shadow-amber-200/50 hover:scale-[1.01]' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <Database className="w-5 h-5" />
                Use Existing Data
              </span>
            </button>
          </div>
        </div>

        {/* Help Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-8 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Creating Your Knowledge Base</h2>
              <p className="text-sm text-gray-500">Tips for well-structured notes</p>
            </div>
          </div>

          <div className="space-y-4 text-gray-700">
            <p className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              Use <strong>#</strong> for units, <strong>##</strong> for chapters, <strong>###</strong> for subtopics
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              Keep one subject per file
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              Write clear, concise notes instead of huge paragraphs
            </p>

            <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-4 font-mono text-sm whitespace-pre-line border border-rose-200/30">
{`# Unit 1

## Introduction

Definition...

## Advantages

Point 1
Point 2

# Unit 2

## Topic`}
            </div>

            <p className="text-sm text-rose-500/80">
              💡 Well-structured notes produce much better AI answers
            </p>
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-200/20 border border-amber-200/30 p-8 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
              <span className="text-2xl">🏷️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Need Custom Tags?</h2>
              <p className="text-sm text-gray-500">Tags are managed by the developer</p>
            </div>
          </div>

          <p className="text-gray-600 mb-5">
            If you'd like additional tags or metadata added to your notes, feel free to get in touch.
          </p>

          <div className="bg-gradient-to-r from-rose-50/50 to-amber-50/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border border-rose-200/30">
            <span className="font-semibold text-gray-700 break-all flex items-center gap-2">
              <span className="text-rose-400">📧</span>
              prateeksaha963@gmail.com
            </span>

            <button
              onClick={() => {
                navigator.clipboard.writeText("prateeksaha963@gmail.com");
                setMessage("📋 Email copied to clipboard!");
                setMessageType("success");
                setTimeout(() => setMessage(""), 3000);
              }}
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Email
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default UploadScreen;