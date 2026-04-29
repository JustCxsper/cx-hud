return function(Config)
    local function sendNui(action, payload)
        SendNUIMessage({ action = action, data = payload })
    end

    local function round(n)
        return math.floor((n or 0) + 0.5)
    end

    local function headingToCompass(deg)
        local norm = deg % 360
        if norm < 22.5 or norm >= 337.5 then return 'N'
        elseif norm < 67.5  then return 'NE'
        elseif norm < 112.5 then return 'E'
        elseif norm < 157.5 then return 'SE'
        elseif norm < 202.5 then return 'S'
        elseif norm < 247.5 then return 'SW'
        elseif norm < 292.5 then return 'W'
        else                     return 'NW'
        end
    end

    local function formatMoney(n)
        local s = tostring(math.floor(n or 0))
        while true do
            local result, count = s:gsub('^(%-?%d+)(%d%d%d)', '%1,%2')
            if count == 0 then break end
            s = result
        end
        return '$' .. s
    end

    local function getStreetInfo(coords)
        local sh, ch  = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
        local rawZone = GetNameOfZone(coords.x, coords.y, coords.z)
        local street  = GetStreetNameFromHashKey(sh)
        local cross   = ch ~= 0 and GetStreetNameFromHashKey(ch) or ''
        local zLabel  = GetLabelText(rawZone)
        return street, cross, (zLabel == 'NULL' or zLabel == '') and rawZone or zLabel
    end

    local function waypointDistance(coords)
        local wp = GetFirstBlipInfoId(8)
        if not DoesBlipExist(wp) then return false end
        local wc = GetBlipInfoIdCoord(wp)
        local dx = coords.x - wc.x
        local dy = coords.y - wc.y
        local d  = math.sqrt(dx * dx + dy * dy)
        return d >= 1000 and ('%.1f km'):format(d / 1000) or ('%d m'):format(math.floor(d))
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

    return {
        sendNui          = sendNui,
        round            = round,
        headingToCompass = headingToCompass,
        formatMoney      = formatMoney,
        getStreetInfo    = getStreetInfo,
        waypointDistance = waypointDistance,
        getVehName       = getVehName,
    }
end
