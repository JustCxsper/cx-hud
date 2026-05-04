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

    RegisterNuiCallback('setCinebars', function(data, cb)
        if data.visible then
            exports[GetCurrentResourceName()]:hideHud()
        else
            exports[GetCurrentResourceName()]:showHud()
        end
        cb('ok')
    end)

    RegisterNuiCallback('setHudHidden', function(_, cb)
        exports[GetCurrentResourceName()]:toggleHud()
        cb('ok')
    end)

    RegisterNuiCallback('nuiViewport', function(data, cb)
        if data and Minimap and Minimap.setNuiViewport then
            Minimap.setNuiViewport(data.width, data.height)
        end
        cb('ok')
    end)

    RegisterNuiCallback('saveServerDefault', function(data, cb)
        if data and type(data.layout) == 'table' and type(data.name) == 'string' then
            TriggerServerEvent('cx-hud:saveServerDefault', data.layout, data.name)
        end
        cb('ok')
    end)

    RegisterNuiCallback('kvpSaveLayout', function(data, cb)
        if data and type(data) == 'table' then
            local ok, encoded = pcall(json.encode, data)
            if ok then SetResourceKvp('cx_hud_layout', encoded) end
        end
        cb('ok')
    end)

    RegisterNuiCallback('kvpDeleteLayout', function(_, cb)
        DeleteResourceKvp('cx_hud_layout')
        cb('ok')
    end)
end
