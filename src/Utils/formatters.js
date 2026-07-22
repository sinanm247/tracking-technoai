export function formatPoDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export function formatRelativeActivityTime(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return diffMin === 1 ? '1 min ago' : `${diffMin} min ago`;

  const startOfDay = (value) => {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (dayDiff === 1) return 'Yesterday';

  if (dayDiff < 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'long' });
  }

  return formatPoDate(dateString);
}

export function formatLineCount(count) {
  return String(count).padStart(2, '0');
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function toIsoDate(value) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function calculatePoStatusPercent(items = [], poStatus) {
  if (!items.length) return poStatus === 'Closed' ? 100 : 0;

  const deliveredCount = items.filter((item) => item.status === 'Delivered').length;
  return Math.round((deliveredCount / items.length) * 100);
}

export function mapPublicTrackOrder(data) {
  const items = (data.items || []).map((item) => ({
    lineNo: item.lineNumber,
    description: item.description,
    quantity: item.quantity,
    status: item.status,
    eta: item.eta,
  }));

  return {
    poNumber: data.poNumber,
    poStatus: data.poStatus,
    poStatusPercent: calculatePoStatusPercent(data.items, data.poStatus),
    poClosingDate: data.poClosingDate,
    numberOfLines: data.numberOfLines,
    items,
  };
}
