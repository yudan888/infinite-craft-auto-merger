# ✨ Infinite Craft Auto Merger (V6.2)

An automated helper and control panel for **Infinite Craft**. Automate element merging, target specific items, track First Discoveries, avoid duplicate failed combinations, and watch YouTube videos right inside your browser window.

---

## 🚀 Features

* **🎯 Target Element Mode**: Systematically pairs a chosen target element against all valid items in your sidebar.
* **🎲 Random Loop Mode**: Continuously merges random item pairs for passive discovery.
* **👯 Singles, Doubles & Triples Modes**: Run single combinations, queue double combinations simultaneously, or use **Triple Merge Mode** to merge three elements at once for maximum speed and discovery.
* **⚡ 6 Speed Presets**: Granular delay controls ranging from `Slow` (400ms) down to `Nitro` (25ms).
* **🧠 Smart Fail Persistence**: Saves non-working item combinations to `localStorage` so the script never wastes time retrying them.
* **🏆 First Discovery Counter**: Tracks and saves your total count of unique First Discoveries using a live DOM observer.
* **🏷️ Ignore Numbers Filter**: Exclude numeric/numbered items from combinations with a single checkbox.
* **📺 Embedded YouTube Player**: Paste any YouTube video URL or ID into the panel to watch videos while automating.
* **🔊 Audio & UI Controls**: Toggle game mute instantly, drag the panel around your screen, or minimize it to stay out of your workspace.

---

## 📦 How to Use

### Option 1: Tampermonkey / Userscript (Recommended)
1. Install a userscript manager browser extension like **Tampermonkey** or **Violentmonkey**.
2. Create a new userscript and paste the full code from `auto-merger-full-code.js`.
3. Save the script and navigate to [Infinite Craft](https://neal.fun/infinite-craft/).
4. The auto-merger control panel will load automatically every time you open the game.

### Option 2: Developer Console
1. Navigate to [Infinite Craft](https://neal.fun/infinite-craft/).
2. Press `F12` (or right-click and select **Inspect**) to open Developer Tools.
3. Switch to the **Console** tab.
4. Paste the full code from `auto-merger-full-code.js` and press `Enter`.

### Option 3: Bookmarklet (Optional)
Create a new browser bookmark, set the URL to `javascript:` followed by your minified code, and click it whenever you are on the Infinite Craft page.

---

## ⚙️ Speed Presets

| Speed Preset | Inter-Combo Delay | Post-Combo Scan Delay | Drag Delay |
| :--- | :--- | :--- | :--- |
| **🐌 Slow** | 400ms | 600ms | 150ms |
| **⚡ Normal** | 250ms | 450ms | 100ms |
| **⏱️ Medium** | 180ms | 380ms | 80ms |
| **🚀 Fast** | 150ms | 350ms | 60ms |
| **💨 Turbo** | 80ms | 250ms | 30ms |
| **🔥 Nitro** | 25ms | 25ms | 25ms |

---

## 🛠️ Panel Controls

* **▶️ Start Target**: Begins merging the item written in the target input box against sidebar items.
* **🎲 Loop Random**: Starts an endless random pairing loop.
* **🧹 Clear Canvas**: Clears all active elements off the workspace.
* **🗑️ Clear Fails**: Clears saved failed combinations from local storage.
* **🔊 Mute Game**: Silences audio elements and Howler.js audio instances.
* **⛔ Stop**: Halts all active automated loops.

# 🐛 Known Issues & Troubleshooting

## Canvas Overcrowding / Script Freezing

**Issue:** 
High-speed combination loops can occasionally cause elements to spawn uncontrollably across the workspace, resulting in script unresponsiveness.

**Resolution:**
1. Refresh the browser page (`F5` or `Ctrl + R`).
2. Re-open the Developer Console (`F12`).
3. Paste and run the auto-merger script to resume operation.

---

## ⏱️ Delayed First Discoveries Counter

**Issue:** 
The First Discoveries counter or visual notification may lag behind active element creation, especially during rapid combination loops.

**Resolution:**
No action required. The background DOM observer automatically catches up and updates your tally as soon as the game syncs page elements.

---

## 🌙 Dark Mode Not Working

**Issue:** 
Dark mode doesn't affect the panel so the panel still stays white.

**Resolution:**
No action required. I'll probably be fixing this bug in the next update! 
