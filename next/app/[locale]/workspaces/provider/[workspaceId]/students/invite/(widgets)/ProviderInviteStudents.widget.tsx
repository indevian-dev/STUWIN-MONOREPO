'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PiEnvelope, PiPlus, PiTrash } from 'react-icons/pi';
import { toast } from 'react-toastify';

interface ProviderInviteStudentsWidgetProps {
  onInvite: (invitationData: any) => void;
  onCancel: () => void;
  sending: boolean;
}

interface InvitationEmail {
  id: string;
  email: string;
  name?: string;
}

export function ProviderInviteStudentsWidget({
  onInvite,
  onCancel,
  sending
}: ProviderInviteStudentsWidgetProps) {
  const t = useTranslations('ProviderStudents');
  const [emails, setEmails] = useState<InvitationEmail[]>([
    { id: '1', email: '', name: '' }
  ]);
  const [bulkEmails, setBulkEmails] = useState('');
  const [invitationMessage, setInvitationMessage] = useState(
    t('default_invitation_message')
  );
  const [useBulkMode, setUseBulkMode] = useState(false);

  const addEmailField = () => {
    const newEmail: InvitationEmail = {
      id: Date.now().toString(),
      email: '',
      name: ''
    };
    setEmails([...emails, newEmail]);
  };

  const removeEmailField = (id: string) => {
    if (emails.length > 1) {
      setEmails(emails.filter(email => email.id !== id));
    }
  };

  const updateEmail = (id: string, field: 'email' | 'name', value: string) => {
    setEmails(emails.map(email =>
      email.id === id ? { ...email, [field]: value } : email
    ));
  };

  const parseBulkEmails = () => {
    const emailList = bulkEmails
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Try to extract name and email from format like "Name <email@example.com>"
        const match = line.match(/^(.+?)\s*<(.+)>$/);
        if (match) {
          return {
            id: Date.now().toString() + Math.random(),
            email: match[2],
            name: match[1].trim()
          };
        }
        return {
          id: Date.now().toString() + Math.random(),
          email: line,
          name: ''
        };
      })
      .filter(item => item.email.includes('@'));

    if (emailList.length > 0) {
      setEmails(emailList);
      setUseBulkMode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validEmails = useBulkMode ? [] : emails.filter(email => email.email.trim() !== '');

    if (validEmails.length === 0 && !useBulkMode) {
      toast.error(t('at_least_one_email_required'));
      return;
    }

    const invitationData = {
      emails: useBulkMode ? bulkEmails : validEmails,
      message: invitationMessage,
      useBulkMode
    };

    onInvite(invitationData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-app shadow-sm border border-neutral-200 p-6">
        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!useBulkMode}
                onChange={() => setUseBulkMode(false)}
                className="text-app-bright-green focus:ring-app"
              />
              <span className="text-sm font-medium">{t('individual_emails')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={useBulkMode}
                onChange={() => setUseBulkMode(true)}
                className="text-app-bright-green focus:ring-app"
              />
              <span className="text-sm font-medium">{t('bulk_emails')}</span>
            </label>
          </div>
        </div>

        {/* Individual Email Fields */}
        {!useBulkMode && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-app-dark-blue dark:text-white">{t('student_emails')}</h3>
            {emails.map((email, index) => (
              <div key={email.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('email')} {index + 1}
                  </label>
                  <input
                    type="email"
                    value={email.email}
                    onChange={(e) => updateEmail(email.id, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-app focus:outline-none focus:ring-2 focus:ring-app focus:border-transparent"
                    placeholder="student@example.com"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('name_optional')}
                  </label>
                  <input
                    type="text"
                    value={email.name}
                    onChange={(e) => updateEmail(email.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-app focus:outline-none focus:ring-2 focus:ring-app focus:border-transparent"
                    placeholder={t('student_name')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEmailField(email.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-app transition-colors"
                  disabled={emails.length === 1}
                >
                  <PiTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEmailField}
              className="flex items-center gap-2 px-4 py-2 text-app-bright-green hover:bg-app-bright-green/10 rounded-app transition-colors"
            >
              <PiPlus className="w-4 h-4" />
              {t('add_another_email')}
            </button>
          </div>
        )}

        {/* Bulk Email Input */}
        {useBulkMode && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-app-dark-blue dark:text-white mb-4">{t('bulk_email_input')}</h3>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-neutral-300 rounded-app focus:outline-none focus:ring-2 focus:ring-app focus:border-transparent"
              placeholder={t('bulk_email_placeholder')}
            />
            <p className="text-sm text-neutral-600 mt-2">
              {t('bulk_email_help')}
            </p>
            <button
              type="button"
              onClick={parseBulkEmails}
              className="mt-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-app hover:bg-neutral-200 transition-colors"
            >
              {t('parse_emails')}
            </button>
          </div>
        )}

        {/* Invitation Message */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-app-dark-blue dark:text-white mb-4">{t('invitation_message')}</h3>
          <textarea
            value={invitationMessage}
            onChange={(e) => setInvitationMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-app focus:outline-none focus:ring-2 focus:ring-app focus:border-transparent"
            placeholder={t('invitation_message_placeholder')}
          />
          <p className="text-sm text-neutral-600 mt-2">
            {t('invitation_message_help')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-neutral-300 rounded-app text-neutral-700 hover:bg-neutral-50 transition-colors"
            disabled={sending}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-app hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={sending}
          >
            {sending ? t('sending_invitations') : t('send_invitations')}
          </button>
        </div>
      </div>
    </form>
  );
}




