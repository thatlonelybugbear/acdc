Hooks.on('getSceneControlButtons', showTokenControlsButton);

function showTokenControlsButton(controls) {
	if (!game.permissions.MANUAL_ROLLS.includes(game.user.role)) return;
	const active = !!getCDC(game.settings.get('core', 'diceConfiguration'));
	const toolclip = {
		src: 'modules/acdc/assets/acdcRollConfig.webm',
		heading: 'ACDC.Config',
		items: {
			click: { heading: 'ACDC.ToggleMode', reference: 'CONTROLS.Click' },
			shiftClick: { heading: 'DICE.CONFIG.Label', reference: 'CONTROLS.ShiftClick' },
		},
	};
	if (game.version > 13) {
		const tools = controls.tokens?.tools;
		if (tools) {
			const order = Object.keys(tools).findLastIndex((i) => i) + 1;
			tools.acdc = {
				name: 'acdc',
				order,
				title: localize('ACDC.ButtonHint'),
				icon: 'fa-solid fa-r',
				visible: true,
				toggle: true,
				onChange: acdcMenu,
				active,
				toolclip,
			};
		}
	} else {
		const token = controls.find((c) => c.name === 'token');
		if (token) {
			const i = token.tools.length;
			token.tools.splice(i, 0, {
				name: 'ACDC',
				title: localize('ACDC.ButtonHint'),
				icon: 'fa-solid fa-r',
				visible: true,
				toggle: true,
				onClick: acdcMenu,
				button: true,
				active,
				toolclip,
			});
		}
	}
}

function acdcMenu() {
	if (!event.shiftKey) return changeDiceRollConfig();
	else return new DiceConfig().render(true);
}
async function changeDiceRollConfig() {
	const config = game.settings.get('core', 'diceConfiguration'); //the default state is {}
	const acdcConfig = game.settings.get('acdc', 'manualDice');
	const isManual = getCDC(config);
	if (isManual === null) {
		for (const fullfillmentDice in CONFIG.Dice.fulfillment.dice) config[fullfillmentDice] = '';
	} else for (const dice in config) config[dice] = isManual ? '' : acdcConfig.includes(dice) ? 'manual' : '';
	await game.settings.set('core', 'diceConfiguration', config);
	await game.user.setFlag('acdc', 'currentDiceConfig', isManual ? 'auto' : 'manual');
	ui.notifications.info(localize(isManual ? 'ACDC.Auto' : !acdcConfig.length ? 'ACDC.Manual' : 'ACDC.SelectedManual'));
}

function localize(string) {
	return game.i18n.localize(string);
}

function getCDC(config) {
	if (foundry.utils.isEmpty(config)) return null;
	return game.user.getFlag('acdc', 'currentDiceConfig') === 'manual';
}

Hooks.on('renderDiceConfig', (app, html) => {
	const debug = game.settings.get('acdc', 'debug');
	if (debug) console.log('ACDC debug: DiceConfig Opened - Injecting Custom Save Behavior');

	if (!app._originalUpdateObject) {
		app._originalUpdateObject = app._updateObject;

		app._updateObject = async function (event, formData) {
			if (debug) console.log('ACDC debug: Intercepted Save - Storing User Preferences');

			await game.settings.set('core', 'diceConfiguration', formData);

			const manualDice = Object.entries(formData)
				.filter(([key, value]) => value === 'manual')
				.map(([key]) => key);

			await game.settings.set('acdc', 'manualDice', manualDice);

			if (debug) console.log('ACDC debug: Manual Dice Saved:', manualDice);

			return this._originalUpdateObject(event, formData);
		};
	}
});

Hooks.once('init', () => {
	game.settings.register('acdc', 'manualDice', {
		name: 'Manual Dice Selection',
		scope: 'client',
		config: false,
		type: Array,
		default: [],
	});
	game.settings.register('acdc', 'debug', {
		name: 'Debug',
		scope: 'world',
		config: false,
		type: Boolean,
		default: false,
	});
	game.keybindings.register('acdc', 'keybind', {
		name: 'ACDC.Keybind',
		editable: [{ key: 'KeyB' }],
		restricted: false,
		reservedModifiers: ['Control', 'Shift'],
	});
});

Hooks.on('ready', () => {
	document.addEventListener('keydown', (event) => {
		if ((event.ctrlKey || event.shiftKey) && game.keybindings.get('acdc', 'keybind').some((k) => k.key === event.code)) acdcMenu();
	});
});

