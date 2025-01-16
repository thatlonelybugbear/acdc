Hooks.on('getSceneControlButtons', (controls) => {
	let token = controls.find((c) => c.name === 'token');
	if (token) {
		let i = token.tools.length;
		token.tools.splice(i, 0, {
			name: 'ACDC',
			title: game.i18n.localize('acdc.buttonHint'),
			icon: 'fa-solid fa-r',
			visible: true,
			onClick: changeDiceRollConfig,
			button: true,
		});
	}
});

async function changeDiceRollConfig() {
	const config = game.settings.get('core', 'diceConfiguration');
	const isManual = game.user.getFlag('acdc', 'currentDiceConfig') === 'manual';
	for (const dice in config) config[dice] = isManual ? '' : 'manual';
	await game.settings.set('core', 'diceConfiguration', config);
	await game.user.setFlag('acdc', 'currentDiceConfig', isManual ? 'auto' : 'manual');
	ui.notifications.info(`Foundry dice rolls are now ${isManual ? 'auto' : 'manual'}`);
}
