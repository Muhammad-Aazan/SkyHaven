// Skyhaven Utilities — Size, Date, Mime type & Extension formatters

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function formatFullDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'code' | 'other';

export function getFileCategory(mimeType: string, extension: string): FileCategory {
  const ext = extension.toLowerCase().replace('.', '');
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'webm', 'avi', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext)) {
    return 'archive';
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return 'spreadsheet';
  }
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(ext) || mime.includes('word') || mime.includes('document')) {
    return 'document';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php', 'sql', 'sh'].includes(ext)) {
    return 'code';
  }
  return 'other';
}

export function getFileColor(category: FileCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'image':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
    case 'pdf':
      return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    case 'video':
      return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
    case 'audio':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    case 'document':
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    case 'spreadsheet':
      return { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' };
    case 'code':
      return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' };
    case 'archive':
      return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  }
}
