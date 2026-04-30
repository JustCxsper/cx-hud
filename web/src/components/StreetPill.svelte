<script>
  import { hudState, status } from '../lib/stores.js'

  $: showPill = $hudState.minimap
  $: showClock = $hudState.streetclock
  $: street = $status.street || ''
  $: zoneText = (() => {
    const c = $status.crossing || ''
    const z = $status.zone || ''
    return c.length ? `${c}  ·  ${z}` : z
  })()
  $: hasWaypoint = $status.waypointDist != null && $status.waypointDist !== ''
</script>

<div class="street-pill glass" id="streetPill" class:hidden={!showPill}>
  <div class="dir-badge" id="direction">{$status.direction}</div>
  <div class="street-copy-wrap">
    <div class="street-copy">
      <strong id="street">{street}</strong>
      <span id="zone">{zoneText}</span>
    </div>
  </div>
  <div class="clock-waypoint-wrap" class:hidden={!showClock}>
    <div
      class="clock-badge"
      id="clockBadge"
      class:chip-fading={hasWaypoint}
      class:hidden={!showClock}
    >
      <i class="fa-regular fa-clock"></i>
      <span id="clock">{$status.time}</span>
    </div>
    <div
      class="clock-badge waypoint-chip"
      id="waypointChip"
      class:chip-visible={hasWaypoint}
      class:hidden={!hasWaypoint}
    >
      <i class="fa-solid fa-location-dot"></i>
      <span id="waypointDist">{$status.waypointDist || '-'}</span>
    </div>
  </div>
</div>
