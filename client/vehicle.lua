return function(State, Utils, Config)
    local function pushVehicle()
        if not cache.vehicle then
            Utils.sendNui('updateVehicle', { show = false })
            return
        end
        local veh    = cache.vehicle
        local rawSpd = GetEntitySpeed(veh)
        local speed  = Config.SpeedUnit == 'KMH' and rawSpd * 3.6 or rawSpd * 2.236936
        local gear   = GetVehicleCurrentGear(veh)
        local rpm    = math.floor((GetVehicleCurrentRpm(veh) or 0) * 100)
        Utils.sendNui('updateVehicle', {
            show     = true,
            speed    = Utils.round(speed),
            unit     = Config.SpeedUnit,
            fuel     = Utils.round(GetVehicleFuelLevel(veh)),
            rpm      = rpm,
            gear     = gear == 0 and 'R' or tostring(gear),
            engine   = math.max(0, math.min(100, Utils.round(GetVehicleEngineHealth(veh) / 10))),
            seatbelt = Config.EnableSeatbelt ~= false and State.seatbeltOn or false,
            vehName  = Utils.getVehName(veh),
            lights   = {
                headlights     = State.lastLights.headlights,
                highbeam       = State.lastLights.highbeam,
                indicatorLeft  = State.lastLights.indicatorLeft,
                indicatorRight = State.lastLights.indicatorRight,
                hazard         = State.lastLights.hazard,
            },
        })
    end

    return { pushVehicle = pushVehicle }
end
