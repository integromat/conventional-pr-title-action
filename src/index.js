const {writeFile} = require('fs').promises;
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const installPreset = require('./installPreset');
const validateTitle = require('./validateTitle');

async function prepareConfig(lintConfig) {
	const url = path.join(__dirname, '../.commitlintrc.js');
	await writeFile(url, lintConfig);
	return require(url)
}

async function run() {
	try {
		let contextName = core.getInput('context-name');
		let successState = core.getInput('success-state');
		let failureState = core.getInput('failure-state');
		const lintConfig = core.getInput('lint-config');
		const client = new github.GitHub(process.env.GITHUB_TOKEN);

		const contextPullRequest = github.context.payload.pull_request;
		if (!contextPullRequest) {
			throw new Error(
				"This action can only be invoked in `pull_request` events. Otherwise the pull request can't be inferred."
			);
		}

		const owner = contextPullRequest.base.user.login;
		const repo = contextPullRequest.base.repo.name;

		let error = null;
		try {
			const config = await prepareConfig(lintConfig);
			const installPresetPackage = config.extends[0];
			await installPreset(installPresetPackage + '@latest');
			await validateTitle(installPresetPackage, contextPullRequest.title);
		} catch (err) {
			error = err;
		}

		core.setOutput('success', (error === null).toString());

		let state = 'success';
		let description = successState;
		if (error) {
			state = 'failure';
			description = failureState;
		}

		await client.request(
			'POST /repos/:owner/:repo/statuses/:sha',
			{
				owner,
				repo,
				state,
				description,
				sha: contextPullRequest.head.sha,
				target_url: 'https://github.com/integromat/conventional-commits/tree/master/commitlint',
				context: contextName,
			},
		);

		if (error) {
			throw error;
		} else {
			console.log(`${state}: ${description}`);
		}

	} catch (error) {
		core.setFailed(error.message);
	}
};

run().catch(console.error);
