Config = {}
Config.Version = "1.0.5" --Don't change this, it is used for version checking and update notifications.

Config.DefaultVoice        = 'Normal'
Config.ShowStress          = true
Config.StressThreshold     = 5
Config.SpeedUnit           = 'MPH' --freedom units
Config.EnableMinimapOnFoot = true
Config.UpdateInterval      = 100
Config.MenuCommand         = 'hud'

--logo stuff needs changed a bit, but this is just a placeholder for now
Config.Logo = {
    url    = 'https://cdn.discordapp.com/attachments/1474555836201173036/1488304999082754078/11111.png?ex=69cc4b8b&is=69cafa0b&hm=6ff725c9e4fa61b87241e6d02fbea1a799a31345b5ae5aa2073376da9c593e3c&',
    width  = 120,
    height = 80,
}

Config.RedlineThreshold = 85

--seatbelt shite
Config.EnableSeatbelt    = true -- do u even want to use our seatbelt? if not set it to false 
Config.SeatbeltEject      = true
Config.SeatbeltEjectSpeed = 60.0
Config.SeatbeltBodyThresh = 500.0
Config.SeatbeltKey        = 29

-- Warning thresholds 
Config.WarnHealth  = 20
Config.WarnHunger  = 15
Config.WarnThirst  = 15
Config.WarnFuel    = 10
Config.WarnEngine  = 20

--ui colours, injects into the css yeehaw
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
    arcFuel        = '#7ee8ca',
    arcEngine      = '#8fb8ff',
    lightIndicator = '#f5a623',
    lightHeadlight = '#fff8c0',
    lightHighbeam  = '#7dd8ff',
    beltWarn       = '#ff4466',
    warnGlow       = 'rgba(255,60,60,0.55)',
}

--Default components for new players.
Config.DefaultVisible = {
    portrait  = true,
    charname  = true,
    voice     = true,
    playerid  = false,
    job       = true,
    cash      = true,
    bank      = true,
    minimap   = true,
    health    = true,
    armor     = true,
    hunger    = true,
    thirst    = true,
    vehicle   = true,
    lights    = true,
    cinebars  = false,
    logo      = false,
}