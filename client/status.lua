return function(State, Utils, Vehicle, Minimap, isReady, Config)
    local cachedCash  = '$0'
    local cachedBank  = '$0'
    local lastCashRaw = -1
    local lastBankRaw = -1

    local function refreshMoneyCache()
        local cash = (State.playerData.money and State.playerData.money.cash) or 0
        local bank = (State.playerData.money and State.playerData.money.bank) or 0
        if cash ~= lastCashRaw then lastCashRaw = cash; cachedCash = Utils.formatMoney(cash) end
        if bank ~= lastBankRaw then lastBankRaw = bank; cachedBank = Utils.formatMoney(bank) end
    end

    local cachedJob   = 'Civilian'
    local cachedGrade = 'Unemployed'
    local cachedName  = 'Player'

    local function refreshStaticCache()
        refreshMoneyCache()
        if State.playerData.job then
            cachedJob   = State.playerData.job.label or State.playerData.job.name or 'Civilian'
            local g     = State.playerData.job.grade
            cachedGrade = g and (g.name or tostring(g.level)) or 'Unemployed'
        else
            cachedJob = 'Civilian'; cachedGrade = 'Unemployed'
        end
        if State.playerData.charinfo then
            local full = ((State.playerData.charinfo.firstname or '') .. ' ' .. (State.playerData.charinfo.lastname or '')):match('^%s*(.-)%s*$')
            cachedName = full ~= '' and full or 'Player'
        else
            cachedName = 'Player'
        end
    end

    local cachedStreet   = 'Loading...'
    local cachedCross    = ''
    local cachedZone     = 'San Andreas'
    local cachedWaypoint = nil

    local prevStatus = {}

    local function pushStatus(doSlow)
        local coords  = GetEntityCoords(cache.ped)
        local heading = GetEntityHeading(cache.ped)
        if doSlow then
            cachedStreet, cachedCross, cachedZone = Utils.getStreetInfo(coords)
            cachedWaypoint = Utils.waypointDistance(coords)
        end
        local hp      = math.max(0, GetEntityHealth(cache.ped) - 100)
        local armour  = GetPedArmour(cache.ped)
        local meta    = State.playerData.metadata or {}
        local hunger  = Utils.round(meta.hunger or 100)
        local thirst  = Utils.round(meta.thirst or 100)
        local stress  = Utils.round(LocalPlayer.state.stress or meta.stress or 0)
        local stamina = math.max(0, math.min(100, GetPlayerSprintStaminaRemaining(cache.playerId)))
        local isUnderwater = IsPedSwimmingUnderWater(cache.ped)
        local isSwimming = IsPedSwimming(cache.ped)
        local oxygenRemaining = GetPlayerUnderwaterTimeRemaining(cache.playerId)
        local oxygen = 100
        if isUnderwater or isSwimming then
            if oxygenRemaining and oxygenRemaining >= 0.0 then
                oxygen = math.max(0, math.min(100, (oxygenRemaining / 10.0) * 100.0))
            else
                oxygen = 0
            end
        end

        local inVehicle = IsPedInAnyVehicle(cache.ped, false)

        local status = {
            health       = Utils.round(hp),
            armour       = Utils.round(armour),
            hunger       = hunger,
            thirst       = thirst,
            stress       = stress,
            stamina      = Utils.round(stamina),
            oxygen       = Utils.round(oxygen),
            talking      = State.isTalking,
            voice        = State.voiceLabel,
            cash         = cachedCash,
            bank         = cachedBank,
            id           = cache.serverId,
            charName     = cachedName,
            time         = ('%02d:%02d'):format(GetClockHours(), GetClockMinutes()),
            street       = cachedStreet ~= '' and cachedStreet or 'Unknown Road',
            crossing     = cachedCross,
            zone         = cachedZone,
            direction    = Utils.headingToCompass(heading),
            job          = cachedJob,
            grade        = cachedGrade,
            inVehicle    = inVehicle,
            seatbelt     = State.seatbeltOn,
            showStress   = Config.ShowStress and stress >= Config.StressThreshold,
            showStamina  = (IsPedRunning(cache.ped) or IsPedSprinting(cache.ped)) and stamina < 99,
            showOxygen   = (isUnderwater or isSwimming) and oxygen < 99,
            oxygenCritical = (isUnderwater or isSwimming) and oxygen <= 0,
            waypointDist = cachedWaypoint,
        }

        local delta      = {}
        local hasChanges = false
        for k, v in pairs(status) do
            if prevStatus[k] ~= v then
                delta[k]      = v
                prevStatus[k] = v
                hasChanges    = true
            end
        end

        if hasChanges then
            Utils.sendNui('updateStatus', delta)
        end
    end

    local slowTick   = 0
    local SLOW_EVERY = 3

    CreateThread(function()
        while true do
            local p = IsPauseMenuActive()
            if p ~= State.gameIsPaused then
                State.gameIsPaused = p
                Utils.sendNui('setPaused', { paused = p })
            end
            if isReady() and not State.menuIsOpen and not State.gameIsPaused then
                local t = NetworkIsPlayerTalking(cache.playerId)
                if t ~= State.isTalking then State.isTalking = t end
                slowTick = (slowTick + 1) % SLOW_EVERY
                pushStatus(slowTick == 0)
                Vehicle.pushVehicle(slowTick == 0)
                Wait(Config.UpdateInterval)
            else
                Wait(500)
            end
        end
    end)

    local function pushConfig()
        Utils.sendNuiSafe('initConfig', {
            colors     = Config.Colors,
            defaults   = Config.DefaultVisible,
            logo       = Config.Logo,
            redline    = Config.RedlineThreshold,
            minimapGeo = Minimap.calculateMinimapGeo(),
            menuOptions = Config.MenuOptions,
            hideMapAndStreetOnFoot = Config.HideMapAndStreetOnFoot,
            version    = Config.Version,
            thresholds = {
                health = Config.WarnHealth, hunger = Config.WarnHunger,
                thirst = Config.WarnThirst, fuel   = Config.WarnFuel,
                engine = Config.WarnEngine, ammoClip = Config.WarnAmmoClip,
            },
        })
    end

    local function showHud(visible)
        State.hudShowing = visible
        Utils.sendNui('toggleHud', { visible = visible })
    end

    local function fetchPlayerData()
        local ok, data

        ok, data = pcall(function() return exports['qbx_core']:GetPlayerData() end)
        if ok and data and next(data) then
            State.playerData = data
            refreshStaticCache()
            return
        end

        ok, data = pcall(function()
            local QBCore = exports['qb-core']:GetCoreObject()
            return QBCore.Functions.GetPlayerData()
        end)
        if ok and data and next(data) then
            State.playerData = data
            refreshStaticCache()
            return
        end

        Wait(500)
        ok, data = pcall(function() return exports['qbx_core']:GetPlayerData() end)
        if not ok or not data or not next(data) then
            ok, data = pcall(function()
                local QBCore = exports['qb-core']:GetCoreObject()
                return QBCore.Functions.GetPlayerData()
            end)
        end

        State.playerData = (ok and data) or {}
        refreshStaticCache()
    end

    local function tryShowHud()
        if not isReady() then return end
        Minimap.patchMinimap()
        pushConfig()
        showHud(true)
        prevStatus = {}  -- force full resend so NUI state is fresh
        pushStatus(true)
        Vehicle.pushVehicle(true)
    end

    return {
        pushStatus         = pushStatus,
        pushConfig         = pushConfig,
        showHud            = showHud,
        fetchPlayerData    = fetchPlayerData,
        tryShowHud         = tryShowHud,
        refreshStaticCache = refreshStaticCache,
        refreshMoneyCache  = refreshMoneyCache,
    }
end
