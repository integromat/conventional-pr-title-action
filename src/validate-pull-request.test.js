const validatePullRequest = require('./validate-pull-request');
const installPreset = require('./install-preset');

const preset = 'conventional-changelog-angular';

// Install preset (takes some time)
jest.setTimeout(30000);
beforeAll(async () => {
	return new Promise(resolve => {
		resolve(installPreset(preset))
	});
});

it('detects valid PR titles', async () => {
	const inputs = [
		"fix: fix bug\n\nCDM-134",
		"fix: fix bug\n\nCDM-134\n\nBREAKING CHANGE: Fix bug",
		"feat: add feature\n\nCDM-134",
		"feat: add feature\n\nCDM-134\n\nBREAKING CHANGE: Add feature",
		"refactor: internal cleanup"
	];

	for (let index = 0; index < inputs.length; index++) {
		const input = inputs[index].split(`\n\n`);
		const title = input[0];
		input.shift()
		const desc = input.join(`\n\n`);
		await validatePullRequest(preset, title, desc);
	}
});

it('throws for PR titles without a type', async () => {
	let command = validatePullRequest(preset, 'fix bug', 'CDM-1234');
	await expect(command).rejects.toThrow(/subject may not be empty/);
});

it( 'throws error when JIRA issue is missing', async () => {
	let command = validatePullRequest(preset, 'fix: bug');
	await expect(command).rejects.toThrow(/Reference to JIRA issue is missing/);
});

it('throws for PR titles with an unknown type', async () => {
	await expect(validatePullRequest(preset, 'foo: bar')).rejects.toThrow(
		/type must be one of/
	);
});
