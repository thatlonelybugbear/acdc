export function registerDND5eIntegration(api) {
	if (game.system.id !== 'dnd5e') return;

	api.registerSmartRollType({
		id: 'attack',
		label: 'ACDC.Settings.RollTypes.attack',
		test: (roll) => hasHookName(roll, 'attack') || getDND5eRollType(roll) === 'attack',
	});

	api.registerSmartRollType({
		id: 'initiative',
		label: 'ACDC.Settings.RollTypes.initiative',
		test: (roll) => hasHookName(roll, 'initiativeDialog') || String(roll.options?.flavor ?? '') === game.i18n.localize('DND5E.Initiative'),
	});

	api.registerSmartRollType({
		id: 'damage',
		label: 'ACDC.Settings.RollTypes.damage',
		test: (roll) => hasHookName(roll, 'damage') || getDND5eRollType(roll) === 'damage',
	});

	api.registerSmartRollType({
		id: 'healing',
		label: 'ACDC.Settings.RollTypes.healing',
		test: (roll) => getDND5eRollType(roll) === 'healing',
	});

	api.registerSmartRollType({
		id: 'skill',
		label: 'ACDC.Settings.RollTypes.skill',
		test: (roll) => hasHookName(roll, 'skill') || getDND5eRollType(roll) === 'skill',
	});

	api.registerSmartRollType({
		id: 'tool',
		label: 'ACDC.Settings.RollTypes.tool',
		test: (roll) => hasHookName(roll, 'tool') || getDND5eRollType(roll) === 'tool',
	});

	api.registerSmartRollType({
		id: 'save',
		label: 'ACDC.Settings.RollTypes.save',
		test: (roll) => hasHookName(roll, 'savingThrow') || getDND5eRollType(roll) === 'save',
	});

	api.registerSmartRollType({
		id: 'deathSave',
		label: 'ACDC.Settings.RollTypes.deathSave',
		test: (roll) => hasHookName(roll, 'deathSave') || getDND5eRollType(roll) === 'death',
	});

	api.registerSmartRollType({
		id: 'concentration',
		label: 'ACDC.Settings.RollTypes.concentration',
		test: (roll) => getDND5eRollType(roll) === 'concentration',
	});

	api.registerSmartRollType({
		id: 'check',
		label: 'ACDC.Settings.RollTypes.check',
		test: (roll) => hasHookName(roll, 'abilityCheck') || getDND5eRollType(roll) === 'ability',
	});
}

function hasHookName(roll, hookName) {
	return (roll.options?.hookNames ?? []).some((name) => String(name).toLowerCase() === hookName.toLowerCase());
}

function getDND5eRollType(roll) {
	return String(roll.options?.rollType ?? roll.options?.type ?? roll.options?.flags?.dnd5e?.roll?.type ?? '').toLowerCase();
}
