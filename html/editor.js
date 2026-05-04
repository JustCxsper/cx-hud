const YEET_KEY = 'cx_hud_layout_v1'

const DRAGGABLES = [
    { id: 'topLeft',        sel: '.top-left',       label: 'Player Card'     },
    { id: 'topRight',       sel: '.top-right',       label: 'Top Right Panel' },
    { id: 'minimapCluster', sel: '.minimap-cluster', label: 'Minimap', isMinimap: true, noPanel: true },
    { id: 'streetPill',     sel: '#streetPill',      label: 'Street Pill'     },
    { id: 'statusRow',      sel: '#statusRow',       label: 'Status Rings',   hasOrient: true },
    { id: 'vehicleCard',    sel: '#vehicleCard',      label: 'Speedometer',    canHide: true },
    { id: 'lightsPanel',    sel: '#lightsPanel',      label: 'Lights Panel',   canHide: true },
    { id: 'weaponCard',     sel: '#weaponCard',       label: 'Weapon & Ammo',  canHide: true },
]


let editorOpen        = false
let snapEnabled       = false
let snapGridSize      = 20
let savedLayout       = {}
let activePanel       = null
let dragState         = null
let dragHandles       = []
let handleSyncRaf     = null
let showingVeh        = true
let mmHomePosition    = null
let canSetDefault     = false
let serverDefaultBtnEl = null
let namingModal       = null

let theOverlay, theGrid, gridPen, ghostBox, toastEl, confirmBox, toastKiller

function clampNum(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }
function snapToGrid(n)       { return snapEnabled ? Math.round(n / snapGridSize) * snapGridSize : n }

function popToast(msg) {
    clearTimeout(toastKiller)
    toastEl.textContent = msg
    toastEl.classList.add('visible')
    toastKiller = setTimeout(() => toastEl.classList.remove('visible'), 2200)
}

function showConfirm(msg, yesFn) {
    confirmBox.querySelector('.ed-confirm-msg').textContent = msg
    confirmBox.classList.add('visible')
    const yesBtn = confirmBox.querySelector('#edConfirmYes')
    const noBtn  = confirmBox.querySelector('#edConfirmNo')
    const tidy   = () => { confirmBox.classList.remove('visible'); yesBtn.onclick = null; noBtn.onclick = null }
    yesBtn.onclick = () => { tidy(); yesFn() }
    noBtn.onclick  = tidy
}

function loadLayout() {
    try { const raw = localStorage.getItem(YEET_KEY); if (raw) savedLayout = JSON.parse(raw) } catch (_) {}
}

function saveLayout() {
    try { localStorage.setItem(YEET_KEY, JSON.stringify(savedLayout)) } catch (_) {}
    nuiPost('kvpSaveLayout', savedLayout)
}

function applyOneBlock(block) {
    const s  = savedLayout[block.id]
    if (!s) return
    const el = document.querySelector(block.sel)
    if (!el) return

    if (!block.isMinimap) {
        if (s.x != null) { el.style.left = s.x + 'px'; el.style.right  = 'auto' }
        if (s.y != null) { el.style.top  = s.y + 'px'; el.style.bottom = 'auto' }
    }

    if (s.scale != null) {
        el.style.transformOrigin = '0 0'
        el.style.transform       = `scale(${s.scale})`
    }

    if (block.hasOrient && s.vertical) el.classList.add('vertical')
}

function getRect(el) {
    void el.offsetWidth
    return el.getBoundingClientRect()
}

function sendMinimapOffset(clusterEl) {
    if (!mmHomePosition || !clusterEl) return

    const r  = getRect(clusterEl)
    const ox = r.left - mmHomePosition.left
    const oy = r.top  - mmHomePosition.top

    savedLayout['minimapCluster'] = {
        ...(savedLayout['minimapCluster'] || {}),
        offsetX: ox,
        offsetY: oy,
    }

    nuiPost('setMinimapOffset', { x: ox, y: oy })

    clusterEl.style.left   = ''
    clusterEl.style.top    = ''
    clusterEl.style.right  = ''
    clusterEl.style.bottom = ''

    if (savedLayout['minimapCluster']) {
        delete savedLayout['minimapCluster'].x
        delete savedLayout['minimapCluster'].y
    }
}

function syncHandlePos(h) {
    const r = getRect(h.el)
    h.handle.style.width    = Math.ceil(r.width  || h.el.offsetWidth  || 80) + 'px'
    h.handle.style.height   = Math.ceil(r.height || h.el.offsetHeight || 40) + 'px'
    h.handle.style.left     = Math.round(r.left) + 'px'
    h.handle.style.top      = Math.round(r.top)  + 'px'
    h.handle.style.position = 'absolute'
}

function syncAllHandles() {
    if (!editorOpen) return
    dragHandles.forEach(syncHandlePos)
    handleSyncRaf = requestAnimationFrame(syncAllHandles)
}

function makeHandle(block, el) {
    const handle = document.createElement('div')
    handle.className = 'ed-handle'

    const lbl = document.createElement('div')
    lbl.className   = 'ed-label'
    lbl.textContent = block.label
    handle.appendChild(lbl)

    theOverlay.appendChild(handle)

    const h = { block, el, handle }
    dragHandles.push(h)
    syncHandlePos(h)

    handle.addEventListener('pointerdown', e => startDrag(e, h))

    if (window.ResizeObserver) {
        h.ro = new ResizeObserver(() => syncHandlePos(h))
        h.ro.observe(el)
    }

    if (!block.noPanel) {
        handle.addEventListener('click', e => {
            if (dragState?.moved) return
            e.stopPropagation()
            openPanel(h)
        })
    }

    return h
}

function buildAllHandles() {
    DRAGGABLES.forEach(block => {
        const el = document.querySelector(block.sel)
        if (!el || el.classList.contains('hidden')) return

        const r = getRect(el)

        if (!el.style.left || el.style.left === 'auto' || el.style.left === '') {
            el.style.left = r.left + 'px'
            el.style.top  = r.top  + 'px'
        }
        el.style.right     = 'auto'
        el.style.bottom    = 'auto'

        const savedScale = savedLayout[block.id]?.scale
        if (savedScale != null) {
            el.style.transformOrigin = '0 0'
            el.style.transform = `scale(${savedScale})`
        }

        makeHandle(block, el)
    })

    theOverlay.addEventListener('click', e => {
        if (activePanel && !activePanel.contains(e.target)) closePanel()
    })
}

function destroyAllHandles() {
    if (handleSyncRaf) { cancelAnimationFrame(handleSyncRaf); handleSyncRaf = null }
    dragHandles.forEach(h => { if (h.ro) h.ro.disconnect(); h.handle.remove() })
    dragHandles = []
}

function startDrag(e, h) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    closePanel()

    const startX = parseFloat(h.el.style.left) || getRect(h.el).left
    const startY = parseFloat(h.el.style.top)  || getRect(h.el).top

    dragState = {
        h,
        startX, startY,
        mouseStartX: e.clientX,
        mouseStartY: e.clientY,
        moved: false,
    }

    h.handle.classList.add('dragging')
    h.handle.setPointerCapture(e.pointerId)

    ghostBox.style.width   = h.handle.style.width
    ghostBox.style.height  = h.handle.style.height
    ghostBox.style.display = 'block'

    h.handle.addEventListener('pointermove', onDragMove)
    h.handle.addEventListener('pointerup',   onDragEnd)
}

function onDragMove(e) {
    if (!dragState) return
    const { h, startX, startY, mouseStartX, mouseStartY } = dragState

    const rawX = startX + (e.clientX - mouseStartX)
    const rawY = startY + (e.clientY - mouseStartY)

    if (Math.abs(e.clientX - mouseStartX) > 3 || Math.abs(e.clientY - mouseStartY) > 3) {
        dragState.moved = true
    }

    h.el.style.left     = rawX + 'px'
    h.el.style.top      = rawY + 'px'
    h.handle.style.left = rawX + 'px'
    h.handle.style.top  = rawY + 'px'

    ghostBox.style.left = snapToGrid(rawX) + 'px'
    ghostBox.style.top  = snapToGrid(rawY) + 'px'
}

function onDragEnd(e) {
    if (!dragState) return
    const { h, startX, startY, mouseStartX, mouseStartY } = dragState

    h.handle.classList.remove('dragging')
    h.handle.removeEventListener('pointermove', onDragMove)
    h.handle.removeEventListener('pointerup',   onDragEnd)
    ghostBox.style.display = 'none'

    const finalX = snapToGrid(startX + (e.clientX - mouseStartX))
    const finalY = snapToGrid(startY + (e.clientY - mouseStartY))

    h.el.style.left     = finalX + 'px'
    h.el.style.top      = finalY + 'px'
    h.handle.style.left = finalX + 'px'
    h.handle.style.top  = finalY + 'px'

    savedLayout[h.block.id] = { ...(savedLayout[h.block.id] || {}), x: finalX, y: finalY }

    if (h.block.isMinimap) {
        sendMinimapOffset(h.el)
    }

    saveLayout()
    dragState = null
}

function openPanel(h) {
    closePanel()
    const { block, el } = h
    const snap   = savedLayout[block.id] || {}
    const scale  = snap.scale   ?? 1
    const isVert = snap.vertical ?? false

    activePanel = document.createElement('div')
    activePanel.className = 'ed-panel'
    activePanel.innerHTML = `
        <div class="ed-panel-title">
            ${block.label}
            <div class="ed-panel-close" id="epClose"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="ed-row">
            <span class="ed-row-label">X</span>
            <input class="ed-input" id="epX" type="number" value="${Math.round(parseFloat(el.style.left) || 0)}" step="1">
            <span class="ed-unit">px</span>
        </div>
        <div class="ed-row">
            <span class="ed-row-label">Y</span>
            <input class="ed-input" id="epY" type="number" value="${Math.round(parseFloat(el.style.top) || 0)}" step="1">
            <span class="ed-unit">px</span>
        </div>
        <div class="ed-scale-row">
            <span class="ed-row-label">Scale</span>
            <input type="range" class="ed-scale-slider" id="epScale" min="0.5" max="2" step="0.05" value="${scale}">
            <span class="ed-scale-val" id="epScaleVal">${Math.round(scale * 100)}%</span>
        </div>
        ${block.hasOrient ? `
        <div class="ed-orient-row">
            <button class="ed-orient-btn ${!isVert ? 'active' : ''}" id="epOrientH"><i class="fa-solid fa-grip-lines"></i> Horizontal</button>
            <button class="ed-orient-btn ${isVert  ? 'active' : ''}" id="epOrientV"><i class="fa-solid fa-grip-lines-vertical"></i> Vertical</button>
        </div>` : ''}
        ${block.canHide ? `
        <div class="ed-vis-row">
            <span class="ed-vis-label">Visible</span>
            <label class="toggle-switch" style="pointer-events:all">
                <input type="checkbox" id="epVisible" ${snap.hidden ? '' : 'checked'}>
                <div class="toggle-track"></div><div class="toggle-thumb"></div>
            </label>
        </div>` : ''}
    `

    const r  = h.handle.getBoundingClientRect()
    let px   = r.right + 12
    let py   = r.top
    if (px + 240 > window.innerWidth)  px = r.left - 252
    if (py + 340 > window.innerHeight) py = window.innerHeight - 345

    activePanel.style.left = clampNum(px, 8, window.innerWidth  - 250) + 'px'
    activePanel.style.top  = clampNum(py, 8, window.innerHeight - 345) + 'px'
    theOverlay.appendChild(activePanel)

    activePanel.querySelector('#epClose').addEventListener('click', closePanel)

    activePanel.querySelector('#epX').addEventListener('input', ev => {
        const v = parseInt(ev.target.value, 10)
        if (isNaN(v)) return
        el.style.left = v + 'px'
        h.handle.style.left = v + 'px'
        savedLayout[block.id] = { ...(savedLayout[block.id] || {}), x: v }
        saveLayout()
    })

    activePanel.querySelector('#epY').addEventListener('input', ev => {
        const v = parseInt(ev.target.value, 10)
        if (isNaN(v)) return
        el.style.top = v + 'px'
        h.handle.style.top = v + 'px'
        savedLayout[block.id] = { ...(savedLayout[block.id] || {}), y: v }
        saveLayout()
    })

    const scaleSlider = activePanel.querySelector('#epScale')
    const scaleLabel  = activePanel.querySelector('#epScaleVal')
    scaleSlider.addEventListener('input', () => {
        const s = parseFloat(scaleSlider.value)
        scaleLabel.textContent = Math.round(s * 100) + '%'
        el.style.transformOrigin = '0 0'
        el.style.transform       = `scale(${s})`
        savedLayout[block.id] = { ...(savedLayout[block.id] || {}), scale: s }
        saveLayout()
        syncHandlePos(h)
    })

    if (block.hasOrient) {
        const setOrient = goVertical => {
            el.classList.toggle('vertical', goVertical)
            savedLayout[block.id] = { ...(savedLayout[block.id] || {}), vertical: goVertical }
            saveLayout()
            activePanel.querySelector('#epOrientH').classList.toggle('active', !goVertical)
            activePanel.querySelector('#epOrientV').classList.toggle('active',  goVertical)
            setTimeout(() => syncHandlePos(h), 30)
        }
        activePanel.querySelector('#epOrientH').addEventListener('click', () => setOrient(false))
        activePanel.querySelector('#epOrientV').addEventListener('click', () => setOrient(true))
    }

    if (block.canHide) {
        activePanel.querySelector('#epVisible').addEventListener('change', ev => {
            const nowVisible = ev.target.checked
            savedLayout[block.id] = { ...(savedLayout[block.id] || {}), hidden: !nowVisible }
            saveLayout()
            el.classList.toggle('hidden', !nowVisible)
            syncHandlePos(h)
        })
    }
}

function closePanel() {
    if (activePanel) { activePanel.remove(); activePanel = null }
}

function drawGrid() {
    theGrid.width  = window.innerWidth
    theGrid.height = window.innerHeight
    gridPen.clearRect(0, 0, theGrid.width, theGrid.height)
    if (!snapEnabled) return
    gridPen.strokeStyle = 'rgba(126,232,202,0.07)'
    gridPen.lineWidth   = 1
    for (let x = 0; x < theGrid.width;  x += snapGridSize) {
        gridPen.beginPath(); gridPen.moveTo(x, 0); gridPen.lineTo(x, theGrid.height); gridPen.stroke()
    }
    for (let y = 0; y < theGrid.height; y += snapGridSize) {
        gridPen.beginPath(); gridPen.moveTo(0, y); gridPen.lineTo(theGrid.width, y); gridPen.stroke()
    }
}

function toggleSnap() {
    snapEnabled = !snapEnabled
    theOverlay.querySelector('#edSnapBtn').classList.toggle('on', snapEnabled)
    theOverlay.querySelector('#edSnapSizeWrap').classList.toggle('visible', snapEnabled)
    theGrid.classList.toggle('visible', snapEnabled)
    drawGrid()
}

function toggleVehiclePreview() {
    showingVeh = !showingVeh
    const vehEl    = document.querySelector('#vehicleCard')
    const lightsEl = document.querySelector('#lightsPanel')
    if (vehEl)    vehEl.classList.toggle('hidden', !showingVeh)
    if (lightsEl) lightsEl.classList.toggle('hidden', !showingVeh)
    theOverlay.querySelector('#edVehBtn').classList.toggle('on', showingVeh)
    destroyAllHandles()
    setTimeout(buildAllHandles, 30)
}

function doReset() {
    savedLayout = {}
    try { localStorage.removeItem(YEET_KEY) } catch (_) {}
    nuiPost('kvpDeleteLayout')

    DRAGGABLES.forEach(b => {
        const el = document.querySelector(b.sel)
        if (!el) return
        el.style.left      = ''
        el.style.top       = ''
        el.style.right     = ''
        el.style.bottom    = ''
        el.style.transform = ''
        if (b.hasOrient) el.classList.remove('vertical')
    })

    nuiPost('setMinimapOffset', { x: 0, y: 0 })
    destroyAllHandles()
    setTimeout(buildAllHandles, 80)
    popToast('Layout reset to defaults')
}

function buildOverlay() {
    if (theOverlay) return

    theOverlay = document.createElement('div')
    theOverlay.id = 'editorOverlay'
    document.body.appendChild(theOverlay)

    theGrid = document.createElement('canvas')
    theGrid.id = 'editorGrid'
    theOverlay.appendChild(theGrid)
    gridPen = theGrid.getContext('2d')

    ghostBox = document.createElement('div')
    ghostBox.className = 'ed-ghost'
    theOverlay.appendChild(ghostBox)

    toastEl = document.createElement('div')
    toastEl.id = 'editorToast'
    theOverlay.appendChild(toastEl)

    confirmBox = document.createElement('div')
    confirmBox.id = 'editorConfirm'
    confirmBox.innerHTML = `
        <div class="ed-confirm-box">
            <div class="ed-confirm-msg"></div>
            <div class="ed-confirm-btns">
                <button class="ed-btn ed-btn-reset" id="edConfirmYes">Yes, reset</button>
                <button class="ed-btn ed-btn-close" id="edConfirmNo">Cancel</button>
            </div>
        </div>
    `
    theOverlay.appendChild(confirmBox)

    const toolbar = document.createElement('div')
    toolbar.id = 'editorToolbar'
    toolbar.innerHTML = `
        <span class="ed-title"><i class="fa-solid fa-pen-ruler" style="margin-right:7px;color:var(--accent)"></i>Edit Layout</span>
        <div class="ed-sep"></div>
        <button class="ed-snap-btn" id="edSnapBtn"><i class="fa-solid fa-border-all"></i> Grid Snap</button>
        <div class="ed-snap-size" id="edSnapSizeWrap">
            <span>Size</span>
            <select id="edSnapSizeSelect">
                <option value="10">10px</option>
                <option value="20" selected>20px</option>
                <option value="40">40px</option>
                <option value="60">60px</option>
            </select>
        </div>
        <div class="ed-sep"></div>
        <button class="ed-veh-btn" id="edVehBtn"><i class="fa-solid fa-car"></i> Vehicle HUD</button>
        <div class="ed-sep"></div>
        <button class="ed-btn ed-btn-reset" id="edResetBtn"><i class="fa-solid fa-rotate-left"></i> Reset</button>
        <button class="ed-btn ed-btn-save"  id="edSaveBtn"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        <button class="ed-btn ed-btn-close" id="edCloseBtn"><i class="fa-solid fa-xmark"></i> Close</button>
        <div class="ed-sep" id="edAdminSep" style="display:none"></div>
        <button class="ed-btn ed-btn-server-default" id="edServerDefaultBtn" style="display:none"><i class="fa-solid fa-server"></i> Set Server Default</button>
    `
    theOverlay.appendChild(toolbar)

    toolbar.querySelector('#edSnapBtn').addEventListener('click', toggleSnap)
    toolbar.querySelector('#edSnapSizeSelect').addEventListener('change', e => {
        snapGridSize = parseInt(e.target.value, 10)
        drawGrid()
    })
    toolbar.querySelector('#edVehBtn').addEventListener('click', toggleVehiclePreview)
    toolbar.querySelector('#edResetBtn').addEventListener('click', () => {
        showConfirm('This will reset all HUD elements back to their default positions, scale and orientation. Continue?', doReset)
    })
    toolbar.querySelector('#edSaveBtn').addEventListener('click', () => {
        saveLayout()
        popToast('Layout saved!')
    })
    toolbar.querySelector('#edCloseBtn').addEventListener('click', closeEditor)

    serverDefaultBtnEl = toolbar.querySelector('#edServerDefaultBtn')
    serverDefaultBtnEl.addEventListener('click', showNameModal)
    if (canSetDefault) {
        serverDefaultBtnEl.style.display = ''
        toolbar.querySelector('#edAdminSep').style.display = ''
    }

    namingModal = document.createElement('div')
    namingModal.id = 'editorNameModal'
    namingModal.innerHTML = `
        <div class="ed-name-box">
            <div class="ed-name-title"><i class="fa-solid fa-server"></i>Set Server Default</div>
            <div class="ed-name-subtitle">New players who haven't customised their layout will start with this one.</div>
            <div class="ed-name-field-label">
                <span>Layout Name</span>
                <span class="ed-name-counter" id="edNameCounter">0 / 32</span>
            </div>
            <input class="ed-name-input-large" id="edNameInput" type="text" maxlength="32" placeholder="e.g. My Server Default" autocomplete="off" spellcheck="false">
            <div class="ed-name-error" id="edNameError"></div>
            <div class="ed-name-actions">
                <button class="ed-btn-name-save" id="edNameSave" disabled><i class="fa-solid fa-floppy-disk"></i> Save as Default</button>
                <button class="ed-btn-name-cancel" id="edNameCancel">Cancel</button>
            </div>
        </div>
    `
    theOverlay.appendChild(namingModal)

    const nameInput  = namingModal.querySelector('#edNameInput')
    const nameError  = namingModal.querySelector('#edNameError')
    const nameSaveBtn = namingModal.querySelector('#edNameSave')
    const NAME_RE    = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,31}$/

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        const counter = namingModal.querySelector('#edNameCounter')
        if (counter) {
            counter.textContent = val.length + ' / 32'
            counter.classList.toggle('warn', val.length > 24)
        }
        if (NAME_RE.test(val)) {
            nameSaveBtn.disabled = false
            nameError.textContent = ''
        } else {
            nameSaveBtn.disabled = true
            nameError.textContent = val.length === 0 ? '' : 'Must start with a letter or number. Allowed: letters, numbers, spaces, _ and -'
        }
    })

    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !nameSaveBtn.disabled) nameSaveBtn.click()
    })

    nameSaveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim()
        if (!NAME_RE.test(name)) return
        namingModal.classList.remove('visible')
        nuiPost('saveServerDefault', { layout: savedLayout, name })
        popToast('Saving layout...')
    })

    namingModal.querySelector('#edNameCancel').addEventListener('click', () => {
        namingModal.classList.remove('visible')
    })

    document.addEventListener('keydown', onEditorKey)
}

function showNameModal() {
    if (!namingModal) return
    const inp = namingModal.querySelector('#edNameInput')
    const err = namingModal.querySelector('#edNameError')
    const btn = namingModal.querySelector('#edNameSave')
    const ctr = namingModal.querySelector('#edNameCounter')
    if (inp) inp.value = ''
    if (err) err.textContent = ''
    if (btn) btn.disabled = true
    if (ctr) { ctr.textContent = '0 / 32'; ctr.classList.remove('warn') }
    namingModal.classList.add('visible')
    setTimeout(() => inp?.focus(), 50)
}

function onEditorKey(e) {
    if (!editorOpen) return
    if (e.key === 'Escape') {
        if (namingModal?.classList.contains('visible')) { namingModal.classList.remove('visible'); return }
        if (confirmBox.classList.contains('visible')) { confirmBox.classList.remove('visible'); return }
        closeEditor()
    }
}

function openEditor() {
    if (editorOpen) return
    editorOpen = true

    loadLayout()
    buildOverlay()

    DRAGGABLES.forEach(b => applyOneBlock(b))

    if (savedLayout['minimapCluster']?.offsetX != null) {
        nuiPost('setMinimapOffset', {
            x: savedLayout['minimapCluster'].offsetX,
            y: savedLayout['minimapCluster'].offsetY,
        })
    }

    setTimeout(() => {
        const clusterEl = document.querySelector('.minimap-cluster')
        if (clusterEl) {
            const r   = getRect(clusterEl)
            const ox  = savedLayout['minimapCluster']?.offsetX ?? 0
            const oy  = savedLayout['minimapCluster']?.offsetY ?? 0
            mmHomePosition = { left: r.left - ox, top: r.top - oy }
        }

        theOverlay.classList.add('active')
        drawGrid()
        showingVeh = !document.querySelector('#vehicleCard')?.classList.contains('hidden')
        theOverlay.querySelector('#edVehBtn').classList.toggle('on', showingVeh)
        buildAllHandles()
        if (handleSyncRaf) cancelAnimationFrame(handleSyncRaf)
        handleSyncRaf = requestAnimationFrame(syncAllHandles)
    }, 60)

    nuiPost('editorOpened')
}

function closeEditor() {
    if (!editorOpen) return
    editorOpen = false

    closePanel()
    destroyAllHandles()
    theOverlay.classList.remove('active')
    nuiPost('editorClosed')

    const pill = document.getElementById('streetPill')
    const sRow = document.getElementById('statusRow')
    if (pill && !savedLayout.streetPill) { pill.style.left = ''; pill.style.top = '' }
    if (sRow && !savedLayout.statusRow)  { sRow.style.left = '';  sRow.style.top = '' }
}

function kickOffOnBoot() {
    loadLayout()
    DRAGGABLES.forEach(b => applyOneBlock(b))

    if (savedLayout['minimapCluster']?.offsetX != null) {
        nuiPost('setMinimapOffset', {
            x: savedLayout['minimapCluster'].offsetX,
            y: savedLayout['minimapCluster'].offsetY,
        })
    }

    forceRingRepaint()
}

function forceRingRepaint() {
    const ring = document.querySelector('.minimap-border-ring')
    if (!ring) return
    ring.style.display = 'none'
    void ring.offsetHeight
    ring.style.display = ''
}

const edIsOpen           = () => editorOpen
const edForceRingRepaint = forceRingRepaint
const edHandles          = dragHandles
const edApplyOnBoot      = kickOffOnBoot
const edSyncHandle       = syncHandlePos

function edSetCanSaveDefault(val) {
    canSetDefault = !!val
    if (!serverDefaultBtnEl) return
    const sep = theOverlay?.querySelector('#edAdminSep')
    serverDefaultBtnEl.style.display = canSetDefault ? '' : 'none'
    if (sep) sep.style.display = canSetDefault ? '' : 'none'
}

function edHandleSaveResult(success, msg) {
    popToast(msg || (success ? 'Saved!' : 'Save failed.'))
}

document.getElementById('editLayoutBtn')?.addEventListener('click', () => {
    closeSettings()
    setTimeout(openEditor, 150)
})

kickOffOnBoot()
