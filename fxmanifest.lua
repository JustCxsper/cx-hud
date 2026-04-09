fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name        'cx-hud'
author      'Cxsper'
description 'A shitty hud or something like that.'
version     '4.2.0'

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
    'client/main.lua',
}

