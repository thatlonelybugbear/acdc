Hooks.on('getSceneControlButtons', showTokenControlsButton);

function showTokenControlsButton(controls) {
	if (!game.permissions.MANUAL_ROLLS.includes(game.user.role)) return;
	let token = controls.find((c) => c.name === 'token');
	if (token) {
		let i = token.tools.length;
		token.tools.splice(i, 0, {
			name: 'ACDC',
			title: localize('acdc.buttonHint'),
			icon: 'fa-solid fa-r',
			visible: true,
			onClick: changeDiceRollConfig,
			button: true,
		});
	}
}

async function changeDiceRollConfig() {
	const config = game.settings.get('core', 'diceConfiguration');
	let initialRun = false;  //the default state is {}
	if (foundry.utils.isEmpty(config)) {
		initialRun = true;
		for (const fullfillmentDice in CONFIG.Dice.fulfillment.dice) 
			config[fullfillmentDice] = '';
	}
	const isManual = !initialRun && game.user.getFlag('acdc', 'currentDiceConfig') === 'manual';
	for (const dice in config) config[dice] = isManual ? '' : 'manual';
	await game.settings.set('core', 'diceConfiguration', config);
	await game.user.setFlag('acdc', 'currentDiceConfig', isManual ? 'auto' : 'manual');
	ui.notifications.info(localize(isManual ? 'acdc.auto' : 'acdc.manual'));
}

function localize(string) {
	return game.i18n.localize(string);
}
