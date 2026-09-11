import { useState, useEffect } from "react";
// configuring pdf.js
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
} from "lucide-react";

import {
  updateProgress,
  updateLastOpened,
} from "../../api/bookApi";

function BookReader({ book, onBack }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(
    book?.current_page || 1
  );
  const [scale, setScale] = useState(0.9);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  function onDocumentLoadSuccess({ numPages }) {
    console.log("PDF loaded");
    console.log("Total pages:", numPages);
    setNumPages(numPages);
  }

  // pdf navigation 
  const previousPage = async () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      await updateProgress(newPage);
    }
  };

  const nextPage = async () => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      await updateProgress(book.id, newPage);
    }
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    if (scale > 0.6) {
      setScale(scale - 0.2);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    updateLastOpened(book.id);
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  const progress = numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40'
    }`}>
      
      {/* Decorative warm elements - only in light mode */}
      {!isDarkMode && (
        <>
          <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
          <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />
        </>
      )}

      {/* Header */}
      <header className={`h-16 border-b flex items-center justify-between px-6 shadow-sm transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white/80 backdrop-blur-sm border-rose-200/30'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-rose-50 text-rose-600'
            }`}
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-slate-700' 
                : 'bg-gradient-to-br from-rose-100 to-amber-100'
            }`}>
              <BookOpen className={`w-5 h-5 ${
                isDarkMode ? 'text-slate-300' : 'text-rose-600'
              }`} />
            </div>
            <div>
              <h1 className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-slate-100' : 'text-slate-800'
              }`}>
                {book?.title}
              </h1>
              <p className={`text-xs flex items-center gap-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Study Reader
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress indicator */}
          {numPages > 0 && (
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className={`w-24 h-1.5 rounded-full ${
                isDarkMode ? 'bg-slate-700' : 'bg-rose-100'
              }`}>
                <div 
                  className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-rose-600'
              }`}>
                {progress}%
              </span>
            </div>
          )}

          <button
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-rose-50 text-rose-600'
            }`}
          >
            <Search size={20} />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-rose-50 text-rose-600'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-rose-50 text-rose-600'
            }`}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <button className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'hover:bg-slate-700 text-slate-300' 
              : 'hover:bg-rose-50 text-rose-600'
          }`}>
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Reader */}
      <main className={`flex-1 flex items-center justify-center p-6 overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900' : ''
      }`}>
        <div className={`relative overflow-auto rounded-2xl shadow-2xl border w-full max-w-5xl h-full flex items-center justify-center transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white/80 backdrop-blur-sm border-rose-200/30 shadow-rose-200/20'
        }`}>
          <Document
            file={book.signed_url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center p-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                </div>
                <p className={`mt-4 font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-rose-600'
                }`}>
                  Loading PDF...
                </p>
              </div>
            }
            className="flex items-center justify-center w-full h-full p-4"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg rounded-lg"
              loading={
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                  <p className={`mt-3 text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-amber-600'
                  }`}>
                    Loading page...
                  </p>
                </div>
              }
            />
          </Document>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-50 h-20 border-t flex items-center justify-center transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white/80 backdrop-blur-sm border-rose-200/30'
      }`}>
        <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center px-4">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              pageNumber <= 1
                ? isDarkMode 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:scale-[1.02]'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 hover:scale-[1.02]'
            }`}
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className={`font-medium flex items-center gap-3 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <span>Page</span>
            <span className={`px-3 py-1 rounded-lg font-bold ${
              isDarkMode 
                ? 'bg-slate-700 text-slate-100' 
                : 'bg-rose-50 text-rose-600'
            }`}>
              {pageNumber}
            </span>
            <span>of</span>
            <span className="font-bold">{numPages || '...'}</span>
          </div>

          <button
            onClick={() => {
              alert("Next button clicked");
              nextPage();
            }}
            disabled={pageNumber >= numPages}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              pageNumber >= numPages
                ? isDarkMode 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02]'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.6}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                scale <= 0.6
                  ? isDarkMode 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'hover:bg-slate-700 text-slate-300 hover:scale-105'
                    : 'hover:bg-rose-50 text-rose-600 hover:scale-105'
              }`}
            >
              <ZoomOut size={18} />
            </button>

            <span className={`text-sm font-medium min-w-[60px] text-center ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'hover:bg-slate-700 text-slate-300 hover:scale-105'
                  : 'hover:bg-rose-50 text-rose-600 hover:scale-105'
              }`}
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BookReader;