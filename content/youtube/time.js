// Time parsing / formatting utilities
function parseYouTubeTime(str){
  const parts = str.split(':').map(p=>p.trim()).filter(Boolean);
  if (!parts.length) return 0;
  if (parts.length === 3) return (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]);
  if (parts.length === 2) return (+parts[0])*60 + (+parts[1]);
  return +parts[0];
}
function formatDuration(totalSeconds){
  if (totalSeconds == null) return '…';
  const h = Math.floor(totalSeconds/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = totalSeconds%60;
  if (h>0) return `${h}h ${m}m ${s}s`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
}
