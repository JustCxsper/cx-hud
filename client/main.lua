local hudHidden = false
local hudUserHidden = false
local State = {
    playerData      = {},
    hudShowing      = false,
    coreLoaded      = false,
    playerSpawned   = false,
    isTalking       = false,
    voiceLabel      = Config.DefaultVoice,
    seatbeltOn      = false,
    ejected         = false,
    menuIsOpen      = false,
    gameIsPaused    = false,
    lastLights      = {
        headlights = false, highbeam = false,
        indicatorLeft = false, indicatorRight = false, hazard = false,
    },
}

local function isReady()
    return State.coreLoaded and State.playerSpawned and LocalPlayer.state.isLoggedIn
end

local Utils   = lib.load('client/utils')(Config)
local Minimap = lib.load('client/minimap')(State, Utils, isReady, Config)
local Vehicle = lib.load('client/vehicle')(State, Utils, Config)
local Weapon  = lib.load('client/weapon')(State, Utils, isReady, Config)
local Status  = lib.load('client/status')(State, Utils, Vehicle, Minimap, isReady, Config)
lib.load('client/seatbelt')(State, Utils, Config)
lib.load('client/lights')(State, Utils, isReady)
lib.load('client/nui')(State, Utils, Minimap, Status, Vehicle, Config)
lib.load('client/events')(State, Utils, Minimap, Status, Vehicle, isReady, Config)

AddStateBagChangeHandler('invOpen', nil, function(bagName, key, value)
    if not bagName:find('player:') then return end
    if value then
        if not hudHidden and not State.hudShowing then return end
        if not hudHidden then SendNUIMessage({ action = 'hideHud' }); hudHidden = true end
    else
        if hudHidden and State.hudShowing then SendNUIMessage({ action = 'showHud' }); hudHidden = false end
    end
end)

exports('showHud', function()
    if not State.hudShowing then
        Minimap.setHudVisible(true)
        Status.pushConfig()
        Status.showHud(true)
        Status.pushStatus(true)
        Vehicle.pushVehicle(true)
    end
end)

exports('hideHud', function()
    if State.hudShowing and not hudHidden then
        Minimap.setHudVisible(false)
        Status.showHud(false)
    end
end)

exports('toggleHud', function()
    hudUserHidden = not hudUserHidden
    if hudUserHidden then
        Minimap.setHudVisible(false)
        Status.showHud(false)
    else
        Minimap.setHudVisible(true)
        Status.showHud(true)
        Status.pushStatus(true)
        Vehicle.pushVehicle(true)
    end
end)