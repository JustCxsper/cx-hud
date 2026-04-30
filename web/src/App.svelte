<script>
  import { hudVisible, hudPaused, inventoryHidden, hudState, menuOpen, editorOpen } from './lib/stores.js'
  import Hud from './components/Hud.svelte'
  import HudMenu from './components/HudMenu.svelte'
  import Editor from './components/Editor.svelte'

  $: hudHidden = !$hudVisible
  $: hudStyle = $hudPaused ? 'visibility:hidden' : ''
</script>

<div class="cinebar cinebar-top" class:hidden={!$hudState.cinebars}></div>
<div class="cinebar cinebar-bottom" class:hidden={!$hudState.cinebars}></div>

<div
  id="hud"
  class:hidden={hudHidden}
  class:inventory-hidden={$inventoryHidden}
  style={hudStyle}
>
  <Hud />
</div>

{#if $menuOpen}
  <HudMenu />
{/if}

{#if $editorOpen}
  <Editor />
{/if}
