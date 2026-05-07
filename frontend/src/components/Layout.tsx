import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Globe, ChevronDown } from 'lucide-react';
import api from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('Loading...');
  const [role, setRole] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        setUsername(response.data.username);
        setRole(response.data.role);
        if (response.data.language && response.data.language !== i18n.language) {
            i18n.changeLanguage(response.data.language);
        }
      } catch (err) {
        console.error("Failed to fetch user, redirecting to login", err);
        navigate('/login');
      }
    };

    if (localStorage.getItem('access_token')) {
        fetchUser();
    } else {
        navigate('/login');
    }
  }, [navigate, i18n]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'de' : 'en';
    await i18n.changeLanguage(newLang);
    try {
        await api.put('/users/me/language', { language: newLang });
    } catch (e) {
        console.error("Failed to save language preference", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">TransEdit</span>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900">
                  {t('Projekte', 'Projekte')}
                </Link>
                <Link to="/glossary" target="_blank" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  {t('Glossar', 'Glossar')}
                </Link>
                {role === 'admin' && (
                  <Link to="/admin" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-indigo-500 hover:text-indigo-700 hover:border-indigo-300">
                    {t('Adminbereich', 'Adminbereich')}
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <span>{username}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => { toggleLanguage(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <Globe className="mr-3 h-4 w-4 text-gray-400" />
                        {i18n.language === 'en' ? 'Auf Deutsch wechseln' : 'Switch to English'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-gray-400" />
                        {t('Ausloggen', 'Ausloggen')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
