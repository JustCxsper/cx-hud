local KVP_KEY = 'cx_hud_default_layout'

ServerDefaultLayout = nil -- { name = "string", layout = {} }

local function LoadDefaultLayout()
    local raw = GetResourceKvpString(KVP_KEY)
    if not raw or raw == '' then return end
    local ok, data = pcall(json.decode, raw)
    if ok and type(data) == 'table' and type(data.name) == 'string' and type(data.layout) == 'table' then
        ServerDefaultLayout = data
    end
end

local function SaveDefaultLayout()
    local ok, encoded = pcall(json.encode, ServerDefaultLayout)
    if not ok then return false end
    SetResourceKvp(KVP_KEY, encoded)
    return true
end

function PrintLayoutStatus()
    if ServerDefaultLayout then
        print("^5[CX HUD]^7 Default layout detected: ^2" .. ServerDefaultLayout.name .. "^7")
    else
        print("^5[CX HUD]^7 ^3No server default layout set^7")
    end
end

local function IsValidLayoutName(name)
    if type(name) ~= 'string' then return false end
    local len = #name
    if len < 1 or len > 32 then return false end
    return name:match('^[A-Za-z0-9][A-Za-z0-9 _%-]*$') ~= nil
end

RegisterCommand('cx_resetdefault', function(source)
    if source ~= 0 then
        print("^1[CX HUD]^7 This command can only be run from the server console.")
        return
    end
    DeleteResourceKvp(KVP_KEY)
    ServerDefaultLayout = nil
    print("^5[CX HUD]^7 Server default layout cleared.")
end, true)

RegisterNetEvent('cx-hud:requestDefaultLayout', function()
    local src = source
    local hasAce = IsPlayerAceAllowed(src, 'cx-hud.setdefaultlayout')
    TriggerClientEvent('cx-hud:receiveDefaultLayout', src, ServerDefaultLayout, hasAce)
end)

RegisterNetEvent('cx-hud:saveServerDefault', function(layoutData, name)
    local src = source

    if not IsPlayerAceAllowed(src, 'cx-hud.setdefaultlayout') then
        TriggerClientEvent('cx-hud:saveDefaultResult', src, false, 'Permission denied.')
        return
    end

    if not IsValidLayoutName(name) then
        TriggerClientEvent('cx-hud:saveDefaultResult', src, false,
            'Invalid name. Use 1-32 characters starting with a letter or number. Allowed: letters, numbers, spaces, _ and -')
        return
    end

    if type(layoutData) ~= 'table' then
        TriggerClientEvent('cx-hud:saveDefaultResult', src, false, 'Invalid layout data.')
        return
    end

    ServerDefaultLayout = { name = name, layout = layoutData }

    if SaveDefaultLayout() then
        print("^5[CX HUD]^7 Default layout updated by ^3" .. GetPlayerName(src) .. "^7 → ^2" .. name .. "^7")
        TriggerClientEvent('cx-hud:saveDefaultResult', src, true, 'Default layout "' .. name .. '" saved!')
    else
        ServerDefaultLayout = nil
        TriggerClientEvent('cx-hud:saveDefaultResult', src, false, 'Failed to save layout.')
    end
end)

LoadDefaultLayout()
