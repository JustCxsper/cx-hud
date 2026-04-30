return function(State, Utils, Minimap, Status, Vehicle, Config)
    -- speed unit is player-controlled via /hud, default to MPH until they change it
    Config.SpeedUnit = 'MPH'

    RegisterNuiCallback('menuClosed', function(_, cb)
        State.menuIsOpen = false; SetNuiFocus(false, false); cb('ok')
    end)

    RegisterNuiCallback('editorOpened', function(_, cb)
        State.menuIsOpen = true; SetNuiFocus(true, true); cb('ok')
    end)

    RegisterNuiCallback('editorClosed', function(_, cb)
        State.menuIsOpen = false; SetNuiFocus(false, false); cb('ok')
    end)

    RegisterNuiCallback('setMinimapOffset', function(data, cb)
        if data and data.x and data.y then
            Minimap.repositionMinimap(data.x, data.y)
        end
        cb('ok')
    end)

    RegisterNuiCallback('setMinimapVisible', function(data, cb)
        Minimap.setVisible(data.visible)
        cb('ok')
    end)

    RegisterNuiCallback('setSpeedUnit', function(data, cb)
        if data.unit == 'KMH' or data.unit == 'MPH' then Config.SpeedUnit = data.unit end
        cb('ok')
    end)

    RegisterNuiCallback('nuiViewport', function(data, cb)
        if data and Minimap and Minimap.setNuiViewport then
            Minimap.setNuiViewport(data.width, data.height)
        end
        cb('ok')
    end)
end
