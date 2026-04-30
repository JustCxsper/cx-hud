import {
  hudState, hudVisible, hudPaused, inventoryHidden,
  status, vehicle, weapon, config, versionInfo, menuOpen,
} from './stores.js'

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

function applyMinimapGeo(geo) {
  if (!geo) return
  const root = document.documentElement.style
  if (geo.left   != null) root.setProperty('--mm-left', geo.left   + 'px')
  if (geo.top    != null) root.setProperty('--mm-top',  geo.top    + 'px')
  if (geo.width  != null) root.setProperty('--mm-w',    geo.width  + 'px')
  if (geo.height != null) root.setProperty('--mm-h',    geo.height + 'px')
  if (geo.insetX != null) root.setProperty('--sz-inset-x', geo.insetX + 'px')
  if (geo.insetY != null) root.setProperty('--sz-inset-y', geo.insetY + 'px')
}

const handlers = {
  initConfig(data) {
    if (!data) return
    if (data.colors) injectColors(data.colors)
    config.update((c) => ({
      ...c,
      colors: data.colors ?? c.colors,
      thresholds: { ...c.thresholds, ...(data.thresholds || {}) },
      redline: data.redline ?? c.redline,
      logo: data.logo ?? c.logo,
      menuOptions: data.menuOptions ?? c.menuOptions,
      defaults: data.defaults ?? c.defaults,
      minimapGeo: data.minimapGeo ?? c.minimapGeo,
    }))
    if (data.minimapGeo) applyMinimapGeo(data.minimapGeo)
    if (data.defaults) hudState.applyDefaults(data.defaults)
  },
  setMinimapGeo(data) {
    config.update((c) => ({ ...c, minimapGeo: data }))
    applyMinimapGeo(data)
  },
  versionInfo(data) {
    versionInfo.set({
      current: data.current,
      outdated: !!data.outdated,
      latest: data.latest || null,
    })
  },
  toggleHud(data) {
    hudVisible.set(!!data.visible)
  },
  setPaused(data) {
    hudPaused.set(!!data.paused)
  },
  openMenu() {
    menuOpen.set(true)
  },
  updateStatus(data) {
    status.update((s) => {
      const next = { ...s }
      for (const key of [
        'voice', 'talking', 'id', 'job', 'grade', 'cash', 'bank', 'time',
        'charName', 'street', 'crossing', 'zone', 'direction',
        'health', 'armour', 'hunger', 'thirst', 'stress', 'stamina',
        'showStress', 'showStamina',
      ]) {
        if (data[key] !== undefined) next[key] = data[key]
      }
      if (data.waypointDist !== undefined) next.waypointDist = data.waypointDist || null
      return next
    })
  },
  updateVehicle(data) {
    vehicle.update((v) => ({ ...v, ...data }))
  },
  updateLights(data) {
    vehicle.update((v) => ({ ...v, lights: data }))
  },
  updateWeapon(data) {
    weapon.update((w) => ({ ...w, ...data }))
  },
  hideHud() {
    inventoryHidden.set(true)
  },
  showHud() {
    inventoryHidden.set(false)
  },
}

export function attachMessageBus() {
  const onMessage = (ev) => {
    const { action, data } = ev.data ?? {}
    if (!action) return
    const fn = handlers[action]
    if (fn) fn(data)
  }
  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}

export function dispatchAction(action, data) {
  window.postMessage({ action, data }, '*')
}
