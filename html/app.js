const theWholeHud   = document.getElementById('hud')
const carCard       = document.getElementById('vehicleCard')
const lightyBois    = document.getElementById('lightsPanel')
const stressBubble  = document.getElementById('stressPill')
const staminaBubble = document.getElementById('staminaPill')
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
const voiceRingContainer = document.getElementById('comp-voice')

const elPlayerId   = document.getElementById('playerId')
const elJobLabel   = document.getElementById('jobLabel')
const elJobGrade   = document.getElementById('jobGrade')
const elCash       = document.getElementById('cash')
const elBank       = document.getElementById('bank')
const elClock      = document.getElementById('clock')
const elCharName   = document.getElementById('charName')
const elStreet     = document.getElementById('street')
const elZone       = document.getElementById('zone')
const elDirection  = document.getElementById('direction')
const elHealthBar  = document.getElementById('healthBar')
const elArmorBar   = document.getElementById('armorBar')
const elHungerBar  = document.getElementById('hungerBar')
const elThirstBar  = document.getElementById('thirstBar')
const elStressBar  = document.getElementById('stressBar')
const elStaminaBar = document.getElementById('staminaBar')
const elCompHealth = document.getElementById('comp-health')
const elCompHunger = document.getElementById('comp-hunger')
const elCompThirst = document.getElementById('comp-thirst')
const elStatusRow  = document.getElementById('statusRow')
const elSpeedVal   = document.getElementById('speedVal')
const elSpeedUnit  = document.getElementById('speedUnit')
const elRpmVal     = document.getElementById('rpmVal')
const elVehName    = document.getElementById('vehName')
const elFuelPct    = document.getElementById('fuelPct')
const elEnginePct  = document.getElementById('enginePct')
const elSeatbelt   = document.getElementById('seatbeltPill')
const elSeatbeltSp = elSeatbelt?.querySelector('span')
const elLightLeft  = document.getElementById('lightIndicatorLeft')
const elLightRight = document.getElementById('lightIndicatorRight')
const elLightHaz   = document.getElementById('lightHazard')
const elLightHead  = document.getElementById('lightHeadlights')
const elLightHigh  = document.getElementById('lightHighbeam')


const SAVE_KEY   = 'cx_hud_state_v1'
const SPEED_KEY  = 'cx_hud_speed_v1'
const AVATAR_KEY = 'cx_hud_avatar_v1'

const RES_NAME = typeof window.GetParentResourceName === 'function'
    ? window.GetParentResourceName()
    : 'cx-hud'

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

function applyMinimapGeo(geo) {
    if (!geo) return
    const root = document.documentElement.style
    if (geo.left   != null) root.setProperty('--mm-left', geo.left + 'px')
    if (geo.top    != null) root.setProperty('--mm-top',  geo.top  + 'px')
    if (geo.width  != null) root.setProperty('--mm-w',    geo.width  + 'px')
    if (geo.height != null) root.setProperty('--mm-h',    geo.height + 'px')
    if (geo.insetX != null) root.setProperty('--sz-inset-x', geo.insetX + 'px')
    if (geo.insetY != null) root.setProperty('--sz-inset-y', geo.insetY + 'px')
}

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

    if (elStatusRow) {
        elStatusRow.classList.toggle('hidden', !(hudState.health || hudState.armor || hudState.hunger || hudState.thirst))
    }

    carCard.classList.toggle('hidden', !hudState.vehicle)

    cineTop.classList.toggle('hidden',    !hudState.cinebars)
    cineBottom.classList.toggle('hidden', !hudState.cinebars)
}

function bootHudState() {
    loadHudState()
    applyVisibility()
}

const RING_CIRC     = 2 * Math.PI * 20
const RING_CIRC_STR = RING_CIRC + ' ' + RING_CIRC

function initRings() {
    for (const el of [elHealthBar, elArmorBar, elHungerBar, elThirstBar, elStressBar, elStaminaBar]) {
        if (el) el.style.strokeDasharray = RING_CIRC_STR
    }
}

function setRing(el, value) {
    if (!el) return
    const pct = Math.max(0, Math.min(100, value || 0))
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

function setWarn(pillEl, barEl, value, threshold) {
    const low = value <= threshold
    if (pillEl) pillEl.classList.toggle('warn-low', low)
    if (barEl)  barEl.classList.toggle('warn-low',  low)
}

function setArcWarn(el, value, threshold) {
    if (el) el.classList.toggle('warn-low', value <= threshold)
}

function refreshLights(data) {
    if (!data) return
    const hz = !!data.hazard
    flipLight(elLightLeft,  hz || !!data.indicatorLeft)
    flipLight(elLightRight, hz || !!data.indicatorRight)
    flipLight(elLightHaz,   hz)
    flipLight(elLightHead,  !!data.headlights)
    flipLight(elLightHigh,  !!data.highbeam)
}

function flipLight(el, on) {
    if (el) el.classList.toggle('active', on)
}

function nuiPost(endpoint, body) {
    fetch('https://' + RES_NAME + '/' + endpoint, {
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
    const frag  = document.createDocumentFragment()
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
        frag.appendChild(line)
    }
    tickGroup.appendChild(frag)
}

buildDialTicks()
initRings()

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

const handlers = {
    initConfig(data) {
        if (data?.colors)     injectColors(data.colors)
        if (data?.defaults)   applyConfigDefaults(data.defaults)
        if (data?.thresholds) window.__cxThresh = data.thresholds
        if (data?.redline)    { redlineRpm = data.redline; buildRedlineMarker(redlineRpm) }
        if (data?.logo)       applyLogo(data.logo)
        applyMinimapGeo(data?.minimapGeo)
        bootHudState()
    },

    setMinimapGeo(data) {
        applyMinimapGeo(data)
    },

    versionInfo(data) {
        const badge = document.getElementById('versionBadge')
        if (!badge) return
        badge.textContent = 'v' + data.current
        badge.classList.toggle('version-outdated', !!data.outdated)
        if (data.outdated) badge.title = 'Update available: v' + data.latest
    },

    toggleHud(data) {
        theWholeHud.classList.toggle('hidden', !data.visible)
    },

    setPaused(data) {
        theWholeHud.style.visibility = data.paused ? 'hidden' : ''
    },

    openMenu() {
        openSettings()
    },

    updateStatus(data) {
        if (data.voice !== undefined) {
            if (voiceRingContainer) {
                voiceRingContainer.classList.remove('mode-Whisper', 'mode-Normal', 'mode-Shout');
                voiceRingContainer.classList.add('mode-' + data.voice);
            }
        }
        if (data.id        !== undefined) elPlayerId.textContent  = data.id
        if (data.job       !== undefined) elJobLabel.textContent  = data.job
        if (data.grade     !== undefined) elJobGrade.textContent  = data.grade
        if (data.cash      !== undefined) elCash.textContent      = data.cash
        if (data.bank      !== undefined) elBank.textContent      = data.bank
        if (data.time      !== undefined) elClock.textContent     = data.time
        if (data.charName  !== undefined) elCharName.textContent  = data.charName
        if (data.zone      !== undefined) elZone.textContent      = data.zone
        if (data.direction !== undefined) elDirection.textContent = data.direction

        if (data.street !== undefined || data.crossing !== undefined) {
            if (data.street   !== undefined) elStreet._lastStreet   = data.street
            if (data.crossing !== undefined) elStreet._lastCrossing = data.crossing
            const s = elStreet._lastStreet   || ''
            const c = elStreet._lastCrossing || ''
            elStreet.textContent = c.length ? s + ' / ' + c : s
        }

        if (data.health  !== undefined) setRing(elHealthBar,  data.health)
        if (data.armour  !== undefined) setRing(elArmorBar,   data.armour)
        if (data.hunger  !== undefined) setRing(elHungerBar,  data.hunger)
        if (data.thirst  !== undefined) setRing(elThirstBar,  data.thirst)
        if (data.stress  !== undefined) setRing(elStressBar,  data.stress)
        if (data.stamina !== undefined) setRing(elStaminaBar, 100 - (data.stamina || 0))

        if (data.talking !== undefined) {
            if (voiceRingContainer) voiceRingContainer.classList.toggle('talking', !!data.talking);
        }

        if (data.showStress  !== undefined) stressBubble.classList.toggle('visible',  !!data.showStress)
        if (data.showStamina !== undefined) staminaBubble.classList.toggle('visible', !!data.showStamina)

        if (data.waypointDist !== undefined) updateWaypointChip(data.waypointDist || null)

        const wt = window.__cxThresh || { health: 20, hunger: 15, thirst: 15 }
        if (data.health !== undefined) setWarn(elCompHealth, elHealthBar, data.health, wt.health)
        if (data.hunger !== undefined) setWarn(elCompHunger, elHungerBar, data.hunger, wt.hunger)
        if (data.thirst !== undefined) setWarn(elCompThirst, elThirstBar, data.thirst, wt.thirst)
    },

    updateVehicle(data) {
        if (!hudState.vehicle) {
            carCard.classList.add('hidden')
            lightyBois.classList.add('hidden')
            return
        }

        carCard.classList.toggle('hidden', !data.show)
        lightyBois.classList.toggle('hidden', !(hudState.lights && data.show))

        if (!data.show) return

        elSpeedVal.textContent  = data.speed
        elSpeedUnit.textContent = data.unit
        gearBadge.textContent   = data.gear
        elRpmVal.textContent    = rpmDisplay(data.rpm)
        if (data.vehName) elVehName.textContent = data.vehName

        updateSpeedRing(data.speed)
        setSideArc(petrolArc, elFuelPct,   data.fuel)
        setSideArc(motorArc,  elEnginePct, data.engine)

        handleGearChange(data.gear, data.rpm)
        applyRedlineFlash(data.rpm)

        if (elSeatbelt) {
            if (elSeatbeltSp) elSeatbeltSp.textContent = data.seatbelt ? 'Belt On' : 'Belt Off'
            elSeatbelt.classList.toggle('on',        !!data.seatbelt)
            elSeatbelt.classList.toggle('belt-warn', !data.seatbelt)
        }

        const vt = window.__cxThresh || { fuel: 10, engine: 20 }
        setArcWarn(petrolArc, data.fuel,   vt.fuel)
        setArcWarn(motorArc,  data.engine, vt.engine)

        if (data.lights) refreshLights(data.lights)
    },

    updateLights(data) {
        refreshLights(data)
    },
}

window.addEventListener('message', ev => {
    const { action, data } = ev.data ?? {}
    handlers[action]?.(data)
})

window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.action === 'hideHud') {
        theWholeHud.classList.add('inventory-hidden');
    }

    if (data.action === 'showHud') {
        theWholeHud.classList.remove('inventory-hidden');
    }
});

bootHudState()
