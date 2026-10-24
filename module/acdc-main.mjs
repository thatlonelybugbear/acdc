import { registerDND5eIntegration } from './integrations/acdc-dnd5e.mjs';

Hooks.on('getSceneControlButtons', showTokenControlsButton);

const ROLL_MODES = ['auto', 'manual', 'smart'];
const DEFAULT_SMART_ROLL_TYPES = [];
const SMART_ROLL_TYPES = new Map();
const ACDC_API = { registerSmartRollType };

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
globalThis.ACDC = ACDC_API;

class ACDCLinksMenu extends HandlebarsApplicationMixin(ApplicationV2) {
	static LINKS = [
		{ label: 'README', icon: 'fa-brands fa-github', url: 'https://github.com/thatlonelybugbear/acdc/blob/main/README.md' },
		{ label: 'Issues', icon: 'fa-solid fa-circle-exclamation', url: 'https://github.com/thatlonelybugbear/acdc/issues' },
		{ label: 'Discord', icon: 'fa-brands fa-discord', url: 'https://discord.gg/twsvWuJJEN' },
		{ label: 'Ko-Fi', icon: 'fa-solid fa-mug-hot', url: 'https://ko-fi.com/thatlonelybugbear' },
		{ label: 'Patreon', icon: 'fa-brands fa-patreon', url: 'https://www.patreon.com/thatlonelybugbear' },
	];

	static DEFAULT_OPTIONS = {
		id: 'acdc-links-menu',
		classes: ['acdc-links-menu'],
		window: {
			title: 'ACDC.LinksMenu.Title',
			icon: 'fa-solid fa-link',
			resizable: false,
		},
		actions: {
			openLink: ACDCLinksMenu.#onOpenLink,
		},
		position: {
			width: 420,
			height: 'auto',
		},
	};

	static PARTS = {
		body: {
			template: 'modules/acdc/templates/apps/acdc-links-menu.hbs',
		},
	};

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.primaryLinks = this.constructor.LINKS.slice(0, 2);
		context.secondaryLinks = this.constructor.LINKS.slice(2, 3);
		context.tertiaryLinks = this.constructor.LINKS.slice(3);
		return context;
	}

	static #onOpenLink(_event, target) {
		const url = target?.dataset?.url;
		if (!url) return;
		globalThis.open(url, '_blank', 'noopener,noreferrer');
	}
}

class SmartRollResolver extends foundry.applications.dice.RollResolver {
	async awaitFulfillment() {
		const fulfillable = Roll.defaultImplementation.identifyFulfillableTerms(this.roll.terms);
		if (!fulfillable.length) return;

		const manualTerms = [];
		const autoTerms = [];
		for (const term of fulfillable) {
			if (shouldUseManualResolver(this.roll, term)) manualTerms.push(term);
			else autoTerms.push(term);
		}

		if (autoTerms.length) {
			const previousResolver = this.roll._resolver;
			this.roll._resolver = null;
			try {
				for (const term of autoTerms) await term.evaluate({ allowInteractive: false });
			} finally {
				this.roll._resolver = previousResolver;
			}
		}

		if (!manualTerms.length) return;
		const autoTermNumbers = autoTerms.map((term) => [term, term.number]);
		for (const term of autoTerms) term.number = 0;
		try {
			return await super.awaitFulfillment();
		} finally {
			for (const [term, number] of autoTermNumbers) term.number = number;
		}
	}
}

function showTokenControlsButton(controls) {
	if (isCatControllingManualRolls() && !canToggleCatManualRolls()) return;
	if (!canToggleCatManualRolls() && !game.permissions.MANUAL_ROLLS.includes(game.user.role)) return;
	const active = getRollMode() !== 'auto';
	const toolclip = {
		src: 'modules/acdc/assets/acdcRollConfig.webm',
		heading: 'ACDC.Config',
		items: {
			click: { heading: 'ACDC.ToggleMode', reference: 'CONTROLS.Click' },
			shiftClick: { heading: 'DICE.CONFIG.Label', reference: 'CONTROLS.ShiftClick' },
		},
	};
	const tools = controls.tokens?.tools;
	if (tools) {
		const order = Object.keys(tools).length;
		tools.acdc = {
			name: 'acdc',
			order,
			title: localize('ACDC.ButtonHint'),
			icon: 'fa-solid fa-r',
			visible: true,
			toggle: true,
			onChange: changeDiceRollConfig,
			active,
			toolclip,
		};
	}
}

Hooks.on('renderSceneControls', () => {
	const btn = document.querySelector('[data-tool="acdc"]');
	if (!btn) return;

	btn.addEventListener(
		'click',
		(ev) => {
			if (ev.shiftKey) {
				ev.stopImmediatePropagation();
				if (isCatControllingManualRolls()) return;
				new foundry.applications.settings.menus.DiceConfig().render(true);
			}
		},
		true,
	);
});

async function changeDiceRollConfig() {
	if (isCatControllingManualRolls() && !canToggleCatManualRolls()) return;
	const mode = getNextRollMode();
	await setRollMode(mode);
	ui.notifications.info(localize(`ACDC.Modes.${mode}.Notification`));
}

function localize(string) {
	return game.i18n.localize(string);
}

function getRollMode() {
	if (isCatControllingManualRolls()) return game.settings.get('cat', 'manualRollsEnabled') ? 'manual' : 'auto';
	if (!game.settings.settings.has('acdc.rollMode')) return 'auto';
	const mode = game.settings.get('acdc', 'rollMode');
	return ROLL_MODES.includes(mode) ? mode : 'auto';
}

async function setRollMode(mode) {
	if (isCatControllingManualRolls()) {
		if (canToggleCatManualRolls()) await game.settings.set('cat', 'manualRollsEnabled', mode !== 'auto');
		return;
	}
	await game.settings.set('acdc', 'rollMode', mode);
	await game.settings.set('core', Roll.DICE_CONFIGURATION_SETTING, buildDiceConfiguration(mode));
}

function getNextRollMode() {
	const mode = getRollMode();
	if (canToggleCatManualRolls()) return mode === 'auto' ? 'manual' : 'auto';
	const enabledMode = hasSmartRollTypes() ? 'smart' : 'manual';
	return mode === 'auto' ? enabledMode : 'auto';
}

function canToggleCatManualRolls() {
	return game.user.isGM && isCatControllingManualRolls();
}

function isCatControllingManualRolls() {
	if (!game.modules.get('cat')?.active) return false;
	if (!['manualRollsEnabled', 'manualRollsUsers', 'manualRollsInclusion'].every((key) => game.settings.settings.has(`cat.${key}`))) return false;
	return game.settings.get('cat', 'manualRollsEnabled') || (!!game.settings.get('cat', 'manualRollsUsers')?.length && game.settings.get('cat', 'manualRollsInclusion') > 0);
}

Hooks.on('updateSetting', (setting) => {
	if (['cat.manualRollsEnabled', 'cat.manualRollsUsers', 'cat.manualRollsInclusion'].includes(setting.key) && ui.controls?.rendered) {
		ui.controls.render({ reset: true });
	}
});

function buildDiceConfiguration(mode) {
	const config = foundry.utils.deepClone(game.settings.get('core', Roll.DICE_CONFIGURATION_SETTING) ?? {});
	config.default = mode === 'auto' ? '' : 'manual';
	return config;
}

function hasManualFulfillmentDice(config) {
	return config?.default === 'manual' || Object.keys(CONFIG.Dice.fulfillment.dice).some((dice) => config?.[dice] === 'manual');
}

function shouldUseManualResolver(roll, term) {
	if (!(term.denomination in CONFIG.Dice.fulfillment.dice)) return getManualNonRegisteredDenominations();
	const rollType = getRollType(roll, term);
	if (rollType) return getManualRollTypes().has(rollType);
	return false;
}

function getManualRollTypes() {
	const rollTypes = game.settings.get('acdc', 'manualRollTypes');
	return rollTypes instanceof Set ? rollTypes : new Set(Array.isArray(rollTypes) ? rollTypes : []);
}

function hasSmartRollTypes() {
	return !!getManualRollTypes().size || getManualNonRegisteredDenominations();
}

function getRollType(roll, term) {
	for (const [rollType, { test }] of SMART_ROLL_TYPES) {
		if (test?.(roll, term)) return rollType;
	}
	return '';
}

function getManualNonRegisteredDenominations() {
	return game.settings.get('acdc', 'manualNonRegisteredDenominations');
}

function getSmartRollTypeChoices() {
	return Object.fromEntries([...SMART_ROLL_TYPES].map(([rollType, { label }]) => [rollType, { label }]));
}

function registerSmartRollType({ id, label, test }) {
	SMART_ROLL_TYPES.set(id, { label, test });
	const setting = game.settings.settings.get('acdc.manualRollTypes');
	if (setting) setting.config = true;
}

Hooks.once('init', () => {
	game.modules.get('acdc').api = ACDC_API;
	registerDND5eIntegration(ACDC_API);
	Hooks.callAll('acdcRegisterSmartRollTypes', ACDC_API);
	registerSmartRollResolver();

	game.settings.registerMenu('acdc', 'linksMenu', {
		name: 'ACDC.LinksMenu.Name',
		label: 'ACDC.LinksMenu.Label',
		hint: 'ACDC.LinksMenu.Hint',
		icon: 'fa-solid fa-link',
		type: ACDCLinksMenu,
		restricted: false,
	});

	game.settings.register('acdc', 'rollMode', {
		name: 'ACDC.Settings.RollMode.Name',
		hint: 'ACDC.Settings.RollMode.Hint',
		scope: 'client',
		config: false,
		type: String,
		default: 'auto',
		onChange: (mode) => {
			if (!isCatControllingManualRolls()) game.settings.set('core', Roll.DICE_CONFIGURATION_SETTING, buildDiceConfiguration(mode));
		},
	});

	game.settings.register('acdc', 'manualRollTypes', {
		name: 'ACDC.Settings.ManualRollTypes.Name',
		hint: 'ACDC.Settings.ManualRollTypes.Hint',
		scope: 'client',
		config: !!SMART_ROLL_TYPES.size,
		type: new foundry.data.fields.SetField(
			new foundry.data.fields.StringField({
				choices: getSmartRollTypeChoices,
			}),
		),
		default: DEFAULT_SMART_ROLL_TYPES,
	});

	game.settings.register('acdc', 'manualNonRegisteredDenominations', {
		name: 'ACDC.Settings.ManualNonRegisteredDenominations.Name',
		hint: 'ACDC.Settings.ManualNonRegisteredDenominations.Hint',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	});

	game.keybindings.register('acdc', 'keybind', {
		name: 'ACDC.Keybind',
		editable: [{ key: 'KeyB' }],
		restricted: false,
		reservedModifiers: ['Control', 'Shift'],
		onDown: (ctx) => {
			const ev = ctx.event;
			const tokenControlsActive = ui.controls.control?.name === 'tokens';
			if (ev.shiftKey && tokenControlsActive) {
				if (isCatControllingManualRolls()) return false;
				new foundry.applications.settings.menus.DiceConfig().render(true);
				return true;
			}

			// should ctrl+B toggle ACDC mode only when the token controls are active? Worth trying to make it global?
			if (ev.ctrlKey) {
				const btn = document.querySelector('[data-tool="acdc"]');
				if (btn) {
					btn.dispatchEvent(
						new MouseEvent('click', {
							bubbles: true,
							cancelable: true,
						}),
					);
				}
				return true;
			}

			return false;
		},
	});
});

Hooks.once('ready', registerSmartRollResolver);

function registerSmartRollResolver() {
	const rollClasses = new Set([Roll, Roll.defaultImplementation, ...CONFIG.Dice.rolls]);
	for (const RollClass of rollClasses) registerSmartRollResolverFor(RollClass);
}

function registerSmartRollResolverFor(RollClass) {
	if (RollClass._acdcSmartRollResolverPatched) return;
	let descriptor;
	let cls = RollClass;
	while (cls && !descriptor) {
		descriptor = Object.getOwnPropertyDescriptor(cls, 'resolverImplementation');
		cls = Object.getPrototypeOf(cls);
	}
	if (!descriptor) return;

	RollClass._acdcSmartRollResolverPatched = true;
	Object.defineProperty(RollClass, 'resolverImplementation', {
		configurable: true,
		get() {
			const config = game.settings.get('core', Roll.DICE_CONFIGURATION_SETTING);
			if (!isCatControllingManualRolls() && hasManualFulfillmentDice(config) && getRollMode() === 'smart') return SmartRollResolver;
			return descriptor.get.call(this);
		},
	});
}
