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
