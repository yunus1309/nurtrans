import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Admin() {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {t('Adminbereich', 'Adminbereich')}
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            {t('admin_welcome', 'Willkommen im Administrationsbereich. Hier können Sie Benutzer und Systemeinstellungen verwalten.')}
          </p>
        </div>
      </div>
    </div>
  );
}
