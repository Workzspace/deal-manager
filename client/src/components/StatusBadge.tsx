// Small coloured pill that shows a deal's status.
import type { DealStatus } from '../types';
import { STATUS_LABELS } from '../format';

export default function StatusBadge({ status }: { status: DealStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}
