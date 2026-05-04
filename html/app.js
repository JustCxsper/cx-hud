const hudRoot   = document.getElementById('hud')
const vehicleCard       = document.getElementById('vehicleCard')
const weaponCard    = document.getElementById('weaponCard')
const lightsPanel    = document.getElementById('lightsPanel')
const stressPill  = document.getElementById('stressPill')
const staminaPill = document.getElementById('staminaPill')
const speedRing    = document.getElementById('speedRing')
const settingsMenu  = document.getElementById('hudMenu')
const fuelArc     = document.getElementById('fuelArc')
const engineArc      = document.getElementById('engineArc')
const streetPill      = document.getElementById('streetPill')
const wpWrap        = document.querySelector('.clock-waypoint-wrap')
const clockChip     = document.getElementById('clockBadge')
const wpChip        = document.getElementById('waypointChip')
const wpDistLabel   = document.getElementById('waypointDist')
const cineTop       = document.getElementById('cinebarTop')
const cineBottom    = document.getElementById('cinebarBottom')
const gearDisplay     = document.getElementById('gearVal')
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

const SAVE_KEY   = 'cx_hud_state_v2'
const SPEED_KEY  = 'cx_hud_speed_v1'
const AVATAR_KEY = 'cx_hud_avatar_v1'

const RES_NAME = typeof window.GetParentResourceName === 'function'
    ? window.GetParentResourceName()
    : 'cx-hud'

const hudState = {
    portrait: true, charname: true, voice: true, playerid: false,
    logo: true, job: true, cash: true, bank: true,
    minimap: true, minimapBorder: true, streetPill: true, streetclock: true, statusRow: true,
    health: true, armor: true, hunger: true, thirst: true,
    vehicle: true, lights: true, cinebars: false, weapon: true,
}

let currentUnit = null
let hadWaypoint = false

const vehicleViewState = {
    show: false,
    speed: 0,
    unit: 'MPH',
    rpm: 0,
    gear: 'N',
    fuel: 0,
    engine: 0,
    vehName: '',
    seatbelt: false,
}

function nuiPost(endpoint, body) {
    fetch('https://' + RES_NAME + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
    }).catch(() => {})
}


function sendNuiViewport() {
    nuiPost('nuiViewport', {
        width: window.innerWidth || 1920,
        height: window.innerHeight || 1080,
    })
}

window.addEventListener('resize', sendNuiViewport)
setTimeout(sendNuiViewport, 100)
setTimeout(sendNuiViewport, 500)
setTimeout(sendNuiViewport, 2000)

function applyMinimapGeo(geo) {
    if (!geo) return
    const root = document.documentElement.style
    if (geo.left   != null) root.setProperty('--mm-left', geo.left   + 'px')
    if (geo.top    != null) root.setProperty('--mm-top',  geo.top    + 'px')
    if (geo.width  != null) root.setProperty('--mm-w',    geo.width  + 'px')
    if (geo.height != null) root.setProperty('--mm-h',    geo.height + 'px')
    if (geo.insetX != null) root.setProperty('--sz-inset-x', geo.insetX + 'px')
    if (geo.insetY != null) root.setProperty('--sz-inset-y', geo.insetY + 'px')

    const pill = document.getElementById('streetPill')
    const statusRow = document.getElementById('statusRow')
    const saved = (() => { try { return JSON.parse(localStorage.getItem('cx_hud_layout_v1') || '{}') } catch (_) { return {} } })()

    const editorOpen = typeof edIsOpen !== 'undefined' && edIsOpen()
    if (!editorOpen) {
        if (pill && !saved.streetPill) {
            pill.style.left = ''
            pill.style.top  = ''
        }
        if (statusRow && !saved.statusRow) {
            statusRow.style.left = ''
            statusRow.style.top  = ''
        }
    }
    if (typeof edForceRingRepaint === 'function') edForceRingRepaint()

    if (typeof edIsOpen !== 'undefined' && edIsOpen() && typeof edHandles !== 'undefined') {
        const mmHandle = edHandles.find(h => h.block.isMinimap)
        if (mmHandle) setTimeout(() => edSyncHandle(mmHandle), 0)
    }
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
        ringWeapon: '--ring-weapon', ringWeaponLow: '--ring-weapon-low',
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
    const tlCard = document.querySelector('.tl-card')
    if (tlCard) {
        const showTlCard = hudState.portrait || hudState.charname || hudState.playerid
        tlCard.classList.toggle('hidden', !showTlCard)
    }
    if (streetPill) streetPill.classList.toggle('hidden', !hudState.streetPill)
    if (wpWrap) wpWrap.classList.toggle('hidden', !hudState.streetclock)
    if (clockChip) clockChip.classList.toggle('hidden', !hudState.streetclock)
    if (elStatusRow) {
        elStatusRow.classList.toggle('hidden', !(hudState.statusRow && (hudState.health || hudState.armor || hudState.hunger || hudState.thirst)))
    }
    vehicleCard.classList.toggle('hidden', !(hudState.vehicle && vehicleViewState.show))
    lightsPanel.classList.toggle('hidden', !(hudState.lights && hudState.vehicle && vehicleViewState.show))
    cineTop.classList.toggle('hidden',    !hudState.cinebars)
    cineBottom.classList.toggle('hidden', !hudState.cinebars)
    if (weaponCard) {
        weaponCard.classList.toggle('hud-weapon-disabled', !hudState.weapon)
        if (!hudState.weapon) weaponCard.classList.remove('weapon-visible')
    }
    const borderRing = document.querySelector('.minimap-border-ring')
    if (borderRing) borderRing.classList.toggle('hidden', !(hudState.minimap && hudState.minimapBorder))
}

function applyLockedOptions() {
    const opts = window.__menuOptions || {}

    let locked = []
    if (Array.isArray(opts.locked)) {
        locked = opts.locked
    } else {
        for (const [key, allowed] of Object.entries(opts)) {
            if (allowed === false) locked.push(key)
        }
    }

    for (const key of locked) {
        const row = document.querySelector(`label[for="tog-${key}"]`) || document.getElementById('tog-' + key)?.closest('.hud-toggle-row')
        if (row) {
            row.style.opacity = '0.45'
            row.style.pointerEvents = 'none'
        }
        const cb = document.getElementById('tog-' + key)
        if (cb) cb.disabled = true
    }
}

function bootHudState() {
    loadHudState()
    applyVisibility()
    applyLockedOptions()
}

const RING_CIRC     = 125.66
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

function setWarn(pillEl, barEl, value, threshold) {
    const low = value <= threshold
    if (pillEl) pillEl.classList.toggle('warn-low', low)
    if (barEl)  barEl.classList.toggle('warn-low',  low)
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

function applyLogo(logoConfig) {
    if (!logoConfig) return
    const img         = document.getElementById('logoImg')
    const placeholder = document.getElementById('logoPlaceholder')
    const slot        = document.getElementById('comp-logo')
    if (!img || !placeholder || !slot) return
    if (logoConfig.transparentBg) {
        slot.classList.remove('glass')
    } else {
        slot.classList.add('glass')
    }
    if (!logoConfig.url || logoConfig.url === '') { slot.classList.add('hidden'); return }
    if (logoConfig.width)  slot.style.setProperty('--logo-w', logoConfig.width  + 'px')
    if (logoConfig.height) slot.style.setProperty('--logo-h', logoConfig.height + 'px')
    img.src = logoConfig.url
    img.classList.remove('hidden')
    placeholder.classList.add('hidden')
    img.onerror = () => { img.classList.add('hidden'); placeholder.classList.remove('hidden') }
}


const elWeaponCard       = document.getElementById('weaponCard')
const elWeaponImg        = document.getElementById('weaponImg')
const elWeaponIcon       = document.getElementById('weaponIcon')
const elWeaponName       = document.getElementById('weaponName')
const elWeaponAmmoRow = document.getElementById('weaponAmmoRow')
const elWeaponAmmoClip = document.getElementById('weaponAmmoClip')
const elWeaponAmmoLabel = document.getElementById('weaponAmmoLabel')
const elWeaponMeleeLabel = document.getElementById('weaponMeleeLabel')
const elWeaponRechargeRow = document.getElementById('weaponRechargeRow')
const elWeaponRechargeFill = document.getElementById('weaponRechargeFill')
const elWeaponRechargeLabel = document.getElementById('weaponRechargeLabel')
let rechargeRaf = null
let taserRecharging = false

const handlers = {
    initConfig(data) {
        if (data?.colors)     injectColors(data.colors)
        if (data?.thresholds) window.__cxThresh = data.thresholds
        if (data?.redline)    { redlineRpm = data.redline; buildRedlineMarker(redlineRpm) }
        if (data?.logo)       applyLogo(data.logo)
        if (data?.menuOptions) window.__menuOptions = data.menuOptions
        applyMinimapGeo(data?.minimapGeo)
        if (data?.defaults)   applyConfigDefaults(data.defaults)
        bootHudState()
        const savedUnit = loadSpeedUnit()
        if (savedUnit) nuiPost('setSpeedUnit', { unit: savedUnit })
        if (typeof edApplyOnBoot === 'function') edApplyOnBoot()
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

    playerLayout(data) {
        if (!data || typeof data.layout !== 'object') return
        try { localStorage.setItem('cx_hud_layout_v1', JSON.stringify(data.layout)) } catch (_) {}
        if (Object.keys(data.layout).length > 0 && typeof edApplyOnBoot === 'function') edApplyOnBoot()
    },

    serverDefaultLayout(data) {
        if (typeof edSetCanSaveDefault === 'function') edSetCanSaveDefault(!!data.canSetDefault)
        if (!data.layout) return
        try {
            const raw = localStorage.getItem('cx_hud_layout_v1')
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Object.keys(parsed).length > 0) return
            }
            localStorage.setItem('cx_hud_layout_v1', JSON.stringify(data.layout))
            if (typeof edApplyOnBoot === 'function') edApplyOnBoot()
        } catch (_) {}
    },

    saveDefaultResult(data) {
        if (typeof edHandleSaveResult === 'function') edHandleSaveResult(data.success, data.message)
    },

    toggleHud(data) {
        hudRoot.classList.toggle('hidden', !data.visible)
    },

    setPaused(data) {
        hudRoot.style.visibility = data.paused ? 'hidden' : ''
    },

    openMenu() {
        openSettings()
    },

    updateStatus(data) {
        if (data.voice !== undefined) {
            if (voiceRingContainer) {
                voiceRingContainer.classList.remove('mode-Whisper', 'mode-Normal', 'mode-Shout')
                voiceRingContainer.classList.add('mode-' + data.voice)
            }
        }
        if (data.id        !== undefined) elPlayerId.textContent  = data.id
        if (data.job       !== undefined) elJobLabel.textContent  = data.job
        if (data.grade     !== undefined) elJobGrade.textContent  = data.grade
        if (data.cash      !== undefined) elCash.textContent      = data.cash
        if (data.bank      !== undefined) elBank.textContent      = data.bank
        if (data.time      !== undefined) elClock.textContent     = data.time
        if (data.charName  !== undefined) elCharName.textContent  = data.charName
        if (data.zone      !== undefined) elStreet._lastZone     = data.zone
        if (data.direction !== undefined) elDirection.textContent = data.direction

        if (data.street !== undefined || data.crossing !== undefined || data.zone !== undefined) {
            if (data.street   !== undefined) elStreet._lastStreet   = data.street
            if (data.crossing !== undefined) elStreet._lastCrossing = data.crossing
            const s = elStreet._lastStreet   || ''
            const c = elStreet._lastCrossing || ''
            const z = elStreet._lastZone     || ''
            elStreet.textContent = s
            elZone.textContent   = c.length ? c + '  ·  ' + z : z
        }

        if (data.health  !== undefined) setRing(elHealthBar,  data.health)
        if (data.armour  !== undefined) setRing(elArmorBar,   data.armour)
        if (data.hunger  !== undefined) setRing(elHungerBar,  data.hunger)
        if (data.thirst  !== undefined) setRing(elThirstBar,  data.thirst)
        if (data.stress  !== undefined) setRing(elStressBar,  data.stress)
        if (data.stamina !== undefined) setRing(elStaminaBar, 100 - (data.stamina || 0))

        if (data.talking !== undefined) {
            if (voiceRingContainer) voiceRingContainer.classList.toggle('talking', !!data.talking)
        }

        if (data.showStress  !== undefined) stressPill.classList.toggle('visible',  !!data.showStress)
        if (data.showStamina !== undefined) staminaPill.classList.toggle('visible', !!data.showStamina)

        if (data.waypointDist !== undefined) updateWaypointChip(data.waypointDist || null)

        const wt = window.__cxThresh || { health: 20, hunger: 15, thirst: 15 }
        if (data.health !== undefined) setWarn(elCompHealth, elHealthBar, data.health, wt.health)
        if (data.hunger !== undefined) setWarn(elCompHunger, elHungerBar, data.hunger, wt.hunger)
        if (data.thirst !== undefined) setWarn(elCompThirst, elThirstBar, data.thirst, wt.thirst)
    },

    updateVehicle(data) {
        if (!data) return
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) vehicleViewState[key] = value
        }

        if (!vehicleViewState.show) {
            vehicleCard.classList.add('hidden')
            lightsPanel.classList.add('hidden')
            return
        }

        const canShowVehicle = hudState.vehicle && vehicleViewState.show
        vehicleCard.classList.toggle('hidden', !canShowVehicle)
        lightsPanel.classList.toggle('hidden', !(canShowVehicle && hudState.lights))
        if (!canShowVehicle) return

        elSpeedVal.textContent  = vehicleViewState.speed ?? 0
        elSpeedUnit.textContent = vehicleViewState.unit || 'MPH'
        gearDisplay.textContent = vehicleViewState.gear || 'N'
        elRpmVal.textContent    = rpmDisplay(vehicleViewState.rpm)
        if (vehicleViewState.vehName) elVehName.textContent = vehicleViewState.vehName

        updateSpeedRing(vehicleViewState.speed)
        setSideArc(fuelArc,    elFuelPct,    vehicleViewState.fuel)
        setSideArc(engineArc,  elEnginePct,  vehicleViewState.engine)
        handleGearChange(vehicleViewState.gear)
        applyRedlineFlash(vehicleViewState.rpm)

        if (elSeatbelt) {
            if (elSeatbeltSp) elSeatbeltSp.textContent = vehicleViewState.seatbelt ? 'Belt On' : 'Belt Off'
            elSeatbelt.classList.toggle('on',        !!vehicleViewState.seatbelt)
            elSeatbelt.classList.toggle('belt-warn', !vehicleViewState.seatbelt)
        }

        const vt = window.__cxThresh || { fuel: 10, engine: 20 }
        setArcWarn(fuelArc,    vehicleViewState.fuel,    vt.fuel)
        setArcWarn(engineArc,  vehicleViewState.engine,  vt.engine)

        if (data.lights) refreshLights(data.lights)
    },

    updateLights(data) {
        refreshLights(data)
        const canShowVehicle = hudState.vehicle && vehicleViewState.show
        lightsPanel.classList.toggle('hidden', !(canShowVehicle && hudState.lights))
    },

    updateWeapon(data) {
        if (!elWeaponCard) return
        if (!data.show || !hudState.weapon) {
            elWeaponCard.classList.remove('weapon-visible')
            return
        }

        elWeaponCard.classList.remove('hidden', 'hud-weapon-disabled')
        requestAnimationFrame(() => elWeaponCard.classList.add('weapon-visible'))

        if (elWeaponImg && elWeaponIcon && data.weapName) {
            const imageBase = data.weaponImageBase
            const sources = imageBase
                ? (/\.(png|webp)$/i.test(imageBase) ? [imageBase] : [imageBase + '.png', imageBase + '.webp'])
                : []
            const key = sources.join('|')

            if (elWeaponImg.dataset.srcKey !== key) {
                elWeaponImg.dataset.srcKey = key
                elWeaponImg.dataset.tryIndex = '0'
                elWeaponImg.classList.add('hidden')
                elWeaponIcon.classList.add('hidden')

                const trySource = () => {
                    const index = Number(elWeaponImg.dataset.tryIndex || 0)
                    const src = sources[index]
                    if (!src) {
                        elWeaponImg.classList.add('hidden')
                        elWeaponIcon.classList.remove('hidden')
                        return
                    }
                    elWeaponImg.src = src
                }

                elWeaponImg.onload = () => {
                    elWeaponImg.classList.remove('hidden')
                    elWeaponIcon.classList.add('hidden')
                }

                elWeaponImg.onerror = () => {
                    elWeaponImg.dataset.tryIndex = String(Number(elWeaponImg.dataset.tryIndex || 0) + 1)
                    trySource()
                }

                trySource()
            }
        }

        if (elWeaponName) elWeaponName.textContent = data.weapName
            ? data.weapName.replace('weapon_', '').replace(/_/g, ' ').replace(/\w/g, c => c.toUpperCase())
            : 'Unknown'

        const isMeleeOrThrow = data.isMelee || data.isThrow
        const isRecharging = !!data.recharging
        const isPetrolcan = data.weapName === 'weapon_petrolcan'

        if (elWeaponAmmoRow) elWeaponAmmoRow.classList.toggle('hidden', isMeleeOrThrow || data.isTaser || isPetrolcan)
        if (elWeaponRechargeRow) elWeaponRechargeRow.classList.toggle('hidden', !data.isTaser)
        if (elWeaponMeleeLabel) elWeaponMeleeLabel.classList.toggle('hidden', !isMeleeOrThrow)

        if (data.isTaser) {
            elWeaponCard.classList.remove('ammo-low')
            if (isRecharging && !taserRecharging) {
                taserRecharging = true
                if (rechargeRaf) cancelAnimationFrame(rechargeRaf)
                const ms = data.rechargeMs || 3000
                const start = performance.now()
                if (elWeaponRechargeFill) elWeaponRechargeFill.style.width = '0%'
                if (elWeaponRechargeFill) elWeaponRechargeFill.classList.add('charging')
                if (elWeaponRechargeRow) elWeaponRechargeRow.classList.remove('ready')
                if (elWeaponRechargeRow) elWeaponRechargeRow.classList.add('charging')
                if (elWeaponRechargeLabel) elWeaponRechargeLabel.textContent = 'CHARGING'
                const tick = (now) => {
                    const pct = Math.min(1, (now - start) / ms)
                    if (elWeaponRechargeFill) elWeaponRechargeFill.style.width = (pct * 100) + '%'
                    if (pct < 1) {
                        rechargeRaf = requestAnimationFrame(tick)
                    } else {
                        rechargeRaf = null
                        taserRecharging = false
                        elWeaponRechargeFill && elWeaponRechargeFill.classList.remove('charging')
                        elWeaponRechargeRow && elWeaponRechargeRow.classList.remove('charging')
                        elWeaponRechargeRow && elWeaponRechargeRow.classList.add('ready')
                        elWeaponRechargeLabel && (elWeaponRechargeLabel.textContent = 'READY')
                        setTimeout(() => elWeaponRechargeRow && elWeaponRechargeRow.classList.remove('ready'), 900)
                    }
                }
                rechargeRaf = requestAnimationFrame(tick)
            } else if (!isRecharging && !taserRecharging) {
                if (elWeaponRechargeFill) elWeaponRechargeFill.style.width = '100%'
                if (elWeaponRechargeLabel) elWeaponRechargeLabel.textContent = 'READY'
            }
        } else if (!isMeleeOrThrow) {
            if (elWeaponAmmoClip) elWeaponAmmoClip.textContent = data.ammoClip ?? 0
            if (elWeaponAmmoLabel) elWeaponAmmoLabel.textContent = data.ammoLabel || 'AMMO'
            elWeaponCard.classList.toggle('ammo-low', !!data.low)
        } else {
            elWeaponCard.classList.remove('ammo-low')
        }
    },
}

window.addEventListener('message', ev => {
    const { action, data } = ev.data ?? {}
    handlers[action]?.(data)
    if (action === 'hideHud') hudRoot.classList.add('inventory-hidden')
    if (action === 'showHud') hudRoot.classList.remove('inventory-hidden')
})

initRings()
bootHudState()
