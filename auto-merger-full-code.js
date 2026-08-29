// ==UserScript==
// @name         Infinite Craft Auto Merger
// @namespace    https://github.com/yudan888/infinite-craft-auto-merger
// @version      6.2
// @description  Automated helper and control panel for Infinite Craft
// @author       yudan888
// @match        https://neal.fun/infinite-craft/
// @grant        none
// ==UserScript==
(() => {
  const CONFIG = {
    itemSelector: '.items .item',
    gameContainerSelector: '.container',
    panelId: 'auto-combo-panel',
    targetInputId: 'auto-combo-target-input',
    suggestionBoxId: 'auto-combo-suggestion-box',
    suggestionItemClass: 'auto-combo-suggestion-item',
    statusBoxId: 'auto-combo-status',
    firstDiscoveryBoxId: 'auto-combo-fd-status',
    startButtonId: 'auto-combo-start-button',
    randomButtonId: 'auto-combo-random-button',
    stopButtonId: 'auto-combo-stop-button',
    clearCanvasButtonId: 'auto-combo-clear-canvas-button',
    clearFailedButtonId: 'auto-combo-clear-failed-button',
    muteButtonId: 'auto-combo-mute-button',
    ytInputId: 'auto-combo-yt-input',
    ytPlayerId: 'auto-combo-yt-player',
    filterNumbersCheckboxId: 'auto-combo-filter-numbers',
    speedSelectId: 'auto-combo-speed-select',
    modeSelectId: 'auto-combo-mode-select',
    debugMarkerClass: 'auto-combo-debug-marker',

    speedPresets: {
      slow: { interComboDelay: 400, postComboScanDelay: 600, dragBetweenDelay: 150 },
      normal: { interComboDelay: 250, postComboScanDelay: 450, dragBetweenDelay: 100 },
      medium: { interComboDelay: 180, postComboScanDelay: 380, dragBetweenDelay: 80 },
      fast: { interComboDelay: 150, postComboScanDelay: 350, dragBetweenDelay: 60 },
      turbo: { interComboDelay: 80, postComboScanDelay: 250, dragBetweenDelay: 30 },
      nitro: { interComboDelay: 25, postComboScanDelay: 25, dragBetweenDelay: 25 }
    },

    interComboDelay: 250,
    postComboScanDelay: 450,
    dragBetweenDelay: 100,
    scanDebounceDelay: 150,
    suggestionLimit: 20,
    debugMarkerDuration: 700,
    storageKeyFailedCombos: 'infCraftAutoComboFailedCombosV2',
    storageKeySpeed: 'infCraftAutoComboSpeed',
    storageKeyMute: 'infCraftAutoComboMuted',
    storageKeyYtUrl: 'infCraftAutoComboYtUrl',
    storageKeyPos: 'infCraftAutoComboPos',
    storageKeyFirstDiscoveries: 'infCraftAutoComboFDCount'
  };

  class AutoTargetCombo {
    constructor() {
      this.itemElementMap = new Map();
      this.failedCombos = new Set();
      this.isRunning = false;
      this.isRandomLooping = false;
      this.isMuted = false;
      this.isMinimized = false;
      this.firstDiscoveryCount = 0;
      this.comboCounter = 0;
      this.suggestions = [];
      this.scanTimer = null;
      this.observer = null;

      this._boundOutsideClick = e => {
        if (this.panel && !this.panel.contains(e.target)) {
          this.suggestionBox.style.display = 'none';
        }
      };

      this.injectStyles();
      this.setupUI();
      this.loadFailedCombos();
      this.loadSpeed();
      this.loadMuteState();
      this.loadPosition();
      this.loadFirstDiscoveries();
      this.setupEvents();
      this.observeDOM();
      this.scanItems();
      this.logStatus('Ready V6.2 (Triples & Per-Combo Tracking)');
    }

    injectStyles() {
      if (document.getElementById(`${CONFIG.panelId}-styles`)) return;

      const style = document.createElement('style');
      style.id = `${CONFIG.panelId}-styles`;
      style.textContent = `
        #${CONFIG.panelId} {
          position:fixed;top:8px;left:8px;z-index:10010;width:230px;
          background:rgba(250,250,250,.97);border:1px solid #aaa;
          border-radius:6px;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          box-shadow:0 3px 10px #0004;display:flex;flex-direction:column;color:#111;
          overflow:hidden;
        }
        .auto-combo-drag-bar {
          display:flex;align-items:center;justify-content:space-between;
          background:rgba(150, 150, 150, 0.9);backdrop-filter:blur(5px);
          color:#e0e0e0;padding:5px 8px;cursor:grab;font-weight:bold;
          user-select:none;font-size:11px;border-bottom:1px solid rgba(0,0,0,0.2);
        }
        .auto-combo-drag-bar:active { cursor:grabbing; }
        .auto-combo-title-text { color:#e0e0e0; }
        .auto-combo-win-controls { display:flex;gap:4px; }
        .auto-combo-win-btn {
          border:none;cursor:pointer;font-size:11px;font-weight:bold;
          width:18px;height:18px;border-radius:3px;display:flex;
          align-items:center;justify-content:center;color:white;
        }
        #auto-combo-minimize-btn { background:#29b6f6; }
        #auto-combo-minimize-btn:hover { background:#03a9f4; }
        #auto-combo-close-btn { background:#f44336; }
        #auto-combo-close-btn:hover { background:#d32f2f; }
        .auto-combo-content {
          padding:8px;display:flex;flex-direction:column;gap:5px;
        }
        #${CONFIG.panelId} * { box-sizing:border-box }
        #${CONFIG.panelId} input,#${CONFIG.panelId} button,#${CONFIG.panelId} select {
          width:100%;padding:6px 8px;font-size:12px;border:1px solid #bbb;border-radius:4px
        }
        #${CONFIG.panelId} button { cursor:pointer;background:#eee }
        #${CONFIG.startButtonId} { background:#4caf50!important;color:white }
        #${CONFIG.randomButtonId} { background:#9c27b0!important;color:white }
        #${CONFIG.clearCanvasButtonId} { background:#2196f3!important;color:white }
        #${CONFIG.clearFailedButtonId} { background:#ff9800!important;color:white }
        #${CONFIG.muteButtonId} { background:#607d8b!important;color:white }
        #${CONFIG.stopButtonId} { background:#f44336!important;color:white }
        #${CONFIG.suggestionBoxId} {
          display:none;position:absolute;z-index:10011;max-height:120px;overflow-y:auto;
          background:white;border:1px solid #aaa;box-shadow:0 3px 6px #0003
        }
        .${CONFIG.suggestionItemClass} { padding:5px 8px;cursor:pointer }
        .${CONFIG.suggestionItemClass}:hover { background:#07f;color:white }
        #${CONFIG.statusBoxId} {
          padding:4px;text-align:center;font-size:10px;background:#f9f9f9;
          border:1px solid #e5e5e5;border-radius:3px;min-height:24px;word-wrap:break-word;
        }
        #${CONFIG.firstDiscoveryBoxId} {
          padding:4px;text-align:center;font-weight:bold;font-size:11px;
          background:#fff8e1;border:1px solid #ffe082;border-radius:3px;color:#f57f17
        }
        .yt-wrapper {
          display:flex;flex-direction:column;gap:4px;background:#eee;padding:4px;border-radius:4px
        }
        #${CONFIG.ytPlayerId} {
          width:100%;height:110px;border:none;border-radius:3px;background:#000
        }
        .filter-wrapper { display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer }
        .filter-wrapper input { width:auto!important;margin:0 }
        .${CONFIG.debugMarkerClass} {
          position:absolute;width:8px;height:8px;border-radius:50%;
          z-index:10012;pointer-events:none;transition:opacity .3s
        }
      `;
      document.head.appendChild(style);
    }

    setupUI() {
      const existing = document.getElementById(CONFIG.panelId);
      if (existing) existing.remove();

      this.panel = document.createElement('div');
      this.panel.id = CONFIG.panelId;
      this.panel.innerHTML = `
        <div class="auto-combo-drag-bar" id="auto-combo-drag-handle">
          <span class="auto-combo-title-text">⠿ ✨ Auto Combiner V6.2</span>
          <div class="auto-combo-win-controls">
            <button class="auto-combo-win-btn" id="auto-combo-minimize-btn" title="Minimize/Maximize">–</button>
            <button class="auto-combo-win-btn" id="auto-combo-close-btn" title="Close">×</button>
          </div>
        </div>
        <div class="auto-combo-content" id="auto-combo-content-area">
          <input id="${CONFIG.targetInputId}" placeholder="Target Element" autocomplete="off">
          <div id="${CONFIG.suggestionBoxId}"></div>
          
          <div style="display:flex; gap:4px;">
            <select id="${CONFIG.speedSelectId}" style="flex:1;">
              <option value="slow">🐌 Slow</option>
              <option value="normal">⚡ Normal</option>
              <option value="medium">⏱️ Medium</option>
              <option value="fast">🚀 Fast</option>
              <option value="turbo">💨 Turbo</option>
              <option value="nitro">🔥 Nitro</option>
            </select>
            <select id="${CONFIG.modeSelectId}" style="flex:1;">
              <option value="singles">🧍‍♂️ Singles</option>
              <option value="doubles">👯 Doubles</option>
              <option value="triples">👨‍👩‍👧 Triples</option>
            </select>
          </div>

          <label class="filter-wrapper">
            <input type="checkbox" id="${CONFIG.filterNumbersCheckboxId}" checked> 🏷️ Ignore Numbers
          </label>
          <button id="${CONFIG.startButtonId}">▶️ Start Target</button>
          <button id="${CONFIG.randomButtonId}">🎲 Loop Random</button>
          <button id="${CONFIG.clearCanvasButtonId}">🧹 Clear Canvas</button>
          <button id="${CONFIG.clearFailedButtonId}">🗑️ Clear Fails</button>
          <button id="${CONFIG.muteButtonId}">🔊 Mute Game</button>
          <button id="${CONFIG.stopButtonId}">⛔ Stop</button>
          <div id="${CONFIG.firstDiscoveryBoxId}">🏆 First Discoveries: 0</div>
          <div id="${CONFIG.statusBoxId}">Initializing...</div>
          <div class="yt-wrapper">
            <input id="${CONFIG.ytInputId}" placeholder="Paste YT URL or ID" autocomplete="off">
            <iframe id="${CONFIG.ytPlayerId}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(this.panel);

      for (const key of [
        'targetInput', 'suggestionBox', 'statusBox', 'firstDiscoveryBox',
        'startButton', 'randomButton', 'stopButton', 'clearCanvasButton',
        'clearFailedButton', 'muteButton', 'ytInput', 'ytPlayer',
        'filterNumbersCheckbox', 'speedSelect', 'modeSelect'
      ]) {
        const id = CONFIG[`${key}Id`];
        this[key] = this.panel.querySelector(`#${id}`);
      }

      this.dragHandle = this.panel.querySelector('#auto-combo-drag-handle');
      this.contentArea = this.panel.querySelector('#auto-combo-content-area');
      this.minimizeBtn = this.panel.querySelector('#auto-combo-minimize-btn');
      this.closeBtn = this.panel.querySelector('#auto-combo-close-btn');

      this.loadSavedYouTube();
    }

    setupEvents() {
      this.targetInput.addEventListener('input', () => this.updateSuggestions());
      this.targetInput.addEventListener('focus', () => this.updateSuggestions());
      this.targetInput.addEventListener('keydown', e => this.handleSuggestionKey(e));

      this.ytInput.addEventListener('input', () => this.handleYouTubeInput());

      this.startButton.onclick = () => this.startAutoCombo();
      this.randomButton.onclick = () => this.startRandomLoop();
      this.clearCanvasButton.onclick = () => this.triggerCanvasClear();
      this.clearFailedButton.onclick = () => this.clearFailedCombos();
      this.muteButton.onclick = () => this.toggleMute();
      this.stopButton.onclick = () => this.stop();
      this.speedSelect.onchange = () => this.changeSpeed();

      this.closeBtn.onclick = () => {
        if (window.infCraftAutoComboInstance) {
          window.infCraftAutoComboInstance.destroy();
        }
      };

      this.minimizeBtn.onclick = () => {
        this.isMinimized = !this.isMinimized;
        this.contentArea.style.display = this.isMinimized ? 'none' : 'flex';
        this.minimizeBtn.textContent = this.isMinimized ? '□' : '–';
      };

      this.setupDragging();

      document.addEventListener('click', this._boundOutsideClick, true);
    }

    setupDragging() {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      this.dragHandle.onmousedown = e => {
        if (e.target.closest('.auto-combo-win-controls')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = this.panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        e.preventDefault();
      };

      this._boundMouseMove = e => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newLeft = initialLeft + dx;
        const newTop = initialTop + dy;

        this.panel.style.left = `${newLeft}px`;
        this.panel.style.top = `${newTop}px`;
        this.panel.style.right = 'auto';
      };

      this._boundMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          const rect = this.panel.getBoundingClientRect();
          localStorage.setItem(CONFIG.storageKeyPos, JSON.stringify({ left: rect.left, top: rect.top }));
        }
      };

      document.addEventListener('mousemove', this._boundMouseMove);
      document.addEventListener('mouseup', this._boundMouseUp);
    }

    loadPosition() {
      try {
        const saved = JSON.parse(localStorage.getItem(CONFIG.storageKeyPos));
        if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
          this.panel.style.left = `${saved.left}px`;
          this.panel.style.top = `${saved.top}px`;
          this.panel.style.right = 'auto';
        }
      } catch {}
    }

    loadFirstDiscoveries() {
      try {
        this.firstDiscoveryCount = parseInt(localStorage.getItem(CONFIG.storageKeyFirstDiscoveries) || '0', 10);
      } catch {
        this.firstDiscoveryCount = 0;
      }
      if (this.firstDiscoveryBox) {
        this.firstDiscoveryBox.textContent = `🏆 First Discoveries: ${this.firstDiscoveryCount}`;
      }
    }

    saveFirstDiscoveries() {
      localStorage.setItem(CONFIG.storageKeyFirstDiscoveries, this.firstDiscoveryCount);
    }

    loadFailedCombos() {
      try {
        const saved = JSON.parse(localStorage.getItem(CONFIG.storageKeyFailedCombos) || '[]');
        this.failedCombos = new Set(Array.isArray(saved) ? saved : []);
      } catch {
        this.failedCombos = new Set();
      }
    }

    saveFailedCombos() {
      if (this.failedCombos.size) {
        localStorage.setItem(CONFIG.storageKeyFailedCombos, JSON.stringify([...this.failedCombos]));
      } else {
        localStorage.removeItem(CONFIG.storageKeyFailedCombos);
      }
    }

    clearFailedCombos() {
      const count = this.failedCombos.size;
      this.failedCombos.clear();
      this.saveFailedCombos();
      this.logStatus(`🗑️ Cleared ${count} fails`);
    }

    loadMuteState() {
      const saved = localStorage.getItem(CONFIG.storageKeyMute) === 'true';
      if (saved) {
        this.isMuted = true;
        this.applyMuteState();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem(CONFIG.storageKeyMute, this.isMuted);
      this.applyMuteState();
      this.logStatus(this.isMuted ? '🔇 Game Muted' : '🔊 Game Unmuted');
    }

    applyMuteState() {
      this.muteButton.textContent = this.isMuted ? '🔊 Unmute Game' : '🔇 Mute Game';
      
      document.querySelectorAll('audio, video').forEach(el => {
        el.muted = this.isMuted;
      });

      if (window.Howler && typeof window.Howler.mute === 'function') {
        window.Howler.mute(this.isMuted);
      }
    }

    extractVideoId(input) {
      if (!input) return '';
      input = input.trim();
      if (input.length === 11 && !input.includes('/') && !input.includes('.')) return input;
      
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = input.match(regExp);
      return (match && match[2].length === 11) ? match[2] : '';
    }

    handleYouTubeInput() {
      const val = this.ytInput.value;
      const videoId = this.extractVideoId(val);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        this.ytPlayer.src = embedUrl;
        localStorage.setItem(CONFIG.storageKeyYtUrl, val);
      }
    }

    loadSavedYouTube() {
      const saved = localStorage.getItem(CONFIG.storageKeyYtUrl);
      if (saved) {
        this.ytInput.value = saved;
        const videoId = this.extractVideoId(saved);
        if (videoId) {
          this.ytPlayer.src = `https://www.youtube.com/embed/${videoId}`;
        }
      } else {
        this.ytPlayer.src = 'https://www.youtube.com/embed/5qap5aO4i9A';
      }
    }

    loadSpeed() {
      const saved = localStorage.getItem(CONFIG.storageKeySpeed);
      this.currentSpeed = CONFIG.speedPresets[saved] ? saved : 'normal';
      this.speedSelect.value = this.currentSpeed;
      this.applySpeed();
    }

    changeSpeed() {
      this.currentSpeed = this.speedSelect.value;
      localStorage.setItem(CONFIG.storageKeySpeed, this.currentSpeed);
      this.applySpeed();
      this.logStatus(`⚙️ ${this.currentSpeed.toUpperCase()}`);
    }

    applySpeed() {
      Object.assign(CONFIG, CONFIG.speedPresets[this.currentSpeed]);
    }

    isNumericElement(name) {
      if (!name) return false;
      return /\d/.test(name);
    }

    getValidItems() {
      const allItems = [...this.itemElementMap.keys()];
      if (this.filterNumbersCheckbox.checked) {
        return allItems.filter(name => !this.isNumericElement(name));
      }
      return allItems;
    }

    checkAndIncrementFirstDiscovery() {
      const discoveryEls = document.querySelectorAll(
        '.instance-discovered, .discovery, .instance-discovery, [class*="discovery"], [class*="discovered"]'
      );
      
      let foundNew = false;
      discoveryEls.forEach(el => {
        const text = el.innerText || '';
        if (!el.dataset.counted && (text.includes('First Discovery') || text.includes('✨'))) {
          el.dataset.counted = 'true';
          foundNew = true;
        }
      });

      if (foundNew) {
        this.firstDiscoveryCount++;
        this.saveFirstDiscoveries();
        this.firstDiscoveryBox.textContent = `🏆 First Discoveries: ${this.firstDiscoveryCount}`;
      }
    }

    triggerCanvasClear() {
      const trashBtn = document.querySelector('.clear, .clear-button, [class*="clear"]');
      if (trashBtn) {
        trashBtn.click();
        return;
      }

      const container = document.querySelector('.container');
      if (container && container.__vue__) {
        container.__vue__.clear?.();
      }
    }

    scanItems() {
      const elements = document.querySelectorAll(CONFIG.itemSelector);
      const nextMap = new Map();

      elements.forEach(el => {
        const name = el.innerText.trim().replace(/^[\p{Emoji}\s]+/u, '') || el.innerText.trim();
        if (name && !nextMap.has(name)) nextMap.set(name, el);
      });

      const changed = nextMap.size !== this.itemElementMap.size ||
        [...nextMap].some(([name, el]) => this.itemElementMap.get(name) !== el);

      this.itemElementMap = nextMap;

      if (changed && document.activeElement === this.targetInput) {
        this.updateSuggestions();
      }

      if (this.isMuted) {
        document.querySelectorAll('audio, video').forEach(el => {
          el.muted = true;
        });
      }

      return changed;
    }

    observeDOM() {
      const container = document.querySelector(CONFIG.gameContainerSelector) || document.body;
      this.observer = new MutationObserver(() => {
        this.checkAndIncrementFirstDiscovery();
        clearTimeout(this.scanTimer);
        this.scanTimer = setTimeout(() => this.scanItems(), CONFIG.scanDebounceDelay);
      });
      this.observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    getElement(name) {
      const element = this.itemElementMap.get(name);
      return element && document.body.contains(element) ? element : null;
    }

    async startAutoCombo() {
      if (this.isRunning) {
        this.logStatus('⚠️ Already running');
        return;
      }

      const targetName = this.targetInput.value.trim();
      if (!targetName) {
        this.logStatus('⚠️ Enter Target');
        this.targetInput.focus();
        return;
      }

      this.scanItems();
      if (!this.getElement(targetName)) {
        this.logStatus(`⚠️ "${targetName}" not found`);
        return;
      }

      const items = this.getValidItems().filter(name => name !== targetName);
      if (!items.length) {
        this.logStatus('ℹ️ No items match filter');
        return;
      }

      this.isRunning = true;
      const mode = this.modeSelect.value;
      const step = mode === 'triples' ? 3 : (mode === 'doubles' ? 2 : 1);

      this.logStatus(`🚀 Starting Target... (${items.length})`);

      for (let i = 0; i < items.length && this.isRunning; i += step) {
        const item1Name = items[i];
        const item2Name = (mode === 'doubles' || mode === 'triples') && (i + 1 < items.length) ? items[i + 1] : null;
        const item3Name = mode === 'triples' && (i + 2 < items.length) ? items[i + 2] : null;

        const comboKey1 = this.getComboKey(targetName, item1Name);
        const comboKey2 = item2Name ? this.getComboKey(targetName, item2Name) : null;
        const comboKey3 = item3Name ? this.getComboKey(targetName, item3Name) : null;

        let tasks = [];
        if (!this.failedCombos.has(comboKey1)) {
          tasks.push({ source: item1Name, target: targetName, key: comboKey1, yOffset: 0 });
        }
        if (item2Name && !this.failedCombos.has(comboKey2)) {
          tasks.push({ source: item2Name, target: targetName, key: comboKey2, yOffset: -120 });
        }
        if (item3Name && !this.failedCombos.has(comboKey3)) {
          tasks.push({ source: item3Name, target: targetName, key: comboKey3, yOffset: -240 });
        }

        if (tasks.length === 0) continue;

        const maxIndex = Math.min(i + step, items.length);
        const progress = step > 1 ? `${i + 1}-${maxIndex}/${items.length}` : `${i + 1}/${items.length}`;
        const logNames = tasks.map(t => t.source).join(' & ');
        this.logStatus(`⏳ ${progress}: ${logNames}`);

        try {
          const dropX = window.innerWidth / 3;
          const dropY = window.innerHeight / 2;

          const taskResults = [];
          const newItemsAll = [];

          for (let tIdx = 0; tIdx < tasks.length && this.isRunning; tIdx++) {
            const task = tasks[tIdx];
            const before = new Set(this.itemElementMap.keys());

            const srcEl = this.getElement(task.source);
            const tgtEl = this.getElement(task.target);
            if (srcEl && tgtEl) {
              await this.simulateCombo(srcEl, tgtEl, dropX, dropY + task.yOffset);
            }

            if (!this.isRunning) break;

            await this.wait(CONFIG.postComboScanDelay);
            this.scanItems();
            this.checkAndIncrementFirstDiscovery();

            const newItems = [...this.itemElementMap.keys()].filter(name => !before.has(name));
            if (newItems.length > 0) {
              taskResults.push({ task, success: true, newItems });
              newItemsAll.push(...newItems);
            } else {
              taskResults.push({ task, success: false, newItems: [] });
              this.failedCombos.add(task.key);
            }
          }

          if (!this.isRunning) break;

          this.saveFailedCombos();

          const icons = taskResults.map(r => r.success ? '✅' : '❌').join('');
          const uniqueNewItems = [...new Set(newItemsAll)];

          if (uniqueNewItems.length > 0) {
            this.logStatus(`${icons} Found: ${uniqueNewItems.join(', ')}!`);
          } else {
            this.logStatus(`${icons} Fail ${progress}`);
          }

          this.comboCounter += taskResults.length;
          await this.wait(CONFIG.interComboDelay);
        } catch (error) {
          console.error('[AutoCombo]', error);
        }
      }

      const stopped = !this.isRunning;
      this.isRunning = false;
      this.logStatus(stopped ? '⛔ Stopped' : '✅ Done!');
    }

    async startRandomLoop() {
      if (this.isRunning) {
        this.logStatus('⚠️ Already running');
        return;
      }

      this.isRunning = true;
      this.isRandomLooping = true;
      const mode = this.modeSelect.value;

      this.logStatus('🎲 Randomizing...');

      const getValidPair = (validItems) => {
        let a, b, attempts = 0;
        do {
          a = validItems[Math.floor(Math.random() * validItems.length)];
          b = validItems[Math.floor(Math.random() * validItems.length)];
          attempts++;
        } while ((a === b || this.failedCombos.has(this.getComboKey(a, b))) && attempts < 50);
        return { a, b, key: this.getComboKey(a, b) };
      };

      while (this.isRunning && this.isRandomLooping) {
        this.scanItems();
        const validItems = this.getValidItems();

        if (validItems.length < 2) {
          this.logStatus('⚠️ Need 2+ valid items');
          break;
        }

        const pair1 = getValidPair(validItems);
        const pair2 = (mode === 'doubles' || mode === 'triples') ? getValidPair(validItems) : null;
        const pair3 = mode === 'triples' ? getValidPair(validItems) : null;

        const tasks = [{ src: pair1.a, tgt: pair1.b, key: pair1.key, yOffset: 0 }];
        if (pair2) tasks.push({ src: pair2.a, tgt: pair2.b, key: pair2.key, yOffset: -120 });
        if (pair3) tasks.push({ src: pair3.a, tgt: pair3.b, key: pair3.key, yOffset: -240 });

        const logMsg = tasks.map(t => `${t.src}+${t.tgt}`).join(' | ');
        this.logStatus(`🔀 ${logMsg}`);

        try {
          const dropX = window.innerWidth / 3;
          const dropY = window.innerHeight / 2;

          const taskResults = [];
          const newItemsAll = [];

          for (let tIdx = 0; tIdx < tasks.length && this.isRunning; tIdx++) {
            const task = tasks[tIdx];
            const before = new Set(this.itemElementMap.keys());

            const srcEl = this.getElement(task.src);
            const tgtEl = this.getElement(task.tgt);
            if (srcEl && tgtEl) {
              await this.simulateCombo(srcEl, tgtEl, dropX, dropY + task.yOffset);
            }

            if (!this.isRunning) break;

            await this.wait(CONFIG.postComboScanDelay);
            this.scanItems();
            this.checkAndIncrementFirstDiscovery();

            const newItems = [...this.itemElementMap.keys()].filter(name => !before.has(name));
            if (newItems.length > 0) {
              taskResults.push({ task, success: true, newItems });
              newItemsAll.push(...newItems);
            } else {
              taskResults.push({ task, success: false, newItems: [] });
              this.failedCombos.add(task.key);
            }
          }

          if (!this.isRunning) break;

          this.saveFailedCombos();

          const icons = taskResults.map(r => r.success ? '✅' : '❌').join('');
          const uniqueNewItems = [...new Set(newItemsAll)];

          if (uniqueNewItems.length > 0) {
            this.logStatus(`${icons} Found: ${uniqueNewItems.join(', ')}!`);
          } else {
            this.logStatus(`${icons} ${logMsg}`);
          }

          this.comboCounter += taskResults.length;
          await this.wait(CONFIG.interComboDelay);
        } catch (error) {
          console.error('[AutoCombo]', error);
        }
      }

      this.isRunning = false;
      this.isRandomLooping = false;
      this.logStatus('⛔ Loop Stopped.');
    }

    stop() {
      this.isRunning = false;
      this.isRandomLooping = false;
      this.logStatus('⛔ Stopped');
    }

    destroy() {
      this.stop();
      if (this.observer) {
        this.observer.disconnect();
      }
      document.removeEventListener('click', this._boundOutsideClick, true);
      document.removeEventListener('mousemove', this._boundMouseMove);
      document.removeEventListener('mouseup', this._boundMouseUp);
      clearTimeout(this.scanTimer);
      this.panel?.remove();
      window.infCraftAutoComboInstance = null;
    }

    async simulateCombo(source, target, dropX, dropY) {
      dropX = dropX || window.innerWidth / 3;
      dropY = dropY || window.innerHeight / 2;

      await this.dispatchFullDragSequence(target, dropX, dropY, '#f64');
      await this.wait(CONFIG.dragBetweenDelay);
      await this.dispatchFullDragSequence(source, dropX, dropY, '#269');
    }

    async dispatchFullDragSequence(element, dropX, dropY, color) {
      if (!this.isRunning || !element) return;

      const rect = element.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      this.showDebugMarker(startX, startY, color);
      this.showDebugMarker(dropX, dropY, color);

      const eventOpts = {
        bubbles: true, cancelable: true, view: window,
        clientX: startX, clientY: startY, button: 0, buttons: 1
      };

      element.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
      element.dispatchEvent(new MouseEvent('mousedown', eventOpts));

      await this.wait(20);

      const dragOpts = { ...eventOpts, clientX: dropX, clientY: dropY };

      window.dispatchEvent(new PointerEvent('pointermove', dragOpts));
      window.dispatchEvent(new MouseEvent('mousemove', dragOpts));

      await this.wait(20);

      window.dispatchEvent(new PointerEvent('pointerup', dragOpts));
      window.dispatchEvent(new MouseEvent('mouseup', dragOpts));
    }

    updateSuggestions() {
      const query = this.targetInput.value.toLowerCase();
      if (!query) {
        this.suggestionBox.style.display = 'none';
        return;
      }

      this.suggestions = this.getValidItems()
        .filter(name => name.toLowerCase().includes(query))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, CONFIG.suggestionLimit);

      this.suggestionBox.innerHTML = '';
      this.suggestionBox.style.display = this.suggestions.length ? 'block' : 'none';

      const rect = this.targetInput.getBoundingClientRect();
      Object.assign(this.suggestionBox.style, {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`
      });

      this.suggestions.forEach(name => {
        const item = document.createElement('div');
        item.className = CONFIG.suggestionItemClass;
        item.textContent = name;
        item.onmousedown = e => {
          e.preventDefault();
          this.targetInput.value = name;
          this.suggestionBox.style.display = 'none';
        };
        this.suggestionBox.appendChild(item);
      });
    }

    handleSuggestionKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.suggestionBox.style.display = 'none';
        this.startAutoCombo();
      }
      if (e.key === 'Escape') this.suggestionBox.style.display = 'none';
    }

    showDebugMarker(x, y, color) {
      const marker = document.createElement('div');
      marker.className = CONFIG.debugMarkerClass;
      Object.assign(marker.style, {
        left: `${x - 4}px`, top: `${y - 4}px`, backgroundColor: color
      });
      document.body.appendChild(marker);
      setTimeout(() => marker.remove(), CONFIG.debugMarkerDuration);
    }

    getComboKey(a, b) {
      return [a, b].sort().join('||');
    }

    wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    logStatus(message) {
      this.statusBox.textContent = message;
    }
  }

  if (window.infCraftAutoComboInstance) {
    window.infCraftAutoComboInstance.destroy();
  }
  window.infCraftAutoComboInstance = new AutoTargetCombo();
})();
