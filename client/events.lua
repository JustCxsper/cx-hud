return function(State, Utils, Minimap, Status, Vehicle, readyToRock, Config)
    RegisterCommand(Config.MenuCommand or 'hud', function()
        if not readyToRock() then return end
        State.menuIsOpen = true
        SetNuiFocus(true, true)
        Utils.yeet('openMenu', {})
    end, false)

    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        Status.grabPlayerData()
        State.diddlyLoaded = true
        State.actuallySpawned = true
        CreateThread(function() Wait(1500); SetBigmapActive(false, false); Status.tryShowHud() end)
    end)

    RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
        State.diddlyLoaded = false; State.actuallySpawned = false; State.buckledUp = false
        Status.showHud(false); DisplayRadar(false)
    end)

    AddEventHandler('playerSpawned', function()
        State.actuallySpawned = true; Status.grabPlayerData()
        CreateThread(function() Wait(1500); SetBigmapActive(false, false); Status.tryShowHud() end)
    end)

    AddEventHandler('onResourceStart', function(res)
        if res ~= GetCurrentResourceName() then return end
        Status.grabPlayerData()
        if LocalPlayer.state.isLoggedIn then
            State.diddlyLoaded = true
            if NetworkIsPlayerActive(cache.playerId) and DoesEntityExist(cache.ped) then
                State.actuallySpawned = true
            end
            CreateThread(function() Wait(1000); SetBigmapActive(false, false); Status.tryShowHud() end)
        else
            Status.showHud(false)
        end
    end)

    RegisterNetEvent('QBCore:Player:SetPlayerData', function(freshData)
        State.whoAmI = freshData or {}
        Status.refreshStaticCache()
        if State.hudShowing then Status.pushStatus(true) end
    end)

    RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job)
        State.whoAmI.job = job
        Status.refreshStaticCache()
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('QBCore:Client:OnMoneyChange', function(moneyType, amount, operation)
        State.whoAmI.money = State.whoAmI.money or {}
        local current = State.whoAmI.money[moneyType] or 0
        if     operation == 'add'    then State.whoAmI.money[moneyType] = current + amount
        elseif operation == 'remove' then State.whoAmI.money[moneyType] = math.max(0, current - amount)
        elseif operation == 'set'    then State.whoAmI.money[moneyType] = amount
        end
        Status.refreshMoneyCache()
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('hud:client:UpdateNeeds', function(hunger, thirst)
        State.whoAmI.metadata        = State.whoAmI.metadata or {}
        State.whoAmI.metadata.hunger = hunger
        State.whoAmI.metadata.thirst = thirst
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('pma-voice:setTalkingMode', function(mode)
        local modes = { [1] = 'Whisper', [2] = 'Normal', [3] = 'Shout' }
        State.voiceLabel = modes[mode] or Config.DefaultVoice
        if State.hudShowing then Status.pushStatus(false) end
    end)

    RegisterNetEvent('cx-hud:versionResult', function(current, latest, outdated)
        Utils.yeet('versionInfo', { current = current, latest = latest, outdated = outdated })
    end)
end
