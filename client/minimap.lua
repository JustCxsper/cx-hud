return function(State, Utils, isReady, Config)
    local squaremapLoaded = false
    local mapPatched      = false
    local mmOffsetX       = 0.0
    local mmOffsetY       = 0.0
    local nuiWidth        = 1920
    local nuiHeight       = 1080

    local function loadSquaremap()
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

    local function suppressBigmap()
        CreateThread(function()
            local t = 0
            while t < 10000 do SetBigmapActive(false, false); t = t + 1000; Wait(1000) end
        end)
    end

    local function getBaseOffset()
        local aspectRatio = GetAspectRatio(false)
        if aspectRatio > (1920 / 1080) then
            return ((1920 / 1080 - aspectRatio) / 3.6) - 0.008, aspectRatio
        end
        return 0.0, aspectRatio
    end

    local function scaleGeoToNui(geo)
        local resX, resY = GetActiveScreenResolution()
        if not resX or not resY or resX <= 0 or resY <= 0 then return geo end

        local sx = (nuiWidth or resX) / resX
        local sy = (nuiHeight or resY) / resY

        geo.left   = geo.left * sx
        geo.top    = geo.top * sy
        geo.width  = geo.width * sx
        geo.height = geo.height * sy
        geo.insetX = geo.insetX * sx
        geo.insetY = geo.insetY * sy
        return geo
    end

    --- couldn't do it myself so ported it from minimal-hud, https://github.com/ThatMadCap/minimal-hud
    local function calculateMinimapGeo()
        SetBigmapActive(false, false)

        local resX, resY  = GetActiveScreenResolution()
        local baseOffset, aspectRatio = getBaseOffset()
        local minimapRawX, minimapRawY

        SetScriptGfxAlign(string.byte('L'), string.byte('B'))
        minimapRawX, minimapRawY = GetScriptGfxPosition(0.0, -0.227888)

        local width  = resX / (3.48 * aspectRatio)
        local height = resY / 5.55

        ResetScriptGfxAlign()

        SetScriptGfxAlign(string.byte('L'), string.byte('T'))
        local szX, szY = GetScriptGfxPosition(0.0, 0.0)
        ResetScriptGfxAlign()

        return scaleGeoToNui({
            left   = (minimapRawX + baseOffset) * resX + mmOffsetX,
            top    = minimapRawY * resY + mmOffsetY,
            width  = width,
            height = height,
            insetX = math.floor(szX * resX + 0.5),
            insetY = math.floor(szY * resY + 0.5),
        })
    end

    local function applyComponentPositions()
        local resX, resY = GetActiveScreenResolution()
        local normX = mmOffsetX / resX
        local normY = mmOffsetY / resY
        local baseOffset = getBaseOffset()

        SetMinimapClipType(0)
        SetMinimapComponentPosition('minimap',      'L', 'B',  0.0  + baseOffset + normX, -0.047 + normY, 0.1638, 0.183)
        SetMinimapComponentPosition('minimap_mask', 'L', 'B',  0.0  + baseOffset + normX,  0.0   + normY, 0.128,  0.20)
        SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.01 + baseOffset + normX,  0.025 + normY, 0.262,  0.300)
    end

    local function patchMinimap()
        if mapPatched then return end
        if not loadSquaremap() then return end

        applyComponentPositions()
        SetBlipAlpha(GetNorthRadarBlip(), 0)
        SetBigmapActive(true, false); Wait(0); SetBigmapActive(false, false)
        suppressBigmap()
        mapPatched = true
        Utils.sendNui('setMinimapGeo', calculateMinimapGeo())
    end

    local function repositionMinimap(px, py)
        mmOffsetX = px
        mmOffsetY = py
        applyComponentPositions()
        SetBigmapActive(true, false); Wait(0); SetBigmapActive(false, false)
        Utils.sendNui('setMinimapGeo', calculateMinimapGeo())
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
    local lastShow    = nil
    local minimapVisible = true
    local hudVisible     = true

    CreateThread(function()
        while true do
            Wait(500)
            local canShow = isReady()
            local inCar   = canShow and cache.vehicle ~= nil or false
            local show    = canShow and hudVisible and minimapVisible and inCar
            if canShow ~= lastCanShow or inCar ~= lastInCar or show ~= lastShow then
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
                lastShow    = show
            end
        end
    end)

    local function setNuiViewport(w, h)
        w = tonumber(w)
        h = tonumber(h)
        if not w or not h or w <= 0 or h <= 0 then return end

        if math.abs(w - nuiWidth) < 1 and math.abs(h - nuiHeight) < 1 then return end

        nuiWidth = w
        nuiHeight = h

        if mapPatched then
            Utils.sendNui('setMinimapGeo', calculateMinimapGeo())
        end
    end

    return {
        patchMinimap        = patchMinimap,
        calculateMinimapGeo = calculateMinimapGeo,
        repositionMinimap   = repositionMinimap,
        setNuiViewport      = setNuiViewport,
        setVisible          = function(v) minimapVisible = v end,
        setHudVisible       = function(v) hudVisible = v; if not v then mapPatched = false end end,
    }
end
