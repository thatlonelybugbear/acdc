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
	const cprManualRollToggle = game.settings.get('acdc', 'cprManualRollToggle');
	if (cprManualRollToggle || !event.shiftKey) return changeDiceRollConfig();
	else {
		if (game.version > 13) return new foundry.applications.settings.menus.DiceConfig().render(true);
		else return new DiceConfig().render(true);
	}
}
async function changeDiceRollConfig() {
	const cprManualRollToggle = game.modules.get('chris-premades')?.active ? game.settings.get('acdc', 'cprManualRollToggle') : false;
	if (cprManualRollToggle) {
		const key = 'manualRollsEnabled';
		const scope = 'chris-premades';
		const cprManualRollsEnabled = game.settings.get(scope, key);
		await game.settings.set(scope, key, !cprManualRollsEnabled);
		await game.user.setFlag('acdc', 'currentDiceConfig', cprManualRollsEnabled ? 'auto' : 'manual');
		return ui.notifications.info(localize(cprManualRollsEnabled ? 'ACDC.Auto' : 'ACDC.CPR_INTEGRATION_TOGGLE.Manual'));
	}
	const config = game.settings.get('core', 'diceConfiguration'); //the default state is {}
	const acdcConfig = game.settings.get('acdc', 'manualDice');
	const isManual = getCDC(config);
	if (isManual === null) {
		for (const fullfillmentDice in CONFIG.Dice.fulfillment.dice) config[fullfillmentDice] = '';
	} else {
		for (const dice in config) {
			config[dice] = isManual ? '' : !acdcConfig?.length || acdcConfig?.includes(dice) ? 'manual' : '';
		}
	}
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

	const form = app.form;
	if (!form) return;

	form.addEventListener('submit', async (event, debug) => {
		setTimeout(async () => {
			const config = game.settings.get('core', 'diceConfiguration');

			const manualDice = Object.entries(config)
				.filter(([_, method]) => method === 'manual')
				.map(([denomination]) => denomination);
			await game.settings.set('acdc', 'manualDice', manualDice);
			if (debug) console.log('ACDC - manualDice updated:', manualDice);
		}, 0);
	});
});

Hooks.once('init', () => {
	function cprIntegrationSettings () {
		game.settings.register('acdc', 'cprManualRollToggle', {
			name: 'ACDC.CPR_INTEGRATION_TOGGLE.NAME',
			hint: 'ACDC.CPR_INTEGRATION_TOGGLE.HINT',
			scope: 'world',
			config: true,
			default: false,
			type: Boolean,
		});
	};

	const cprModule = game.modules.get('chris-premades');
	if (cprModule?.active) {
		if (foundry.utils.isNewerVersion(cprModule.version, '1.2.41')) {
			Hooks.once('cprInitComplete', cprIntegrationSettings);
		}
		else cprIntegrationSettings();
	}
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
		const active = document.activeElement;
		const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

		if (isTyping) return;

		// Trigger keybind logic if not typing
		if ((event.ctrlKey || event.shiftKey) && game.keybindings.get('acdc', 'keybind').some((k) => k.key === event.code)) {
			acdcMenu();
		}
	});
});
