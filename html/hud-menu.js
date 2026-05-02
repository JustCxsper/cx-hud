const bigPortrait    = document.getElementById('portraitImg')
const bigFallback    = document.getElementById('portraitIcon')
const previewPic     = document.getElementById('avatarPreviewImg')
const previewFallbck = document.getElementById('avatarPreviewIcon')
const urlBox         = document.getElementById('avatarUrlInput')

if (bigPortrait) bigPortrait.addEventListener('error', nukeAvatar)

function setAvatar(url) {
    if (!url || !url.trim()) { nukeAvatar(); return }
    const src = url.trim()
    bigPortrait.src = src
    bigPortrait.classList.remove('hidden')
    bigFallback.classList.add('hidden')
    previewPic.src = src
    previewPic.classList.remove('hidden')
    previewFallbck.classList.add('hidden')
    localStorage.setItem(AVATAR_KEY, src)
}

function nukeAvatar() {
    bigPortrait.src = ''
    bigPortrait.classList.add('hidden')
    bigFallback.classList.remove('hidden')
    previewPic.src = ''
    previewPic.classList.add('hidden')
    previewFallbck.classList.remove('hidden')
    if (urlBox) urlBox.value = ''
    localStorage.removeItem(AVATAR_KEY)
}

;(function() {
    const saved = localStorage.getItem(AVATAR_KEY)
    if (saved) setAvatar(saved)
})()

document.getElementById('avatarApply')?.addEventListener('click', () => setAvatar(urlBox.value))
document.getElementById('avatarClear')?.addEventListener('click', nukeAvatar)
urlBox?.addEventListener('keydown', e => { if (e.key === 'Enter') setAvatar(urlBox.value) })
urlBox?.addEventListener('input', () => {
    const val = urlBox.value.trim()
    if (val.length > 8) {
        previewPic.src = val
        previewPic.classList.remove('hidden')
        previewFallbck.classList.add('hidden')
    }
})

document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const paneId = 'pane-' + tab.dataset.tab
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'))
        document.querySelectorAll('.menu-pane').forEach(p => p.classList.remove('active'))
        tab.classList.add('active')
        document.getElementById(paneId)?.classList.add('active')
    })
})

function openSettings() {
    settingsMenu.classList.remove('hidden')
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.menu-pane').forEach(p => p.classList.remove('active'))
    document.querySelector('.menu-tab')?.classList.add('active')
    document.querySelector('.menu-pane')?.classList.add('active')
    for (const key of Object.keys(hudState)) {
        const cb = document.getElementById('tog-' + key)
        if (cb) cb.checked = hudState[key]
    }
    const speedTog = document.getElementById('tog-speedunit')
    if (speedTog) speedTog.checked = (currentUnit === 'KMH')
    const savedAv = localStorage.getItem(AVATAR_KEY)
    if (savedAv && urlBox) urlBox.value = savedAv
}

function closeSettings() {
    settingsMenu.classList.add('hidden')
    nuiPost('menuClosed')
}

document.getElementById('menuClose')?.addEventListener('click', closeSettings)
document.getElementById('menuBackdrop')?.addEventListener('click', closeSettings)

document.addEventListener('keydown', e => {
    if (settingsMenu.classList.contains('hidden')) return
    if ((e.key === 'Escape' || e.key === 'Backspace') && document.activeElement !== urlBox) {
        e.preventDefault()
        closeSettings()
    }
})

for (const key of Object.keys(hudState)) {
    const cb = document.getElementById('tog-' + key)
    if (!cb) continue
    cb.addEventListener('change', () => {
        hudState[key] = cb.checked
        applyVisibility()
        saveHudState()
        if (key === 'minimap') nuiPost('setMinimapVisible', { visible: cb.checked })
        if (key === 'cinebars') nuiPost('setCinebars', { visible: cb.checked })
    })
}

currentUnit = loadSpeedUnit() || 'MPH'

const unitToggle = document.getElementById('tog-speedunit')
if (unitToggle) {
    unitToggle.checked = (currentUnit === 'KMH')
    unitToggle.addEventListener('change', () => {
        currentUnit = unitToggle.checked ? 'KMH' : 'MPH'
        saveSpeedUnit(currentUnit)
        nuiPost('setSpeedUnit', { unit: currentUnit })
    })
}
