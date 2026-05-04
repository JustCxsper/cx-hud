return function(State, Utils, Minimap, Status, Vehicle, isReady, Config)
    RegisterCommand(Config.MenuCommand or 'hud', function()
        if not isReady() then return end
        State.menuIsOpen = true
        SetNuiFocus(true, true)
        Utils.sendNui('openMenu', {})
    end, false)

    local function sendKvpLayout()
        local raw = GetResourceKvpString('cx_hud_layout')
        if not raw or raw == '' then return end
        local ok, layout = pcall(json.decode, raw)
        if ok and type(layout) == 'table' then
            Utils.sendNui('playerLayout', { layout = layout })
        end
    end

    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        Status.fetchPlayerData()
        State.coreLoaded    = true
        State.playerSpawned = true
        sendKvpLayout()
        TriggerServerEvent('cx-hud:requestDefaultLayout')
        CreateThread(function() Wait(1500); SetBigmapActive(false, false); Status.tryShowHud() end)
    end)

    RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
        State.coreLoaded = false; State.playerSpawned = false; State.seatbeltOn = false
        Status.showHud(false); DisplayRadar(false)
    end)

    AddEventHandler('playerSpawned', function()
        if not State.coreLoaded then return end
        State.playerSpawned = true; Status.fetchPlayerData()
        CreateThread(function() Wait(1500); SetBigmapActive(false, false); Status.tryShowHud() end)
    end)

    AddEventHandler('onResourceStart', function(res)
        if res ~= GetCurrentResourceName() then return end
        Status.fetchPlayerData()
        if LocalPlayer.state.isLoggedIn then
            State.coreLoaded = true
            if NetworkIsPlayerActive(cache.playerId) and DoesEntityExist(cache.ped) then
                State.playerSpawned = true
            end
            sendKvpLayout()
            TriggerServerEvent('cx-hud:requestDefaultLayout')
            CreateThread(function() Wait(1000); SetBigmapActive(false, false); Status.tryShowHud() end)
        else
            Status.showHud(false)
        end
    end)

    RegisterNetEvent('QBCore:Player:SetPlayerData', function(playerData)
        State.playerData = playerData or {}
        Status.refreshStaticCache()
        if State.hudShowing then Status.pushStatus(true) end
    end)

    RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job)
        State.playerData.job = job
        Status.refreshStaticCache()
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('QBCore:Client:OnMoneyChange', function(moneyType, amount, operation)
        State.playerData.money = State.playerData.money or {}
        local current = State.playerData.money[moneyType] or 0
        if     operation == 'add'    then State.playerData.money[moneyType] = current + amount
        elseif operation == 'remove' then State.playerData.money[moneyType] = math.max(0, current - amount)
        elseif operation == 'set'    then State.playerData.money[moneyType] = amount
        end
        Status.refreshMoneyCache()
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('hud:client:UpdateNeeds', function(hunger, thirst)
        State.playerData.metadata        = State.playerData.metadata or {}
        State.playerData.metadata.hunger = hunger
        State.playerData.metadata.thirst = thirst
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('pma-voice:setTalkingMode', function(mode)
        local modes = { [1] = 'Whisper', [2] = 'Normal', [3] = 'Shout' }
        State.voiceLabel = modes[mode] or Config.DefaultVoice
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('cx-hud:versionResult', function(current, latest, outdated)
        Utils.sendNui('versionInfo', { current = current, latest = latest, outdated = outdated })
    end)

    RegisterNetEvent('cx-hud:receiveDefaultLayout', function(defaultLayoutData, canSetDefault)
        Utils.sendNui('serverDefaultLayout', {
            layout        = defaultLayoutData and defaultLayoutData.layout or nil,
            name          = defaultLayoutData and defaultLayoutData.name  or nil,
            canSetDefault = canSetDefault or false,
        })
    end)

    RegisterNetEvent('cx-hud:saveDefaultResult', function(success, msg)
        Utils.sendNui('saveDefaultResult', { success = success, message = msg })
    end)
end