// The create / edit deal form, shown inside a bottom sheet.
// Numeric fields are kept as strings in state so the inputs can be empty;
// they're converted to numbers only when saving.
import { useEffect, useState } from 'react';
import type { Buyer, Deal, DealInput, DealStatus } from '../types';
import { formatINR, gajFromFeet, sqFtFromFeet, STATUS_LABELS, STATUS_ORDER } from '../format';
import BottomSheet from './BottomSheet';

interface Props {
  open: boolean;
  deal: Deal | null; // null = creating a new deal
  onClose: () => void;
  onSave: (data: DealInput) => Promise<void>;
  onDelete?: (deal: Deal) => Promise<void>;
}

// A buyer row while editing (offer kept as string for the input).
interface BuyerRow {
  name: string;
  phone: string;
  offer_amount: string;
  note: string;
}

const emptyBuyer = (): BuyerRow => ({ name: '', phone: '', offer_amount: '', note: '' });

function toNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Live "= ₹48 L" helper shown under a price input as the user types.
function PriceHint({ value }: { value: string }) {
  const n = toNum(value);
  if (n == null || n <= 0) return null;
  return <span className="field-hint">= {formatINR(n)}</span>;
}

export default function DealForm({ open, deal, onClose, onSave, onDelete }: Props) {
  const [plotNo, setPlotNo] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [gaj, setGaj] = useState('');
  // Tracks whether the user typed gaj by hand; if not, we auto-fill from W×L.
  const [gajManual, setGajManual] = useState(false);
  const [status, setStatus] = useState<DealStatus>('available');
  const [asking, setAsking] = useState('');
  const [expected, setExpected] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // When the sheet opens, load the deal's values (or reset for a new deal).
  useEffect(() => {
    if (!open) return;
    setError('');
    setSaving(false); // reset so a previous save doesn't leave it stuck on "Saving…"
    if (deal) {
      setPlotNo(deal.plot_no);
      setWidth(deal.width_ft != null ? String(deal.width_ft) : '');
      setLength(deal.length_ft != null ? String(deal.length_ft) : '');
      setGaj(deal.gaj != null ? String(deal.gaj) : '');
      setGajManual(true); // existing value — don't overwrite unless they change W/L
      setStatus(deal.status);
      setAsking(deal.asking_price != null ? String(deal.asking_price) : '');
      setExpected(deal.expected_price != null ? String(deal.expected_price) : '');
      setSellerName(deal.seller_name || '');
      setSellerPhone(deal.seller_phone || '');
      setNotes(deal.notes || '');
      setBuyers(
        (deal.buyers || []).map((b) => ({
          name: b.name,
          phone: b.phone || '',
          offer_amount: b.offer_amount != null ? String(b.offer_amount) : '',
          note: b.note || '',
        }))
      );
    } else {
      setPlotNo('');
      setWidth('');
      setLength('');
      setGaj('');
      setGajManual(false);
      setStatus('available');
      setAsking('');
      setExpected('');
      setSellerName('');
      setSellerPhone('');
      setNotes('');
      setBuyers([]);
    }
  }, [open, deal]);

  // Auto-calculate gaj from width × length unless the user typed it manually.
  useEffect(() => {
    if (gajManual) return;
    const w = toNum(width);
    const l = toNum(length);
    if (w && l) setGaj(String(gajFromFeet(w, l)));
    else setGaj('');
  }, [width, length, gajManual]);

  const w = toNum(width);
  const l = toNum(length);
  const sqft = w && l ? sqFtFromFeet(w, l) : 0;

  function updateBuyer(i: number, field: keyof BuyerRow, value: string) {
    setBuyers((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));
  }

  async function handleSave() {
    if (!plotNo.trim()) {
      setError('Plot no./reference is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const cleanedBuyers: Buyer[] = buyers
        .filter((b) => b.name.trim())
        .map((b) => ({
          name: b.name.trim(),
          phone: b.phone.trim() || null,
          offer_amount: toNum(b.offer_amount),
          note: b.note.trim() || null,
        }));

      const data: DealInput = {
        plot_no: plotNo.trim(),
        width_ft: toNum(width),
        length_ft: toNum(length),
        gaj: toNum(gaj),
        status,
        asking_price: toNum(asking),
        expected_price: toNum(expected),
        seller_name: sellerName.trim() || null,
        seller_phone: sellerPhone.trim() || null,
        notes: notes.trim() || null,
        buyers: cleanedBuyers,
      };
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deal || !onDelete) return;
    if (!confirm(`Delete plot "${deal.plot_no}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await onDelete(deal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      title={deal ? 'Edit Plot' : 'New Plot'}
      onClose={onClose}
      footer={
        <div className="form-actions">
          {deal && onDelete && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {error && <p className="form-error">{error}</p>}

      <label className="field">
        <span>Plot no. / reference *</span>
        <input value={plotNo} onChange={(e) => setPlotNo(e.target.value)} placeholder="e.g. Plot 12" />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Width (ft)</span>
          <input
            inputMode="decimal"
            value={width}
            onChange={(e) => {
              setWidth(e.target.value);
              setGajManual(false);
            }}
            placeholder="45"
          />
        </label>
        <label className="field">
          <span>Length (ft)</span>
          <input
            inputMode="decimal"
            value={length}
            onChange={(e) => {
              setLength(e.target.value);
              setGajManual(false);
            }}
            placeholder="50"
          />
        </label>
      </div>

      <label className="field">
        <span>
          Gaj {!gajManual && w && l ? '(auto-calculated — you can override)' : ''}
        </span>
        <input
          inputMode="decimal"
          value={gaj}
          onChange={(e) => {
            setGaj(e.target.value);
            setGajManual(true);
          }}
          placeholder="250"
        />
      </label>
      {sqft > 0 && <p className="hint">= {sqft.toLocaleString('en-IN')} sq ft total</p>}

      <label className="field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as DealStatus)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Asking price (₹)</span>
          <input
            inputMode="numeric"
            value={asking}
            onChange={(e) => setAsking(e.target.value)}
            placeholder="5200000"
          />
          <PriceHint value={asking} />
        </label>
        <label className="field">
          <span>Expected price (₹)</span>
          <input
            inputMode="numeric"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="5000000"
          />
          <PriceHint value={expected} />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Seller name</span>
          <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Name" />
        </label>
        <label className="field">
          <span>Seller phone</span>
          <input
            inputMode="tel"
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
            placeholder="98765 43210"
          />
        </label>
      </div>

      <div className="subsection">
        <div className="subsection-head">
          <h3>Interested buyers</h3>
          <button type="button" className="btn btn-small" onClick={() => setBuyers((p) => [...p, emptyBuyer()])}>
            + Add buyer
          </button>
        </div>

        {buyers.length === 0 && <p className="hint">No buyers added yet.</p>}

        {buyers.map((b, i) => (
          <div className="buyer-row" key={i}>
            <div className="buyer-row-head">
              <strong>Buyer {i + 1}</strong>
              <button
                type="button"
                className="icon-btn"
                aria-label="Remove buyer"
                onClick={() => setBuyers((p) => p.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Name</span>
                <input value={b.name} onChange={(e) => updateBuyer(i, 'name', e.target.value)} />
              </label>
              <label className="field">
                <span>Phone</span>
                <input inputMode="tel" value={b.phone} onChange={(e) => updateBuyer(i, 'phone', e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Offer amount (₹)</span>
              <input
                inputMode="numeric"
                value={b.offer_amount}
                onChange={(e) => updateBuyer(i, 'offer_amount', e.target.value)}
                placeholder="4800000"
              />
              <PriceHint value={b.offer_amount} />
            </label>
            <label className="field">
              <span>Note</span>
              <input value={b.note} onChange={(e) => updateBuyer(i, 'note', e.target.value)} placeholder="e.g. paying cash" />
            </label>
          </div>
        ))}
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering about this plot…"
        />
      </label>
    </BottomSheet>
  );
}
