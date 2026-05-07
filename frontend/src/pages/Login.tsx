import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerLanguage, setRegisterLanguage] = useState('en');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };

  const currentLang = i18n.language.startsWith('de') ? { code: 'de', name: 'Deutsch', flag: '🇩🇪' } : { code: 'en', name: 'English', flag: '🇬🇧' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { username, password, language: registerLanguage });
      }
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.detail) {
          setErrorMsg(error.response.data.detail);
      } else {
          setErrorMsg(t('error_generic'));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative" onClick={() => setIsLangOpen(false)}>
      {/* Language Switcher Dropdown */}
      <div className="absolute top-4 right-4 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2 text-lg">{currentLang.flag}</span>
              {currentLang.name}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {isLangOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <button
                  onClick={() => changeLanguage('de')}
                  className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${currentLang.code === 'de' ? 'bg-gray-50 font-bold' : ''}`}
                >
                  <span className="mr-2 text-lg">🇩🇪</span> Deutsch
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${currentLang.code === 'en' ? 'bg-gray-50 font-bold' : ''}`}
                >
                  <span className="mr-2 text-lg">🇬🇧</span> English
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? t('register_title') : t('login_title')}
          </h2>
        </div>
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errorMsg}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('username_placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${!isRegister ? 'rounded-b-md' : ''}`}
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isRegister && (
              <div>
                <select
                  value={registerLanguage}
                  onChange={(e) => setRegisterLanguage(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isRegister ? t('btn_register') : t('btn_login')}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-indigo-600 hover:text-indigo-500">
            {isRegister ? t('already_have_account') : t('no_account_yet')}
          </button>
        </div>
      </div>
    </div>
  );
}
