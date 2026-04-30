<script>
  export let kind = 'health'
  export let elementId = null
  export let ringId = null
  export let icon = 'fa-heart'
  export let title = 'Health'
  export let value = 100
  export let warnThreshold = null
  export let visible = true
  export let extraClass = ''
  export let talking = false

  const RING_CIRC = 125.66

  $: clamped = Math.max(0, Math.min(100, value || 0))
  $: dashOffset = RING_CIRC - (clamped / 100) * RING_CIRC
  $: warn = warnThreshold != null && clamped <= warnThreshold
</script>

<div
  class="status-pill {kind} {extraClass}"
  class:warn-low={warn}
  class:visible
  class:talking
  id={elementId}
  {title}
>
  <div class="pill-bg"></div>
  <svg class="s-ring-svg" viewBox="0 0 44 44">
    <circle class="s-ring-track" cx="22" cy="22" r="20" />
    <circle
      class="s-ring-fill"
      class:warn-low={warn}
      cx="22"
      cy="22"
      r="20"
      id={ringId}
      style="stroke-dasharray:{RING_CIRC} {RING_CIRC}; stroke-dashoffset:{dashOffset};"
    />
  </svg>
  <div class="s-inner"><i class="fa-solid {icon} s-ico"></i></div>
</div>
