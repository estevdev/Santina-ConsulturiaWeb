import { VideoProvider } from '@/types/capacitacion';

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  isDirectVideo: boolean;
}

export function parseVideoUrl(url: string): ParsedVideo {
  if (!url || typeof url !== 'string') {
    return { provider: 'direct', embedUrl: null, thumbnailUrl: null, isDirectVideo: false };
  }

  const trimmed = url.trim();

  // YouTube
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      isDirectVideo: false,
    };
  }

  // Vimeo
  // Matches: vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: null,
      isDirectVideo: false,
    };
  }

  // Google Drive
  // Matches: drive.google.com/file/d/FILE_ID/view... or open?id=FILE_ID
  const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return {
      provider: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnailUrl: null,
      isDirectVideo: false,
    };
  }

  // Loom
  // Matches: loom.com/share/ID
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    const loomId = loomMatch[1];
    return {
      provider: 'loom',
      embedUrl: `https://www.loom.com/embed/${loomId}`,
      thumbnailUrl: null,
      isDirectVideo: false,
    };
  }

  // Direct video file (MP4, WebM, Ogg, MOV) or Supabase storage URL
  const isDirect =
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed) ||
    trimmed.includes('/storage/v1/object/public/');

  return {
    provider: isDirect ? 'direct' : 'external',
    embedUrl: trimmed,
    thumbnailUrl: null,
    isDirectVideo: isDirect,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export function getFileIconBadge(fileName: string): { label: string; color: string } {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return { label: 'PDF', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    case 'doc':
    case 'docx':
      return { label: 'WORD', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { label: 'EXCEL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'ppt':
    case 'pptx':
      return { label: 'PPT', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'zip':
    case 'rar':
    case '7z':
      return { label: 'ZIP', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return { label: 'IMG', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    default:
      return { label: ext.toUpperCase() || 'FILE', color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600' };
  }
}
