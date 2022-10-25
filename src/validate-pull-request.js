const path = require('path');
const exec = require('child_process').exec;

async function validatePullRequest(preset, title, body = '') {

    const commitlintpath = path.resolve(__dirname, '../node_modules', '.bin/commitlint');
    const commitlintConfig = path.resolve(__dirname, '../.commitlintrc.js');
    let res;
	if (body){
		body = body.replace(/`/gm, '\\`');
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
}

module.exports = validatePullRequest


// validateTitle('@integromat/commitlint', 'fix: some commit #5').catch(e => e)
