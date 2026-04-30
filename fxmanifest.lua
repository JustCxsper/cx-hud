fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name        'cx-hud'
author      'Cxsper'
description 'this is a hud i guess'
version     '1.1.5'

ui_page 'web/dist/index.html'

files {
    'web/dist/index.html',
    'web/dist/assets/*.js',
    'web/dist/assets/*.css',
    'stream/minimap.gfx',
    'stream/minimap.ytd',
    'stream/squaremap.ytd',
}

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
}

client_scripts {
    'client/utils.lua',
    'client/minimap.lua',
    'client/vehicle.lua',
    'client/weapon_data.lua',
    'client/weapon.lua',
    'client/seatbelt.lua',
    'client/lights.lua',
    'client/status.lua',
    'client/nui.lua',
    'client/events.lua',
    'client/main.lua',
}

server_scripts {
    'server/version.lua',
}

dependencies {
    'jg-stress-addon',
}
