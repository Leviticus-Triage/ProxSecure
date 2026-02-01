import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker for Vite + react-pdf 10.x + pdfjs-dist 5.x
// Use unpkg with ESM path format for pdfjs-dist 5.x
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Interactive PDF Viewer Modal with zoom, pan, and page navigation.
 * @param {Object} props
 * @param {string} props.pdfUrl - URL or blob URL of the PDF to display
 * @param {string} props.title - Modal title
 * @param {function} props.onClose - Callback when modal is closed
 */
export default function PDFViewerModal({ pdfUrl, title = 'PDF Report', onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setError(err.message || 'Failed to load PDF');
    setLoading(false);
  }, []);

  const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(numPages || p, p + 1));

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const resetZoom = () => setScale(1.0);

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') goToPrevPage();
    if (e.key === 'ArrowRight') goToNextPage();
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
  }, [onClose, numPages]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className={`flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full m-0 rounded-none' : 'w-[90vw] h-[90vh] max-w-5xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-2">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded"
                title="Reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 3}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom in (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Page navigation */}
            {numPages && numPages > 1 && (
              <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-2">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous page (←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-600 min-w-[60px] text-center">
                  {pageNumber} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next page (→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-gray-200"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-red-100 text-gray-600 hover:text-red-600"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p className="font-medium">Failed to load PDF</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white"
            />
          </Document>
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
          Keyboard: <kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd> navigate pages •
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">+</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded">-</kbd> zoom •
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> close
        </div>
      </div>
    </div>
  );
}
