return function(State, Utils, Vehicle, Minimap, readyToRock, Config)
    local cachedCash  = '$0'
    local cachedBank  = '$0'
    local lastCashRaw = -1
    local lastBankRaw = -1

    local function refreshMoneyCache()
        local cash = (State.whoAmI.money and State.whoAmI.money.cash) or 0
        local bank = (State.whoAmI.money and State.whoAmI.money.bank) or 0
        if cash ~= lastCashRaw then lastCashRaw = cash; cachedCash = Utils.prettyMoney(cash) end
        if bank ~= lastBankRaw then lastBankRaw = bank; cachedBank = Utils.prettyMoney(bank) end
    end

    local cachedJob   = 'Civilian'
    local cachedGrade = 'Unemployed'
    local cachedName  = 'Player'

    local function refreshStaticCache()
        refreshMoneyCache()
        if State.whoAmI.job then
            cachedJob   = State.whoAmI.job.label or State.whoAmI.job.name or 'Civilian'
            local g     = State.whoAmI.job.grade
            cachedGrade = g and (g.name or tostring(g.level)) or 'Unemployed'
        else
            cachedJob = 'Civilian'; cachedGrade = 'Unemployed'
        end
        if State.whoAmI.charinfo then
            local full = ((State.whoAmI.charinfo.firstname or '') .. ' ' .. (State.whoAmI.charinfo.lastname or '')):match('^%s*(.-)%s*$')
            cachedName = full ~= '' and full or 'Player'
        else
            cachedName = 'Player'
        end
    end

    local cachedStreet   = 'Loading...'
    local cachedCross    = ''
    local cachedZone     = 'San Andreas'
    local cachedWaypoint = nil

    local prevStatus = {}

    local function pushStatus(doSlow)
        local coords  = GetEntityCoords(cache.ped)
        local heading = GetEntityHeading(cache.ped)
        if doSlow then
            cachedStreet, cachedCross, cachedZone = Utils.whereTheHellAmI(coords)
            cachedWaypoint = Utils.waypointDistance(coords)
        end
        local hp      = math.max(0, GetEntityHealth(cache.ped) - 100)
        local armour  = GetPedArmour(cache.ped)
        local meta    = State.whoAmI.metadata or {}
        local hunger  = Utils.roundIt(meta.hunger or 100)
        local thirst  = Utils.roundIt(meta.thirst or 100)
        local stress  = Utils.roundIt(LocalPlayer.state.stress or meta.stress or 0)
        local stamina = math.max(0, math.min(100, GetPlayerSprintStaminaRemaining(cache.playerId)))

        local ped = PlayerPedId()
        local weaponHash = GetSelectedPedWeapon(ped)
        local unarmedHash = `WEAPON_UNARMED`

        local weaponVisible = weaponHash ~= unarmedHash

        local weaponName = ""

        if weaponHash ~= unarmedHash then
            weaponName = GetLabelText(GetDisplayNameFromVehicleModel(weaponHash)) or "UNKNOWN"
        end

        SendNUIMessage({
            action = "updateWeapon",
            weaponVisible = weaponVisible,
            weaponName = weaponName,
            ammo = weaponVisible and GetAmmoInPedWeapon(ped, weaponHash) or 0
        })

        -- Full lookup table: weapon hash → { display name, ox_inventory image key }
        -- Image key is lowercase, matching ox_inventory's /web/images/<key>.png files.
        local WEAPON_DATA = {
            -- Pistols
            [GetHashKey('WEAPON_PISTOL')]              = { 'Pistol',              'weapon_pistol' },
            [GetHashKey('WEAPON_PISTOL_MK2')]          = { 'Pistol Mk II',        'weapon_pistol_mk2' },
            [GetHashKey('WEAPON_COMBATPISTOL')]        = { 'Combat Pistol',       'weapon_combatpistol' },
            [GetHashKey('WEAPON_APPISTOL')]            = { 'AP Pistol',           'weapon_appistol' },
            [GetHashKey('WEAPON_STUNGUN')]             = { 'Stun Gun',            'weapon_stungun' },
            [GetHashKey('WEAPON_PISTOL50')]            = { 'Pistol .50',          'weapon_pistol50' },
            [GetHashKey('WEAPON_SNSPISTOL')]           = { 'SNS Pistol',          'weapon_snspistol' },
            [GetHashKey('WEAPON_SNSPISTOL_MK2')]       = { 'SNS Pistol Mk II',    'weapon_snspistol_mk2' },
            [GetHashKey('WEAPON_HEAVYPISTOL')]         = { 'Heavy Pistol',        'weapon_heavypistol' },
            [GetHashKey('WEAPON_VINTAGEPISTOL')]       = { 'Vintage Pistol',      'weapon_vintagepistol' },
            [GetHashKey('WEAPON_FLAREGUN')]            = { 'Flare Gun',           'weapon_flaregun' },
            [GetHashKey('WEAPON_MARKSMANPISTOL')]      = { 'Marksman Pistol',     'weapon_marksmanpistol' },
            [GetHashKey('WEAPON_REVOLVER')]            = { 'Revolver',            'weapon_revolver' },
            [GetHashKey('WEAPON_REVOLVER_MK2')]        = { 'Revolver Mk II',      'weapon_revolver_mk2' },
            [GetHashKey('WEAPON_DOUBLEACTION')]        = { 'Double Action Revolver', 'weapon_doubleaction' },
            [GetHashKey('WEAPON_RAYPISTOL')]           = { 'Up-n-Atomizer',       'weapon_raypistol' },
            [GetHashKey('WEAPON_CERAMICPISTOL')]       = { 'Ceramic Pistol',      'weapon_ceramicpistol' },
            [GetHashKey('WEAPON_NAVYREVOLVER')]        = { 'Navy Revolver',       'weapon_navyrevolver' },
            [GetHashKey('WEAPON_GADGETPISTOL')]        = { 'Perico Pistol',       'weapon_gadgetpistol' },
            [GetHashKey('WEAPON_MILITARYPISTOL')]      = { 'Military Pistol',     'weapon_militarypistol' },
            [GetHashKey('WEAPON_STUNGUN_MP')]          = { 'Stun Gun',            'weapon_stungun' },
            -- SMGs
            [GetHashKey('WEAPON_MICROSMG')]            = { 'Micro SMG',           'weapon_microsmg' },
            [GetHashKey('WEAPON_SMG')]                 = { 'SMG',                 'weapon_smg' },
            [GetHashKey('WEAPON_SMG_MK2')]             = { 'SMG Mk II',           'weapon_smg_mk2' },
            [GetHashKey('WEAPON_ASSAULTSMG')]          = { 'Assault SMG',         'weapon_assaultsmg' },
            [GetHashKey('WEAPON_COMBATPDW')]           = { 'Combat PDW',          'weapon_combatpdw' },
            [GetHashKey('WEAPON_MACHINEPISTOL')]       = { 'Machine Pistol',      'weapon_machinepistol' },
            [GetHashKey('WEAPON_MINISMG')]             = { 'Mini SMG',            'weapon_minismg' },
            [GetHashKey('WEAPON_RAYCARBINE')]          = { 'Unholy Hellbringer',  'weapon_raycarbine' },
            -- Rifles / Assault
            [GetHashKey('WEAPON_ASSAULTRIFLE')]        = { 'Assault Rifle',       'weapon_assaultrifle' },
            [GetHashKey('WEAPON_ASSAULTRIFLE_MK2')]    = { 'Assault Rifle Mk II', 'weapon_assaultrifle_mk2' },
            [GetHashKey('WEAPON_CARBINERIFLE')]        = { 'Carbine Rifle',       'weapon_carbinerifle' },
            [GetHashKey('WEAPON_CARBINERIFLE_MK2')]    = { 'Carbine Rifle Mk II', 'weapon_carbinerifle_mk2' },
            [GetHashKey('WEAPON_ADVANCEDRIFLE')]       = { 'Advanced Rifle',      'weapon_advancedrifle' },
            [GetHashKey('WEAPON_SPECIALCARBINE')]      = { 'Special Carbine',     'weapon_specialcarbine' },
            [GetHashKey('WEAPON_SPECIALCARBINE_MK2')]  = { 'Special Carbine Mk II', 'weapon_specialcarbine_mk2' },
            [GetHashKey('WEAPON_BULLPUPRIFLE')]        = { 'Bullpup Rifle',       'weapon_bullpuprifle' },
            [GetHashKey('WEAPON_BULLPUPRIFLE_MK2')]    = { 'Bullpup Rifle Mk II', 'weapon_bullpuprifle_mk2' },
            [GetHashKey('WEAPON_COMPACTRIFLE')]        = { 'Compact Rifle',       'weapon_compactrifle' },
            [GetHashKey('WEAPON_MILITARYRIFLE')]       = { 'Military Rifle',      'weapon_militaryrifle' },
            [GetHashKey('WEAPON_HEAVYRIFLE')]          = { 'Heavy Rifle',         'weapon_heavyrifle' },
            [GetHashKey('WEAPON_TACTICALRIFLE')]       = { 'Tactical Rifle',      'weapon_tacticalrifle' },
            -- Shotguns
            [GetHashKey('WEAPON_PUMPSHOTGUN')]         = { 'Pump Shotgun',        'weapon_pumpshotgun' },
            [GetHashKey('WEAPON_PUMPSHOTGUN_MK2')]     = { 'Pump Shotgun Mk II',  'weapon_pumpshotgun_mk2' },
            [GetHashKey('WEAPON_SAWNOFFSHOTGUN')]      = { 'Sawed-Off Shotgun',   'weapon_sawnoffshotgun' },
            [GetHashKey('WEAPON_ASSAULTSHOTGUN')]      = { 'Assault Shotgun',     'weapon_assaultshotgun' },
            [GetHashKey('WEAPON_BULLPUPSHOTGUN')]      = { 'Bullpup Shotgun',     'weapon_bullpupshotgun' },
            [GetHashKey('WEAPON_MUSKET')]              = { 'Musket',              'weapon_musket' },
            [GetHashKey('WEAPON_HEAVYSHOTGUN')]        = { 'Heavy Shotgun',       'weapon_heavyshotgun' },
            [GetHashKey('WEAPON_DBSHOTGUN')]           = { 'Double Barrel Shotgun', 'weapon_dbshotgun' },
            [GetHashKey('WEAPON_AUTOSHOTGUN')]         = { 'Sweeper Shotgun',     'weapon_autoshotgun' },
            [GetHashKey('WEAPON_COMBATSHOTGUN')]       = { 'Combat Shotgun',      'weapon_combatshotgun' },
            -- Snipers
            [GetHashKey('WEAPON_SNIPERRIFLE')]         = { 'Sniper Rifle',        'weapon_sniperrifle' },
            [GetHashKey('WEAPON_HEAVYSNIPER')]         = { 'Heavy Sniper',        'weapon_heavysniper' },
            [GetHashKey('WEAPON_HEAVYSNIPER_MK2')]     = { 'Heavy Sniper Mk II',  'weapon_heavysniper_mk2' },
            [GetHashKey('WEAPON_MARKSMANRIFLE')]       = { 'Marksman Rifle',      'weapon_marksmanrifle' },
            [GetHashKey('WEAPON_MARKSMANRIFLE_MK2')]   = { 'Marksman Rifle Mk II','weapon_marksmanrifle_mk2' },
            -- LMGs
            [GetHashKey('WEAPON_MG')]                  = { 'MG',                  'weapon_mg' },
            [GetHashKey('WEAPON_COMBATMG')]            = { 'Combat MG',           'weapon_combatmg' },
            [GetHashKey('WEAPON_COMBATMG_MK2')]        = { 'Combat MG Mk II',     'weapon_combatmg_mk2' },
            [GetHashKey('WEAPON_GUSENBERG')]           = { 'Gusenberg Sweeper',   'weapon_gusenberg' },
            -- Launchers
            [GetHashKey('WEAPON_RPG')]                 = { 'RPG',                 'weapon_rpg' },
            [GetHashKey('WEAPON_GRENADELAUNCHER')]     = { 'Grenade Launcher',    'weapon_grenadelauncher' },
            [GetHashKey('WEAPON_GRENADELAUNCHER_SMOKE')]={ 'Smoke GL',            'weapon_grenadelauncher_smoke' },
            [GetHashKey('WEAPON_MINIGUN')]             = { 'Minigun',             'weapon_minigun' },
            [GetHashKey('WEAPON_FIREWORK')]            = { 'Firework Launcher',   'weapon_firework' },
            [GetHashKey('WEAPON_RAILGUN')]             = { 'Railgun',             'weapon_railgun' },
            [GetHashKey('WEAPON_HOMINGLAUNCHER')]      = { 'Homing Launcher',     'weapon_hominglauncher' },
            [GetHashKey('WEAPON_COMPACTLAUNCHER')]     = { 'Compact GL',          'weapon_compactlauncher' },
            [GetHashKey('WEAPON_RAYMINIGUN')]          = { 'Widowmaker',          'weapon_rayminigun' },
            -- Throwables
            [GetHashKey('WEAPON_GRENADE')]             = { 'Grenade',             'weapon_grenade' },
            [GetHashKey('WEAPON_BZGAS')]               = { 'BZ Gas',              'weapon_bzgas' },
            [GetHashKey('WEAPON_MOLOTOV')]             = { 'Molotov Cocktail',    'weapon_molotov' },
            [GetHashKey('WEAPON_STICKYBOMB')]          = { 'Sticky Bomb',         'weapon_stickybomb' },
            [GetHashKey('WEAPON_PROXMINE')]            = { 'Proximity Mine',      'weapon_proxmine' },
            [GetHashKey('WEAPON_SNOWBALL')]            = { 'Snowball',            'weapon_snowball' },
            [GetHashKey('WEAPON_PIPEBOMB')]            = { 'Pipe Bomb',           'weapon_pipebomb' },
            [GetHashKey('WEAPON_BALL')]                = { 'Ball',                'weapon_ball' },
            [GetHashKey('WEAPON_SMOKEGRENADE')]        = { 'Tear Gas',            'weapon_smokegrenade' },
            [GetHashKey('WEAPON_FLARE')]               = { 'Flare',               'weapon_flare' },
            -- Melee (3rd element = true marks as melee → no crosshair)
            [GetHashKey('WEAPON_KNIFE')]               = { 'Knife',               'weapon_knife',    true },
            [GetHashKey('WEAPON_NIGHTSTICK')]          = { 'Nightstick',          'weapon_nightstick',    true },
            [GetHashKey('WEAPON_HAMMER')]              = { 'Hammer',              'weapon_hammer',        true },
            [GetHashKey('WEAPON_BAT')]                 = { 'Baseball Bat',        'weapon_bat',           true },
            [GetHashKey('WEAPON_GOLFCLUB')]            = { 'Golf Club',           'weapon_golfclub',      true },
            [GetHashKey('WEAPON_CROWBAR')]             = { 'Crowbar',             'weapon_crowbar',       true },
            [GetHashKey('WEAPON_BOTTLE')]              = { 'Broken Bottle',       'weapon_bottle',        true },
            [GetHashKey('WEAPON_DAGGER')]              = { 'Antique Cavalry Dagger','weapon_dagger',      true },
            [GetHashKey('WEAPON_HATCHET')]             = { 'Hatchet',             'weapon_hatchet',       true },
            [GetHashKey('WEAPON_KNUCKLE')]             = { 'Brass Knuckles',      'weapon_knuckle',       true },
            [GetHashKey('WEAPON_MACHETE')]             = { 'Machete',             'weapon_machete',       true },
            [GetHashKey('WEAPON_SWITCHBLADE')]         = { 'Switchblade',         'weapon_switchblade',  true },
            [GetHashKey('WEAPON_WRENCH')]              = { 'Monkey Wrench',       'weapon_wrench',        true },
            [GetHashKey('WEAPON_BATTLEAXE')]           = { 'Battle Axe',          'weapon_battleaxe',     true },
            [GetHashKey('WEAPON_POOLCUE')]             = { 'Pool Cue',            'weapon_poolcue',       true },
            [GetHashKey('WEAPON_STONE_HATCHET')]       = { 'Stone Hatchet',       'weapon_stone_hatchet', true },
        }

        local isMelee = false
        if weaponVisible then
            local totalAmmo = GetAmmoInPedWeapon(cache.ped, weaponHash) or 0
            local _, clipAmmo = GetAmmoInClip(cache.ped, weaponHash)
            clipAmmo = clipAmmo or 0
            if totalAmmo < clipAmmo then totalAmmo = clipAmmo end
            local reserve = math.max(0, totalAmmo - clipAmmo)
            weaponAmmo = ('%d / %d'):format(clipAmmo, reserve)

            local entry = WEAPON_DATA[weaponHash]
            if entry then
                -- Lookup table hit: exact name and correct icon key
                weaponName = entry[1]
                weaponIcon = 'nui://ox_inventory/web/images/' .. entry[2] .. '.png'
                isMelee    = entry[3] == true
            else
                -- Fallback for custom/modded weapons: use GXT label via GetDisplayNameFromWeapon
                local displayKey = (GetDisplayNameFromWeapon and GetDisplayNameFromWeapon(weaponHash)) or ''
                if displayKey ~= '' and displayKey ~= 'NULL' then
                    local label = GetLabelText(displayKey)
                    if label and label ~= 'NULL' and label ~= '' and label ~= '.' then
                        weaponName = label
                    else
                        weaponName = displayKey
                    end
                    -- Build icon key: lowercase of display key
                    local iconKey = displayKey:lower()
                    weaponIcon = 'nui://ox_inventory/web/images/' .. iconKey .. '.png'
                else
                    weaponName = 'Weapon'
                    weaponIcon = ''
                end
            end
        else
            weaponIcon = ''
        end

        local status = {
            health       = Utils.roundIt(hp),
            armour       = Utils.roundIt(armour),
            hunger       = hunger,
            thirst       = thirst,
            stress       = stress,
            stamina      = Utils.roundIt(stamina),
            talking      = State.mouthRunning,
            voice        = State.voiceLabel,
            cash         = cachedCash,
            bank         = cachedBank,
            id           = cache.serverId,
            charName     = cachedName,
            time         = (function()
                local h = GetClockHours()
                local m = GetClockMinutes()
                local ampm = h >= 12 and 'PM' or 'AM'
                local displayH = h % 12
                if displayH == 0 then displayH = 12 end
                return ('%d:%02d %s'):format(displayH, m, ampm)
            end)(),
            street       = cachedStreet ~= '' and cachedStreet or 'Unknown Road',
            crossing     = cachedCross,
            zone         = cachedZone,
            direction    = Utils.headingToCompass(heading),
            job          = cachedJob,
            grade        = cachedGrade,
            inVehicle    = cache.vehicle ~= nil,
            seatbelt     = State.buckledUp,
            weaponVisible= weaponVisible,
            showCrosshair= weaponVisible and not isMelee,
            weaponName   = weaponName,
            weaponAmmo   = weaponAmmo,
            weaponIcon   = weaponIcon,
            showStress   = Config.ShowStress and stress >= Config.StressThreshold,
            showStamina  = (IsPedRunning(cache.ped) or IsPedSprinting(cache.ped)) and stamina < 99,
            waypointDist = cachedWaypoint,
        }

        local delta      = {}
        local hasChanges = false
        for k, v in pairs(status) do
            if prevStatus[k] ~= v then
                delta[k]      = v
                prevStatus[k] = v
                hasChanges    = true
            end
        end

        if hasChanges then
            Utils.yeet('updateStatus', delta)
        end
    end

    local slowTick   = 0
    local SLOW_EVERY = 3

    CreateThread(function()
        while true do
            local p = IsPauseMenuActive()
            if p ~= State.gameIsPaused then
                State.gameIsPaused = p
                Utils.yeet('setPaused', { paused = p })
            end
            if readyToRock() and not State.menuIsOpen and not State.gameIsPaused then
                local t = NetworkIsPlayerTalking(cache.playerId)
                if t ~= State.mouthRunning then State.mouthRunning = t end
                slowTick = (slowTick + 1) % SLOW_EVERY
                pushStatus(slowTick == 0)
                Vehicle.pushVehicle()
                Wait(Config.UpdateInterval)
            else
                Wait(500)
            end
        end
    end)

    local function pushConfig()
        Utils.yeet('initConfig', {
            colors     = Config.Colors,
            defaults   = Config.DefaultVisible,
            speedUnit  = Config.SpeedUnit,
            logo       = Config.Logo,
            redline    = Config.RedlineThreshold,
            minimapGeo = Minimap.calculateMinimapGeo(),
            thresholds = {
                health = Config.WarnHealth, hunger = Config.WarnHunger,
                thirst = Config.WarnThirst, fuel   = Config.WarnFuel,
                engine = Config.WarnEngine,
            },
        })
    end

    local function showHud(visible)
        State.hudShowing = visible
        Utils.yeet('toggleHud', { visible = visible })
    end

    local function grabPlayerData()
        local ok, data = pcall(function() return exports['qbx_core']:GetPlayerData() end)
        State.whoAmI = (ok and data) or {}
        refreshStaticCache()
    end

    local function tryShowHud()
        if not readyToRock() then return end
        Minimap.patchMinimap()
        pushConfig()
        showHud(true)
        prevStatus = {}  -- force full resend so NUI state is fresh
        pushStatus(true)
        Vehicle.pushVehicle()
    end

    return {
        pushStatus         = pushStatus,
        pushConfig         = pushConfig,
        showHud            = showHud,
        grabPlayerData     = grabPlayerData,
        tryShowHud         = tryShowHud,
        refreshStaticCache = refreshStaticCache,
        refreshMoneyCache  = refreshMoneyCache,
    }
end
