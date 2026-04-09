const theWholeHud   = document.getElementById('hud')
const carCard       = document.getElementById('vehicleCard')
const lightyBois    = document.getElementById('lightsPanel')
const stressBubble  = document.getElementById('stressPill')
const staminaBubble = document.getElementById('staminaPill')
const talkDot       = document.getElementById('voiceDot')
const goFastRing    = document.getElementById('speedRing')
const settingsMenu  = document.getElementById('hudMenu')
const petrolArc     = document.getElementById('fuelArc')
const motorArc      = document.getElementById('engineArc')
const whereAmI      = document.getElementById('streetPill')
const wpWrap        = document.querySelector('.clock-waypoint-wrap')
const clockChip     = document.getElementById('clockBadge')
const wpChip        = document.getElementById('waypointChip')
const wpDistLabel   = document.getElementById('waypointDist')
const cineTop       = document.getElementById('cinebarTop')
const cineBottom    = document.getElementById('cinebarBottom')
const gearBadge     = document.getElementById('gearVal')
const redlineMarker = document.getElementById('redlineMarker')

const SAVE_KEY   = 'cx_hud_state_v1'
const SPEED_KEY  = 'cx_hud_speed_v1'
const AVATAR_KEY = 'cx_hud_avatar_v1'

const hudState = {
    portrait: true, charname: true, voice: true, playerid: false,
    logo: true, job: true, cash: true, bank: true,
    minimap: true, health: true, armor: true, hunger: true, thirst: true,
    vehicle: true, lights: true, cinebars: false,
}

let currentUnit    = null
let redlineRpm     = 85
let hadWaypoint    = false
let lastGear       = -1
let gearFlashTimer = null

function injectColors(cols) {
    if (!cols) return
    const root = document.documentElement.style
    const map = {
        panel: '--panel', panel2: '--panel2', border: '--border', border2: '--border2',
        text: '--text', muted: '--muted', accent: '--accent',
        cash: '--cash', bank: '--bank',
        ringHealth: '--ring-health', ringArmor: '--ring-armor', ringHunger: '--ring-hunger',
        ringThirst: '--ring-thirst', ringStress: '--ring-stress', ringStamina: '--ring-stamina',
        arcFuel: '--arc-fuel', arcEngine: '--arc-engine',
        lightIndicator: '--light-indicator', lightHeadlight: '--light-headlight', lightHighbeam: '--light-highbeam',
        beltWarn: '--belt-warn', warnGlow: '--warn-glow',
    }
    for (const [k, v] of Object.entries(map)) {
        if (cols[k]) root.setProperty(v, cols[k])
    }
}

function applyConfigDefaults(defaults) {
    if (!defaults) return
    for (const key of Object.keys(hudState)) {
        if (typeof defaults[key] === 'boolean') hudState[key] = defaults[key]
    }
}

function saveHudState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(hudState)) } catch (_) {}
}

function loadHudState() {
    try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        for (const key of Object.keys(hudState)) {
            if (typeof saved[key] === 'boolean') hudState[key] = saved[key]
        }
    } catch (_) {}
}

function loadSpeedUnit()  { return localStorage.getItem(SPEED_KEY) || null }
function saveSpeedUnit(u) { try { localStorage.setItem(SPEED_KEY, u) } catch (_) {} }

const DIRECT_IDS = [
    'portrait', 'charname', 'voice', 'playerid',
    'logo', 'job', 'cash', 'bank',
    'minimap', 'health', 'armor', 'hunger', 'thirst',
]

function applyVisibility() {
    for (const key of DIRECT_IDS) {
        const el = document.getElementById('comp-' + key)
        if (el) el.classList.toggle('hidden', !hudState[key])
    }

    if (whereAmI) whereAmI.classList.toggle('hidden', !hudState.minimap)
    if (wpWrap)   wpWrap.classList.toggle('hidden',   !hudState.minimap)

    const statusRow = document.getElementById('statusRow')
    if (statusRow) {
        statusRow.classList.toggle('hidden', !(hudState.health || hudState.armor || hudState.hunger || hudState.thirst))
    }

    carCard.classList.toggle('hidden', !hudState.vehicle)

    cineTop.classList.toggle('hidden',    !hudState.cinebars)
    cineBottom.classList.toggle('hidden', !hudState.cinebars)
}

function bootHudState() {
    loadHudState()
    applyVisibility()
}

const RING_CIRC = 2 * Math.PI * 20

function setRing(id, value) {
    const el = document.getElementById(id)
    if (!el) return
    const pct = Math.max(0, Math.min(100, value || 0))
    el.style.strokeDasharray  = RING_CIRC + ' ' + RING_CIRC
    el.style.strokeDashoffset = RING_CIRC - (pct / 100) * RING_CIRC
}

function setTxt(id, value) {
    const el = document.getElementById(id)
    if (el) el.textContent = value
}

function setSideArc(arcEl, pctLabelEl, value) {
    if (!arcEl) return
    const pct = Math.max(0, Math.min(100, value || 0))
    arcEl.style.strokeDashoffset = 110 - (pct / 100) * 110
    if (pctLabelEl) pctLabelEl.textContent = Math.round(pct) + '%'
}

function updateSpeedRing(spd) {
    const pct = Math.max(0, Math.min(100, (spd || 0) / 220 * 100))
    goFastRing.style.strokeDashoffset = 418 - (pct / 100) * 418
}

function rpmDisplay(pct) {
    return Math.round((Math.max(0, Math.min(100, pct || 0)) / 100) * 8000).toLocaleString()
}

function setWarn(pillId, barId, value, threshold) {
    const pill = document.getElementById(pillId)
    const bar  = document.getElementById(barId)
    const low  = value <= threshold
    if (pill) pill.classList.toggle('warn-low', low)
    if (bar)  bar.classList.toggle('warn-low',  low)
}

function setArcWarn(arcId, value, threshold) {
    const el = document.getElementById(arcId)
    if (el) el.classList.toggle('warn-low', value <= threshold)
}

function refreshLights(data) {
    if (!data) return
    const hz = !!data.hazard
    flipLight('lightIndicatorLeft',  hz || !!data.indicatorLeft)
    flipLight('lightIndicatorRight', hz || !!data.indicatorRight)
    flipLight('lightHazard',    hz)
    flipLight('lightHeadlights', !!data.headlights)
    flipLight('lightHighbeam',   !!data.highbeam)
}

function flipLight(id, on) {
    const el = document.getElementById(id)
    if (el) el.classList.toggle('active', on)
}

function resName() {
    return typeof window.GetParentResourceName === 'function' ? window.GetParentResourceName() : 'cx-hud'
}

function nuiPost(endpoint, body) {
    fetch('https://' + resName() + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
    }).catch(() => {})
}

function updateWaypointChip(distStr) {
    const hasWp = distStr != null && distStr !== ''
    if (hasWp) {
        wpDistLabel.textContent = distStr
        if (!hadWaypoint) {
            clockChip.classList.add('chip-fading')
            wpChip.classList.remove('hidden')
            wpChip.classList.add('chip-visible')
            hadWaypoint = true
        }
    } else if (hadWaypoint) {
        clockChip.classList.remove('chip-fading')
        wpChip.classList.remove('chip-visible')
        wpChip.classList.add('hidden')
        hadWaypoint = false
    }
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

function handleGearChange(newGear, rpmPct) {
    if (newGear === lastGear) return
    lastGear = newGear
    if (newGear === 'R' || newGear === '0') return
    if (gearFlashTimer) clearTimeout(gearFlashTimer)
    gearBadge.classList.add('gear-shift')
    gearFlashTimer = setTimeout(() => {
        gearBadge.classList.remove('gear-shift')
        gearFlashTimer = null
    }, 280)
}

function applyRedlineFlash(rpmPct) {
    const isRed = rpmPct >= redlineRpm
    goFastRing.classList.toggle('redline-active', isRed)
}

function buildDialTicks() {
    const tickGroup = document.getElementById('dialTicks')
    if (!tickGroup) return
    const cx = 115, cy = 115, outerR = 88, majorLen = 10, minorLen = 5
    const startAngle = 0, sweep = 264, majorCount = 11, minorPerMajor = 4
    const total = (majorCount - 1) * (minorPerMajor + 1) + 1
    const step  = sweep / (total - 1)
    const NS    = 'http://www.w3.org/2000/svg'
    for (let i = 0; i < total; i++) {
        const major   = i % (minorPerMajor + 1) === 0
        const len     = major ? majorLen : minorLen
        const rad     = ((startAngle + i * step) * Math.PI) / 180
        const ox = cx + outerR * Math.cos(rad)
        const oy = cy + outerR * Math.sin(rad)
        const ix = cx + (outerR - len) * Math.cos(rad)
        const iy = cy + (outerR - len) * Math.sin(rad)
        const line = document.createElementNS(NS, 'line')
        line.setAttribute('x1', ox.toFixed(2))
        line.setAttribute('y1', oy.toFixed(2))
        line.setAttribute('x2', ix.toFixed(2))
        line.setAttribute('y2', iy.toFixed(2))
        line.setAttribute('class', major ? 'dial-tick-major' : 'dial-tick-minor')
        tickGroup.appendChild(line)
    }
}

buildDialTicks()

function applyLogo(logoConfig) {
    if (!logoConfig) return
    const img         = document.getElementById('logoImg')
    const placeholder = document.getElementById('logoPlaceholder')
    const slot        = document.getElementById('comp-logo')
    if (!img || !placeholder || !slot) return

    if (!logoConfig.url || logoConfig.url === '') {
        slot.classList.add('hidden')
        return
    }

    if (logoConfig.width)  slot.style.setProperty('--logo-w', logoConfig.width  + 'px')
    if (logoConfig.height) slot.style.setProperty('--logo-h', logoConfig.height + 'px')

    img.src = logoConfig.url
    img.classList.remove('hidden')
    placeholder.classList.add('hidden')
    img.onerror = () => {
        img.classList.add('hidden')
        placeholder.classList.remove('hidden')
    }
}

const bigPortrait    = document.getElementById('portraitImg')
const bigFallback    = document.getElementById('portraitIcon')
const previewPic     = document.getElementById('avatarPreviewImg')
const previewFallbck = document.getElementById('avatarPreviewIcon')
const urlBox         = document.getElementById('avatarUrlInput')

if (bigPortrait) bigPortrait.addEventListener('error', nukeAvatar)

function setAvatar(url) {
    if (!url || !url.trim()) { nukeAvatar(); return }
    const src = url.trim()
    bigPortrait.src = src
    bigPortrait.classList.remove('hidden')
    bigFallback.classList.add('hidden')
    previewPic.src = src
    previewPic.classList.remove('hidden')
    previewFallbck.classList.add('hidden')
    localStorage.setItem(AVATAR_KEY, src)
}

function nukeAvatar() {
    bigPortrait.src = ''
    bigPortrait.classList.add('hidden')
    bigFallback.classList.remove('hidden')
    previewPic.src = ''
    previewPic.classList.add('hidden')
    previewFallbck.classList.remove('hidden')
    if (urlBox) urlBox.value = ''
    localStorage.removeItem(AVATAR_KEY)
}

;(function() {
    const saved = localStorage.getItem(AVATAR_KEY)
    if (saved) setAvatar(saved)
})()

document.getElementById('avatarApply')?.addEventListener('click', () => setAvatar(urlBox.value))
document.getElementById('avatarClear')?.addEventListener('click', nukeAvatar)
urlBox?.addEventListener('keydown', e => { if (e.key === 'Enter') setAvatar(urlBox.value) })
urlBox?.addEventListener('input', () => {
    const val = urlBox.value.trim()
    if (val.length > 8) {
        previewPic.src = val
        previewPic.classList.remove('hidden')
        previewFallbck.classList.add('hidden')
    }
})

function openSettings() {
    settingsMenu.classList.remove('hidden')
    for (const key of Object.keys(hudState)) {
        const cb = document.getElementById('tog-' + key)
        if (cb) cb.checked = hudState[key]
    }
    const speedTog = document.getElementById('tog-speedunit')
    if (speedTog) speedTog.checked = (currentUnit === 'KMH')
    const savedAv = localStorage.getItem(AVATAR_KEY)
    if (savedAv && urlBox) urlBox.value = savedAv
}

function closeSettings() {
    settingsMenu.classList.add('hidden')
    nuiPost('menuClosed')
}

document.getElementById('menuClose')?.addEventListener('click', closeSettings)
document.getElementById('menuBackdrop')?.addEventListener('click', closeSettings)

document.addEventListener('keydown', e => {
    if (settingsMenu.classList.contains('hidden')) return
    if ((e.key === 'Escape' || e.key === 'Backspace') && document.activeElement !== urlBox) {
        e.preventDefault()
        closeSettings()
    }
})

for (const key of Object.keys(hudState)) {
    const cb = document.getElementById('tog-' + key)
    if (!cb) continue
    cb.addEventListener('change', () => {
        hudState[key] = cb.checked
        applyVisibility()
        saveHudState()
    })
}

currentUnit = loadSpeedUnit() || 'MPH'

;(function() { nuiPost('setSpeedUnit', { unit: currentUnit }) })()

const unitToggle = document.getElementById('tog-speedunit')
if (unitToggle) {
    unitToggle.checked = (currentUnit === 'KMH')
    unitToggle.addEventListener('change', () => {
        currentUnit = unitToggle.checked ? 'KMH' : 'MPH'
        saveSpeedUnit(currentUnit)
        nuiPost('setSpeedUnit', { unit: currentUnit })
    })
}

window.addEventListener('message', function(ev) {
    const action = ev.data?.action
    const data   = ev.data?.data

    if (action === 'initConfig') {
        if (data?.colors)     injectColors(data.colors)
        if (data?.defaults)   applyConfigDefaults(data.defaults)
        if (data?.thresholds) window.__cxThresh = data.thresholds
        if (data?.redline)    { redlineRpm = data.redline; buildRedlineMarker(redlineRpm) }
        if (data?.logo)       applyLogo(data.logo)
        bootHudState()
        return
    }

    if (action === 'versionInfo') {
        const badge = document.getElementById('versionBadge')
        if (!badge) return
        badge.textContent = 'v' + data.current
        badge.classList.toggle('version-outdated', !!data.outdated)
        if (data.outdated) badge.title = 'Update available: v' + data.latest
    }

    if (action === 'toggleHud') {
        theWholeHud.classList.toggle('hidden', !data.visible)
    }

    if (action === 'setPaused') {
        theWholeHud.style.visibility = data.paused ? 'hidden' : ''
    }

    if (action === 'openMenu') {
        openSettings()
    }

    if (action === 'updateStatus') {
        setTxt('voiceMode', data.voice)
        setTxt('playerId',  data.id)
        setTxt('jobLabel',  data.job)
        setTxt('jobGrade',  data.grade)
        setTxt('cash',      data.cash)
        setTxt('bank',      data.bank)
        setTxt('clock',     data.time)
        if (data.charName) setTxt('charName', data.charName)
        setTxt('street',    data.crossing?.length ? data.street + ' / ' + data.crossing : data.street)
        setTxt('zone',      data.zone)
        setTxt('direction', data.direction)

        setRing('healthBar',  data.health)
        setRing('armorBar',   data.armour)
        setRing('hungerBar',  data.hunger)
        setRing('thirstBar',  data.thirst)
        setRing('stressBar',  data.stress)
        setRing('staminaBar', data.stamina)

        talkDot.classList.toggle('talking',  !!data.talking)
        stressBubble.classList.toggle('visible',  !!data.showStress)
        staminaBubble.classList.toggle('visible', !!data.showStamina)

        updateWaypointChip(data.waypointDist || null)

        const wt = window.__cxThresh || { health: 20, hunger: 15, thirst: 15 }
        setWarn('comp-health', 'healthBar', data.health, wt.health)
        setWarn('comp-hunger', 'hungerBar', data.hunger, wt.hunger)
        setWarn('comp-thirst', 'thirstBar', data.thirst, wt.thirst)
    }

    if (action === 'updateVehicle') {
        if (!hudState.vehicle) {
            carCard.classList.add('hidden')
            lightyBois.classList.add('hidden')
            return
        }

        carCard.classList.toggle('hidden', !data.show)
        lightyBois.classList.toggle('hidden', !(hudState.lights && data.show))

        if (!data.show) return

        setTxt('speedVal',  data.speed)
        setTxt('speedUnit', data.unit)
        setTxt('gearVal',   data.gear)
        setTxt('rpmVal',    rpmDisplay(data.rpm))
        if (data.vehName) setTxt('vehName', data.vehName)

        updateSpeedRing(data.speed)
        setSideArc(petrolArc, document.getElementById('fuelPct'),   data.fuel)
        setSideArc(motorArc,  document.getElementById('enginePct'), data.engine)

        handleGearChange(data.gear, data.rpm)
        applyRedlineFlash(data.rpm)

        const beltPill = document.getElementById('seatbeltPill')
        if (beltPill) {
            const span = beltPill.querySelector('span')
            if (span) span.textContent = data.seatbelt ? 'Belt On' : 'Belt Off'
            beltPill.classList.toggle('on',        !!data.seatbelt)
            beltPill.classList.toggle('belt-warn', !data.seatbelt)
        }

        const vt = window.__cxThresh || { fuel: 10, engine: 20 }
        setArcWarn('fuelArc',   data.fuel,   vt.fuel)
        setArcWarn('engineArc', data.engine, vt.engine)

        if (data.lights) refreshLights(data.lights)
    }

    if (action === 'updateLights') {
        refreshLights(data)
    }
})

bootHudState()