import { dispatchAction } from './messageBus.js'

const DEV_PANEL_POS_KEY = 'cx_dev_panel_pos_v1'
const DEV_PANEL_COLLAPSED_KEY = 'cx_dev_panel_collapsed_v1'
const DESIGN_W = 1920
const DESIGN_H = 1080

let bootSent = false

export function bootDevMock() {
  if (bootSent) return
  bootSent = true

  document.body.classList.add('cx-dev')
  installViewportScale()
  installFetchStub()
  installDevPanel()

  setTimeout(() => {
    dispatchAction('initConfig', {
      colors: null,
      thresholds: { health: 20, hunger: 15, thirst: 15, fuel: 10, engine: 20 },
      redline: 85,
      logo: { url: '', width: 120, height: 40, transparentBg: false },
      menuOptions: { locked: [] },
      defaults: null,
      minimapGeo: { left: 26, top: 794, width: 315, height: 200, insetX: 0, insetY: 0 },
    })

    dispatchAction('versionInfo', { current: '1.1.5', outdated: false })
    dispatchAction('toggleHud', { visible: true })

    dispatchAction('updateStatus', {
      voice: 'Normal',
      talking: false,
      id: 1,
      job: 'Police',
      grade: 'Officer',
      cash: '$1,250',
      bank: '$45,000',
      time: '12:34',
      charName: 'John Doe',
      street: 'Vinewood Blvd',
      crossing: 'Las Lagunas',
      zone: 'Vinewood',
      direction: 'N',
      health: 100,
      armour: 50,
      hunger: 80,
      thirst: 70,
      stress: 15,
      stamina: 100,
      showStress: true,
      showStamina: true,
      waypointDist: null,
    })
  }, 50)
}

function installViewportScale() {
  const apply = () => {
    const sx = window.innerWidth / DESIGN_W
    const sy = window.innerHeight / DESIGN_H
    const scale = Math.min(sx, sy)
    document.documentElement.style.setProperty('--cx-dev-scale', String(scale))
    document.body.dataset.devResolution =
      `${window.innerWidth}×${window.innerHeight}  ·  ${(scale * 100).toFixed(0)}% of 1920×1080`
  }
  apply()
  window.addEventListener('resize', apply)
}

function installFetchStub() {
  const realFetch = window.fetch
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.startsWith('https://cx-hud/')) {
      try {
        const ep = url.replace('https://cx-hud/', '')
        const body = opts?.body ? JSON.parse(opts.body) : null
        // eslint-disable-next-line no-console
        console.log('[nui:dev] →', ep, body)
      } catch {}
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    return realFetch.apply(this, arguments)
  }
}

function installDevPanel() {
  const panel = document.createElement('div')
  panel.id = 'devPanel'
  panel.innerHTML = /* html */ `
    <div class="dev-panel-head" id="devPanelHead">
      <strong>cx-hud · dev</strong>
      <div class="dev-head-actions">
        <button id="devPanelToggle" title="Collapse">_</button>
      </div>
    </div>
    <div class="dev-panel-body">
      <div class="dev-row">
        <button data-action="toggleHud" data-payload='{"visible":true}'>Show HUD</button>
        <button data-action="toggleHud" data-payload='{"visible":false}'>Hide HUD</button>
        <button data-action="setPaused" data-payload='{"paused":true}'>Pause</button>
        <button data-action="setPaused" data-payload='{"paused":false}'>Resume</button>
      </div>
      <div class="dev-row">
        <button data-action="openMenu">Open Menu</button>
        <button data-action="hideHud">Inv Hide</button>
        <button data-action="showHud">Inv Show</button>
      </div>
      <div class="dev-row">
        <button id="devVehOn">Vehicle On</button>
        <button id="devVehOff">Vehicle Off</button>
        <button id="devWeapOn">Weapon On</button>
        <button id="devWeapOff">Weapon Off</button>
      </div>
      <div class="dev-row">
        <label>HP <input type="range" min="0" max="100" value="100" id="devHp"></label>
      </div>
      <div class="dev-row">
        <label>Armour <input type="range" min="0" max="100" value="50" id="devArm"></label>
      </div>
      <div class="dev-row">
        <label>Speed <input type="range" min="0" max="220" value="60" id="devSpd"></label>
      </div>
      <div class="dev-row">
        <label>RPM <input type="range" min="0" max="100" value="40" id="devRpm"></label>
      </div>
      <div class="dev-row">
        <label>Fuel <input type="range" min="0" max="100" value="80" id="devFuel"></label>
      </div>
      <div class="dev-row">
        <label>Direction
          <select id="devDir">
            <option>N</option><option>S</option><option>E</option><option>W</option>
            <option>NE</option><option>NW</option><option>SE</option><option>SW</option>
          </select>
        </label>
      </div>
      <div class="dev-row">
        <button id="devWp">Toggle Waypoint</button>
        <button id="devTalk">Toggle Talking</button>
      </div>
    </div>
  `
  document.body.appendChild(panel)

  restorePanelPosition(panel)
  restoreCollapsed(panel)
  installPanelDrag(panel)

  panel.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      let payload = null
      try { payload = btn.dataset.payload ? JSON.parse(btn.dataset.payload) : null } catch {}
      dispatchAction(btn.dataset.action, payload)
    })
  })

  let vehShown = false
  panel.querySelector('#devVehOn').addEventListener('click', () => {
    vehShown = true
    dispatchAction('updateVehicle', mockVehicle())
  })
  panel.querySelector('#devVehOff').addEventListener('click', () => {
    vehShown = false
    dispatchAction('updateVehicle', { show: false })
  })

  panel.querySelector('#devWeapOn').addEventListener('click', () => {
    dispatchAction('updateWeapon', {
      show: true, weapName: 'WEAPON_PISTOL', weaponImageBase: null,
      ammoClip: 12, ammoLabel: '9MM', isMelee: false, isThrow: false, low: false,
    })
  })
  panel.querySelector('#devWeapOff').addEventListener('click', () => {
    dispatchAction('updateWeapon', { show: false })
  })

  const hp = panel.querySelector('#devHp')
  const arm = panel.querySelector('#devArm')
  hp.addEventListener('input', () => dispatchAction('updateStatus', { health: +hp.value }))
  arm.addEventListener('input', () => dispatchAction('updateStatus', { armour: +arm.value }))

  const spd = panel.querySelector('#devSpd')
  const rpm = panel.querySelector('#devRpm')
  const fuel = panel.querySelector('#devFuel')
  const sendVeh = () => {
    if (!vehShown) return
    dispatchAction('updateVehicle', {
      ...mockVehicle(),
      speed: +spd.value,
      rpm: +rpm.value,
      fuel: +fuel.value,
    })
  }
  spd.addEventListener('input', sendVeh)
  rpm.addEventListener('input', sendVeh)
  fuel.addEventListener('input', sendVeh)

  const dir = panel.querySelector('#devDir')
  dir.addEventListener('change', () => dispatchAction('updateStatus', { direction: dir.value }))

  let wp = false
  panel.querySelector('#devWp').addEventListener('click', () => {
    wp = !wp
    dispatchAction('updateStatus', { waypointDist: wp ? '1.4 km' : null })
  })

  let talking = false
  panel.querySelector('#devTalk').addEventListener('click', () => {
    talking = !talking
    dispatchAction('updateStatus', { talking })
  })

  panel.querySelector('#devPanelToggle').addEventListener('click', (e) => {
    e.stopPropagation()
    panel.classList.toggle('collapsed')
    try {
      localStorage.setItem(DEV_PANEL_COLLAPSED_KEY, panel.classList.contains('collapsed') ? '1' : '0')
    } catch {}
  })
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

function restorePanelPosition(panel) {
  let pos = null
  try {
    const raw = localStorage.getItem(DEV_PANEL_POS_KEY)
    if (raw) pos = JSON.parse(raw)
  } catch {}
  if (!pos) return
  applyPanelPosition(panel, pos.left, pos.top)
}

function restoreCollapsed(panel) {
  try {
    if (localStorage.getItem(DEV_PANEL_COLLAPSED_KEY) === '1') {
      panel.classList.add('collapsed')
    }
  } catch {}
}

function applyPanelPosition(panel, left, top) {
  const r = panel.getBoundingClientRect()
  const w = r.width || 240
  const h = r.height || 100
  const cl = clamp(left, 4, window.innerWidth - w - 4)
  const ct = clamp(top, 4, window.innerHeight - h - 4)
  panel.style.left = cl + 'px'
  panel.style.top = ct + 'px'
}

function installPanelDrag(panel) {
  const head = panel.querySelector('#devPanelHead')
  let dragging = null

  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return
    if (e.button !== 0) return
    e.preventDefault()
    const r = panel.getBoundingClientRect()
    dragging = {
      pointerId: e.pointerId,
      offsetX: e.clientX - r.left,
      offsetY: e.clientY - r.top,
    }
    head.setPointerCapture(e.pointerId)
    panel.classList.add('dragging')
  })

  head.addEventListener('pointermove', (e) => {
    if (!dragging || dragging.pointerId !== e.pointerId) return
    const left = e.clientX - dragging.offsetX
    const top = e.clientY - dragging.offsetY
    applyPanelPosition(panel, left, top)
  })

  const end = (e) => {
    if (!dragging || dragging.pointerId !== e.pointerId) return
    dragging = null
    panel.classList.remove('dragging')
    try {
      const r = panel.getBoundingClientRect()
      localStorage.setItem(DEV_PANEL_POS_KEY, JSON.stringify({ left: r.left, top: r.top }))
    } catch {}
  }
  head.addEventListener('pointerup', end)
  head.addEventListener('pointercancel', end)

  window.addEventListener('resize', () => {
    const r = panel.getBoundingClientRect()
    applyPanelPosition(panel, r.left, r.top)
  })
}

function mockVehicle() {
  return {
    show: true,
    speed: 60,
    unit: 'MPH',
    gear: '3',
    rpm: 40,
    vehName: 'Sultan RS',
    fuel: 80,
    engine: 95,
    seatbelt: false,
    lights: { headlights: false, highbeam: false, hazard: false, indicatorLeft: false, indicatorRight: false },
  }
}
