import { writable, derived } from 'svelte/store'

const SAVE_KEY = 'cx_hud_state_v2'
const SPEED_KEY = 'cx_hud_speed_v1'
const AVATAR_KEY = 'cx_hud_avatar_v1'
const LAYOUT_KEY = 'cx_hud_layout_v1'

export const STORAGE_KEYS = { SAVE_KEY, SPEED_KEY, AVATAR_KEY, LAYOUT_KEY }

const defaultHudState = {
  portrait: true, charname: true, voice: true, playerid: false,
  logo: true, job: true, cash: true, bank: true,
  minimap: true, streetclock: true, health: true, armor: true, hunger: true, thirst: true,
  vehicle: true, lights: true, cinebars: false, weapon: true,
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

function makeHudStateStore() {
  const initial = { ...defaultHudState, ...(readJSON(SAVE_KEY, {}) || {}) }
  const { subscribe, set, update } = writable(initial)
  return {
    subscribe,
    set: (v) => { set(v); writeJSON(SAVE_KEY, v) },
    update: (fn) => update((s) => { const n = fn(s); writeJSON(SAVE_KEY, n); return n }),
    setKey: (key, val) => update((s) => { s[key] = val; return s }),
    applyDefaults: (defaults) => {
      if (!defaults) return
      update((s) => {
        for (const key of Object.keys(defaultHudState)) {
          if (typeof defaults[key] === 'boolean') s[key] = defaults[key]
        }
        return s
      })
    },
    reset: () => set({ ...defaultHudState }),
  }
}

export const hudState = makeHudStateStore()

export const hudVisible = writable(false)
export const hudPaused = writable(false)
export const inventoryHidden = writable(false)

export const status = writable({
  voice: 'Normal',
  talking: false,
  id: '1',
  job: 'Civilian',
  grade: 'Freelancer',
  cash: '$0',
  bank: '$0',
  time: '00:00',
  charName: 'Player',
  street: 'Loading...',
  crossing: '',
  zone: 'San Andreas',
  direction: 'N',
  health: 100,
  armour: 0,
  hunger: 100,
  thirst: 100,
  stress: 0,
  stamina: 100,
  showStress: false,
  showStamina: false,
  waypointDist: null,
})

export const vehicle = writable({
  show: false,
  speed: 0,
  unit: 'MPH',
  gear: '1',
  rpm: 0,
  vehName: '',
  fuel: 100,
  engine: 100,
  seatbelt: false,
  lights: null,
})

export const weapon = writable({
  show: false,
  weapName: '',
  weaponImageBase: null,
  ammoClip: 0,
  ammoLabel: 'AMMO',
  isMelee: false,
  isThrow: false,
  low: false,
})

export const config = writable({
  colors: null,
  thresholds: { health: 20, hunger: 15, thirst: 15, fuel: 10, engine: 20 },
  redline: 85,
  logo: null,
  menuOptions: { locked: [] },
  defaults: null,
  minimapGeo: null,
})

export const versionInfo = writable({ current: '2.0.0', outdated: false, latest: null })

export const menuOpen = writable(false)
export const editorOpen = writable(false)

const initialLayout = readJSON(LAYOUT_KEY, {}) || {}
function makeLayoutStore() {
  const { subscribe, set, update } = writable(initialLayout)
  return {
    subscribe,
    set: (v) => { set(v); writeJSON(LAYOUT_KEY, v) },
    update: (fn) => update((s) => { const n = fn(s); writeJSON(LAYOUT_KEY, n); return n }),
    save: () => {
      let cur
      subscribe((v) => (cur = v))()
      writeJSON(LAYOUT_KEY, cur)
    },
    reset: () => { set({}) },
  }
}
export const layout = makeLayoutStore()

const initialUnit = (() => {
  try { return localStorage.getItem(SPEED_KEY) || 'MPH' } catch { return 'MPH' }
})()
function makeUnitStore() {
  const { subscribe, set } = writable(initialUnit)
  return {
    subscribe,
    set: (v) => { try { localStorage.setItem(SPEED_KEY, v) } catch {} ; set(v) },
  }
}
export const speedUnit = makeUnitStore()

const initialAvatar = (() => {
  try { return localStorage.getItem(AVATAR_KEY) || '' } catch { return '' }
})()
function makeAvatarStore() {
  const { subscribe, set } = writable(initialAvatar)
  return {
    subscribe,
    set: (url) => {
      try {
        if (url) localStorage.setItem(AVATAR_KEY, url)
        else localStorage.removeItem(AVATAR_KEY)
      } catch {}
      set(url || '')
    },
  }
}
export const avatar = makeAvatarStore()

export const showTopLeft = derived(hudState, ($s) => $s.portrait || $s.charname || $s.playerid)
export const showStatusRow = derived(hudState, ($s) => $s.health || $s.armor || $s.hunger || $s.thirst)
