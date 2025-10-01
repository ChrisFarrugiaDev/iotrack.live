/* =======================================================================
   SECTION: CONFIG
   SUMMARY: Centralised, human-readable settings used across the widget.
   - Telemetry key names (ThingsBoard attribute/telemetry names)
   - Text labels and units for display
   - Responsive scaling baselines for tall/narrow tiles
   ======================================================================= */
const CONFIG = {
  telemetryKeys: {
    remainingRuntimeHours: 'remainingRuntimeHr', // TB key for runtime (in hours, decimal)
    fuelLitersToRefill:    'emptyLevelLiters'    // TB key for liters (numeric)
  },
  labels: {
    litersTitle:  'Approximate Fuel Level in Liters',
    refillTitle:   'Approximate Fuel Liters to Refill',
    runtimeTitle: 'Estimated Runtime on High Load',
    hoursUnit:    'H',
    minutesUnit:  'M',
    litersUnit:   'L'
  },
  scaling: {
    // Baseline size for a tall/narrow tile. The widget scales from these.
    baseWidthPx:  195,
    baseHeightPx: 220,
    minScale:     0.30,  // how small we allow it to shrink (keeps content readable)
    tinyCutoff:   0.50,  // < tiny → hide labels
    microCutoff:  0.50   // < micro → hide icons & units
  }
};


/* =======================================================================
   SECTION: UTILITIES
   SUMMARY: Small helpers for robust value extraction and formatting.
   - getNumericValueFromData: finds a numeric value for a given key anywhere
     in the ThingsBoard `data[]` payload (handles common shapes).
   - formatHoursToHhMm: turns decimal hours (e.g., 72.289) into "72h 17m".
   ======================================================================= */

/**
 * Search the ThingsBoard `data` array for the first numeric value of a key.
 * Supports several common payload shapes:
 *  - row[key] (flat)
 *  - row.latest[key] (latest object)
 *  - row.data[key]  (timeseries → array of [ts, value], uses the last item)
 */
 
function getNumericValueFromData(keyName) {
  if (Array.isArray(data)) {
    for (const row of data) {
      if (!row) continue;

      // 1) Flat property on the row
      if (Object.prototype.hasOwnProperty.call(row, keyName)) {
        const numeric = Number(row[keyName]);
        if (!Number.isNaN(numeric)) return numeric;
      }

      // 2) row.latest[key]
      if (row.latest && Object.prototype.hasOwnProperty.call(row.latest, keyName)) {
        const numeric = Number(row.latest[keyName]);
        if (!Number.isNaN(numeric)) return numeric;
      }

      // 3) row.data[key] → timeseries array like [[ts, val], ...]
      if (row.data && row.data[keyName]) {
        const series = row.data[keyName];
        const lastItem = Array.isArray(series) && series.length ? series[series.length - 1] : null;
        // Support both [[ts,val], ...] and [val] shapes
        const numeric = Number(Array.isArray(lastItem) ? lastItem[1] : lastItem);
        if (!Number.isNaN(numeric)) return numeric;
      }
    }
  }
  return NaN; // Not found / not numeric
}

/**
 * Convert decimal hours to a compact "Hh Mm" string.
 * Example: 72.289 → "72h 17m"
 */
function formatHoursToHhMm(decimalHours) {
  if (!isFinite(decimalHours)) return '—';
  let wholeHours = Math.floor(decimalHours);
  let wholeMinutes = Math.round((decimalHours - wholeHours) * 60);
  // Carry over if minutes round to 60
  if (wholeMinutes === 60) { wholeHours += 1; wholeMinutes = 0; }
  return `${wholeHours}${CONFIG.labels.hoursUnit} ${wholeMinutes}${CONFIG.labels.minutesUnit}`;
}


/* =======================================================================
   SECTION: DATA EXTRACTION
   SUMMARY: Read telemetry values safely using the helpers above, then clamp
   to non-negative (business-friendly) values.
   ======================================================================= */
let runtimeHoursRaw = getNumericValueFromData(CONFIG.telemetryKeys.remainingRuntimeHours);
if (Number.isNaN(runtimeHoursRaw)) runtimeHoursRaw = 0;

let fuelLitersToRefillRaw = getNumericValueFromData(CONFIG.telemetryKeys.fuelLitersToRefill);
if (Number.isNaN(fuelLitersToRefillRaw)) fuelLitersToRefillRaw = 0;

// Clamp to 0+ to avoid negative noise in the UI
const runtimeHours = Math.max(0, runtimeHoursRaw);
const fuelLiters   = Math.max(0, fuelLitersToRefillRaw);


/* =======================================================================
   SECTION: ICONS (SVG)
   SUMMARY: Inline SVGs used in the widget. The clock uses a stroke path,
   the droplet is a filled path. Colour can be controlled via CSS if desired.
   ======================================================================= */
const clockSVG = `
<svg viewBox="0 0 24 24" class="icon icon-clock" aria-hidden="true">
  <path d="M12 7V12L14.5 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
</svg>`;

// Filled droplet (explicitly fill with currentColor)
const dropletSVG = `
<svg viewBox="0 0 24 24" class="icon icon-droplet" aria-hidden="true">
  <path d="M12.53 2.22a.75.75 0 0 0-1.06 0C9.12 4.57 5 9.1 5 13a7 7 0 1 0 14 0c-0-3.9-4.12-8.43-6.47-10.78Z
           M12 20.5A5.5 5.5 0 0 1 6.5 15c0-2.63 2.87-6.35 5.5-9 2.63 2.65 5.5 6.37 5.5 9A5.5 5.5 0 0 1 12 20.5Z"
        fill="currentColor"/>
</svg>`;


/* =======================================================================
   SECTION: MARKUP
   SUMMARY: Build the widget HTML. This returns a single root container with
   two rows: runtime (top) and liters (bottom).
   - Labels are human-friendly strings from CONFIG.labels
   - Values are formatted for clarity (e.g., "72h 17m")
   ======================================================================= */
const html = `
<div class="tb-stats-card">

  <!-- Liters to Fill -->
  <div class="tb-stat">
    <div class="tb-top">
      <div class="tb-icon-wrap">${dropletSVG}</div>
      <div class="tb-label">${CONFIG.labels.litersTitle}</div>
    </div>
    <div class="tb-value">
      ${fuelLiters % 1 === 0 ? Math.trunc(fuelLiters) : fuelLiters.toFixed(1)}${CONFIG.labels.litersUnit}
    </div>
  </div>
  <!-- Time until Empty -->
  <div class="tb-stat">
    <div class="tb-top">
      <div class="tb-icon-wrap">${dropletSVG}</div>
      <div class="tb-label">${CONFIG.labels.refillTitle}</div>
    </div>
    <div class="tb-value">
      ${fuelLiters % 1 === 0 ? Math.trunc(fuelLiters) : fuelLiters.toFixed(1)}${CONFIG.labels.litersUnit}
    </div>
  </div>
    <!--runtime row -->
  <div class="tb-stat">
    <div class="tb-top">
      <div class="tb-icon-wrap">${clockSVG}</div>
      <div class="tb-label">${CONFIG.labels.runtimeTitle}</div>
    </div>
    <div class="tb-value">
      <span class="tb-hours">${formatHoursToHhMm(runtimeHours)}</span>
    </div>
  </div>
</div>
`;


/* =======================================================================
   SECTION: RESPONSIVE SCALING
   SUMMARY: Scale typography and spacing based on the container size.
   - Uses the limiting dimension (min of width/height relative to baseline)
   - Adds "tiny" and "micro" classes to progressively simplify the UI
     (hide labels; then hide icons/units) when space is extremely tight.
   ======================================================================= */
setTimeout(() => {
  // Locate the root card after the HTML is injected into the DOM
  const cardRoot = document.querySelector('.tb-stats-card');
  if (!cardRoot) return;

  const {
    baseWidthPx:  BASE_WIDTH_PX,
    baseHeightPx: BASE_HEIGHT_PX,
    minScale:     MIN_SCALE,
    tinyCutoff:   TINY_CUTOFF,
    microCutoff:  MICRO_CUTOFF
  } = CONFIG.scaling;

  function applyResponsiveScale() {
    const rect = cardRoot.getBoundingClientRect();
    const containerWidth  = rect.width  || BASE_WIDTH_PX;
    const containerHeight = rect.height || BASE_HEIGHT_PX;

    // Scale by the limiting dimension to avoid overflow in either direction
    const scale = Math.max(MIN_SCALE, Math.min(
      containerWidth  / BASE_WIDTH_PX,
      containerHeight / BASE_HEIGHT_PX
    ));

    // Expose the scale to CSS (fonts, padding, gaps use this)
    cardRoot.style.setProperty('--scale', String(scale));

    // Progressive simplification for very small tiles
    cardRoot.classList.toggle('tiny',  scale < TINY_CUTOFF);   // hide labels
    cardRoot.classList.toggle('micro', scale < MICRO_CUTOFF);  // hide icons & units
  }

  applyResponsiveScale();                  // initial pass
  window.addEventListener('resize', applyResponsiveScale); // on viewport changes

  // Poll occasionally to catch ThingsBoard grid/resizes that don't trigger 'resize'
  const pollId = setInterval(applyResponsiveScale, 400);

  // Clean up the poll if the widget is removed from the DOM
  const domObserver = new MutationObserver(() => {
    if (!document.body.contains(cardRoot)) {
      clearInterval(pollId);
      domObserver.disconnect();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });
}, 0);


/* =======================================================================
   SECTION: RETURN
   SUMMARY: Provide the HTML string to ThingsBoard so it renders the widget.
   ======================================================================= */
return html;
