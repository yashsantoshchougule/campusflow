import { useState, useEffect } from "react";
import {
  Upload,
  Search,
  BookOpen,
  Trash2,
  ArrowRight,
  Library,
  Clock,
  TrendingUp,
  FileText,
  X,
  ChevronRight,
  Sparkles,
  GraduationCap
} from "lucide-react";
// import DashboardNav from "../Dashboard/DashboardNav";
import Footer from "../common/Footer";
import ModuleNav from "../common/ModuleNav";

import {
  getBooks,
  uploadBook,
  deleteBook,
  getBook,
} from "../../api/bookApi";

function StudyScreen({ user, onBack, setScreen, setSelectedBook, onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [continueBook, setContinueBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true);
      const fetchedBooks = await getBooks();
      setBooks(fetchedBooks);
      
      const sorted = [...fetchedBooks].sort(
        (a, b) => new Date(b.last_opened) - new Date(a.last_opened)
      );
      
      if (sorted.length) {
        setContinueBook(sorted[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await uploadBook(selectedFile);
      await fetchBooks();
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeBook = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await deleteBook(id);
        await fetchBooks();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const openBook = async (id) => {
    try {
      return await getBook(id);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (current, total) => {
    const percentage = (current / total) * 100;
    if (percentage < 30) return "from-rose-400 to-rose-500";
    if (percentage < 70) return "from-amber-400 to-amber-500";
    return "from-emerald-400 to-emerald-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <ModuleNav
  active="study" // or "study", "upload", "roadmap", "analytics-v2"
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
                <Library className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Study Library
              </h1>
            </div>
            <p className="text-rose-500/80 ml-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Read and manage your uploaded books
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Book
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeUp">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Books</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{books.length}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-amber-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pages Read</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {books.reduce((acc, book) => acc + book.current_page, 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Pages</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {books.reduce((acc, book) => acc + book.total_pages, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Progress</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {books.length > 0 
                    ? `${Math.round((books.reduce((acc, book) => acc + book.current_page, 0) / books.reduce((acc, book) => acc + book.total_pages, 0)) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Continue Reading */}
        {continueBook && (
          <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 rounded-2xl p-8 relative overflow-hidden animate-fadeUp shadow-xl shadow-rose-200/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-white/80" />
                <span className="text-white/80 font-medium">Continue Reading</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1">
                {continueBook.title}
              </h2>
              
              <p className="text-white/80 mb-4">
                {continueBook.current_page} / {continueBook.total_pages} pages
              </p>

              <div className="w-full bg-white/30 rounded-full h-2.5 mb-4 max-w-md">
                <div
                  className="bg-white h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${(continueBook.current_page / continueBook.total_pages) * 100}%`,
                  }}
                />
              </div>

              <button
                onClick={async () => {
                  const bookData = await openBook(continueBook.id);
                  if (!bookData) return;
                  setSelectedBook(bookData);
                  setScreen("study-reader");
                }}
                className="bg-white text-rose-600 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                Continue Reading
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative animate-fadeUp">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-rose-400 w-5 h-5" />
          <input
            placeholder="Search books by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Library Grid */}
        <div className="space-y-4 animate-fadeUp">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              My Books
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredBooks.length})
              </span>
            </h2>
          </div>

          {loadingBooks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/30 animate-pulse">
                  <div className="w-12 h-12 bg-rose-200 rounded-xl mb-4" />
                  <div className="h-6 bg-rose-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-rose-100 rounded w-1/2 mb-4" />
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-rose-200 rounded-lg" />
                    <div className="w-10 h-10 bg-rose-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-200/30">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try a different search term" : "Upload your first book to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => {
                const progress = Math.round((book.current_page / book.total_pages) * 100);
                const progressColor = getProgressColor(book.current_page, book.total_pages);
                
                return (
                  <div
                    key={book.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/30 shadow-sm hover:shadow-xl hover:shadow-rose-200/20 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-8 h-8 text-rose-600" />
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full">
                        {progress}% complete
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                      {book.title}
                    </h3>

                    <p className="text-gray-500 text-sm mb-4">
                      {book.current_page} / {book.total_pages} pages
                    </p>

                    <div className="w-full bg-rose-100 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          const bookData = await openBook(book.id);
                          if (!bookData) return;
                          setSelectedBook(bookData);
                          setScreen("study-reader");
                        }}
                        className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 flex items-center justify-center gap-2"
                      >
                        Read
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeBook(book.id)}
                        className="bg-red-50 hover:bg-red-100 p-2.5 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-200/50 max-w-lg w-full p-8 animate-fadeUp">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl">
                <Upload className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Upload Book</h2>
                <p className="text-sm text-gray-500">Upload a PDF book to your library</p>
              </div>
            </div>

            <div className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 mb-6
              ${selectedFile 
                ? 'border-emerald-400 bg-emerald-50/30' 
                : 'border-rose-200 hover:border-rose-300 bg-rose-50/20'
              }
            `}>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-emerald-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click or drag to upload PDF</p>
                    <p className="text-sm text-gray-400 mt-1">Maximum file size: 50MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-3 border border-rose-200 rounded-xl text-gray-600 hover:bg-rose-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className={`
                  flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${uploading || !selectedFile
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:shadow-lg hover:shadow-rose-200/50'
                  }
                `}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload Book'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default StudyScreen;