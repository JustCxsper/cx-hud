return function(State, Utils, isReady, Config)
    local WeaponData = CX_HUD_WEAPON_DATA or {}
    local WEAPONS = WeaponData.WEAPONS or {}
    local MELEE = WeaponData.MELEE or {}
    local THROW = WeaponData.THROW or {}

    local prevWeapon = {}
    local lastAmmoByWeapon = {}
    local lastWeaponPayload = nil
    local lastWeaponSeenAt = 0
    local activeInventory = nil

    local function detectInventory()
        if activeInventory ~= nil then return activeInventory end
        for _, inv in ipairs((Config.InventoryImages and Config.InventoryImages.inventories) or {}) do
            if inv.resource and GetResourceState(inv.resource) == 'started' then
                activeInventory = inv
                print(('[cx-hud] weapon images using %s'):format(inv.resource))
                return activeInventory
            end
        end
        activeInventory = false
        return activeInventory
    end

    local function buildWeaponImage(itemName)
        local inv = detectInventory()
        if not inv or not inv.path or not itemName then return nil end
        return inv.path:format(itemName)
    end

    local function ammoLabel(hash, weapName)
        weapName = weapName or ''
        if hash == `WEAPON_MUSKET` then return 'MUSKET' end
        if weapName:find('shotgun') then return '12G' end
        if weapName:find('sniper') or weapName:find('marksman') or weapName:find('heavysniper') then return '.308' end
        if weapName:find('smg') or weapName:find('pdw') or weapName:find('machinepistol') or weapName:find('minismg') or weapName:find('microsmg') then return '9MM' end
        if weapName:find('rifle') or weapName:find('carbine') or weapName:find('compactrifle') then return '5.56' end
        if weapName:find('mg') or weapName:find('gusenberg') or weapName:find('minigun') then return '7.62' end
        if weapName:find('rpg') or weapName:find('launcher') then return 'ROCKET' end
        if weapName:find('railgun') then return 'RAIL' end
        if weapName:find('firework') then return 'FIREWORK' end
        if weapName:find('flare') then return 'FLARE' end
        return '9MM'
    end

    local function nativeBool(name, ...)
        local fn = _G[name]
        if type(fn) ~= 'function' then return false end
        local ok, result = pcall(fn, ...)
        return ok and result == true
    end

    local function pushWeapon()
        local ped = cache.ped
        local hash = GetSelectedPedWeapon(ped)
        local now = GetGameTimer()

        if hash == `WEAPON_UNARMED` then
            if lastWeaponPayload and (now - lastWeaponSeenAt) < 300 then
                if prevWeapon.show == false then
                    prevWeapon = lastWeaponPayload
                    Utils.sendNui('updateWeapon', lastWeaponPayload)
                end
                return
            end
            if prevWeapon.show ~= false then
                prevWeapon = { show = false }
                lastAmmoByWeapon = {}
                Utils.sendNui('updateWeapon', { show = false })
            end
            return
        end

        local isMelee = MELEE[hash] == true
        local isThrow = THROW[hash] == true
        local ammoClip, ammoTotal = 0, 0

        if not isMelee then
            local hasClipAmmo, clipAmmo = GetAmmoInClip(ped, hash)
            ammoClip  = (hasClipAmmo and tonumber(clipAmmo)) or 0
            ammoTotal = tonumber(GetAmmoInPedWeapon(ped, hash)) or 0
            if ammoTotal == 0 then ammoClip = 0 end

            local cachedClip = lastAmmoByWeapon[hash]
            local switching  = nativeBool('IsPedSwitchingWeapon', ped)
            local notReady   = nativeBool('IsPedWeaponReadyToShoot', ped) == false
            local notArmed   = nativeBool('IsPedArmed', ped, 4) == false

            if ammoTotal > 0 and ammoClip == 0 and cachedClip and cachedClip > 0 and (switching or notReady or notArmed) then
                ammoClip = cachedClip
            else
                lastAmmoByWeapon[hash] = ammoClip
            end
        end

        local weapName = WEAPONS[hash] or 'weapon_unarmed'
        local payload = {
            show = true,
            weapName = weapName,
            ammoClip = ammoClip,
            ammoTotal = ammoTotal,
            ammoLabel = ammoLabel(hash, weapName),
            weaponImageBase = buildWeaponImage(weapName),
            isMelee = isMelee,
            isThrow = isThrow,
            low = (not isMelee and not isThrow) and (ammoClip <= (Config.WarnAmmoClip or 5)),
        }

        lastWeaponPayload = payload
        lastWeaponSeenAt = now

        local changed = false
        for k, v in pairs(payload) do
            if prevWeapon[k] ~= v then changed = true break end
        end
        if changed then
            prevWeapon = payload
            Utils.sendNui('updateWeapon', payload)
        end
    end

    CreateThread(function()
        while true do
            if isReady() and not State.menuIsOpen and not State.gameIsPaused then
                pushWeapon()
                Wait(Config.UpdateInterval)
            else
                Wait(500)
            end
        end
    end)

    return { pushWeapon = pushWeapon }
end
