# Alter Core Dice Configuration

![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/thatlonelybugbear/acdc/main/module.json&label=Token%20Warp%20Version&query=$.version&colorB=yellow&style=for-the-badge) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/thatlonelybugbear/acdc/main/module.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=ff6400&style=for-the-badge) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/thatlonelybugbear/acdc/main/module.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=ff6400&style=for-the-badge)

![Total Download Count](https://img.shields.io/github/downloads/thatlonelybugbear/acdc/total?color=2b82fc&label=TOTAL%20DOWNLOADS&style=for-the-badge) ![Latest Release Download Count](https://img.shields.io/github/downloads/thatlonelybugbear/acdc/latest/total?color=2b82fc&label=LATEST%20DOWNLOADS&style=for-the-badge) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/acdc&colorB=68a74f&style=for-the-badge)](https://forge-vtt.com/bazaar#package=tokenwarp)

#### A system-agnostic module to quickly toggle between manual and automatic Foundry core dice configuration!

If a user has a role with permission to make manual rolls in the first place, a button (icon R) will be added to the client's Token Controls sidebar.

- `Click` on it to toggle between automatic and manual dice rolling, or automatic and smart routing if smart routing options are enabled`*`.
- `SHIFT + Click` to open the Foundry Configure Dice settings menu and set specific dice to manual.

Added functionality by providing a hotkey (default B) to avoid clicking on the Token Controls ACDC button.

- `CTRL + B` toggles between automatic and manual dice rolling, or automatic and smart routing if smart routing options are enabled`*`.
- `SHIFT + B` opens the Foundry Configure Dice settings menu.

`*` ***Smart routing*** is a new feature in ACDC v14.364.1+ that allows systems and modules to register roll types for ACDC to automatically route to the manual resolver.

<hr>
If you like what I do, consider supporting this lonely bugbear 🐾

Every shiny gold coin helps keep the ideas flowing and the goblins at bay.

<a href="https://www.patreon.com/thatlonelybugbear"><img src="https://img.shields.io/badge/-Patreon-%23f96854?style=for-the-badge&logo=patreon"/></a> <a href="https://ko-fi.com/thatlonelybugbear"><img src="https://img.shields.io/badge/Ko–fi-00ADEF?style=for-the-badge&logo=kofi&logoColor=white"/></a> <br/> <br/> You can also join the Bugbear’s Den to hang out, get help, or check what I might be working on!

<a href="https://discord.gg/KYb74fcsBt"><img src="https://img.shields.io/discord/1226846921474310194?style=for-the-badge&logo=discord&label=Discord&labelColor=%231c1e1f&color=%235865f2&link=https%3A%2F%2Fdiscord.gg%KYb74fcsBt"/></a>

<hr>

## How to use!

[Usage.webm](https://github.com/user-attachments/assets/b3e37565-4c10-474c-b23d-0a17ed1ee2f1)

## Smart Routing API Example (v14.364.1+)

ACDC currently ships smart routing choices for the dnd5e system. Other systems and modules can register their own roll types as needed.

Systems or modules can register roll types for ACDC smart routing during `acdcRegisterSmartRollTypes`.

```js
Hooks.on('acdcRegisterSmartRollTypes', (api) => {
	if (game.system.id !== 'dnd4e') return;

	api.registerSmartRollType({
		id: 'attack',
		label: 'ACDC.Settings.RollTypes.attack',
		test: (roll) => roll.data?.isAttackRoll === true,
	});

	api.registerSmartRollType({
		id: 'initiative',
		label: 'ACDC.Settings.RollTypes.initiative',
		test: (roll) => roll.options?.flags?.dnd4e?.roll?.type === 'init',
	});

	api.registerSmartRollType({
		id: 'damage',
		label: 'ACDC.Settings.RollTypes.damage',
		test: (roll) => roll.options?.hitTypeDamage === true || ['normal', 'crit', 'miss'].includes(roll.options?.hitType),
	});

	api.registerSmartRollType({
		id: 'healing',
		label: 'ACDC.Settings.RollTypes.healing',
		test: (roll) => roll.options?.hitTypeHealing === true || roll.options?.hitType === 'heal',
	});

	api.registerSmartRollType({
		id: 'save',
		label: 'ACDC.Settings.RollTypes.save',
		test: (roll) => roll.options?.flags?.dnd4e?.roll?.type === 'save',
	});

	api.registerSmartRollType({
		id: 'deathSave',
		label: 'ACDC.Settings.RollTypes.deathSave',
		test: (roll) => roll.options?.flags?.dnd4e?.roll?.type === 'save' && String(roll.options?.flavor ?? '').includes(game.i18n.localize('DND4E.RollDeathSave')),
	});
});
```

The `test` function receives the `Roll` and the current dice term. Return `true` when the roll or dice term belongs to that smart routing type.

## Smart route d20adv
We could also register a smart routing type for `d20Advantage` like:

```js
api.registerSmartRollType({
	id: 'd20Advantage',
	label: 'd20 advantage',
	test: (_roll, term) => term.denomination === 'd20' && term.modifiers?.includes('adv'),
});
```
