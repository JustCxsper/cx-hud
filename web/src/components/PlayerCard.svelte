<script>
  import { hudState, status, avatar, showTopLeft } from '../lib/stores.js'
</script>

<div class="top-left">
  <div class="glass tl-card" class:hidden={!$showTopLeft}>
    <div class="char-portrait" id="comp-portrait" class:hidden={!$hudState.portrait}>
      <div class="portrait-frame">
        {#if $avatar}
          <img id="portraitImg" class="portrait-img" src={$avatar} alt="" />
        {:else}
          <i class="fa-solid fa-user portrait-icon" id="portraitIcon"></i>
        {/if}
      </div>
    </div>
    <div class="tl-info">
      <div class="tl-name-row" id="comp-charname" class:hidden={!$hudState.charname}>
        <strong class="tl-charname" id="charName">{$status.charName}</strong>
      </div>
      <div class="tl-row" id="comp-playerid" class:hidden={!$hudState.playerid}>
        <span class="tl-label">ID</span>
        <strong class="tl-val" id="playerId" style="color:var(--accent);font-size:13px;">
          {$status.id}
        </strong>
      </div>
    </div>
  </div>
</div>
