// Inject stylesheet for playlist buttons & boxes (idempotent)
function ensurePlaylistButtonStyles(){
  if (document.getElementById('ndx-playlist-style')) return;
  const style = document.createElement('style');
  style.id = 'ndx-playlist-style';
  style.textContent = `
    .ndx-yt-course-btn { box-sizing:border-box;width:100%;max-width:340px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff !important;font-family:system-ui,Arial,sans-serif;font-size:14px;font-weight:600;text-align:center;padding:10px 14px;border-radius:8px;border:1px solid #1e40af;cursor:pointer;text-decoration:none !important;display:inline-block;letter-spacing:.3px;transition:background .18s ease,transform .15s ease,box-shadow .18s ease;margin:10px 0 4px;position:relative;}
    .ndx-yt-course-btn:hover { background:linear-gradient(135deg,#1d4ed8,#1e3a8a);box-shadow:0 4px 10px -2px rgba(0,0,0,.25); }
    .ndx-yt-course-btn:active { transform:translateY(1px); }
    @media (max-width:700px){ .ndx-yt-course-btn { max-width:100%; } }
  .ndx-yt-course-box {box-sizing:border-box;max-width:440px;width:100%;background:linear-gradient(145deg,#0f172a 0%,#13233b 100%);color:#f1f5f9;margin:14px 0 10px;padding:18px 20px 16px;border:1px solid #1e293b;border-radius:14px;font-family:system-ui,Arial,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 6px 18px -6px rgba(0,0,0,.45),0 2px 4px -1px rgba(0,0,0,.4);position:relative;overflow:hidden;}
  .ndx-yt-course-box:before {content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(120deg,rgba(56,189,248,.25),rgba(99,102,241,.2),rgba(168,85,247,.25));-webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.85;filter:saturate(115%);pointer-events:none;}    
  .ndx-yt-course-box-row[data-role=counts] {font-weight:600;font-size:14px;letter-spacing:.3px;}
  .ndx-yt-course-box-row[data-role=duration] {font-size:13px;opacity:.9;}
    .ndx-yt-course-box-row {margin:2px 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .ndx-yt-course-actions button {background:#1e40af;color:#fff;border:1px solid #1d4ed8;border-radius:5px;padding:4px 10px;font-size:12px;cursor:pointer;}
    .ndx-yt-course-actions button:hover {background:#1d4ed8;}
  .ndx-yt-progress {position:relative;flex:1;height:14px;background:linear-gradient(180deg,#1e293b,#142132);border-radius:8px;overflow:hidden;min-width:160px;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.04),0 1px 2px rgba(0,0,0,.6);margin-bottom:4px;}    
  .ndx-yt-progress-bar {position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#0891b2,#2563eb 35%,#6366f1 70%,#8b5cf6 100%);width:0%;transition:width .45s cubic-bezier(.4,.14,.3,1);box-shadow:0 0 0 1px rgba(0,0,0,.25),0 0 10px -2px rgba(99,102,241,.65);}    
  .ndx-yt-completed-text {font-size:12px;font-weight:600;letter-spacing:.25px;}
    .ndx-yt-course-box-watch {position:relative;box-sizing:border-box;display:block;width:100%;max-width:100%;background:#0f172a;color:#f1f5f9;border:1px solid #1e293b;border-radius:10px;padding:10px 12px;margin:10px 0;font-family:system-ui,Arial,sans-serif;font-size:12px;line-height:1.25;}
    .ndx-yt-course-box-watch-row1,.ndx-yt-course-box-watch-row2 {display:flex;flex-wrap:wrap;gap:18px 28px;align-items:center;margin:0 0 4px;}
    .ndx-yt-course-box-watch-row2 {margin:2px 0 0;}
    .ndx-yt-mini-block {display:flex;align-items:center;gap:4px;font-weight:500;}
    .ndx-yt-mini-label {font-size:10px;opacity:.65;background:#1e293b;padding:2px 4px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px;}
    .ndx-yt-progress-barline {height:8px;background:#1e293b;border-radius:5px;overflow:hidden;position:relative;margin:5px 0;}
    .ndx-yt-course-box-watch-actions-corner {position:absolute;bottom:6px;right:6px;display:flex;gap:4px;}
    .ndx-yt-icon-btn {background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:4px 6px;font-size:11px;cursor:pointer;line-height:1;}
    .ndx-yt-icon-btn:hover {background:#334155;}
  /* Enhanced progress layout */
  .ndx-yt-course-box-row[data-role=progress]{gap:8px;}
  .ndx-yt-completed-text{font-weight:500;font-size:12px;min-width:90px;}
  .ndx-yt-progress-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;opacity:.85;font-weight:500;gap:8px;}
  .ndx-yt-progress-meta span{white-space:nowrap;}
  .ndx-yt-progress-summary{text-align:center;font-size:11px;margin-top:4px;opacity:.9;font-weight:500;}
    /* Progress checkbox styling */
  .ndx-course-check-host {display:flex;align-items:center;margin:0 4px 0 2px;}
  .ndx-course-check {appearance:none;-webkit-appearance:none;outline:none;cursor:pointer;width:20px;height:20px;padding:10px;border:2px solid #334155;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,0.15),rgba(255,255,255,0));transition:border-color .25s, background .35s, box-shadow .25s;}
  .ndx-course-check:hover {border-color:#475569;box-shadow:0 0 0 3px rgba(148,163,184,.15);}    
  .ndx-course-check:focus-visible {box-shadow:0 0 0 3px rgba(37,99,235,.55);}
  .ndx-course-check:before {content:'';width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#6366f1 60%,#8b5cf6);transform:scale(0);transition:transform .32s cubic-bezier(.65,.05,.36,1);}    
  .ndx-course-check:checked:before {transform:scale(1);}    
  .ndx-course-check:checked {border-color:#6366f1;background:linear-gradient(135deg,#1e3a8a,#312e81);}    
  .ndx-course-check:active {transform:scale(.9);}    
  `;
  document.documentElement.appendChild(style);
}
