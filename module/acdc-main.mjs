Hooks.on('getSceneControlButtons', showTokenControlsButton);

function showTokenControlsButton(controls) {
	if (!game.permissions.MANUAL_ROLLS.includes(game.user.role)) return;
	const active = !!getCDC(game.settings.get('core', 'diceConfiguration'));
	if (game.version > 13) {
		const tools = controls.tokens?.tools;
		if (tools) {
			const order = Object.keys(tools).findLastIndex(i=>i) + 1;
			tools.acdc = {
				name: 'acdc',
				order,
				title: localize('acdc.buttonHint'),
				icon: 'fa-solid fa-r',
				visible: true,
				toggle: true,
				onChange: changeDiceRollConfig,
				active,
			};
		}
	}
	else {
		const token = controls.find((c) => c.name === 'token');
		if (token) {
			const i = token.tools.length;
			token.tools.splice(i, 0, {
				name: 'ACDC',
				title: localize('acdc.buttonHint'),
				icon: 'fa-solid fa-r',
				visible: true,
				toggle: true,
				onClick: changeDiceRollConfig,
				button: true,
				active,
			});
		}
	}
}

async function changeDiceRollConfig() {
	const config = game.settings.get('core', 'diceConfiguration'); //the default state is {}
	const isManual = getCDC(config);
	if (isManual === null) {
		for (const fullfillmentDice in CONFIG.Dice.fulfillment.dice) config[fullfillmentDice] = '';
	} else for (const dice in config) config[dice] = isManual ? '' : 'manual';
	await game.settings.set('core', 'diceConfiguration', config);
	await game.user.setFlag('acdc', 'currentDiceConfig', isManual ? 'auto' : 'manual');
	ui.notifications.info(localize(isManual ? 'acdc.auto' : 'acdc.manual'));
}

function localize(string) {
	return game.i18n.localize(string);
}

function getCDC(config) {
	if (foundry.utils.isEmpty(config)) return null;
	return game.user.getFlag('acdc', 'currentDiceConfig') === 'manual';
}
