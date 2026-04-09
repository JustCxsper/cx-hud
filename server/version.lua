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
                print("^3[CX Scripts] Please download the latest update from https://portal.cfx.re/assets/^7")
            else
                print("^2[CX Scripts] " .. resourceName .. " is up to date (v" .. currentVersion .. ")^7")
            end
        else
            print("^1[CX Scripts] Could not reach the update server. Error Code: " .. errorCode .. "^7")
        end
    end, "GET")
end


Citizen.CreateThread(function()
    Citizen.Wait(5000)
    CheckVersion()
end)