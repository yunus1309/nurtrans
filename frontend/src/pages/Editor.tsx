import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Virtuoso } from 'react-virtuoso';
import { Save, Check, Clock, AlertTriangle, MessageCircle } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const StatusIndicator = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <Check size={16} className="text-green-500" />;
    case 'review_needed': return <AlertTriangle size={16} className="text-purple-500" />;
    case 'in_progress': return <Clock size={16} className="text-orange-500" />;
    default: return <div className="w-4 h-4 rounded-full border-2 border-red-500" />;
  }
};

const SegmentRow = ({ segment, activeId, setActiveId, handleSaveSegment }: any) => {
  const isActive = activeId === segment.id;
  const initialContent = segment.target_text || '';

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // mark as in progress when typing starts
      if (segment.status === 'untouched' && editor.getHTML() !== '<p></p>') {
        segment.status = 'in_progress';
      }
    },
    editable: true,
  }, [segment.id]); // re-init on segment change is handled by Virtuoso if keys match

  // Handle shortcuts for THIS row when it's active
  useEffect(() => {
    if (!isActive || !editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            let html = editor.getHTML();

            // Basic QA: Remove empty paragraphs at start/end
            html = html.replace(/^(<p><\/p>)+/, '').replace(/(<p><\/p>)+$/, '');
            if (html === '') html = ''; // Clean completely empty

            handleSaveSegment(segment.id, html, 'completed');
            editor.commands.setContent(html); // update view with trimmed
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, editor, segment.id]);


  let borderClass = 'border-l-4 border-l-transparent border-b border-gray-100';
  if (isActive) {
    borderClass = 'border-l-4 border-l-blue-500 border-t border-b border-blue-200 bg-blue-50 shadow-sm z-10 relative';
  } else {
     switch (segment.status) {
        case 'completed': borderClass = 'border-l-4 border-l-green-500 border-b border-gray-100 bg-white'; break;
        case 'review_needed': borderClass = 'border-l-4 border-l-purple-500 border-b border-gray-100 bg-purple-50/30'; break;
        case 'in_progress': borderClass = 'border-l-4 border-l-orange-500 border-b border-gray-100 bg-white'; break;
        case 'untouched': borderClass = 'border-l-4 border-l-red-500 border-b border-gray-100 bg-white'; break;
     }
  }

  return (
    <div
      className={`flex w-full cursor-text transition-colors duration-150 ${borderClass}`}
      onClick={() => {
          setActiveId(segment.id);
          editor?.commands.focus();
      }}
    >
      <div className="w-12 flex-shrink-0 flex items-center justify-center border-r border-gray-200 bg-gray-50 text-xs text-gray-400 font-mono">
        {segment.order + 1}
      </div>
      <div className="flex-1 flex flex-col sm:flex-row">
        <div className="flex-1 p-3 border-b sm:border-b-0 sm:border-r border-gray-200 text-gray-800 dir-auto" dir="auto" dangerouslySetInnerHTML={{__html: segment.source_text}}>
        </div>
        <div className="flex-1 p-3 flex flex-col justify-center bg-white min-h-[60px]">
           <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none min-h-[1.5rem]" dir="auto" />
        </div>
      </div>
      <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center border-l border-gray-200 bg-gray-50 space-y-3 py-2">
        <StatusIndicator status={segment.status} />
        <button className="text-gray-400 hover:text-indigo-500" title="Kommentare">
          <MessageCircle size={14} />
        </button>
      </div>
    </div>
  );
};

export default function Editor() {
  const { documentId } = useParams();
  const [segments, setSegments] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const virtuosoRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSegments();
  }, [documentId]);

  const fetchSegments = async () => {
    try {
      const response = await api.get(`/documents/${documentId}/segments`);
      setSegments(response.data);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSegment = async (id: number, target_text: string, status: string) => {
    try {
      const res = await api.put(`/segments/${id}`, { target_text, status });

      // Update local state
      setSegments(prev => prev.map(s => s.id === id ? { ...s, target_text: res.data.target_text, status: res.data.status } : s));

      // Move to next
      const currentIndex = segments.findIndex(s => s.id === id);
      if (currentIndex !== -1 && currentIndex < segments.length - 1) {
        const nextId = segments[currentIndex + 1].id;
        setActiveId(nextId);
        // Slight delay to allow virtuoso to scroll
        setTimeout(() => {
           virtuosoRef.current?.scrollIntoView({ index: currentIndex + 1, behavior: 'smooth', block: 'center' });
        }, 50);
      } else {
        setActiveId(null);
      }
    } catch (error) {
      console.error('Error saving segment:', error);
      alert("Fehler beim Speichern!");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade Dokument...</div>;
  if (segments.length === 0) return <div className="p-8 text-center text-gray-500">Dieses Dokument hat noch keine Segmente (vielleicht läuft die Verarbeitung noch im Hintergrund). Laden Sie die Seite neu.</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex-shrink-0 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4">
         <div className="flex space-x-4 items-center">
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">&larr; Zurück</Link>
            <div className="h-4 w-px bg-gray-300"></div>
            <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded flex items-center text-xs" title="Speichern (Strg+Enter)"><Save size={16} className="mr-1"/> Speichern</button>
         </div>
         <div className="flex space-x-4 text-sm text-gray-500">
             <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1"/> Unbearbeitet</span>
             <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-1"/> In Arbeit</span>
             <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-500 mr-1"/> Review</span>
             <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1"/> Fertig</span>
         </div>
      </div>

      {/* Grid Header */}
      <div className="flex flex-shrink-0 bg-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-600 shadow-sm z-10">
        <div className="w-12 text-center py-2 border-r border-gray-200">#</div>
        <div className="flex-1 py-2 px-4 border-r border-gray-200">Ausgangstext (Source)</div>
        <div className="flex-1 py-2 px-4">Übersetzung (Target)</div>
        <div className="w-10 text-center py-2 border-l border-gray-200"></div>
      </div>

      {/* Virtualized Grid Body */}
      <div className="flex-1 bg-gray-50 overflow-hidden relative">
        <Virtuoso
          ref={virtuosoRef}
          data={segments}
          className="h-full w-full absolute inset-0"
          itemContent={(_, segment) => (
            <SegmentRow
              key={segment.id}
              segment={segment}
              activeId={activeId}
              setActiveId={setActiveId}
              handleSaveSegment={handleSaveSegment}
            />
          )}
        />
      </div>
    </div>
  );
}
