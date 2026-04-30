<script>
  import { hudState, weapon } from '../lib/stores.js'

  $: visible = $weapon.show && $hudState.weapon
  $: isMeleeOrThrow = !!($weapon.isMelee || $weapon.isThrow)
  $: name = $weapon.weapName
    ? $weapon.weapName
        .replace('weapon_', '')
        .replace(/_/g, ' ')
        .replace(/\w/g, (c) => c.toUpperCase())
    : 'Unknown'

  let imgSources = []
  let imgIndex = 0
  let imgFailed = false

  $: {
    const base = $weapon.weaponImageBase
    const next = base
      ? /\.(png|webp)$/i.test(base)
        ? [base]
        : [base + '.png', base + '.webp']
      : []
    if (JSON.stringify(next) !== JSON.stringify(imgSources)) {
      imgSources = next
      imgIndex = 0
      imgFailed = false
    }
  }

  $: currentSrc = imgSources[imgIndex] || ''

  function handleImgError() {
    if (imgIndex + 1 < imgSources.length) {
      imgIndex += 1
    } else {
      imgFailed = true
    }
  }
</script>

<div
  class="weapon-card glass"
  id="weaponCard"
  class:hud-weapon-disabled={!$hudState.weapon}
  class:weapon-visible={visible}
  class:hidden={!$weapon.show}
  class:ammo-low={!isMeleeOrThrow && !!$weapon.low}
>
  <div class="weapon-icon-wrap" id="weaponIconWrap">
    {#if currentSrc && !imgFailed}
      <img
        class="weapon-img"
        id="weaponImg"
        src={currentSrc}
        alt=""
        on:error={handleImgError}
      />
    {:else}
      <i class="fa-solid fa-gun weapon-icon-fallback" id="weaponIcon"></i>
    {/if}
  </div>
  <div class="weapon-divider"></div>
  <div class="weapon-info">
    <span class="weapon-name" id="weaponName">{name}</span>
    <div class="weapon-ammo-row" id="weaponAmmoRow" class:hidden={isMeleeOrThrow}>
      <span class="weapon-ammo-clip" id="weaponAmmoClip">{$weapon.ammoClip ?? 0}</span>
      <span class="weapon-ammo-label" id="weaponAmmoLabel">{$weapon.ammoLabel || 'AMMO'}</span>
    </div>
    <span
      class="weapon-melee-label"
      id="weaponMeleeLabel"
      class:hidden={!isMeleeOrThrow}
    >
      Melee
    </span>
  </div>
</div>
