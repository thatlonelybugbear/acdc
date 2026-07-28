## Next
* Added minimal CAT manual-roll integration:
  * When CAT has manual-roll users configured, the GM ACDC button toggles CAT's main manual-roll switch.
  * ACDC leaves CAT's dice configuration, resolver, inclusion rules, and per-user manual-roll settings under CAT control.

## v14.364.1
* Verified compatibility with Foundry v14.364
* Raised the minimum supported Foundry version to v14.
* Added smart routing settings for dnd5e.
  * Choose which supported roll types use the manual resolver.
  * Other roll types are rolled automatically.
  * Optionally include non-registered dice denominations, such as 1d7, in manual or smart-routed rolls.
* Reworked the ACDC toggle for Foundry v14's dice fulfillment workflow.
  * With no smart routing options enabled, the ACDC button toggles all rolls between automatic and manual.
  * With smart routing options enabled, the ACDC button toggles between automatic and ACDC smart routing.
* Added an ACDC smart routing API so other systems and modules can register their own roll type detection. See the README for the API example.
  * The smart routing API is available from ACDC v14.364.1 onward.
  * Check the 4e example at <https://github.com/thatlonelybugbear/acdc#smart-routing-api-example-v143641>
* Added a Resources & Support menu with README, Issues, Discord, Ko-Fi, and Patreon links.
* Removed the CPR Manual Rolls integration for now. It can be reworked later when that module is active again.
* Removed pre-v14 compatibility code.

## v14.359.1
* Verified compatibility with Foundry v14.359

## v13.348.3
* Rework the keybinds to use Foundry's API.

## v13.348.2
* Support CTRL+B while focusing a text field via [#24](<https://github.com/thatlonelybugbear/acdc/pull/24>) by [ThiefMaster](<https://github.com/ThiefMaster>) 👍

## v13.348.1
* Verified for Foundry v13.348
* Prevent hotkeys triggering Browser actions via [#22](<https://github.com/thatlonelybugbear/acdc/pull/22>) by [ThiefMaster](<https://github.com/ThiefMaster>) 👍

## v13.347.2
* Updated Italian translation by [GregoryWarn](<https://github.com/GregoryWarn>) 🤗

## v13.347.1
* Foundry v13.347 compatibility bump

## v13.346.1
- Verified for Foundry v13.346
 
## v13.345.1
* Versioning changes for indicating compatibility with Foundry version easily

## v1.0.3
- Fixes for Foundry v13.341 stable release.

## v1.0.2
- Stops ACDC from triggering the Dice Config Menu when typing in text fields.

## v1.0.1
- Adds per dice manual toggles
  - Shift + Left Click on the ACDC button will open the Foundry Dice Configuration Menu and ACDC will then toggle only the user specified dice for manual rolling.
- Adds a key bind for ACDC toggles, default B.
  - Pressing Ctrl + B will toggle the ACDC roll mode.
  - Pressing Shift + B will open the Foundry Dice Configuration Menu.
- Adds a toolclip, shown when the Core setting for Showing Toolclips on Hover is enabled.

## v0.0.8
- Makes sure that ACDC dual supports v12 and v13.

## v0.0.7
- Foundry v13 compatibility

## v0.0.6
- Make the Button a togglable element that is active if Rolls are supposed to be manual.

## v0.0.5
- Make sure that it works on initial module run.

## v0.0.4
- The Button will be shown only if the user has permission to Make Manual Rolls.
  
## v0.0.3
- Make use of proper module namespace.

## Initial release
- Inserts a button (R) in the left Foundry sidebar in Token Controls
- Toggle between manual and auto dice rolls.
