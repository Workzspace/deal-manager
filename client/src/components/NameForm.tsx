// A tiny bottom-sheet form with a single text field — reused for creating and
// editing city names and area names.
import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';

interface Props {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
}

export default function NameForm({
  open,
  title,
  label,
  initialValue = '',
  onClose,
  onSave,
  onDelete,
  deleteLabel,
}: Props) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialValue);
      setError('');
    }
  }, [open, initialValue]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setBusy(true);
    try {
      await onSave(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(`${deleteLabel || 'Delete this item'}? This also deletes everything inside it.`)) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="form-actions">
          {onDelete && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {error && <p className="form-error">{error}</p>}
      <label className="field">
        <span>{label}</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </label>
    </BottomSheet>
  );
}
