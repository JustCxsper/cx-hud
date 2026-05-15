

# cx-hud
A modern, highly customizable, and lightweight HUD for **Qbox** and **QBCore** FiveM servers.
# HUD
![HUD Preview v1.1.5](https://cxsper.dev/assets/cx-hud/images/ui.png)
# UI Editor
![Editor Preview v1.1.5](https://cxsper.dev/assets/cx-hud/images/editor.png)
# Vehicle HUD
![In Car Preview v1.1.5](https://cxsper.dev/assets/cx-hud/images/vehicle-hud.png)
# Settings UI
![Settings Preview v1.1.5](https://cxsper.dev/assets/cx-hud/images/settings.png)


## Features

* **In-Game Settings Menu:** Players can type `/hud` to toggle individual HUD elements, change their avatar, and switch speed units (MPH/KMH) & More - All saves locally per player!

* **In-Game UI Editor** New Feature as of 14th April 26' - do /hud and click `Edit Layout` to use our new editor!

* **Immersive Speedometer:** Custom vehicle HUD featuring speed, RPM, gear shifting animations, fuel/engine health arcs, seatbelt warnings, and turn signal/headlight indicators.

* **Dynamic Minimap:** Clean square minimap with street names, compass direction, current time, and live waypoint distance tracking.

* **Responsive:** Supports up to 4K resolution.

* **Weapon/Ammo UI:** Added 27th April 2026

* **PS BUFFS SUPPORT**

## Features Coming Soon
 
* * **Helicopter / Boats UI**
 
  
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

## Server Default Layout

Server owners can set a default HUD layout that is automatically applied to new players who have never configured their own layout.

### Setting a Default Layout

1. Add the following ACE permission to your `server.cfg`, replacing `group.admin` with whichever group or identifier you want to grant access to:

```cfg
add_ace group.admin cx-hud.setdefaultlayout allow
```

2. Join the server with a player that has the permission above.
3. Open the HUD editor via `/hud` → **Edit Layout**.
4. Arrange the HUD elements however you want.
5. Click the gold **Set Server Default** button that appears in the editor toolbar.
6. Enter a name for the layout (1–32 characters, letters/numbers/spaces/underscores/hyphens, must start with a letter or number).
7. Click **Save as Default**.

The layout is stored in FiveM's KVP system and persists across server restarts. The server console will confirm the saved layout name every time the resource starts:

```
[CX HUD] Default layout detected: My Layout Name
```

### How It Applies to Players

New players (or players who have reset their layout) will automatically receive the server default on login. Players who have already customised their own layout are never affected — their personal layout always takes priority.

### Resetting the Server Default

To clear the server default layout, run the following command in the **server console** or **txAdmin console**:

```
cx_resetdefault
```

This immediately clears the stored layout from KVP and from memory. The next resource start will print `No server default layout set`. To set a new one, just follow the steps above again.

### Resetting a Player's Personal Layout

Players can reset their own layout back to defaults using the **Reset** button inside the HUD editor. This fully clears their saved layout from KVP, meaning the server default will re-apply on their next login if one is set.

---

## jg-vehiclemileage Integration

### Enabling

1. Install and start `jg-vehiclemileage` as normal.
2. In `cx-hud/config.lua`, set:
   ```lua
   Config.JGMileage = true
   ```
3. Hide jg's default UI so it doesn't render twice. Open `jg-vehiclemileage/config.lua` and set:
   ```lua
   Config.ShowMileage = false
   ```
4. Restart your server.

Mileage tracking keeps running inside jg-vehiclemileage; cx-hud just reads the value via its `getMileage` export and renders it inside the speedometer. The unit (`miles` / `km`) follows your cx-hud `SpeedUnit` setting.

### Disabling

Set `Config.JGMileage = false` in `cx-hud/config.lua` and the speedometer reverts to the original layout (RPM number centered at the bottom, no odometer). You can leave jg-vehiclemileage running or stopped — it makes no difference to cx-hud in this mode.

## Exports (Added with v1.1.1)
I have added exports in to allow users to `Hide` and `Show` the HUD. This is specifically useful if you need to hide the HUD for e.g Weazle News Broadcasts etc. 
>Make sure you have started `cx-hud` **BEFORE** the resource using the exports otherwise you will get a NoExport error. 

**Hide the HUD**
`exports['cx-hud']:hideHud()`

**Show the HUD**
`exports['cx-hud']:showHud()`

## Special Thanks + Contributors

Thanks to everyone who has helped make this happen, even if it's small or big. Every little helps! Here's a list of folks who have helped the project in 1 way or another. 

* **Scorpion7162:** Mahoosive PR that helped me really get the project underway [HERE](https://github.com/JustCxsper/cx-hud/commit/6e8566f15c10da2fb10fce917a71e947d2ae8a1c).

* **Solaire:** Thanks alot to Solaire for giving me the logic to support multiple inventories for weapon images.

* **ThatMadCap:** Thanks for his release of his HUD, i was able to understand how some of the minimap functionality worked and ported some of the code over as documented [HERE](https://github.com/JustCxsper/cx-hud/blob/5892779958ba06076e163c55cba2e7207057c23e/client/minimap.lua#L29)


## Notes
* **Qbox Stress:** If your stress ring sits at 0 and doesn't move when shooting, remember that HUDs only *display* data. You must install a stress system like `jg-stress-addon` to actually do le stress magic!
