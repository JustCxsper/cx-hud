return function(State, Utils, Config)
    local BELT_KEY       = Config.SeatbeltKey or 29
    local beltEnabled    = Config.EnableSeatbelt ~= false

    CreateThread(function()
        while true do
            if cache.vehicle then
                State.ejected = false
                local veh      = cache.vehicle
                local isDriver = cache.seat == -1

                if not beltEnabled and State.buckledUp then
                    State.buckledUp = false
                end

                if beltEnabled and IsControlJustPressed(0, BELT_KEY) then
                    State.buckledUp = not State.buckledUp
                    lib.notify({
                        title       = 'Seatbelt',
                        description = State.buckledUp and 'Seatbelt fastened' or 'Seatbelt removed',
                        type        = State.buckledUp and 'success' or 'error',
                        duration    = 2000,
                    })
                end

                if beltEnabled and State.buckledUp then
                    DisableControlAction(0, 75, true)
                    if IsDisabledControlJustPressed(0, 75) then
                        lib.notify({ title = 'Seatbelt', description = 'Remove your seatbelt first', type = 'error' })
                    end
                end

                if isDriver then
                    DisableControlAction(0, 174, true)
                    DisableControlAction(0, 175, true)
                    DisableControlAction(0, 173, true)
                    if IsDisabledControlJustPressed(0, 174) then
                        SetVehicleIndicatorLights(veh, 1, GetVehicleIndicatorLights(veh) ~= 1)
                        SetVehicleIndicatorLights(veh, 0, false)
                        PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', false)
                    end
                    if IsDisabledControlJustPressed(0, 175) then
                        SetVehicleIndicatorLights(veh, 0, GetVehicleIndicatorLights(veh) ~= 2)
                        SetVehicleIndicatorLights(veh, 1, false)
                        PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', false)
                    end
                    if IsDisabledControlJustPressed(0, 173) then
                        local hz = GetVehicleIndicatorLights(veh) == 3
                        SetVehicleIndicatorLights(veh, 0, not hz)
                        SetVehicleIndicatorLights(veh, 1, not hz)
                        PlaySoundFrontend(-1, 'NAV_UP_DOWN', 'HUD_FRONTEND_DEFAULT_SOUNDSET', false)
                    end
                end

                if beltEnabled and Config.SeatbeltEject and not State.buckledUp and not State.ejected then
                    local kmh = GetEntitySpeed(veh) * 3.6
                    if kmh > Config.SeatbeltEjectSpeed and GetVehicleBodyHealth(veh) < Config.SeatbeltBodyThresh then
                        local fwd = GetEntityForwardVector(veh)
                        local spd = GetEntitySpeed(veh)
                        State.ejected = true
                        TaskLeaveVehicle(cache.ped, veh, 4160)
                        Wait(100)
                        SetEntityVelocity(cache.ped, fwd.x * spd * 0.8, fwd.y * spd * 0.8, spd * 0.3)
                    end
                end

                Wait(16)
            else
                if State.buckledUp then State.buckledUp = false end
                State.ejected = false
                Wait(300)
            end
        end
    end)

    exports('SetSeatbelt', function(state)
        State.buckledUp = beltEnabled and state == true or false
    end)
end
