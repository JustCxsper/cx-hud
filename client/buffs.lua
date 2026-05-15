return function(State, Utils, isReady, Config)
    if not Config.UsePSBuffs then
        return {}
    end

    local resource = 'ps-buffs'
    local activeBuffs = {}
    local startedTimes = {}

    local enhancementIcons = {
        ['super-health'] = 'heart',
        ['super-armor'] = 'shield',
        ['super-stress'] = 'brain',
        ['super-hunger'] = 'burger',
        ['super-thirst'] = 'droplet',
    }
    local baseBuffIcons = {
        hacking = 'database',
        intelligence = 'lightbulb',
        luck = 'dollarsign',
        stamina = 'wind',
        strength = 'dumbbell',
        swimming = 'swimmer',
    }

    local function ensureEnhancementMeta(name, data)
        if not data.iconName then data.iconName = enhancementIcons[name] or 'star' end
        if not data.iconColor then data.iconColor = '#FDE829' end
        if not data.progressColor then data.progressColor = '#FDE829' end
        return data
    end

    local function push()
        Utils.sendNuiSafe('updatePsBuffs', { buffs = activeBuffs })
    end

    local function setBuff(name, data)
        if not name then return end
        if not activeBuffs[name] then
            activeBuffs[name] = {}
            startedTimes[name] = nil
        end

        for k, v in pairs(data) do
            activeBuffs[name][k] = v
        end

        local t = tonumber(activeBuffs[name].time)
        if t and t > 0 then
            if not startedTimes[name] or t > startedTimes[name] then
                startedTimes[name] = t
            end
            activeBuffs[name].progressValue = math.max(0, math.min(100, (t * 100.0) / startedTimes[name]))
        end
    end

    local function clearBuff(name)
        activeBuffs[name] = nil
        startedTimes[name] = nil
    end

    local function syncAll()
        if GetResourceState(resource) ~= 'started' then return end
        local ok, data = pcall(function()
            return exports[resource]:GetBuffNUIData()
        end)
        if not ok or type(data) ~= 'table' then return end

        activeBuffs = {}
        startedTimes = {}

        for name, buff in pairs(data) do
            if buff.display then
                local item = {
                    buffName = buff.buffName or name,
                    iconName = buff.iconName,
                    iconColor = buff.iconColor,
                    progressColor = buff.progressColor,
                    progressValue = buff.progressValue or 100,
                    type = buff.type,
                    enhancementName = buff.enhancementName,
                    display = true,
                }
                if buff.enhancementName or buff.type == 'enhancement' or name:find('^super%-') then
                    item = ensureEnhancementMeta(name, item)
                end
                activeBuffs[name] = item
            end
        end

        push()
    end

    RegisterNetEvent('hud:client:BuffEffect', function(data)
        if type(data) ~= 'table' or not data.buffName then return end
        local name = data.buffName
        if data.display == false then
            clearBuff(name)
            push()
            return
        end

        setBuff(name, {
            buffName = name,
            iconName = data.iconName,
            iconColor = data.iconColor,
            progressColor = data.progressColor,
            progressValue = data.progressValue or 100,
            type = 'buff',
            display = true,
        })
        push()
    end)

    RegisterNetEvent('hud:client:EnhancementEffect', function(data)
        if type(data) ~= 'table' or not data.enhancementName then return end
        local name = data.enhancementName
        if data.display == false then
            clearBuff(name)
            push()
            return
        end

        local item = ensureEnhancementMeta(name, {
            buffName = name,
            type = 'enhancement',
            enhancementName = name,
            display = true,
        })
        setBuff(name, item)
        push()
    end)

    RegisterCommand('bufftest', function()
        local keys = {
            'hacking', 'intelligence', 'luck', 'stamina', 'strength', 'swimming',
            'super-hunger', 'super-thirst', 'super-health', 'super-armor', 'super-stress',
        }
        local duration = 120000
        activeBuffs = {}
        startedTimes = {}

        for i = 1, #keys do
            local key = keys[i]
            local isEnhancement = key:find('^super%-') ~= nil
            local iconName = isEnhancement and (enhancementIcons[key] or 'star') or (baseBuffIcons[key] or 'star')
            local iconColor = isEnhancement and '#FDE829' or '#ffffff'
            local progressColor = '#FFD700'

            activeBuffs[key] = {
                buffName = key,
                iconName = iconName,
                iconColor = iconColor,
                progressColor = progressColor,
                progressValue = 100,
                display = true,
                type = isEnhancement and 'enhancement' or 'buff',
                enhancementName = isEnhancement and key or nil,
            }
            startedTimes[key] = duration
        end

        push()

        CreateThread(function()
            local remaining = duration
            while remaining > 0 do
                Wait(1000)
                remaining = remaining - 1000
                local pct = math.max(0, math.min(100, (remaining * 100.0) / duration))
                for _, buff in pairs(activeBuffs) do
                    buff.progressValue = pct
                end
                push()
            end
            activeBuffs = {}
            startedTimes = {}
            push()
        end)

        if GetResourceState(resource) == 'started' then
            for i = 1, #keys do
                pcall(function()
                    exports[resource]:AddBuff(keys[i], duration)
                end)
            end
        end

        print('[cx-hud] bufftest applied (local preview + ps-buffs add attempt).')
    end, false)

    AddEventHandler('onResourceStart', function(res)
        if res ~= GetCurrentResourceName() then return end
        CreateThread(function()
            Wait(1000)
            syncAll()
        end)
    end)

    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        CreateThread(function()
            Wait(500)
            syncAll()
        end)
    end)

    return {
        sync = syncAll,
    }
end
