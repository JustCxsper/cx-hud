<script>
  import { hudState, status, config, showStatusRow } from '../lib/stores.js'
  import StatusPill from './StatusPill.svelte'

  $: thresh = $config.thresholds || { health: 20, hunger: 15, thirst: 15 }
  $: voiceMode = $status.voice || 'Normal'

  $: voiceClass = `mode-${voiceMode}`
</script>

<div class="status-row" id="statusRow" class:hidden={!$showStatusRow}>
  <StatusPill
    kind="voice"
    elementId="comp-voice"
    ringId="voiceRingBar"
    icon="fa-microphone"
    title="Voice"
    value={100}
    visible={$hudState.voice}
    extraClass={voiceClass}
    talking={!!$status.talking}
  />

  <StatusPill
    kind="health"
    elementId="comp-health"
    ringId="healthBar"
    icon="fa-heart"
    title="Health"
    value={$status.health}
    warnThreshold={thresh.health}
    visible={$hudState.health}
  />

  <StatusPill
    kind="armor"
    elementId="comp-armor"
    ringId="armorBar"
    icon="fa-shield-halved"
    title="Armour"
    value={$status.armour}
    visible={$hudState.armor}
  />

  <StatusPill
    kind="hunger"
    elementId="comp-hunger"
    ringId="hungerBar"
    icon="fa-burger"
    title="Hunger"
    value={$status.hunger}
    warnThreshold={thresh.hunger}
    visible={$hudState.hunger}
  />

  <StatusPill
    kind="thirst"
    elementId="comp-thirst"
    ringId="thirstBar"
    icon="fa-droplet"
    title="Thirst"
    value={$status.thirst}
    warnThreshold={thresh.thirst}
    visible={$hudState.thirst}
  />

  <StatusPill
    kind="stress"
    elementId="stressPill"
    ringId="stressBar"
    icon="fa-brain"
    title="Stress"
    value={$status.stress}
    visible={$status.showStress}
  />

  <StatusPill
    kind="stamina"
    elementId="staminaPill"
    ringId="staminaBar"
    icon="fa-bolt"
    title="Stamina"
    value={100 - ($status.stamina || 0)}
    visible={$status.showStamina}
  />
</div>
