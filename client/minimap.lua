return function(State, Utils, readyToRock, Config)
    local squaremapLoaded = false
    local mapPatched      = false

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

    --- couldn't do it myself so ported it from minimal-hud, https://github.com/ThatMadCap/minimal-hud
    local function calculateMinimapGeo()
        SetBigmapActive(false, false)

        local resX, resY  = GetActiveScreenResolution()
        local aspectRatio = GetAspectRatio(false)
        local minimapRawX, minimapRawY

        SetScriptGfxAlign(string.byte('L'), string.byte('B'))

        minimapRawX, minimapRawY = GetScriptGfxPosition(0.000, 0.002 + -0.229888)
        local width  = resX / (3.48 * aspectRatio)
        local height = resY / 5.55

        ResetScriptGfxAlign()

        SetScriptGfxAlign(string.byte('L'), string.byte('T'))
        local szX, szY = GetScriptGfxPosition(0.0, 0.0)
        ResetScriptGfxAlign()

        return {
            left   = minimapRawX * resX,
            top    = minimapRawY * resY,
            width  = width,
            height = height,
            insetX = math.floor(szX * resX + 0.5),
            insetY = math.floor(szY * resY + 0.5),
        }
    end

    local function patchMinimap()
        if mapPatched then return end
        if not grabSquaremap() then return end

        local resX, resY = GetActiveScreenResolution()
        local aspect     = resX / resY
        local mmOffset   = 0.0
        if aspect > 1920 / 1080 then
            mmOffset = ((1920 / 1080 - aspect) / 3.6) - 0.008
        end

        SetMinimapClipType(0)
        SetMinimapComponentPosition('minimap',      'L', 'B',  0.0  + mmOffset, -0.047, 0.1638, 0.183)
        SetMinimapComponentPosition('minimap_mask', 'L', 'B',  0.0  + mmOffset,  0.0,   0.128,  0.20)
        SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.01 + mmOffset,  0.025, 0.262,  0.300)
        SetBlipAlpha(GetNorthRadarBlip(), 0)
        SetBigmapActive(true, false); Wait(0); SetBigmapActive(false, false)
        killBigmap()
        mapPatched = true
        Utils.yeet('setMinimapGeo', calculateMinimapGeo())
    end

    local lastSafezone = GetSafeZoneSize()
    local lastResX, lastResY = GetActiveScreenResolution()
    CreateThread(function()
        while true do
            Wait(2000)
            local current = GetSafeZoneSize()
            local curResX, curResY = GetActiveScreenResolution()

            if math.abs(current - lastSafezone) > 0.001 then
                lastSafezone = current
                mapPatched   = false
            end

            if curResX ~= lastResX or curResY ~= lastResY then
                lastResX, lastResY = curResX, curResY
                mapPatched = false
            end
            if not mapPatched then
                patchMinimap()
            end
        end
    end)

    local lastInCar   = false
    local lastCanShow = false

    CreateThread(function()
        while true do
            Wait(500)
            local canShow = readyToRock()
            local inCar   = canShow and cache.vehicle ~= nil or false
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

    return {
        patchMinimap        = patchMinimap,
        calculateMinimapGeo = calculateMinimapGeo,
    }
end
