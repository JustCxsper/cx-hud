return function(State, Utils, isReady)
    CreateThread(function()
        while true do
            if isReady() and cache.vehicle and DoesEntityExist(cache.vehicle) then
                local veh       = cache.vehicle
                local on, _, hb = GetVehicleLightsState(veh)
                local ind       = GetVehicleIndicatorLights(veh)
                local fl        = {
                    headlights     = (on or 0) >= 1,
                    highbeam       = hb == true or hb == 1,
                    indicatorLeft  = ind == 1 or ind == 3,
                    indicatorRight = ind == 2 or ind == 3,
                    hazard         = ind == 3,
                }
                local changed = false
                for k, v in pairs(fl) do
                    if State.lastLights[k] ~= v then changed = true; break end
                end
                if changed then State.lastLights = fl; Utils.sendNui('updateLights', fl) end
                Wait(150)
            else
                local anyOn = State.lastLights.headlights or State.lastLights.highbeam
                           or State.lastLights.indicatorLeft or State.lastLights.indicatorRight
                if anyOn then
                    State.lastLights = { headlights=false, highbeam=false, indicatorLeft=false, indicatorRight=false, hazard=false }
                    Utils.sendNui('updateLights', State.lastLights)
                end
                Wait(500)
            end
        end
    end)
end
