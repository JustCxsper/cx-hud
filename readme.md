

# cx-hud
A modern, highly customizable, and lightweight HUD for **Qbox** and **QBCore** FiveM servers.
![HUD Preview](https://cxsper.dev/assets/cx-hud/images/UI.png)
# UI Editor
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/b33e40a1-c8b0-490a-96fc-ffc268324eca" />


## Features

* **In-Game Settings Menu:** Players can type `/hud` to toggle individual HUD elements, change their avatar, and switch speed units (MPH/KMH) & More - All saves locally per player!

* **In-Game UI Editor** New Feature as of 14th April 26' - do /hud and click `Edit Layout` to use our new editor!

* **Immersive Speedometer:** Custom vehicle HUD featuring speed, RPM, gear shifting animations, fuel/engine health arcs, seatbelt warnings, and turn signal/headlight indicators.

* **Dynamic Minimap:** Clean square minimap with street names, compass direction, current time, and live waypoint distance tracking.

* **Responsive:** Supports up to 4K resolution.

* **Weapon/Ammo UI:** Added 27th April 2026

## Features Coming Soon

* * **Oxygen Status**
 
* * **Helicopter / Boats UI**
 
* * **ps-buffs integration**
  
## Dependencies

To get the most out of `cx-hud`, ensure you have the following resources installed and running:

* **Framework:** [qbx_core](https://github.com/Qbox-project/qbx_core) or [qb-core](https://github.com/qbcore-framework/qb-core)

* **Voice:** [pma-voice](https://github.com/AvarianKnight/pma-voice)

* **Stress:** [jg-stress-addon](https://github.com/jgscripts/jg-stress-addon) (If you don't want to use this then just go into the fxmanifest.lua and remove the dependency section)

## Installation

1. Download the latest version of `cx-hud`.
2. Extract the folder into your server's `resources` directory.
3. Ensure the folder is named `cx-hud`.
4. Add the following to your `server.cfg` (make sure it starts **after** your framework and voice script):

```cfg
ensure pma-voice
ensure qbx_core
ensure cx-hud
```
I also recommend going into `qbx_smallresources` > `qbx_hudcomponents` > `config.lua` 
- Set the `hudComponents` var to `hudComponents = {1, 2, 3, 4, 6, 7, 9, 13, 14, 19, 20, 21, 22},`

## Configuration

You can easily adjust the HUD's default behaviors, colors, and warning thresholds in the `config.lua` or directly inside `app.js` and `style.css`. 

* **To change default UI colors:** Check the `:root` variables at the top of `style.css`.

## Usage

Once in-game, players can customize their experience by typing:
> `/hud`

This opens the settings panel where players can:
* Paste an image URL to set a custom character portrait.
* Hide/Show the player card, minimap, status rings, or vehicle HUD.
* Toggle the cinematic black bars.

## Exports (Added with v1.1.1)
I have added exports in to allow users to `Hide` and `Show` the HUD. This is specifically useful if you need to hide the HUD for e.g Weazle News Broadcasts etc. 
>Make sure you have started `cx-hud` **BEFORE** the resource using the exports otherwise you will get a NoExport error. 

**Hide the HUD**
`exports['cx-hud']:hideHud()`

**Show the HUD**
`exports['cx-hud']:showHud()`

## Notes

* **Qbox Stress:** If your stress ring sits at 0 and doesn't move when shooting, remember that HUDs only *display* data. You must install a stress system like `jg-stress-addon` to actually do le stress magic!

## More Pics
![In Car Preview](https://cxsper.dev/assets/cx-hud/images/hud-incar.png)
![HUD Settings Preview](https://cxsper.dev/assets/cx-hud/images/hudsettings.png)
