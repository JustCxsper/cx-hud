<script>
  import { hudState, vehicle } from '../lib/stores.js'

  $: lights = $vehicle.lights || {}
  $: hazard = !!lights.hazard
  $: leftOn = hazard || !!lights.indicatorLeft
  $: rightOn = hazard || !!lights.indicatorRight
  $: showPanel = $hudState.lights && $vehicle.show
</script>

<div class="lights-panel" id="lightsPanel" class:hidden={!showPanel}>
  <div
    class="light-btn indicator-left"
    id="lightIndicatorLeft"
    class:active={leftOn}
    title="Left Indicator"
  >
    <i class="fa-solid fa-arrow-left"></i>
  </div>
  <div
    class="light-btn hazard"
    id="lightHazard"
    class:active={hazard}
    title="Hazards"
  >
    <i class="fa-solid fa-triangle-exclamation"></i>
  </div>
  <div
    class="light-btn headlights"
    id="lightHeadlights"
    class:active={!!lights.headlights}
    title="Headlights"
  >
    <i class="fa-solid fa-lightbulb"></i>
  </div>
  <div
    class="light-btn highbeam"
    id="lightHighbeam"
    class:active={!!lights.highbeam}
    title="High Beam"
  >
    <i class="fa-solid fa-bolt-lightning"></i>
  </div>
  <div
    class="light-btn indicator-right"
    id="lightIndicatorRight"
    class:active={rightOn}
    title="Right Indicator"
  >
    <i class="fa-solid fa-arrow-right"></i>
  </div>
</div>
