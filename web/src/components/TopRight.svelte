<script>
  import { hudState, status, config } from '../lib/stores.js'

  $: logo = $config.logo
  $: logoUrl = logo?.url || ''
  $: logoTransparent = !!logo?.transparentBg
  $: logoStyle = logo
    ? [
        logo.width ? `--logo-w:${logo.width}px` : '',
        logo.height ? `--logo-h:${logo.height}px` : '',
      ].filter(Boolean).join(';')
    : ''

  let imgFailed = false
  $: if (logoUrl) imgFailed = false

  $: showLogoSlot = $hudState.logo && (logo == null || logoUrl !== '')
</script>

<div class="top-right">
  <div
    class="tr-logo"
    class:glass={!logoTransparent}
    class:hidden={!showLogoSlot}
    id="comp-logo"
    style={logoStyle}
  >
    {#if logoUrl && !imgFailed}
      <img
        id="logoImg"
        class="logo-img"
        src={logoUrl}
        alt=""
        on:error={() => (imgFailed = true)}
      />
    {:else}
      <span class="logo-placeholder" id="logoPlaceholder">
        <i class="fa-solid fa-shield-halved"></i>
      </span>
    {/if}
  </div>

  <div class="glass tr-card job-card" id="comp-job" class:hidden={!$hudState.job}>
    <div class="tr-ico-wrap"><i class="fa-solid fa-briefcase"></i></div>
    <div class="tr-meta">
      <strong id="jobLabel">{$status.job}</strong>
      <span id="jobGrade">{$status.grade}</span>
    </div>
  </div>

  <div class="tr-money-group">
    <div class="glass tr-card money-card cash-card" id="comp-cash" class:hidden={!$hudState.cash}>
      <i class="fa-solid fa-money-bill-wave tr-ico cash-ico"></i>
      <strong id="cash">{$status.cash}</strong>
    </div>
    <div class="glass tr-card money-card bank-card" id="comp-bank" class:hidden={!$hudState.bank}>
      <i class="fa-solid fa-building-columns tr-ico bank-ico"></i>
      <strong id="bank">{$status.bank}</strong>
    </div>
  </div>
</div>
