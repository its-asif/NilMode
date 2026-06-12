// Inject stylesheet for playlist buttons & boxes (idempotent)
function ensurePlaylistButtonStyles(){
  if (document.getElementById('ndx-playlist-style')) return;
  const style = document.createElement('style');
  style.id = 'ndx-playlist-style';
  style.textContent = `
    .ndx-yt-course-btn {
      box-sizing: border-box;
      width: 100%;
      max-width: 320px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #4f46e5 100%);
      background-size: 200% auto;
      color: #fff !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      padding: 12px 18px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      text-decoration: none !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: .4px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 14px 0 8px;
      position: relative;
    }
    .ndx-yt-course-btn:hover {
      background-position: right center;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      transform: translateY(-1px);
    }
    .ndx-yt-course-btn:active {
      transform: translateY(1px);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    @media (max-width:700px){ .ndx-yt-course-btn { max-width:100%; } }

    .ndx-yt-course-box {
      box-sizing: border-box;
      max-width: 440px;
      width: 100%;
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #f8fafc;
      margin: 16px 0 12px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .ndx-yt-course-box:hover {
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 12px 30px -5px rgba(0,0,0,0.6), 0 0 15px rgba(99, 102, 241, 0.15);
    }
    .ndx-yt-course-box:before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.3));
      -webkit-mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    .ndx-yt-badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .ndx-yt-badge {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      color: #e2e8f0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    }

    .ndx-yt-progress-section {
      margin-bottom: 16px;
      width: 100%;
    }
    .ndx-yt-progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12.5px;
      font-weight: 500;
      color: #cbd5e1;
    }
    .ndx-yt-completed-text {
      font-size: 12.5px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .ndx-yt-pct-text {
      color: #38bdf8;
      font-weight: 700;
    }

    .ndx-yt-progress {
      position: relative;
      width: 100%;
      height: 10px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 999px;
      overflow: hidden;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
    }
    .ndx-yt-progress-bar {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #06b6d4 100%);
      border-radius: 999px;
      width: 0%;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
    }

    .ndx-yt-course-actions {
      display: flex;
      gap: 8px;
    }
    .ndx-yt-course-actions button {
      background: rgba(30, 41, 59, 0.8);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .ndx-yt-course-actions button:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }
    .ndx-yt-course-actions button.ndx-yt-course-delete:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }

    .ndx-yt-course-box-watch {
      position: relative;
      box-sizing: border-box;
      display: block;
      width: 100%;
      max-width: 100%;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
      margin: 12px 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }
    .ndx-yt-course-box-watch-row1, .ndx-yt-course-box-watch-row2 {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      align-items: center;
      margin: 0 0 6px;
    }
    .ndx-yt-course-box-watch-row2 {
      margin: 4px 0 0;
    }
    .ndx-yt-mini-block {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
    .ndx-yt-mini-label {
      font-size: 9px;
      opacity: .8;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.05);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .ndx-yt-progress-barline {
      height: 8px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
      margin: 8px 0;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
    }
    .ndx-yt-progress-barline .ndx-yt-progress-bar {
      background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
      box-shadow: 0 0 6px rgba(99, 102, 241, 0.5);
    }
    .ndx-yt-course-box-watch-actions-corner {
      position: absolute;
      top: 10px;
      right: 12px;
      display: flex;
      gap: 6px;
    }
    .ndx-yt-icon-btn {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 11px;
      cursor: pointer;
      line-height: 1;
      transition: all 0.2s ease;
    }
    .ndx-yt-icon-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }
    .ndx-yt-icon-btn.ndx-yt-course-delete-watch:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    .ndx-yt-progress-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      opacity: .9;
      font-weight: 500;
      margin-right: 60px;
    }
    .ndx-yt-progress-summary {
      text-align: left;
      font-size: 11.5px;
      opacity: .9;
      font-weight: 500;
      color: #94a3b8;
    }

    /* Progress checkbox styling */
    .ndx-course-check-host {
      display: flex;
      align-items: center;
      margin: 0 8px 0 4px;
    }
    .ndx-course-check {
      appearance: none;
      -webkit-appearance: none;
      outline: none;
      cursor: pointer;
      width: 22px;
      height: 22px;
      border: 2px solid #475569;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: rgba(30, 41, 59, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    .ndx-course-check:hover {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
    }
    .ndx-course-check:focus-visible {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }
    .ndx-course-check:before {
      content: '';
      width: 5px;
      height: 9px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) scale(0);
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.35);
      margin-bottom: 2px;
    }
    .ndx-course-check:checked {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    }
    .ndx-course-check:checked:before {
      transform: rotate(45deg) scale(1);
    }
    .ndx-course-check:active {
      transform: scale(0.9);
    }

    /* Support for new YouTube yt-lockup-view-model structure */
    yt-lockup-metadata-view-model:has(.ndx-course-check-host) {
      padding-right: 64px !important;
    }
    div.ytLockupMetadataViewModelMenuButton.ndx-course-menu-aug {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      width: auto !important;
      min-width: 56px !important;
    }
  `;
  document.documentElement.appendChild(style);
}
