Config = {}
Config.Version = "1.2.3" -- Don't change this, it is used for version checking and update notifications.

Config.DefaultVoice        = 'Normal'
Config.ShowStress          = true
Config.StressThreshold     = 5
Config.UpdateInterval      = 100
Config.MenuCommand         = 'hud'

-- Redline threshold (percentage)
Config.RedlineThreshold = 85

-- Seatbelt settings
Config.EnableSeatbelt    = true -- do u even want to use our seatbelt? if not set it to false 
Config.SeatbeltEject      = true
Config.SeatbeltEjectSpeed = 60.0
Config.SeatbeltBodyThresh = 500.0

-- Warning thresholds
Config.WarnHealth  = 20
Config.WarnHunger  = 15
Config.WarnThirst  = 15
Config.WarnFuel    = 10
Config.WarnEngine  = 20
Config.WarnAmmoClip = 5 -- ammo clip count below which the counter turns red

Config.Logo = {
    url            = 'https://cxsper.dev/assets/branding/logo.png',
    width          = 120,
    height         = 80,
    transparentBg  = true,
}

-- Weapon item images (don't touch unless you know what you're doing)
Config.InventoryImages = {
    autoDetect = true,
    inventories = {
        { resource = 'ox_inventory',   path = 'nui://ox_inventory/web/images/%s' },
        { resource = 'qb-inventory',   path = 'nui://qb-inventory/html/images/%s' },
        { resource = 'ps-inventory',   path = 'nui://ps-inventory/html/images/%s' },
        { resource = 'core_inventory', path = 'nui://core_inventory/html/img/%s' },
    }
}

-- Default component visibility for new players
Config.DefaultVisible = {
    portrait    = true,
    charname    = true,
    voice       = true,
    playerid    = true,
    job         = true,
    cash        = true,
    bank        = false,
    minimap       = true,
    minimapBorder = true,
    streetPill    = true,
    streetclock   = true,
    streetCompass = true,
    statusRow     = true,
    health      = true,
    armor       = true,
    hunger      = true,
    thirst      = true,
    vehicle     = true,
    lights      = true,
    cinebars    = false,
    logo        = false,
    weapon      = true,
}

-- Set a key to false to lock it server-side (players cannot toggle it via /hud).
-- Keys must match those in Config.DefaultVisible above.
Config.MenuOptions = {
    portrait    = true,
    charname    = true,
    voice       = true,
    playerid    = true,
    job         = true,
    cash        = true,
    bank        = false,
    minimap       = true,
    minimapBorder = true,
    streetPill    = true,
    streetclock   = true,
    streetCompass = true,
    statusRow     = true,
    health      = true,
    armor       = true,
    hunger      = true,
    thirst      = true,
    vehicle     = true,
    lights      = true,
    cinebars    = true,
    logo        = true,
    weapon      = true,
}

-- UI colours, injected into CSS as custom properties
Config.Colors = {
    panel          = 'rgba(6, 9, 16, 0.88)',
    panel2         = 'rgba(10, 15, 24, 0.94)',
    border         = 'rgba(255,255,255,0.07)',
    border2        = 'rgba(255,255,255,0.12)',
    text           = '#d9d9d9',
    muted          = '#7a87a4',
    accent         = '#7ee8ca',
    cash           = '#5cf0a0',
    bank           = '#7dd8ff',
    ringHealth     = '#ff5577',
    ringArmor      = '#7ba4ff',
    ringHunger     = '#f5a623',
    ringThirst     = '#38c9ff',
    ringStress     = '#ff2d6b',
    ringStamina    = '#9f78ff',
    ringOxygen     = '#58b7ff',
    arcFuel        = '#7ee8ca',
    arcEngine      = '#8fb8ff',
    lightIndicator = '#f5a623',
    lightHeadlight = '#fff8c0',
    lightHighbeam  = '#7dd8ff',
    beltWarn       = '#ff4466',
    warnGlow       = 'rgba(255,60,60,0.55)',
    ringWeapon     = '#e8c97e',
    ringWeaponLow  = '#ff5555',
}
