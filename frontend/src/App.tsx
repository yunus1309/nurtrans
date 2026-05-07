import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Editor from './pages/Editor';
import Glossary from './pages/Glossary';
import BookView from './pages/BookView';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="project/:projectId" element={<ProjectDetails />} />
          <Route path="editor/:documentId" element={<Editor />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="book/:projectId" element={<BookView />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
