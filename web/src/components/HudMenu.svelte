<script>
  import { onMount, onDestroy } from 'svelte'
  import {
    hudState, menuOpen, editorOpen, avatar, speedUnit, versionInfo, config,
  } from '../lib/stores.js'
  import { nuiPost } from '../lib/nui.js'

  let activeTab = 'general'
  let urlInput = ''
  let avatarPreview = ''

  $: avatarPreview = $avatar
  $: lockedOptions = (() => {
    const opts = $config.menuOptions || {}
    if (Array.isArray(opts.locked)) return new Set(opts.locked)
    const set = new Set()
    for (const [k, v] of Object.entries(opts)) if (v === false) set.add(k)
    return set
  })()

  const TOGGLE_DEFS = [
    { tab: 'general', section: 'Player Card', icon: 'fa-id-card', items: [
      { key: 'portrait', icon: 'fa-image-portrait', label: 'Portrait', sub: 'Avatar photo frame' },
      { key: 'charname', icon: 'fa-signature', label: 'Character Name', sub: 'Name display' },
      { key: 'voice', icon: 'fa-microphone', label: 'Voice Indicator', sub: 'Proximity & mode ring' },
      { key: 'playerid', icon: 'fa-id-badge', label: 'Player ID', sub: 'Server ID' },
    ]},
    { tab: 'general', section: 'Top Right', icon: 'fa-layer-group', items: [
      { key: 'logo', icon: 'fa-shield-halved', label: 'Server Logo', sub: 'Logo panel' },
      { key: 'job', icon: 'fa-briefcase', label: 'Job & Grade', sub: 'Current occupation' },
      { key: 'cash', icon: 'fa-money-bill-wave', label: 'Cash', sub: 'Wallet balance' },
      { key: 'bank', icon: 'fa-building-columns', label: 'Bank', sub: 'Account balance' },
    ]},
    { tab: 'general', section: 'Weapon', icon: 'fa-gun', items: [
      { key: 'weapon', icon: 'fa-gun', label: 'Weapon & Ammo', sub: 'Current weapon and clip ammo' },
    ]},
    { tab: 'map', section: 'Minimap', icon: 'fa-map', items: [
      { key: 'minimap', icon: 'fa-map', label: 'Minimap', sub: 'Frame & street bar' },
      { key: 'streetclock', icon: 'fa-clock', label: 'Street Clock', sub: 'Time & waypoint' },
    ]},
    { tab: 'map', section: 'Status Rings', icon: 'fa-heart-pulse', items: [
      { key: 'health', icon: 'fa-heart', label: 'Health', sub: 'HP ring' },
      { key: 'armor', icon: 'fa-shield-halved', label: 'Armour', sub: 'Armour ring' },
      { key: 'hunger', icon: 'fa-burger', label: 'Hunger', sub: 'Food level' },
      { key: 'thirst', icon: 'fa-droplet', label: 'Thirst', sub: 'Water level' },
    ]},
    { tab: 'map', section: 'Display', icon: 'fa-film', items: [
      { key: 'cinebars', icon: 'fa-film', label: 'Cinematic Bars', sub: 'Black bars top & bottom' },
    ]},
    { tab: 'vehicle', section: 'Speedometer', icon: 'fa-gauge-high', items: [
      { key: 'vehicle', icon: 'fa-gauge-high', label: 'Speedometer', sub: 'Speed, gear, RPM, fuel' },
      { key: 'lights', icon: 'fa-lightbulb', label: 'Lights Panel', sub: 'Indicators & headlights' },
    ]},
  ]

  const SECTIONS_BY_TAB = {
    general: TOGGLE_DEFS.filter((s) => s.tab === 'general'),
    map: TOGGLE_DEFS.filter((s) => s.tab === 'map'),
    vehicle: TOGGLE_DEFS.filter((s) => s.tab === 'vehicle'),
  }

  function setToggle(key, val) {
    if (lockedOptions.has(key)) return
    hudState.update((s) => ({ ...s, [key]: val }))
    if (key === 'minimap') nuiPost('setMinimapVisible', { visible: val })
  }

  function applyAvatar() {
    const v = (urlInput || '').trim()
    if (!v) { avatar.set(''); return }
    avatar.set(v)
  }

  function clearAvatar() {
    urlInput = ''
    avatar.set('')
  }

  function onAvatarKey(e) {
    if (e.key === 'Enter') applyAvatar()
  }

  function onAvatarInput() {
    const v = (urlInput || '').trim()
    if (v.length > 8) avatarPreview = v
  }

  function close() {
    menuOpen.set(false)
    nuiPost('menuClosed')
  }

  function onKey(e) {
    if (!$menuOpen) return
    if ((e.key === 'Escape' || e.key === 'Backspace')) {
      const tag = document.activeElement?.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        close()
      }
    }
  }

  function openEditor() {
    menuOpen.set(false)
    setTimeout(() => editorOpen.set(true), 150)
  }

  $: speedKmh = $speedUnit === 'KMH'

  function toggleSpeedUnit(checked) {
    const next = checked ? 'KMH' : 'MPH'
    speedUnit.set(next)
    nuiPost('setSpeedUnit', { unit: next })
  }

  onMount(() => {
    urlInput = $avatar || ''
    document.addEventListener('keydown', onKey)
  })
  onDestroy(() => {
    document.removeEventListener('keydown', onKey)
  })
</script>

<div id="hudMenu">
  <div class="hud-menu-backdrop" id="menuBackdrop" on:click={close}></div>
  <div class="hud-menu-panel">
    <div class="hud-menu-title">
      <div class="menu-title-left">
        <div class="menu-logo"><i class="fa-solid fa-sliders"></i></div>
        <div>
          <h2>HUD Settings</h2>
          <span class="menu-subtitle">Changes save automatically</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="edit-layout-btn" id="editLayoutBtn" on:click={openEditor}>
          <i class="fa-solid fa-pen-ruler"></i> Edit Layout
        </button>
        <span
          class="hud-version-badge"
          id="versionBadge"
          class:version-outdated={$versionInfo.outdated}
          title={$versionInfo.outdated ? `Update available: v${$versionInfo.latest}` : ''}
        >
          v{$versionInfo.current}
        </span>
        <button class="hud-menu-close" id="menuClose" on:click={close}>
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <div class="menu-tabs" id="menuTabs">
      <button
        class="menu-tab"
        class:active={activeTab === 'general'}
        data-tab="general"
        on:click={() => (activeTab = 'general')}
      >
        <i class="fa-solid fa-user"></i><span>General</span>
      </button>
      <button
        class="menu-tab"
        class:active={activeTab === 'map'}
        data-tab="map"
        on:click={() => (activeTab = 'map')}
      >
        <i class="fa-solid fa-map"></i><span>Map &amp; Status</span>
      </button>
      <button
        class="menu-tab"
        class:active={activeTab === 'vehicle'}
        data-tab="vehicle"
        on:click={() => (activeTab = 'vehicle')}
      >
        <i class="fa-solid fa-car"></i><span>Vehicle</span>
      </button>
    </div>

    <div class="menu-content">
      {#each Object.entries(SECTIONS_BY_TAB) as [tabKey, sections]}
        <div class="menu-pane" class:active={activeTab === tabKey} id={`pane-${tabKey}`}>
          {#each sections as section, i}
            <div class="pane-section-title" style={i > 0 ? 'margin-top:18px;' : ''}>
              <i class={`fa-solid ${section.icon}`}></i> {section.section}
            </div>
            <div class="pane-grid">
              {#each section.items as it}
                {@const locked = lockedOptions.has(it.key)}
                <label class="hud-toggle-row" style={locked ? 'opacity:0.45;pointer-events:none;' : ''}>
                  <div class="hud-toggle-label">
                    <i class={`fa-solid ${it.icon}`}></i>
                    <div><span>{it.label}</span><small>{it.sub}</small></div>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      id={`tog-${it.key}`}
                      checked={$hudState[it.key]}
                      disabled={locked}
                      on:change={(e) => setToggle(it.key, e.currentTarget.checked)}
                    />
                    <div class="toggle-track"></div>
                    <div class="toggle-thumb"></div>
                  </label>
                </label>
              {/each}
            </div>
            {#if tabKey === 'map' && i === 0}
              <div class="pane-divider"></div>
            {/if}
          {/each}

          {#if tabKey === 'vehicle'}
            <div class="pane-section-title" style="margin-top:18px;">
              <i class="fa-solid fa-ruler-combined"></i> Units
            </div>
            <div class="pane-grid">
              <label class="hud-toggle-row">
                <div class="hud-toggle-label">
                  <i class="fa-solid fa-ruler-combined"></i>
                  <div><span>Speed Unit</span><small>Off = MPH &nbsp;·&nbsp; On = KMH</small></div>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    id="tog-speedunit"
                    checked={speedKmh}
                    on:change={(e) => toggleSpeedUnit(e.currentTarget.checked)}
                  />
                  <div class="toggle-track"></div>
                  <div class="toggle-thumb"></div>
                </label>
              </label>
            </div>
          {/if}

          {#if tabKey === 'general'}
            <div class="pane-section-title"><i class="fa-solid fa-image"></i> Avatar</div>
            <div class="avatar-input-row">
              <div class="avatar-preview" id="avatarPreview">
                {#if avatarPreview}
                  <img id="avatarPreviewImg" src={avatarPreview} alt="" on:error={() => (avatarPreview = '')} />
                {:else}
                  <i class="fa-solid fa-user" id="avatarPreviewIcon"></i>
                {/if}
              </div>
              <div class="avatar-input-wrap">
                <input
                  type="url"
                  id="avatarUrlInput"
                  class="avatar-url-input"
                  placeholder="Paste image URL..."
                  autocomplete="off"
                  spellcheck="false"
                  bind:value={urlInput}
                  on:keydown={onAvatarKey}
                  on:input={onAvatarInput}
                />
                <div class="avatar-input-actions">
                  <button class="avatar-btn apply" id="avatarApply" on:click={applyAvatar}>
                    <i class="fa-solid fa-check"></i> Apply
                  </button>
                  <button class="avatar-btn clear" id="avatarClear" on:click={clearAvatar}>
                    <i class="fa-solid fa-xmark"></i> Clear
                  </button>
                </div>
                <span class="avatar-hint">imgur · Discord CDN · .png/.jpg</span>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="hud-menu-footer">
      <div class="footer-shortcuts">
        <span><kbd>ESC</kbd> to close</span>
        <span class="footer-dot">·</span>
        <span><kbd>BACKSPACE</kbd> also works</span>
      </div>
    </div>
  </div>
</div>
