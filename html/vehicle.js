let redlineRpm     = 85
let lastGear       = -1
let gearFlashTimer = null

function updateSpeedRing(spd) {
    const pct = Math.max(0, Math.min(100, (spd || 0) / 220 * 100))
    speedRing.style.strokeDashoffset = 418 - (pct / 100) * 418
}

function rpmDisplay(pct) {
    return Math.round((Math.max(0, Math.min(100, pct || 0)) / 100) * 8000).toLocaleString()
}

function setSideArc(arcEl, pctLabelEl, value) {
    if (!arcEl) return
    const pct = Math.max(0, Math.min(100, value || 0))
    arcEl.style.strokeDashoffset = 110 - (pct / 100) * 110
    if (pctLabelEl) pctLabelEl.textContent = Math.round(pct) + '%'
}

function setArcWarn(el, value, threshold) {
    if (el) el.classList.toggle('warn-low', value <= threshold)
}

function handleGearChange(newGear) {
    if (newGear === lastGear) return
    lastGear = newGear
    if (newGear === 'R' || newGear === '0') return
    if (gearFlashTimer) clearTimeout(gearFlashTimer)
    gearDisplay.classList.add('gear-shift')
    gearFlashTimer = setTimeout(() => {
        gearDisplay.classList.remove('gear-shift')
        gearFlashTimer = null
    }, 280)
}

function applyRedlineFlash(rpmPct) {
    const isRed = rpmPct >= redlineRpm
    speedRing.classList.toggle('redline-active', isRed)
}

function buildRedlineMarker(threshold) {
    if (!redlineMarker) return
    const cx = 115, cy = 115, r = 88
    const sweep = 264
    const angleDeg = (threshold / 100) * sweep
    const rad = (angleDeg * Math.PI) / 180
    const ox = cx + r * Math.cos(rad)
    const oy = cy + r * Math.sin(rad)
    const innerR = 78
    const ix = cx + innerR * Math.cos(rad)
    const iy = cy + innerR * Math.sin(rad)
    redlineMarker.setAttribute('x1', ox.toFixed(2))
    redlineMarker.setAttribute('y1', oy.toFixed(2))
    redlineMarker.setAttribute('x2', ix.toFixed(2))
    redlineMarker.setAttribute('y2', iy.toFixed(2))
    redlineMarker.classList.remove('hidden')
}

function buildDialTicks() {
    const tickGroup = document.getElementById('dialTicks')
    if (!tickGroup) return
    const cx = 115, cy = 115, outerR = 88, majorLen = 10, minorLen = 5
    const startAngle = 0, sweep = 264, majorCount = 11, minorPerMajor = 4
    const total = (majorCount - 1) * (minorPerMajor + 1) + 1
    const step  = sweep / (total - 1)
    const NS    = 'http://www.w3.org/2000/svg'
    const frag  = document.createDocumentFragment()
    for (let i = 0; i < total; i++) {
        const major = i % (minorPerMajor + 1) === 0
        const len   = major ? majorLen : minorLen
        const rad   = ((startAngle + i * step) * Math.PI) / 180
        const ox = cx + outerR * Math.cos(rad)
        const oy = cy + outerR * Math.sin(rad)
        const ix = cx + (outerR - len) * Math.cos(rad)
        const iy = cy + (outerR - len) * Math.sin(rad)
        const line = document.createElementNS(NS, 'line')
        line.setAttribute('x1', ox.toFixed(2)); line.setAttribute('y1', oy.toFixed(2))
        line.setAttribute('x2', ix.toFixed(2)); line.setAttribute('y2', iy.toFixed(2))
        line.setAttribute('class', major ? 'dial-tick-major' : 'dial-tick-minor')
        frag.appendChild(line)
    }
    tickGroup.appendChild(frag)
}

function refreshLights(data) {
    if (!data) return
    const hz = !!data.hazard
    flipLight(document.getElementById('lightIndicatorLeft'),  hz || !!data.indicatorLeft)
    flipLight(document.getElementById('lightIndicatorRight'), hz || !!data.indicatorRight)
    flipLight(document.getElementById('lightHazard'),         hz)
    flipLight(document.getElementById('lightHeadlights'),     !!data.headlights)
    flipLight(document.getElementById('lightHighbeam'),       !!data.highbeam)
}

function flipLight(el, on) {
    if (el) el.classList.toggle('active', on)
}

buildDialTicks()
