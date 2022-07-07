const path = require('path');
const exec = require('child_process').exec;

async function validateTitle(preset, title) {

    const commitlintpath = path.resolve(__dirname, '../node_modules', '.bin/commitlint');
    const commitlintConfig = path.resolve(__dirname, '../.commitlintrc.js');
    const FAKE_ISSUE = 'CDM-0000';
    let res;
    try {
        res = await new Promise((resolve, reject) => {
            let result = '';
            const child = exec(`echo "${title}\n\n${FAKE_ISSUE}" | ${commitlintpath} --config ${commitlintConfig}`);
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
        throw e
    }
    console.log(res);
    if (res.length) {
        throw res;
    }
}

module.exports = validateTitle


// validateTitle('@integromat/commitlint', 'fix: some commit #5').catch(e => e)
