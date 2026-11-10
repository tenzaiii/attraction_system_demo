(function () {
    'use strict';
  
    const $ = (id) => document.getElementById(id);
    const store = () => window.TourismHubStore;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
    const JSQR_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    const SAME_CODE_COOLDOWN = 3500;  // ms before the same code can trigger again
    const SCAN_PAUSE = 1800;          // ms pause after any successful decode
    const SCAN_INTERVAL = 120;        // ms between decode attempts
  
    const STATUS_META = {
      'Valid':           { ok: true,  label: 'Pass Status: Valid Verified Entry',   result: 'Approved',                   tone: 'success' },
      'Already Scanned': { ok: false, label: 'Pass Status: Already Scanned',        result: 'Denied (Already Scanned)',   tone: 'warning' },
      'Expired':         { ok: false, label: 'Pass Status: Expired Pass',           result: 'Denied (Expired)',           tone: 'warning' },
      'Unregistered':    { ok: false, label: 'Pass Status: Unregistered Pass Code', result: 'Denied (Unregistered)',      tone: 'warning' },
      'Invalid':         { ok: false, label: 'Pass Status: Invalid Pass',           result: 'Denied (Invalid)',           tone: 'warning' }
    };
  
    let stream = null, timer = 0, detector = null, jsqrPromise = null;
    let facing = 'environment', torchOn = false;
    let lastCode = '', lastAt = 0, pausedUntil = 0, busy = false;
    const work = document.createElement('canvas');
    const wctx = work.getContext('2d', { willReadFrequently: true });
  
    /* ---------------- status chip ---------------- */
    function setStatus(msg, kind) {
      const el = $('scanStatus');
      if (!el) return;
      el.textContent = msg;
      el.dataset.kind = kind || 'info';
    }
  
    /* ---------------- decoder (native first, jsQR fallback) ---------------- */
    async function ensureDecoder() {
      if (detector || window.jsQR) return;
      if ('BarcodeDetector' in window) {
        try { detector = new BarcodeDetector({ formats: ['qr_code'] }); return; } catch (e) { /* fall through */ }
      }
      if (!jsqrPromise) {
        jsqrPromise = new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = JSQR_URL;
          s.onload = resolve;
          s.onerror = () => reject(new Error('QR decoder failed to load'));
          document.head.appendChild(s);
        });
      }
      await jsqrPromise;
    }
  
    async function decodeSource(src, w, h) {
      if (detector) {
        const r = await detector.detect(src);
        return r.length ? r[0].rawValue : null;
      }
      if (window.jsQR) {
        const max = 720, k = Math.min(1, max / Math.max(w, h));
        work.width = Math.round(w * k);
        work.height = Math.round(h * k);
        wctx.drawImage(src, 0, 0, work.width, work.height);
        const img = wctx.getImageData(0, 0, work.width, work.height);
        const r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
        return r ? r.data : null;
      }
      return null;
    }
  
    /* ---------------- camera ---------------- */
    async function startCamera() {
      const frame = $('cameraFrame');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('Camera unavailable here (needs HTTPS). Use manual entry or upload a QR image.', 'warn');
        return;
      }
      stopCamera();
      setStatus('Starting camera…', 'info');
      try {
        await ensureDecoder();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        const video = $('scanVideo');
        video.srcObject = stream;
        await video.play();
        frame.classList.add('camera-live');
        setStatus('Point the camera at the QR code', 'info');
        loop();
      } catch (err) {
        frame.classList.remove('camera-live');
        const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        setStatus(denied ? 'Camera permission denied. Allow access or use manual entry.' :
          'Could not start camera. Use manual entry or upload a QR image.', 'warn');
      }
    }
  
    function stopCamera() {
      clearTimeout(timer);
      timer = 0;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      torchOn = false;
      const video = $('scanVideo');
      if (video) video.srcObject = null;
      const frame = $('cameraFrame');
      if (frame) frame.classList.remove('camera-live');
    }
  
    function loop() {
      timer = setTimeout(async () => {
        const video = $('scanVideo');
        if (!stream) return;
        if (!busy && Date.now() > pausedUntil && video.readyState >= 2 && video.videoWidth) {
          busy = true;
          try {
            const text = await decodeSource(video, video.videoWidth, video.videoHeight);
            if (text) handleDecoded(text);
          } catch (e) { /* skip frame */ }
          busy = false;
        }
        loop();
      }, SCAN_INTERVAL);
    }
  
    window.toggleCameraView = async function () {
      facing = facing === 'environment' ? 'user' : 'environment';
      await startCamera();
    };
  
    window.toggleTorch = async function () {
      const track = stream && stream.getVideoTracks()[0];
      const caps = track && track.getCapabilities ? track.getCapabilities() : {};
      if (!caps.torch) {
        if (window.showPortalToast) showPortalToast('Flash is not supported on this camera.', 'warning');
        return;
      }
      torchOn = !torchOn;
      try { await track.applyConstraints({ advanced: [{ torch: torchOn }] }); } catch (e) { torchOn = false; }
      $('cameraSnapBtn').classList.toggle('torch-on', torchOn);
    };
  
    /* ---------------- image upload fallback ---------------- */
    window.scanFromImage = async function (input) {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      try {
        await ensureDecoder();
        const bmp = await createImageBitmap(file);
        const text = await decodeSource(bmp, bmp.width, bmp.height);
        if (text) handleDecoded(text, true);
        else if (window.showPortalToast) showPortalToast('No QR code found in that image.', 'warning');
      } catch (e) {
        if (window.showPortalToast) showPortalToast('Could not read that image.', 'warning');
      }
    };
  
    /* ---------------- payload parsing + validation ---------------- */
    function extractCode(text) {
      const raw = String(text || '').trim();
      try {                                   // JSON payload: {"code":"PASS-..."}
        const o = JSON.parse(raw);
        if (o && (o.code || o.pass || o.passCode)) return String(o.code || o.pass || o.passCode).trim();
      } catch (e) { /* not JSON */ }
      const m = raw.match(/PASS-[A-Z0-9]+(?:-[A-Z0-9]+)*/i);   // plain code or URL containing one
      return (m ? m[0] : raw).toUpperCase();
    }
  
    function lookupPass(code) {
      const s = store();
      let res = null;
      if (s && typeof s.validatePass === 'function') {
        try { res = s.validatePass(code); } catch (e) { res = null; }
      }
      const pass = (res && res.pass) || null;
      let status;
      if (res) {
        const why = String(res.reason || res.status || res.message || '');
        if (res.valid) status = 'Valid';
        else if (/used|scanned|duplicate/i.test(why)) status = 'Already Scanned';
        else if (/exp/i.test(why) || /EXP/.test(code)) status = 'Expired';
        else status = pass ? 'Invalid' : 'Unregistered';
      } else {                                // no store: offline heuristics
        status = /EXP/.test(code) ? 'Expired' : /USD/.test(code) ? 'Already Scanned' : /^PASS-/.test(code) ? 'Valid' : 'Unregistered';
      }
      if (status === 'Valid' && s && typeof s.getLogs === 'function') {
        const dup = (s.getLogs() || []).some((l) => l.pass === code && /approved/i.test(l.result || ''));
        if (dup) status = 'Already Scanned';
      }
      return {
        status,
        name: (pass && (pass.visitorName || pass.visitor || pass.name)) || 'Tourist Guest',
        attraction: (pass && pass.attraction) || 'Attraction Entry',
        party: (pass && pass.partySize) ? pass.partySize + ' pax' : '1 pax'
      };
    }
  
    function handleDecoded(text, force) {
      const code = extractCode(text);
      const now = Date.now();
      if (!force && code === lastCode && now - lastAt < SAME_CODE_COOLDOWN) return;
      lastCode = code; lastAt = now; pausedUntil = now + SCAN_PAUSE;
      const r = lookupPass(code);
      triggerScan(code, r.name, r.attraction, r.status === 'Valid', r.status, r.party);
    }
  
    /* ---------------- feedback ---------------- */
    function feedback(ok) {
      if (navigator.vibrate) navigator.vibrate(ok ? 80 : [60, 40, 60]);
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = new AC(), o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = ok ? 880 : 220;
        g.gain.setValueAtTime(0.08, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + 0.25);
        setTimeout(() => ac.close(), 400);
      } catch (e) { /* audio blocked */ }
    }
  
    /* ---------------- core scan pipeline ---------------- */
    window.simulateQRScan = function () {
      window.triggerScan('PASS-8842-MNL', 'Juan Dela Cruz', 'Rizal Monument & Luneta Park', true, 'Valid', '1 pax');
    };
  
    window.validateManualCode = function () {
      const input = $('manualPassInput');
      const code = extractCode(input && input.value);
      if (!code) {
        if (window.showPortalToast) showPortalToast('Please enter a tourist pass reference code.', 'warning');
        return;
      }
      handleDecoded(code, true);
      if (input) input.value = '';
    };
  
    window.triggerScan = function (code, name, attraction, isValid, status, party) {
      status = status || (isValid ? 'Valid' : 'Invalid');
      const meta = STATUS_META[status] || STATUS_META.Invalid;
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
      const s = store();
      if (s && typeof s.addLog === 'function') {
        s.addLog({ time: timeStr, pass: code, visitor: name, attraction, party: party || '1 pax', result: meta.result });
      }
      feedback(meta.ok);
      showScanReceipt(name, attraction, code, timeStr, status);
      if (window.showPortalToast) {
        showPortalToast(meta.ok ? `Verified entry pass for ${name}` : `Gate alert: ${code} — ${status}`, meta.tone);
      }
      renderRecent();
    };
  
    window.showScanReceipt = function (name, attraction, code, time, status) {
      const meta = STATUS_META[status] || STATUS_META.Invalid;
      $('receiptVisitor').textContent = name;
      $('receiptAttraction').textContent = attraction;
      $('receiptCode').textContent = code;
      $('receiptTime').textContent = time;
      $('scanResultBadge').innerHTML =
        `<span class="${meta.ok ? 'valid-dot-pill' : 'invalid-dot-pill'}" style="font-size:.95rem;padding:.4rem 1.2rem;">${esc(meta.label)}</span>`;
      const btn = $('scanConfirmBtn');
      if (btn) btn.textContent = meta.ok ? 'Confirm Check-in' : 'Dismiss';
      openPortalModal('scanModal');
    };
  
    /* ---------------- live recent-scans table + history ---------------- */
    function pillFor(result) {
      return /approved|valid/i.test(result || '') && !/denied/i.test(result || '')
        ? '<span class="valid-dot-pill">Valid</span>' : '<span class="invalid-dot-pill">Invalid</span>';
    }
  
    function renderRecent() {
      const tb = $('scansTableBody'), s = store();
      if (!tb || !s || typeof s.getLogs !== 'function') return;
      const logs = (s.getLogs() || []).slice(0, 5);
      if (!logs.length) {
        tb.innerHTML = '<tr><td colspan="5" class="scan-empty">No gate scans recorded yet today.</td></tr>';
        return;
      }
      tb.innerHTML = logs.map((l, i) => `
        <tr>
          <td>${esc(l.time)}</td>
          <td><strong>${esc(l.visitor || 'Tourist Guest')}</strong></td>
          <td>${esc(l.attraction || 'General')}</td>
          <td>${pillFor(l.result)}</td>
          <td style="text-align:right;">
            <button class="action-arrow-btn" style="margin-left:auto;" data-log="${i}" aria-label="View scan details">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </td>
        </tr>`).join('');
    }
  
    window.openScannedHistory = function () {
      const tbody = $('historyModalBody'), s = store();
      if (tbody && s) {
        const logs = s.getLogs() || [];
        tbody.innerHTML = !logs.length
          ? '<tr><td colspan="4" class="scan-empty">No gate scans recorded yet today.</td></tr>'
          : logs.map((l) => `
            <tr>
              <td>${esc(l.time)}</td>
              <td><strong>${esc(l.visitor || 'Tourist Guest')}</strong><br><small style="color:var(--text-muted);">${esc(l.pass || 'PASS')}</small></td>
              <td>${esc(l.attraction || 'General')}</td>
              <td>${/approved|valid/i.test(l.result || '') && !/denied/i.test(l.result || '') ? '<span class="valid-dot-pill">Approved</span>' : '<span class="invalid-dot-pill">Denied</span>'}</td>
            </tr>`).join('');
      }
      openPortalModal('scannedHistoryModal');
    };
  
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-log]');
      if (!b) return;
      const l = (store().getLogs() || [])[Number(b.dataset.log)];
      if (!l) return;
      const st = /approved/i.test(l.result || '') ? 'Valid' : /scanned/i.test(l.result || '') ? 'Already Scanned' :
        /expired/i.test(l.result || '') ? 'Expired' : /unreg/i.test(l.result || '') ? 'Unregistered' : 'Invalid';
      showScanReceipt(l.visitor || 'Tourist Guest', l.attraction || 'General', l.pass || 'PASS', l.time || '', st);
    });
  
    ['tourismhub:sync', 'storage'].forEach((ev) => window.addEventListener(ev, renderRecent));
  
    /* ---------------- lifecycle ---------------- */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCamera();
      else if ($('cameraAutoStart') && $('cameraAutoStart').dataset.on === '1') startCamera();
    });
    window.addEventListener('pagehide', stopCamera);
  
    document.addEventListener('DOMContentLoaded', () => {
      renderRecent();
      const m = $('manualPassInput');
      if (m) m.addEventListener('keydown', (e) => { if (e.key === 'Enter') validateManualCode(); });
      const start = $('cameraStartBtn');
      if (start) start.addEventListener('click', () => { $('cameraAutoStart').dataset.on = '1'; start.hidden = true; startCamera(); });
      setStatus('Tap “Start Camera” to begin scanning', 'info');
    });
  })();