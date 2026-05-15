return function(State, Utils, Config)
    local prevVehicle = {}
    local lastVeh = 0
    local slowTick = 0
    local SLOW_EVERY = 5

    local function resetVehicleState()
        prevVehicle = {}
        lastVeh = 0
        slowTick = 0
    end

    local function pushDelta(payload)
        local delta = {}
        local changed = false

        for k, v in pairs(payload) do
            if prevVehicle[k] ~= v then
                delta[k] = v
                prevVehicle[k] = v
                changed = true
            end
        end

        if changed then
            Utils.sendNui('updateVehicle', delta)
        end
    end

    local function pushVehicle(forceSlow)
        local veh = cache.vehicle
        if not veh or not DoesEntityExist(veh) then
            if prevVehicle.show ~= false then
                Utils.sendNui('updateVehicle', { show = false })
                resetVehicleState()
                prevVehicle.show = false
            end
            return
        end

        local newVehicle = veh ~= lastVeh
        if newVehicle then
            resetVehicleState()
            lastVeh = veh
            forceSlow = true
        end

        slowTick = slowTick + 1
        local doSlow = forceSlow or slowTick >= SLOW_EVERY
        if doSlow then slowTick = 0 end

        local rawSpd = GetEntitySpeed(veh)
        local speed  = Config.SpeedUnit == 'KMH' and rawSpd * 3.6 or rawSpd * 2.236936
        local gear   = GetVehicleCurrentGear(veh)

        local payload = {
            show     = true,
            speed    = Utils.round(speed),
            unit     = Config.SpeedUnit,
            rpm      = math.floor((GetVehicleCurrentRpm(veh) or 0) * 100),
            gear     = gear == 0 and 'R' or tostring(gear),
            seatbelt = Config.EnableSeatbelt ~= false and State.seatbeltOn or false,
        }

        if doSlow then
            payload.fuel    = Utils.round(GetVehicleFuelLevel(veh))
            payload.engine  = math.max(0, math.min(100, Utils.round(GetVehicleEngineHealth(veh) / 10)))
            payload.vehName = Utils.getVehName(veh)

            if Config.JGMileage and GetResourceState('jg-vehiclemileage') == 'started' then
                local ok, km = pcall(function() return exports['jg-vehiclemileage']:getMileage() end)
                if ok and type(km) == 'number' then
                    local isMiles = Config.SpeedUnit == 'MPH'
                    payload.mileage = math.floor((isMiles and km * 0.621371 or km) + 0.5)
                    payload.mileageUnit = isMiles and 'MI' or 'KM'
                end
            end
        end

        pushDelta(payload)
    end

    return {
        pushVehicle = pushVehicle,
        resetVehicleState = resetVehicleState,
    }
end
