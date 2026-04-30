<script>
  import { hudState } from '../lib/stores.js'
</script>

<div class="minimap-cluster">
  <div class="minimap-frame" id="comp-minimap" class:hidden={!$hudState.minimap}></div>
  <div class="minimap-border-ring" class:hidden={!$hudState.minimap}></div>
</div>
