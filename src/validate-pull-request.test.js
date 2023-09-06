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

it('should escape "``" in the body', async () => {
	const body = 'This PR adds and publishes documentation for the webhook logs feature.\n' +
		'This is my first time writing the endpoint documentation from scratch, so please be thorough with your reviews. I have tested my changes with the OpenAPI viewer and it rendered OK.\n' +
		'@dankolafa\n' +
		' I have two questions regarding the schema of the response of the API call `GET /hooks/{hookId}/logs/{logId}`:\n' +
		'- what schema does have the `query` object in the `request` object?\n' +
		'- what is the name and type of items in the `headers` array in the `response` object?\n'
	await validatePullRequest(preset, 'refactor: some refactor', body);
});

it('should ignore everything after "---"', async () => {
	const body = 'This PR adds and publishes documentation for the webhook logs feature.\n' +
		'This is my first time writing the endpoint documentation from scratch, so please be thorough with your reviews. I have tested my changes with the OpenAPI viewer and it rendered OK.\n' +
		'@dankolafa\n' +
		'---\n' +
		' I have two questions regarding the schema of the response of the API call `GET /hooks/{hookId}/logs/{logId}`:\n' +
		'- what schema does have the `query` object in the `request` object?\n' +
		'- what is the name and type of items in the `headers` array in the `response` object?\n'
	const res = await validatePullRequest(preset, 'refactor: some refactor', body);
	expect(res).toEqual(
		'refactor: some refactor\n\n' +
		'This PR adds and publishes documentation for the webhook logs feature.\n' +
		'This is my first time writing the endpoint documentation from scratch, so please be thorough with your reviews. I have tested my changes with the OpenAPI viewer and it rendered OK.\n' +
		'@dankolafa'
	)
});

it('should pass revert commit', async () => {
	await validatePullRequest(preset, 'Revert "feat(sdk-apps-modal): added route guards to protect unsaved sdk-apps changes by modal dialog"');
});
