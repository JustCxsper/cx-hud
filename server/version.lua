local function CheckVersion()
    local versionUrl = "https://raw.githubusercontent.com/JustCxsper/cx-hud/refs/heads/main/version.txt"
    local resourceName = GetCurrentResourceName()

    PerformHttpRequest(versionUrl, function(errorCode, result, headers)
        if errorCode == 200 and result then
            local latestVersion = result:gsub("%s+", "")
            local currentVersion = Config.Version

            print("^5[CX Scripts]^7 Checking for updates...")

            if latestVersion ~= currentVersion then
                print("^1[CX Scripts] WARNING: " .. resourceName .. " is outdated!^7")
                print("^1[CX Scripts] Current Version: " .. currentVersion .. "^7")
                print("^2[CX Scripts] Latest Version: " .. latestVersion .. "^7")
                print("^3[CX Scripts] Please download the latest update from https://github.com/JustCxsper/cx-hud^7")
                print("^3[CX Scripts] Join our Discord for support: https://discord.gg/XatzNXHeU3^7")
            else
                print("^2[CX Scripts] " .. resourceName .. " is up to date (v" .. currentVersion .. ")^7")
            end
        else
            print("^1[CX Scripts] Could not reach the update server. Error Code: " .. errorCode .. "^7")
        end

        if GetResourceState('jg-stress-addon') ~= 'started' then
            print("^5[CX HUD]^7 ^3jg-stress-addon not detected, stress system disabled^7")
        else
            print("^5[CX HUD]^7 jg-stress-addon detected, stress system ^2enabled^7")
        end

        local inventoryDetected = false
        local inventories = { 'ox_inventory', 'qb-inventory', 'ps-inventory', 'core_inventory' }
        for _, inv in ipairs(inventories) do
            if GetResourceState(inv) == 'started' then
                print("^5[CX HUD]^7 Inventory detected for weapon images: ^2" .. inv .. "^7")
                inventoryDetected = true
                break
            end
        end
        if not inventoryDetected then
            print("^5[CX HUD]^7 ^3No supported inventory detected, weapon images will use fallback icon^7")
        end

        PrintLayoutStatus()
    end, "GET")
end

CreateThread(function()
    Citizen.Wait(5000)
    CheckVersion()
end)