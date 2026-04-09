fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name        'cx-hud'
author      'Cxsper'
description 'this is a hud i guess'
version     '1.0.2'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
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
    'client/status.lua',
    'client/events.lua',
    'client/main.lua',
}

server_scripts {
    'server/version.lua',
}

