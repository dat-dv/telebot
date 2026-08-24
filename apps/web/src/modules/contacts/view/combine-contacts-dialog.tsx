'use client';

import { useState, useEffect, useId } from 'react';
import type { IContactListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useCombineContactsMutation } from '../api/contacts-query';

interface CombineContactsDialogProps {
  isOpen: boolean;
  selectedContacts: IContactListItem[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function CombineContactsDialog({
  isOpen,
  selectedContacts,
  onClose,
  onSuccess,
}: CombineContactsDialogProps) {
  const { t } = useLocale();
  const combineMutation = useCombineContactsMutation();

  const titleId = useId();
  const descId = useId();

  const [targetId, setTargetId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [descriptor, setDescriptor] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form whenever dialog opens or selected contacts change
  useEffect(() => {
    if (!isOpen || selectedContacts.length === 0) return;

    const first = selectedContacts[0];
    const initialTargetId = first.id;
    setTargetId(initialTargetId);
    setDisplayName(first.displayName);
    setAlias(first.alias || '');

    // Combine descriptors from all selected contacts if available
    const combinedDescriptors = Array.from(
      new Set(
        selectedContacts.map((c) => c.descriptor?.trim()).filter((d): d is string => Boolean(d)),
      ),
    ).join(' | ');

    setDescriptor(combinedDescriptors || first.descriptor || '');
    setErrorMessage(null);
  }, [isOpen, selectedContacts]);

  // When user switches target contact in dropdown
  const handleTargetChange = (newTargetId: string) => {
    setTargetId(newTargetId);
    const target = selectedContacts.find((c) => c.id === newTargetId);
    if (target) {
      setDisplayName(target.displayName);
      if (target.alias && !alias) {
        setAlias(target.alias);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !combineMutation.isPending) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combineMutation.isPending, onClose]);

  if (!isOpen || selectedContacts.length < 2) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMessage(t('contacts.placeholder.name'));
      return;
    }

    const sourceContactIds = selectedContacts.map((c) => c.id).filter((id) => id !== targetId);

    try {
      setErrorMessage(null);
      await combineMutation.mutateAsync({
        targetContactId: targetId,
        sourceContactIds,
        displayName: trimmedName,
        alias: alias.trim() || undefined,
        descriptor: descriptor.trim() || undefined,
      });
      onSuccess(selectedContacts.length);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('dashboard.error.title'));
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-dialog modal-dialog--md"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <header className="modal-header">
          <div>
            <h3 id={titleId} className="modal-title">
              {t('contacts.combineModal.title')}
            </h3>
            <p id={descId} className="modal-subtitle">
              {t('contacts.combineModal.desc')}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={combineMutation.isPending}
            aria-label={t('common.close')}
          >
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div className="inline-alert inline-alert--error" role="alert">
                <strong>{errorMessage}</strong>
              </div>
            )}

            <div className="modal-field">
              <label htmlFor="combine-target-select" className="modal-label">
                {t('contacts.combineModal.targetLabel')}
              </label>
              <select
                id="combine-target-select"
                className="modal-select"
                value={targetId}
                onChange={(e) => handleTargetChange(e.target.value)}
                disabled={combineMutation.isPending}
              >
                {selectedContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.displayName}
                    {contact.alias ? ` (${contact.alias})` : ''}
                    {contact.descriptor ? ` · ${contact.descriptor}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="combine-name-input" className="modal-label">
                {t('contacts.combineModal.mergedName')} <span className="text-danger">*</span>
              </label>
              <input
                id="combine-name-input"
                type="text"
                className="modal-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('contacts.placeholder.name')}
                disabled={combineMutation.isPending}
                required
              />
            </div>

            <div className="modal-field">
              <label htmlFor="combine-alias-input" className="modal-label">
                {t('contacts.combineModal.mergedAlias')}
              </label>
              <input
                id="combine-alias-input"
                type="text"
                className="modal-input"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={t('contacts.placeholder.alias')}
                disabled={combineMutation.isPending}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="combine-desc-input" className="modal-label">
                {t('contacts.combineModal.mergedDescriptor')}
              </label>
              <textarea
                id="combine-desc-input"
                className="modal-textarea"
                rows={2}
                value={descriptor}
                onChange={(e) => setDescriptor(e.target.value)}
                placeholder={t('contacts.placeholder.descriptor')}
                disabled={combineMutation.isPending}
              />
            </div>

            <div className="modal-warning">
              <span className="modal-warning__icon" aria-hidden="true">
                ⚠️
              </span>
              <p className="modal-warning__text">{t('contacts.combineModal.warning')}</p>
            </div>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={combineMutation.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={combineMutation.isPending || !displayName.trim()}
            >
              {combineMutation.isPending
                ? t('common.loadingDashboard')
                : t('contacts.combineModal.confirm')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
