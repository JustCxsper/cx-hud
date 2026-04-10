
local hudHidden = false
local State = {
    whoAmI        = {},
    hudShowing    = false,
    diddlyLoaded  = false,
    actuallySpawned = false,
    mouthRunning  = false,
    voiceLabel    = Config.DefaultVoice,
    buckledUp     = false,
    menuIsOpen    = false,
    gameIsPaused  = false,
    lastLights    = {
        headlights = false, highbeam = false,
        indicatorLeft = false, indicatorRight = false, hazard = false,
    },
}

local function readyToRock()
    return State.diddlyLoaded and State.actuallySpawned and LocalPlayer.state.isLoggedIn
end

local Utils   = lib.load('client/utils')(Config)
local Minimap = lib.load('client/minimap')(State, Utils, readyToRock, Config)
local Vehicle = lib.load('client/vehicle')(State, Utils, readyToRock, Config)
local Status  = lib.load('client/status')(State, Utils, Vehicle, Minimap, readyToRock, Config)
lib.load('client/events')(State, Utils, Minimap, Status, Vehicle, readyToRock, Config)

AddStateBagChangeHandler('invOpen', nil, function(bagName, key, value)
    if not bagName:find('player:') then return end

    if value then
        if not hudHidden then
            SendNUIMessage({ action = 'hideHud' })
            hudHidden = true
        end
    else
        if hudHidden then
            SendNUIMessage({ action = 'showHud' })
            hudHidden = false
        end
    end
end)
-- Slapped in here to hide the default GTA reticle and top-left minimap pill
CreateThread(function()
    while true do
        Wait(0)
        HideHudComponentThisFrame(14)
        HideHudComponentThisFrame(7)
    end
end)
