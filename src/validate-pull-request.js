const path = require('path');
const exec = require('child_process').exec;

function checkDependabot(prInfo) {
	if (!prInfo) {
		return false
	}
	return prInfo.labels.some(label => label.name === 'dependabot' || label.name === 'dependencies')
		|| prInfo.user.login === 'dependabot[bot]'
}

function splitBodyBySeparator(body) {
	const rows = body.split('\n');
	for (const [i, row] of rows.entries()) {
		if (row.startsWith('---')) {
			console.log('body includes separator "---"');
			console.log('\n\n splitting commit message. Everything bellow "___" is not validated');
			rows.splice(i, rows.length - i );
			return rows.join('\n');
		}
	}
	return body;
}
async function validatePullRequest(preset, title, body = '', prInfo) {

    const commitlintpath = path.resolve(__dirname, '../node_modules', '.bin/commitlint');
    const commitlintConfig = path.resolve(__dirname, '../.commitlintrc.js');
    let res;
	if (/".+"/g.test(title)) {
		title = title.replace(/"/g, '\'');
	}
	if (/`/g.test(title)) {
		title = title.replace(/`/g, '\'')
	}
	if (body){
		body = splitBodyBySeparator(body);
		body = body.replace(/`/gm, '\\`');
	}
	if (checkDependabot(prInfo)) {
		body = ''
	}
	const commitMessage = !!body ? `${title}\n\n${body}` : title;

	console.log('============== COMMIT START ==============');
	console.log(commitMessage);
	console.log('============== COMMIT END ==============');
    try {
        res = await new Promise((resolve, reject) => {
            let result = '';
            const child = exec(`echo "${commitMessage}" | ${commitlintpath} --config ${commitlintConfig}`);
            child.stdout.on('data', (data) => {
                if (data) {
                    result += data.trim();
                }
            });

            child.stderr.on('data', (data) => {
                result += data
            });

            child.on('error', (err) => {
                reject(err);
            });

            child.on('close', (code) => {
                resolve(result);
            });
        })
    } catch (e) {
        throw new Error(e);
    }
	console.log("\nlinter response:\n\n", res)
    if (res.length) {
        throw new Error(res);
    }

	return commitMessage;
}

module.exports = validatePullRequest


// validateTitle('@integromat/commitlint', 'fix: some commit #5').catch(e => e)
