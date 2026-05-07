import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "login_title": "Login",
      "register_title": "Create an Account",
      "username_placeholder": "Username",
      "password_placeholder": "Password",
      "btn_login": "Sign in",
      "btn_register": "Register",
      "already_have_account": "Already have an account? Sign in here.",
      "no_account_yet": "Don't have an account yet? Register here.",
      "error_generic": "An unexpected error occurred. Please try again later."
    }
  },
  de: {
    translation: {
      "login_title": "Anmelden",
      "register_title": "Account erstellen",
      "username_placeholder": "Benutzername",
      "password_placeholder": "Passwort",
      "btn_login": "Anmelden",
      "btn_register": "Registrieren",
      "already_have_account": "Bereits einen Account? Hier anmelden.",
      "no_account_yet": "Noch kein Account? Hier registrieren.",
      "error_generic": "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später noch einmal."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // if detection fails
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
