local whoAmI          = {}
local hudShowing      = false
local diddlyLoaded    = false
local actuallySpawned = false
local mouthRunning    = false
local voiceLabel      = Config.DefaultVoice
local buckledUp       = false
local menuIsOpen      = false
local mapPatched      = false
local gameIsPaused    = false
local myPid           = nil

local lastLights = {
    headlights = false, highbeam = false,
    indicatorLeft = false, indicatorRight = false, hazard = false,
}

local BELT_KEY   = Config.SeatbeltKey or 29
local HIDE_COMPS = { 1, 2, 3, 4, 6, 7, 8, 9, 13, 14, 19 }

local function yeet(action, payload)
    SendNUIMessage({ action = action, data = payload })
end

local function roundIt(n)
    return math.floor((n or 0) + 0.5)
end

local function showHud(state)
    hudShowing = state
    yeet('toggleHud', { visible = state })
end

local function readyToRock()
    return diddlyLoaded and actuallySpawned and LocalPlayer.state.isLoggedIn
end

local function headingToCompass(deg)
    local dirs = { 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' }
    return dirs[math.floor(((deg % 360) + 22.5) / 45) % 8 + 1]
end

local function whereTheHellAmI(coords)
    local sh, ch  = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local rawZone = GetNameOfZone(coords.x, coords.y, coords.z)
    local street  = GetStreetNameFromHashKey(sh)
    local cross   = ch ~= 0 and GetStreetNameFromHashKey(ch) or ''
    local zLabel  = GetLabelText(rawZone)
    return street, cross, (zLabel == 'NULL' or zLabel == '') and rawZone or zLabel
end

local function waypointDistance(coords)
    local wp = GetFirstBlipInfoId(8)
    if not DoesBlipExist(wp) then return nil end
    local wc = GetBlipInfoIdCoord(wp)
    local d  = math.sqrt((coords.x - wc.x)^2 + (coords.y - wc.y)^2)
    return d >= 1000 and ('%.1f km'):format(d / 1000) or ('%d m'):format(math.floor(d))
end

local cachedCash  = '$0'
local cachedBank  = '$0'
local lastCashRaw = -1
local lastBankRaw = -1

local function prettyMoney(n)
    local s = tostring(math.floor(n or 0))
    local going = true
    while going do
        local k; s, k = s:gsub('^(%-?%d+)(%d%d%d)', '%1,%2')
        if k == 0 then going = false end
    end
    return '$' .. s
end

local function refreshMoneyCache()
    local cash = (whoAmI.money and whoAmI.money.cash) or 0
    local bank = (whoAmI.money and whoAmI.money.bank) or 0
    if cash ~= lastCashRaw then lastCashRaw = cash; cachedCash = prettyMoney(cash) end
    if bank ~= lastBankRaw then lastBankRaw = bank; cachedBank = prettyMoney(bank) end
end

local cachedJob   = 'Civilian'
local cachedGrade = 'Unemployed'
local cachedName  = 'Player'

local function refreshStaticCache()
    refreshMoneyCache()
    if whoAmI.job then
        cachedJob   = whoAmI.job.label or whoAmI.job.name or 'Civilian'
        local g     = whoAmI.job.grade
        cachedGrade = g and (g.name or tostring(g.level)) or 'Unemployed'
    else
        cachedJob = 'Civilian'; cachedGrade = 'Unemployed'
    end
    if whoAmI.charinfo then
        local full = ((whoAmI.charinfo.firstname or '') .. ' ' .. (whoAmI.charinfo.lastname or '')):match('^%s*(.-)%s*$')
        cachedName = full ~= '' and full or 'Player'
    else
        cachedName = 'Player'
    end
end

local cachedVehHandle = -1
local cachedVehName   = ''

local function getVehName(veh)
    if veh == cachedVehHandle then return cachedVehName end
    local label = GetLabelText(GetDisplayNameFromVehicleModel(GetEntityModel(veh)))
    if label == 'NULL' or label == '' then label = GetDisplayNameFromVehicleModel(GetEntityModel(veh)) end
    cachedVehHandle = veh
    cachedVehName   = label
    return label
end

local squaremapLoaded = false

local function grabSquaremap()
    if squaremapLoaded then return true end
    RequestStreamedTextureDict('squaremap', false)
    local waited = 0
    while not HasStreamedTextureDictLoaded('squaremap') do
        Wait(100); waited = waited + 100
        if waited >= 5000 then print('[cx-hud] squaremap timed out'); return false end
    end
    SetMinimapClipType(0)
    AddReplaceTexture('platform:/textures/graphics', 'radarmasksm', 'squaremap', 'radarmasksm')
    AddReplaceTexture('platform:/textures/graphics', 'radarmask1g', 'squaremap', 'radarmasksm')
    squaremapLoaded = true
    return true
end

local function killBigmap()
    CreateThread(function()
        local t = 0
        while t < 10000 do SetBigmapActive(false, false); t = t + 1000; Wait(1000) end
    end)
end

local function patchMinimap()
    if mapPatched then return end
    if not grabSquaremap() then return end
    local rx, ry   = GetActiveScreenResolution()
    local mmOffset = 0.0
    if rx / ry > 1920 / 1080 then mmOffset = ((1920 / 1080 - rx / ry) / 3.6) - 0.008 end
    SetMinimapClipType(0)
    SetMinimapComponentPosition('minimap',      'L', 'B',  0.0  + mmOffset, -0.047, 0.1638, 0.183)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B',  0.0  + mmOffset,  0.0,   0.128,  0.20)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.01 + mmOffset,  0.025, 0.262,  0.300)
    SetBlipAlpha(GetNorthRadarBlip(), 0)
    SetBigmapActive(true, false); Wait(0); SetBigmapActive(false, false)
    killBigmap()
    mapPatched = true
end

local lastInCar   = false
local lastCanShow = false

CreateThread(function()
    while true do
        Wait(500)
        local canShow = readyToRock()
        local inCar   = canShow and IsPedInAnyVehicle(PlayerPedId(), false) or false
        local show    = canShow and (Config.EnableMinimapOnFoot or inCar)
        if canShow ~= lastCanShow or inCar ~= lastInCar then
            if canShow then
                patchMinimap()
                DisplayRadar(show)
                if show then SetBigmapActive(false, false) end
            else
                DisplayRadar(false)
                SetBigmapActive(false, false)
            end
            lastCanShow = canShow
            lastInCar   = inCar
        end
    end
end)

CreateThread(function()
    while true do
        if readyToRock() then
            for i = 1, #HIDE_COMPS do HideHudComponentThisFrame(HIDE_COMPS[i]) end
            Wait(0)
        else
            Wait(500)
        end
    end
end)

Citizen.CreateThread(function()
    local sf = RequestScaleformMovie('minimap')
    SetRadarBigmapEnabled(true, false); Wait(0); SetRadarBigmapEnabled(false, false)
    while true do
        if readyToRock() then
            BeginScaleformMovieMethod(sf, 'SETUP_HEALTH_ARMOUR')
            ScaleformMovieMethodAddParamInt(3)
            EndScaleformMovieMethod()
            Wait(2)
        else
            Wait(500)
        end
    end
end)

CreateThread(function()
    while true do
        Wait(1000)
        local b = GetNorthRadarBlip()
        if b ~= 0 then SetBlipAlpha(b, 0) end
    end
end)

local cachedStreet   = 'Loading...'
local cachedCross    = ''
local cachedZone     = 'San Andreas'
local cachedWaypoint = nil

local function pushStatus(doSlow)
    local ped     = PlayerPedId()
    local coords  = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    if doSlow then
        cachedStreet, cachedCross, cachedZone = whereTheHellAmI(coords)
        cachedWaypoint = waypointDistance(coords)
    end
    local hp      = math.max(0, GetEntityHealth(ped) - 100)
    local armour  = GetPedArmour(ped)
    local meta    = whoAmI.metadata or {}
    local hunger  = roundIt(meta.hunger or 100)
    local thirst  = roundIt(meta.thirst or 100)
    local stress  = roundIt(meta.stress  or 0)
    local stamina = math.max(0, math.min(100, GetPlayerSprintStaminaRemaining(myPid)))
    yeet('updateStatus', {
        health       = roundIt(hp),
        armour       = roundIt(armour),
        hunger       = hunger,
        thirst       = thirst,
        stress       = stress,
        stamina      = roundIt(stamina),
        talking      = mouthRunning,
        voice        = voiceLabel,
        cash         = cachedCash,
        bank         = cachedBank,
        id           = GetPlayerServerId(myPid),
        charName     = cachedName,
        time         = ('%02d:%02d'):format(GetClockHours(), GetClockMinutes()),
        street       = cachedStreet ~= '' and cachedStreet or 'Unknown Road',
        crossing     = cachedCross,
        zone         = cachedZone,
        direction    = headingToCompass(heading),
        job          = cachedJob,
        grade        = cachedGrade,
        inVehicle    = IsPedInAnyVehicle(ped, false),
        seatbelt     = buckledUp,
        showStress   = Config.ShowStress and stress >= Config.StressThreshold,
        showStamina  = (IsPedRunning(ped) or IsPedSprinting(ped)) and stamina < 99,
        waypointDist = cachedWaypoint,
    })
end

local function pushVehicle()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then
        yeet('updateVehicle', { show = false })
        return
    end
    local veh    = GetVehiclePedIsIn(ped, false)
    local rawSpd = GetEntitySpeed(veh)
    local speed  = Config.SpeedUnit == 'KMH' and rawSpd * 3.6 or rawSpd * 2.236936
    local gear   = GetVehicleCurrentGear(veh)
    local rpm    = math.floor((GetVehicleCurrentRpm(veh) or 0) * 100)
    yeet('updateVehicle', {
        show     = true,
        speed    = roundIt(speed),
        unit     = Config.SpeedUnit,
        fuel     = roundIt(GetVehicleFuelLevel(veh)),
        rpm      = rpm,
        gear     = gear == 0 and 'R' or tostring(gear),
        engine   = math.max(0, math.min(100, roundIt(GetVehicleEngineHealth(veh) / 10))),
        seatbelt = buckledUp,
        vehName  = getVehName(veh),
        lights   = {
            headlights     = lastLights.headlights,
            highbeam       = lastLights.highbeam,
            indicatorLeft  = lastLights.indicatorLeft,
            indicatorRight = lastLights.indicatorRight,
            hazard         = lastLights.hazard,
        },
    })
end

CreateThread(function()
    while true do
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local veh      = GetVehiclePedIsIn(ped, false)
            local isDriver = GetPedInVehicleSeat(veh, -1) == ped

            if IsControlJustPressed(0, BELT_KEY) then
                buckledUp = not buckledUp
                lib.notify({
                    title       = 'Seatbelt',
                    description = buckledUp and 'Seatbelt fastened' or 'Seatbelt removed',
                    type        = buckledUp and 'success' or 'error',
                    duration    = 2000,
                })
                if hudShowing then pushVehicle(); pushStatus(false) end
            end

            if buckledUp then
                DisableControlAction(0, 75, true)
                if IsDisabledControlJustPressed(0, 75) then
                    lib.notify({ title = 'Seatbelt', description = 'Remove your seatbelt first', type = 'error' })
                end
            end

            if isDriver then
                DisableControlAction(0, 174, true)
                DisableControlAction(0, 175, true)
                DisableControlAction(0, 173, true)
                if IsDisabledControlJustPressed(0, 174) then
                    SetVehicleIndicatorLights(veh, 1, GetVehicleIndicatorLights(veh) ~= 1)
                    SetVehicleIndicatorLights(veh, 0, false)
                    PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
                end
                if IsDisabledControlJustPressed(0, 175) then
                    SetVehicleIndicatorLights(veh, 0, GetVehicleIndicatorLights(veh) ~= 2)
                    SetVehicleIndicatorLights(veh, 1, false)
                    PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
                end
                if IsDisabledControlJustPressed(0, 173) then
                    local hz = GetVehicleIndicatorLights(veh) == 3
                    SetVehicleIndicatorLights(veh, 0, not hz)
                    SetVehicleIndicatorLights(veh, 1, not hz)
                    PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', 1)
                end
            end

            if Config.SeatbeltEject and not buckledUp then
                local kmh = GetEntitySpeed(veh) * 3.6
                if kmh > Config.SeatbeltEjectSpeed and GetVehicleBodyHealth(veh) < Config.SeatbeltBodyThresh then
                    local fwd = GetEntityForwardVector(veh)
                    local spd = GetEntitySpeed(veh)
                    SetPedVelocity(ped, fwd.x * spd * 0.8, fwd.y * spd * 0.8, spd * 0.3)
                end
            end

            Wait(0)
        else
            if buckledUp then
                buckledUp = false
                if hudShowing then pushVehicle(); pushStatus(false) end
            end
            Wait(300)
        end
    end
end)

exports('SetSeatbelt', function(state)
    buckledUp = state == true
    if hudShowing then pushVehicle(); pushStatus(false) end
end)

CreateThread(function()
    while true do
        local ped = PlayerPedId()
        if readyToRock() and IsPedInAnyVehicle(ped, false) then
            local veh = GetVehiclePedIsIn(ped, false)
            local on, _, hb = GetVehicleLightsState(veh)
            local ind = GetVehicleIndicatorLights(veh)
            local fl = {
                headlights     = on >= 1,
                highbeam       = hb == true or hb == 1,
                indicatorLeft  = ind == 1 or ind == 3,
                indicatorRight = ind == 2 or ind == 3,
                hazard         = ind == 3,
            }
            local changed = false
            for k, v in pairs(fl) do
                if lastLights[k] ~= v then changed = true; break end
            end
            if changed then lastLights = fl; yeet('updateLights', fl) end
            Wait(150)
        else
            local anyOn = lastLights.headlights or lastLights.highbeam
                       or lastLights.indicatorLeft or lastLights.indicatorRight
            if anyOn then
                lastLights = { headlights=false, highbeam=false, indicatorLeft=false, indicatorRight=false, hazard=false }
                yeet('updateLights', lastLights)
            end
            Wait(500)
        end
    end
end)

CreateThread(function()
    while true do
        Wait(250)
        local p = IsPauseMenuActive()
        if p ~= gameIsPaused then
            gameIsPaused = p
            yeet('setPaused', { paused = p })
        end
    end
end)

local slowTick   = 0
local SLOW_EVERY = 3

CreateThread(function()
    while true do
        if readyToRock() and not menuIsOpen and not gameIsPaused then
            local t = NetworkIsPlayerTalking(myPid)
            if t ~= mouthRunning then mouthRunning = t end
            slowTick = (slowTick + 1) % SLOW_EVERY
            pushStatus(slowTick == 0)
            pushVehicle()
            Wait(Config.UpdateInterval)
        else
            Wait(500)
        end
    end
end)

RegisterCommand(Config.MenuCommand or 'hud', function()
    if not readyToRock() then return end
    menuIsOpen = true
    SetNuiFocus(true, true)
    yeet('openMenu', {})
end, false)

RegisterNuiCallback('menuClosed', function(_, cb)
    menuIsOpen = false; SetNuiFocus(false, false); cb('ok')
end)

RegisterNuiCallback('setSpeedUnit', function(data, cb)
    if data.unit == 'KMH' or data.unit == 'MPH' then Config.SpeedUnit = data.unit end
    cb('ok')
end)

local function grabPlayerData()
    local ok, data = pcall(function() return exports['qbx_core']:GetPlayerData() end)
    whoAmI = (ok and data) or {}
    refreshStaticCache()
end

local function pushConfig()
    yeet('initConfig', {
        colors     = Config.Colors,
        defaults   = Config.DefaultVisible,
        speedUnit  = Config.SpeedUnit,
        logo       = Config.Logo,
        redline    = Config.RedlineThreshold,
        thresholds = {
            health = Config.WarnHealth, hunger = Config.WarnHunger,
            thirst = Config.WarnThirst, fuel   = Config.WarnFuel,
            engine = Config.WarnEngine,
        },
    })
end

local function tryShowHud()
    if not readyToRock() then return end
    myPid = PlayerId()
    patchMinimap()
    pushConfig()
    showHud(true)
    pushStatus(true)
    pushVehicle()
end

CreateThread(function()
    while true do
        Wait(1000)
        if LocalPlayer.state.isLoggedIn and DoesEntityExist(PlayerPedId()) then
            if not diddlyLoaded    then diddlyLoaded    = true; grabPlayerData() end
            if not actuallySpawned then actuallySpawned = true end
            if not hudShowing and readyToRock() then tryShowHud() end
        end
    end
end)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    grabPlayerData(); diddlyLoaded = true
    Wait(1500); tryShowHud()
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    diddlyLoaded = false; actuallySpawned = false; buckledUp = false
    showHud(false); DisplayRadar(false)
end)

AddEventHandler('playerSpawned', function()
    actuallySpawned = true; grabPlayerData()
    Wait(1500); tryShowHud()
end)

AddEventHandler('onResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    grabPlayerData()
    if LocalPlayer.state.isLoggedIn then
        diddlyLoaded = true
        if NetworkIsPlayerActive(PlayerId()) and DoesEntityExist(PlayerPedId()) then
            actuallySpawned = true
        end
        Wait(1000); tryShowHud()
    else
        showHud(false)
    end
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(freshData)
    whoAmI = freshData or {}
    refreshStaticCache()
    if hudShowing then pushStatus(true) end
end)

RegisterNetEvent('hud:client:UpdateNeeds', function(hunger, thirst)
    whoAmI.metadata        = whoAmI.metadata or {}
    whoAmI.metadata.hunger = hunger
    whoAmI.metadata.thirst = thirst
end)

RegisterNetEvent('hud:client:UpdateStress', function(stress)
    whoAmI.metadata        = whoAmI.metadata or {}
    whoAmI.metadata.stress = stress
end)

RegisterNetEvent('pma-voice:setTalkingMode', function(mode)
    local modes = { [1]='Whisper', [2]='Normal', [3]='Shout' }
    voiceLabel = modes[mode] or Config.DefaultVoice
    if hudShowing then pushStatus(false) end
end)

RegisterNetEvent('cx-hud:versionResult', function(current, latest, outdated)
    yeet('versionInfo', { current = current, latest = latest, outdated = outdated })
end)