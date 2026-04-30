<script>
  import { onMount, onDestroy, tick } from 'svelte'
  import { editorOpen, layout } from '../lib/stores.js'
  import { nuiPost } from '../lib/nui.js'

  const DRAGGABLES = [
    { id: 'topLeft',        sel: '.top-left',       label: 'Player Card' },
    { id: 'topRight',       sel: '.top-right',      label: 'Top Right Panel' },
    { id: 'minimapCluster', sel: '.minimap-cluster', label: 'Minimap', isMinimap: true, noPanel: true },
    { id: 'streetPill',     sel: '#streetPill',     label: 'Street Pill' },
    { id: 'statusRow',      sel: '#statusRow',      label: 'Status Rings', hasOrient: true },
    { id: 'vehicleCard',    sel: '#vehicleCard',    label: 'Speedometer', canHide: true },
    { id: 'lightsPanel',    sel: '#lightsPanel',    label: 'Lights Panel', canHide: true },
    { id: 'weaponCard',     sel: '#weaponCard',     label: 'Weapon & Ammo', canHide: true },
  ]

  let snapEnabled = false
  let snapGridSize = 20
  let showingVeh = true
  let mmHomePosition = null

  let dragHandles = []
  let dragState = null
  let activePanel = null
  let handleSyncRaf = null

  let overlayEl
  let gridCanvas
  let gridCtx
  let ghostBox
  let toastEl
  let confirmBox
  let toastKiller

  let toastVisible = false
  let toastMsg = ''
  let confirmVisible = false
  let confirmMsg = ''
  let confirmYesFn = null

  function clampNum(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }
  function snapToGrid(n) {
    return snapEnabled ? Math.round(n / snapGridSize) * snapGridSize : n
  }

  function getRect(el) {
    void el.offsetWidth
    return el.getBoundingClientRect()
  }

  function popToast(msg) {
    clearTimeout(toastKiller)
    toastMsg = msg
    toastVisible = true
    toastKiller = setTimeout(() => (toastVisible = false), 2200)
  }

  function showConfirm(msg, yesFn) {
    confirmMsg = msg
    confirmVisible = true
    confirmYesFn = yesFn
  }

  function applyOneBlock(block) {
    const cur = $layout
    const s = cur[block.id]
    if (!s) return
    const el = document.querySelector(block.sel)
    if (!el) return

    if (!block.isMinimap) {
      if (s.x != null) { el.style.left = s.x + 'px'; el.style.right = 'auto' }
      if (s.y != null) { el.style.top = s.y + 'px'; el.style.bottom = 'auto' }
    }
    if (s.scale != null) {
      el.style.transformOrigin = '0 0'
      el.style.transform = `scale(${s.scale})`
    }
    if (block.hasOrient && s.vertical) el.classList.add('vertical')
  }

  function sendMinimapOffset(clusterEl) {
    if (!mmHomePosition || !clusterEl) return
    const r = getRect(clusterEl)
    const ox = r.left - mmHomePosition.left
    const oy = r.top - mmHomePosition.top

    layout.update((s) => {
      const next = { ...s }
      next['minimapCluster'] = { ...(next['minimapCluster'] || {}), offsetX: ox, offsetY: oy }
      delete next['minimapCluster'].x
      delete next['minimapCluster'].y
      return next
    })

    nuiPost('setMinimapOffset', { x: ox, y: oy })

    clusterEl.style.left = ''
    clusterEl.style.top = ''
    clusterEl.style.right = ''
    clusterEl.style.bottom = ''
  }

  function syncHandlePos(h) {
    const r = getRect(h.el)
    h.handle.style.width = Math.ceil(r.width || h.el.offsetWidth || 80) + 'px'
    h.handle.style.height = Math.ceil(r.height || h.el.offsetHeight || 40) + 'px'
    h.handle.style.left = Math.round(r.left) + 'px'
    h.handle.style.top = Math.round(r.top) + 'px'
    h.handle.style.position = 'absolute'
  }

  function syncAllHandles() {
    if (!$editorOpen) return
    dragHandles.forEach(syncHandlePos)
    handleSyncRaf = requestAnimationFrame(syncAllHandles)
  }

  function makeHandle(block, el) {
    const handle = document.createElement('div')
    handle.className = 'ed-handle'

    const lbl = document.createElement('div')
    lbl.className = 'ed-label'
    lbl.textContent = block.label
    handle.appendChild(lbl)

    overlayEl.appendChild(handle)

    const h = { block, el, handle }
    dragHandles.push(h)
    syncHandlePos(h)

    handle.addEventListener('pointerdown', (e) => startDrag(e, h))

    if (window.ResizeObserver) {
      h.ro = new ResizeObserver(() => syncHandlePos(h))
      h.ro.observe(el)
    }

    if (!block.noPanel) {
      handle.addEventListener('click', (e) => {
        if (dragState?.moved) return
        e.stopPropagation()
        openPanel(h)
      })
    }

    return h
  }

  function buildAllHandles() {
    DRAGGABLES.forEach((block) => {
      const el = document.querySelector(block.sel)
      if (!el || el.classList.contains('hidden')) return

      const r = getRect(el)
      if (!el.style.left || el.style.left === 'auto' || el.style.left === '') {
        el.style.left = r.left + 'px'
        el.style.top = r.top + 'px'
      }
      el.style.right = 'auto'
      el.style.bottom = 'auto'

      const cur = $layout
      const savedScale = cur[block.id]?.scale
      if (savedScale != null) {
        el.style.transformOrigin = '0 0'
        el.style.transform = `scale(${savedScale})`
      }
      makeHandle(block, el)
    })
  }

  function destroyAllHandles() {
    if (handleSyncRaf) {
      cancelAnimationFrame(handleSyncRaf)
      handleSyncRaf = null
    }
    dragHandles.forEach((h) => {
      if (h.ro) h.ro.disconnect()
      h.handle.remove()
    })
    dragHandles = []
  }

  function startDrag(e, h) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    closePanel()

    const startX = parseFloat(h.el.style.left) || getRect(h.el).left
    const startY = parseFloat(h.el.style.top) || getRect(h.el).top

    dragState = {
      h, startX, startY,
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
      moved: false,
    }

    h.handle.classList.add('dragging')
    h.handle.setPointerCapture(e.pointerId)

    ghostBox.style.width = h.handle.style.width
    ghostBox.style.height = h.handle.style.height
    ghostBox.style.display = 'block'

    h.handle.addEventListener('pointermove', onDragMove)
    h.handle.addEventListener('pointerup', onDragEnd)
  }

  function onDragMove(e) {
    if (!dragState) return
    const { h, startX, startY, mouseStartX, mouseStartY } = dragState

    const rawX = startX + (e.clientX - mouseStartX)
    const rawY = startY + (e.clientY - mouseStartY)

    if (Math.abs(e.clientX - mouseStartX) > 3 || Math.abs(e.clientY - mouseStartY) > 3) {
      dragState.moved = true
    }

    h.el.style.left = rawX + 'px'
    h.el.style.top = rawY + 'px'
    h.handle.style.left = rawX + 'px'
    h.handle.style.top = rawY + 'px'

    ghostBox.style.left = snapToGrid(rawX) + 'px'
    ghostBox.style.top = snapToGrid(rawY) + 'px'
  }

  function onDragEnd(e) {
    if (!dragState) return
    const { h, startX, startY, mouseStartX, mouseStartY } = dragState

    h.handle.classList.remove('dragging')
    h.handle.removeEventListener('pointermove', onDragMove)
    h.handle.removeEventListener('pointerup', onDragEnd)
    ghostBox.style.display = 'none'

    const finalX = snapToGrid(startX + (e.clientX - mouseStartX))
    const finalY = snapToGrid(startY + (e.clientY - mouseStartY))

    h.el.style.left = finalX + 'px'
    h.el.style.top = finalY + 'px'
    h.handle.style.left = finalX + 'px'
    h.handle.style.top = finalY + 'px'

    layout.update((s) => ({
      ...s,
      [h.block.id]: { ...(s[h.block.id] || {}), x: finalX, y: finalY },
    }))

    if (h.block.isMinimap) sendMinimapOffset(h.el)
    dragState = null
  }

  function openPanel(h) {
    closePanel()
    const { block, el } = h
    const cur = $layout
    const snap = cur[block.id] || {}
    const scale = snap.scale ?? 1
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
        <button class="ed-orient-btn ${isVert ? 'active' : ''}" id="epOrientV"><i class="fa-solid fa-grip-lines-vertical"></i> Vertical</button>
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

    const r = h.handle.getBoundingClientRect()
    let px = r.right + 12
    let py = r.top
    if (px + 240 > window.innerWidth) px = r.left - 252
    if (py + 340 > window.innerHeight) py = window.innerHeight - 345

    activePanel.style.left = clampNum(px, 8, window.innerWidth - 250) + 'px'
    activePanel.style.top = clampNum(py, 8, window.innerHeight - 345) + 'px'
    overlayEl.appendChild(activePanel)

    activePanel.querySelector('#epClose').addEventListener('click', closePanel)

    activePanel.querySelector('#epX').addEventListener('input', (ev) => {
      const v = parseInt(ev.target.value, 10)
      if (isNaN(v)) return
      el.style.left = v + 'px'
      h.handle.style.left = v + 'px'
      layout.update((s) => ({ ...s, [block.id]: { ...(s[block.id] || {}), x: v } }))
    })

    activePanel.querySelector('#epY').addEventListener('input', (ev) => {
      const v = parseInt(ev.target.value, 10)
      if (isNaN(v)) return
      el.style.top = v + 'px'
      h.handle.style.top = v + 'px'
      layout.update((s) => ({ ...s, [block.id]: { ...(s[block.id] || {}), y: v } }))
    })

    const scaleSlider = activePanel.querySelector('#epScale')
    const scaleLabel = activePanel.querySelector('#epScaleVal')
    scaleSlider.addEventListener('input', () => {
      const sv = parseFloat(scaleSlider.value)
      scaleLabel.textContent = Math.round(sv * 100) + '%'
      el.style.transformOrigin = '0 0'
      el.style.transform = `scale(${sv})`
      layout.update((s) => ({ ...s, [block.id]: { ...(s[block.id] || {}), scale: sv } }))
      syncHandlePos(h)
    })

    if (block.hasOrient) {
      const setOrient = (goVertical) => {
        el.classList.toggle('vertical', goVertical)
        layout.update((s) => ({ ...s, [block.id]: { ...(s[block.id] || {}), vertical: goVertical } }))
        activePanel.querySelector('#epOrientH').classList.toggle('active', !goVertical)
        activePanel.querySelector('#epOrientV').classList.toggle('active', goVertical)
        setTimeout(() => syncHandlePos(h), 30)
      }
      activePanel.querySelector('#epOrientH').addEventListener('click', () => setOrient(false))
      activePanel.querySelector('#epOrientV').addEventListener('click', () => setOrient(true))
    }

    if (block.canHide) {
      activePanel.querySelector('#epVisible').addEventListener('change', (ev) => {
        const nowVisible = ev.target.checked
        layout.update((s) => ({ ...s, [block.id]: { ...(s[block.id] || {}), hidden: !nowVisible } }))
        el.classList.toggle('hidden', !nowVisible)
        syncHandlePos(h)
      })
    }
  }

  function closePanel() {
    if (activePanel) { activePanel.remove(); activePanel = null }
  }

  function drawGrid() {
    if (!gridCanvas) return
    gridCanvas.width = window.innerWidth
    gridCanvas.height = window.innerHeight
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height)
    if (!snapEnabled) return
    gridCtx.strokeStyle = 'rgba(126,232,202,0.07)'
    gridCtx.lineWidth = 1
    for (let x = 0; x < gridCanvas.width; x += snapGridSize) {
      gridCtx.beginPath(); gridCtx.moveTo(x, 0); gridCtx.lineTo(x, gridCanvas.height); gridCtx.stroke()
    }
    for (let y = 0; y < gridCanvas.height; y += snapGridSize) {
      gridCtx.beginPath(); gridCtx.moveTo(0, y); gridCtx.lineTo(gridCanvas.width, y); gridCtx.stroke()
    }
  }

  function toggleSnap() {
    snapEnabled = !snapEnabled
    drawGrid()
  }

  function onSnapSizeChange(e) {
    snapGridSize = parseInt(e.currentTarget.value, 10)
    drawGrid()
  }

  function toggleVehiclePreview() {
    showingVeh = !showingVeh
    const vehEl = document.querySelector('#vehicleCard')
    const lightsEl = document.querySelector('#lightsPanel')
    if (vehEl) vehEl.classList.toggle('hidden', !showingVeh)
    if (lightsEl) lightsEl.classList.toggle('hidden', !showingVeh)
    destroyAllHandles()
    setTimeout(buildAllHandles, 30)
  }

  function doReset() {
    layout.set({})
    DRAGGABLES.forEach((b) => {
      const el = document.querySelector(b.sel)
      if (!el) return
      el.style.left = ''
      el.style.top = ''
      el.style.right = ''
      el.style.bottom = ''
      el.style.transform = ''
      if (b.hasOrient) el.classList.remove('vertical')
    })
    nuiPost('setMinimapOffset', { x: 0, y: 0 })
    destroyAllHandles()
    setTimeout(buildAllHandles, 80)
    popToast('Layout reset to defaults')
  }

  function close() {
    editorOpen.set(false)
  }

  function onConfirmYes() {
    confirmVisible = false
    if (confirmYesFn) confirmYesFn()
    confirmYesFn = null
  }

  function onConfirmNo() {
    confirmVisible = false
    confirmYesFn = null
  }

  function askReset() {
    showConfirm(
      'This will reset all HUD elements back to their default positions, scale and orientation. Continue?',
      doReset,
    )
  }

  function saveAndToast() {
    layout.save?.()
    popToast('Layout saved!')
  }

  function onOverlayClick(e) {
    if (activePanel && !activePanel.contains(e.target)) closePanel()
  }

  function onKey(e) {
    if (!$editorOpen) return
    if (e.key === 'Escape') {
      if (confirmVisible) { confirmVisible = false; return }
      close()
    }
  }

  onMount(async () => {
    DRAGGABLES.forEach(applyOneBlock)
    const cur = $layout
    if (cur['minimapCluster']?.offsetX != null) {
      nuiPost('setMinimapOffset', {
        x: cur['minimapCluster'].offsetX,
        y: cur['minimapCluster'].offsetY,
      })
    }

    await tick()
    gridCtx = gridCanvas.getContext('2d')

    setTimeout(() => {
      const clusterEl = document.querySelector('.minimap-cluster')
      if (clusterEl) {
        const r = getRect(clusterEl)
        const ox = cur['minimapCluster']?.offsetX ?? 0
        const oy = cur['minimapCluster']?.offsetY ?? 0
        mmHomePosition = { left: r.left - ox, top: r.top - oy }
      }
      overlayEl.classList.add('active')
      drawGrid()
      const vehEl = document.querySelector('#vehicleCard')
      showingVeh = vehEl ? !vehEl.classList.contains('hidden') : true
      buildAllHandles()
      if (handleSyncRaf) cancelAnimationFrame(handleSyncRaf)
      handleSyncRaf = requestAnimationFrame(syncAllHandles)
    }, 60)

    nuiPost('editorOpened')
    document.addEventListener('keydown', onKey)
  })

  onDestroy(() => {
    closePanel()
    destroyAllHandles()
    nuiPost('editorClosed')

    const cur = $layout
    const pill = document.getElementById('streetPill')
    const sRow = document.getElementById('statusRow')
    if (pill && !cur.streetPill) { pill.style.left = ''; pill.style.top = '' }
    if (sRow && !cur.statusRow) { sRow.style.left = ''; sRow.style.top = '' }

    document.removeEventListener('keydown', onKey)
  })
</script>

<div id="editorOverlay" bind:this={overlayEl} on:click={onOverlayClick}>
  <canvas id="editorGrid" bind:this={gridCanvas} class:visible={snapEnabled}></canvas>
  <div class="ed-ghost" bind:this={ghostBox}></div>
  <div id="editorToast" bind:this={toastEl} class:visible={toastVisible}>{toastMsg}</div>

  <div id="editorConfirm" bind:this={confirmBox} class:visible={confirmVisible}>
    <div class="ed-confirm-box">
      <div class="ed-confirm-msg">{confirmMsg}</div>
      <div class="ed-confirm-btns">
        <button class="ed-btn ed-btn-reset" id="edConfirmYes" on:click={onConfirmYes}>Yes, reset</button>
        <button class="ed-btn ed-btn-close" id="edConfirmNo" on:click={onConfirmNo}>Cancel</button>
      </div>
    </div>
  </div>

  <div id="editorToolbar">
    <span class="ed-title">
      <i class="fa-solid fa-pen-ruler" style="margin-right:7px;color:var(--accent)"></i>Edit Layout
    </span>
    <div class="ed-sep"></div>
    <button class="ed-snap-btn" class:on={snapEnabled} id="edSnapBtn" on:click={toggleSnap}>
      <i class="fa-solid fa-border-all"></i> Grid Snap
    </button>
    <div class="ed-snap-size" class:visible={snapEnabled} id="edSnapSizeWrap">
      <span>Size</span>
      <select id="edSnapSizeSelect" on:change={onSnapSizeChange}>
        <option value="10">10px</option>
        <option value="20" selected>20px</option>
        <option value="40">40px</option>
        <option value="60">60px</option>
      </select>
    </div>
    <div class="ed-sep"></div>
    <button class="ed-veh-btn" class:on={showingVeh} id="edVehBtn" on:click={toggleVehiclePreview}>
      <i class="fa-solid fa-car"></i> Vehicle HUD
    </button>
    <div class="ed-sep"></div>
    <button class="ed-btn ed-btn-reset" id="edResetBtn" on:click={askReset}>
      <i class="fa-solid fa-rotate-left"></i> Reset
    </button>
    <button class="ed-btn ed-btn-save" id="edSaveBtn" on:click={saveAndToast}>
      <i class="fa-solid fa-floppy-disk"></i> Save
    </button>
    <button class="ed-btn ed-btn-close" id="edCloseBtn" on:click={close}>
      <i class="fa-solid fa-xmark"></i> Close
    </button>
  </div>
</div>
