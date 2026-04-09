
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
