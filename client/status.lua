return function(State, Utils, Vehicle, Minimap, readyToRock, Config)
    local cachedCash  = '$0'
    local cachedBank  = '$0'
    local lastCashRaw = -1
    local lastBankRaw = -1

    local function refreshMoneyCache()
        local cash = (State.whoAmI.money and State.whoAmI.money.cash) or 0
        local bank = (State.whoAmI.money and State.whoAmI.money.bank) or 0
        if cash ~= lastCashRaw then lastCashRaw = cash; cachedCash = Utils.prettyMoney(cash) end
        if bank ~= lastBankRaw then lastBankRaw = bank; cachedBank = Utils.prettyMoney(bank) end
    end

    local cachedJob   = 'Civilian'
    local cachedGrade = 'Unemployed'
    local cachedName  = 'Player'

    local function refreshStaticCache()
        refreshMoneyCache()
        if State.whoAmI.job then
            cachedJob   = State.whoAmI.job.label or State.whoAmI.job.name or 'Civilian'
            local g     = State.whoAmI.job.grade
            cachedGrade = g and (g.name or tostring(g.level)) or 'Unemployed'
        else
            cachedJob = 'Civilian'; cachedGrade = 'Unemployed'
        end
        if State.whoAmI.charinfo then
            local full = ((State.whoAmI.charinfo.firstname or '') .. ' ' .. (State.whoAmI.charinfo.lastname or '')):match('^%s*(.-)%s*$')
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
            cachedStreet, cachedCross, cachedZone = Utils.whereTheHellAmI(coords)
            cachedWaypoint = Utils.waypointDistance(coords)
        end
        local hp      = math.max(0, GetEntityHealth(cache.ped) - 100)
        local armour  = GetPedArmour(cache.ped)
        local meta    = State.whoAmI.metadata or {}
        local hunger  = Utils.roundIt(meta.hunger or 100)
        local thirst  = Utils.roundIt(meta.thirst or 100)
        local stress  = Utils.roundIt(LocalPlayer.state.stress or meta.stress or 0)
        local stamina = math.max(0, math.min(100, GetPlayerSprintStaminaRemaining(cache.playerId)))

        local status = {
            health       = Utils.roundIt(hp),
            armour       = Utils.roundIt(armour),
            hunger       = hunger,
            thirst       = thirst,
            stress       = stress,
            stamina      = Utils.roundIt(stamina),
            talking      = State.mouthRunning,
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
            inVehicle    = cache.vehicle ~= nil,
            seatbelt     = State.buckledUp,
            showStress   = Config.ShowStress and stress >= Config.StressThreshold,
            showStamina  = (IsPedRunning(cache.ped) or IsPedSprinting(cache.ped)) and stamina < 99,
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
            Utils.yeet('updateStatus', delta)
        end
    end

    local slowTick   = 0
    local SLOW_EVERY = 3

    CreateThread(function()
        while true do
            local p = IsPauseMenuActive()
            if p ~= State.gameIsPaused then
                State.gameIsPaused = p
                Utils.yeet('setPaused', { paused = p })
            end
            if readyToRock() and not State.menuIsOpen and not State.gameIsPaused then
                local t = NetworkIsPlayerTalking(cache.playerId)
                if t ~= State.mouthRunning then State.mouthRunning = t end
                slowTick = (slowTick + 1) % SLOW_EVERY
                pushStatus(slowTick == 0)
                Vehicle.pushVehicle()
                Wait(Config.UpdateInterval)
            else
                Wait(500)
            end
        end
    end)

    local function pushConfig()
        Utils.yeet('initConfig', {
            colors     = Config.Colors,
            defaults   = Config.DefaultVisible,
            logo       = Config.Logo,
            redline    = Config.RedlineThreshold,
            minimapGeo = Minimap.calculateMinimapGeo(),
            menuOptions = Config.MenuOptions,
            thresholds = {
                health = Config.WarnHealth, hunger = Config.WarnHunger,
                thirst = Config.WarnThirst, fuel   = Config.WarnFuel,
                engine = Config.WarnEngine,
            },
        })
    end

    local function showHud(visible)
        State.hudShowing = visible
        Utils.yeet('toggleHud', { visible = visible })
    end

    local function grabPlayerData()
        local ok, data = pcall(function() return exports['qbx_core']:GetPlayerData() end)
        State.whoAmI = (ok and data) or {}
        refreshStaticCache()
    end

    local function tryShowHud()
        if not readyToRock() then return end
        Minimap.patchMinimap()
        pushConfig()
        showHud(true)
        prevStatus = {}  -- force full resend so NUI state is fresh
        pushStatus(true)
        Vehicle.pushVehicle()
    end

    return {
        pushStatus         = pushStatus,
        pushConfig         = pushConfig,
        showHud            = showHud,
        grabPlayerData     = grabPlayerData,
        tryShowHud         = tryShowHud,
        refreshStaticCache = refreshStaticCache,
        refreshMoneyCache  = refreshMoneyCache,
    }
end
