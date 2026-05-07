import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_number', '1'); // Default for now

    try {
      await api.post(`/projects/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchProject(); // Reload to see new document
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Upload fehlgeschlagen.');
    } finally {
      setUploading(false);
    }
  };

  if (!project) return <div className="p-8">Lade...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; Zurück zur Übersicht</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Ausgangssprache: {project.source_language} | Zielsprache: {project.target_language}</p>
        </div>
        <Link to={`/book/${project.id}`} target="_blank" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium">
          Leseansicht (Buch) öffnen
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Neue Datei hochladen</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Lade eine .txt oder .docx Datei hoch. Sie wird im Hintergrund analysiert und segmentiert.</p>
          </div>
          <form onSubmit={handleFileUpload} className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
              <input type="file" accept=".txt,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
            <button type="submit" disabled={!file || uploading} className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
              {uploading ? 'Verarbeite...' : 'Hochladen'}
            </button>
          </form>
        </div>
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-4">Dateien / Seiten</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {project.documents?.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">Noch keine Dateien hochgeladen.</li>
          )}
          {project.documents?.map((doc: any) => (
            <li key={doc.id}>
              <Link to={`/editor/${doc.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{doc.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Öffnen
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Hochgeladen am {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
