<script>
  import { hudState, vehicle, config } from '../lib/stores.js'
  import { onMount, tick } from 'svelte'

  const SPEED_DASH = 418
  const ARC_DASH = 110

  $: thresh = $config.thresholds || { fuel: 10, engine: 20 }
  $: redlineRpm = $config.redline ?? 85

  $: showCard = $hudState.vehicle && $vehicle.show

  $: speedPct = Math.max(0, Math.min(100, ($vehicle.speed || 0) / 220 * 100))
  $: speedDashOffset = SPEED_DASH - (speedPct / 100) * SPEED_DASH

  $: rpmPct = Math.max(0, Math.min(100, $vehicle.rpm || 0))
  $: rpmDisplay = Math.round((rpmPct / 100) * 8000).toLocaleString()
  $: redlineActive = rpmPct >= redlineRpm

  $: fuelPct = Math.max(0, Math.min(100, $vehicle.fuel || 0))
  $: fuelDashOffset = ARC_DASH - (fuelPct / 100) * ARC_DASH
  $: fuelLow = fuelPct <= thresh.fuel

  $: enginePct = Math.max(0, Math.min(100, $vehicle.engine || 0))
  $: engineDashOffset = ARC_DASH - (enginePct / 100) * ARC_DASH
  $: engineLow = enginePct <= thresh.engine

  $: gearVal = $vehicle.gear ?? '1'
  $: seatbelt = !!$vehicle.seatbelt

  let lastGear = -1
  let gearShift = false
  let gearShiftTimer = null
  $: if (gearVal !== lastGear) {
    const prev = lastGear
    lastGear = gearVal
    if (prev !== -1 && gearVal !== 'R' && gearVal !== '0') {
      flashGear()
    }
  }

  function flashGear() {
    if (gearShiftTimer) clearTimeout(gearShiftTimer)
    gearShift = true
    gearShiftTimer = setTimeout(() => {
      gearShift = false
      gearShiftTimer = null
    }, 280)
  }

  let dialTickPaths = []
  let redlineLine = null

  function buildDialTicks() {
    const cx = 115, cy = 115, outerR = 88, majorLen = 10, minorLen = 5
    const startAngle = 0, sweep = 264, majorCount = 11, minorPerMajor = 4
    const total = (majorCount - 1) * (minorPerMajor + 1) + 1
    const step = sweep / (total - 1)
    const ticks = []
    for (let i = 0; i < total; i++) {
      const major = i % (minorPerMajor + 1) === 0
      const len = major ? majorLen : minorLen
      const rad = ((startAngle + i * step) * Math.PI) / 180
      const ox = cx + outerR * Math.cos(rad)
      const oy = cy + outerR * Math.sin(rad)
      const ix = cx + (outerR - len) * Math.cos(rad)
      const iy = cy + (outerR - len) * Math.sin(rad)
      ticks.push({
        x1: ox.toFixed(2),
        y1: oy.toFixed(2),
        x2: ix.toFixed(2),
        y2: iy.toFixed(2),
        major,
      })
    }
    dialTickPaths = ticks
  }

  function buildRedline(threshold) {
    const cx = 115, cy = 115, r = 88
    const sweep = 264
    const angleDeg = (threshold / 100) * sweep
    const rad = (angleDeg * Math.PI) / 180
    const ox = cx + r * Math.cos(rad)
    const oy = cy + r * Math.sin(rad)
    const innerR = 78
    const ix = cx + innerR * Math.cos(rad)
    const iy = cy + innerR * Math.sin(rad)
    redlineLine = {
      x1: ox.toFixed(2),
      y1: oy.toFixed(2),
      x2: ix.toFixed(2),
      y2: iy.toFixed(2),
    }
  }

  $: buildRedline(redlineRpm)

  onMount(() => {
    buildDialTicks()
  })
</script>

<div class="vehicle-card" id="vehicleCard" class:hidden={!showCard}>
  <div class="speed-wrap">
    <svg viewBox="0 0 230 230" class="speed-svg" id="speedoSvg">
      <circle class="dial-disc" cx="115" cy="115" r="112" />
      <g class="dial-ticks" id="dialTicks">
        {#each dialTickPaths as t}
          <line
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            class={t.major ? 'dial-tick-major' : 'dial-tick-minor'}
          />
        {/each}
      </g>
      {#if redlineLine}
        <line
          class="redline-marker"
          id="redlineMarker"
          x1={redlineLine.x1}
          y1={redlineLine.y1}
          x2={redlineLine.x2}
          y2={redlineLine.y2}
        />
      {/if}
      <circle class="side-arc-bg fuel-arc-bg" cx="115" cy="115" r="108" />
      <circle
        class="side-arc-fill fuel-arc-fill"
        class:warn-low={fuelLow}
        cx="115"
        cy="115"
        r="108"
        id="fuelArc"
        style="stroke-dashoffset:{fuelDashOffset};"
      />
      <circle class="side-arc-bg engine-arc-bg" cx="115" cy="115" r="108" />
      <circle
        class="side-arc-fill engine-arc-fill"
        class:warn-low={engineLow}
        cx="115"
        cy="115"
        r="108"
        id="engineArc"
        style="stroke-dashoffset:{engineDashOffset};"
      />
      <circle class="speed-ring-bg" cx="115" cy="115" r="95" />
      <circle
        class="speed-ring-fill"
        class:redline-active={redlineActive}
        cx="115"
        cy="115"
        r="95"
        id="speedRing"
        style="stroke-dashoffset:{speedDashOffset};"
      />
    </svg>
    <div class="speed-center">
      <div class="speed-num-wrap">
        <strong class="speed-val" id="speedVal">{$vehicle.speed ?? 0}</strong>
        <span class="speed-unit" id="speedUnit">{$vehicle.unit || 'MPH'}</span>
      </div>
      <div class="gear-badge" id="gearVal" class:gear-shift={gearShift}>{gearVal}</div>
      <div class="veh-name-label" id="vehName">{$vehicle.vehName || ''}</div>
    </div>
    <div class="arc-labels">
      <div class="arc-label fuel-label">
        <i class="fa-solid fa-gas-pump"></i>
        <span id="fuelPct">{Math.round(fuelPct)}%</span>
      </div>
      <div class="arc-label engine-label">
        <i class="fa-solid fa-screwdriver-wrench"></i>
        <span id="enginePct">{Math.round(enginePct)}%</span>
      </div>
    </div>
    <div class="rpm-row">
      <span class="rpm-lbl">RPM</span>
      <span class="rpm-val" id="rpmVal">{rpmDisplay}</span>
    </div>
  </div>
  <div class="veh-footer">
    <div
      class="veh-tag belt-warn"
      id="seatbeltPill"
      class:on={seatbelt}
      class:belt-warn={!seatbelt}
    >
      <i class="fa-solid fa-user-shield"></i>
      <span>{seatbelt ? 'Belt On' : 'Belt Off'}</span>
    </div>
  </div>
</div>
