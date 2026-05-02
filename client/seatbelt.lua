return function(State, Utils, Config)
    local beltEnabled = Config.EnableSeatbelt ~= false

    local lastIndicatorPress = 0
    local INDICATOR_DEBOUNCE = 175

    local function canUseIndicators()
        return cache.vehicle and cache.seat == -1 and not IsPauseMenuActive()
    end

    local function playIndicatorClick()
        PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', false)
    end

    local function toggleLeftIndicator()
        if not canUseIndicators() then return end
        local now = GetGameTimer()
        if now - lastIndicatorPress < INDICATOR_DEBOUNCE then return end
        lastIndicatorPress = now

        local veh = cache.vehicle
        local ind = GetVehicleIndicatorLights(veh)
        local enable = ind ~= 1
        SetVehicleIndicatorLights(veh, 1, enable)
        SetVehicleIndicatorLights(veh, 0, false)
        playIndicatorClick()
    end

    local function toggleRightIndicator()
        if not canUseIndicators() then return end
        local now = GetGameTimer()
        if now - lastIndicatorPress < INDICATOR_DEBOUNCE then return end
        lastIndicatorPress = now

        local veh = cache.vehicle
        local ind = GetVehicleIndicatorLights(veh)
        local enable = ind ~= 2
        SetVehicleIndicatorLights(veh, 0, enable)
        SetVehicleIndicatorLights(veh, 1, false)
        playIndicatorClick()
    end

    local function toggleHazards()
        if not canUseIndicators() then return end
        local now = GetGameTimer()
        if now - lastIndicatorPress < INDICATOR_DEBOUNCE then return end
        lastIndicatorPress = now

        local veh = cache.vehicle
        local enable = GetVehicleIndicatorLights(veh) ~= 3
        SetVehicleIndicatorLights(veh, 0, enable)
        SetVehicleIndicatorLights(veh, 1, enable)
        playIndicatorClick()
    end

    RegisterCommand('cxhud_indicator_left', toggleLeftIndicator, false)
    RegisterCommand('cxhud_indicator_right', toggleRightIndicator, false)
    RegisterCommand('cxhud_hazards', toggleHazards, false)

    RegisterKeyMapping('cxhud_indicator_left', 'Vehicle indicator: left', 'keyboard', 'LEFT')
    RegisterKeyMapping('cxhud_indicator_right', 'Vehicle indicator: right', 'keyboard', 'RIGHT')
    RegisterKeyMapping('cxhud_hazards', 'Vehicle hazards', 'keyboard', 'DOWN')

    if beltEnabled then
        RegisterCommand('cxhud_seatbelt', function()
            if not cache.vehicle then return end
            State.seatbeltOn = not State.seatbeltOn
            lib.notify({
                title       = 'Seatbelt',
                description = State.seatbeltOn and 'Seatbelt fastened' or 'Seatbelt removed',
                type        = State.seatbeltOn and 'success' or 'error',
                duration    = 2000,
            })
        end, false)
        RegisterKeyMapping('cxhud_seatbelt', 'Toggle seatbelt', 'keyboard', 'B')
    end

    CreateThread(function()
        while true do
            local veh = cache.vehicle
            if veh then
                if not beltEnabled and State.seatbeltOn then
                    State.seatbeltOn = false
                end

                if beltEnabled and State.seatbeltOn then
                    DisableControlAction(0, 75, true)
                    if IsDisabledControlJustPressed(0, 75) then
                        lib.notify({ title = 'Seatbelt', description = 'Remove your seatbelt first', type = 'error' })
                    end
                end

                Wait(0)
            else
                if State.seatbeltOn then State.seatbeltOn = false end
                State.ejected = false
                Wait(300)
            end
        end
    end)

    CreateThread(function()
        while true do
            local veh = cache.vehicle
            if beltEnabled and Config.SeatbeltEject and veh and not State.seatbeltOn and not State.ejected then
                local kmh = GetEntitySpeed(veh) * 3.6
                if kmh > Config.SeatbeltEjectSpeed and GetVehicleBodyHealth(veh) < Config.SeatbeltBodyThresh then
                    local fwd = GetEntityForwardVector(veh)
                    local spd = GetEntitySpeed(veh)
                    State.ejected = true
                    TaskLeaveVehicle(cache.ped, veh, 4160)
                    Wait(100)
                    SetEntityVelocity(cache.ped, fwd.x * spd * 0.8, fwd.y * spd * 0.8, spd * 0.3)
                end
                Wait(200)
            else
                Wait(500)
            end
        end
    end)

    exports('SetSeatbelt', function(state)
        State.seatbeltOn = beltEnabled and state == true or false
    end)
end
