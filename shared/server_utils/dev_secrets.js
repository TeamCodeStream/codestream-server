const fs = require('fs/promises');
const Fs = require('fs');
const existsSync = require('fs').existsSync;
const path = require('path');
const os = require('os');
const vault = require('node-vault');
const asyncPool = require('tiny-async-pool');


async function readVaultDevSecrets () {
	try {
		const tokenFile = path.join(os.homedir(), '.vault_tokens');
		if (!existsSync(tokenFile)) {
			throw new Error(`Vault token file not found: ${tokenFile}`);
		}

		const tokenData = await fs.readFile(tokenFile, 'utf8');
		const tokens = JSON.parse(tokenData);

		const token = tokens[process.env.US_VAULT_HOST];

		const options = {
			apiVersion: 'v1', // default
			endpoint: process.env.US_VAULT_HOST,
			token,
		};

		const vaultClient = vault(options);

		const env = {};

		async function read (secret) {
			const vaultPath = `${process.env.BASE_VAULT_PATH}${secret}`;
			// console.log('Reading', vaultPath);
			const data = await vaultClient.read(vaultPath);
			// console.debug(JSON.stringify(data, null, 2));
			if (!data) {
				console.warn(`No data found for ${vaultPath}`);
				return;
			}
			const value = data.data.value;
			if (!value) {
				console.warn(`No value found for ${vaultPath}`);
				return;
			}
			env[secret] = value;
		}

		// list of secrets to be read from vault
		const secretsFile = `${process.env.CSSVC_BACKEND_ROOT}/${[process.env.DEV_SECRETS_FILE]}`;
		const secrets = JSON.parse(Fs.readFileSync(secretsFile, 'UTF-8'));

		// Read in parallel from vault to speed things up
		await asyncPool(8, secrets, read);
		return env;
	} catch (e) {
		if ( e.message === 'permission denied') {
			console.error('Permission denied reading valut secrets. Are you logged into vault??');
			process.exit(1);
		}
		throw e;
	}
}

module.exports = {
	readVaultDevSecrets
};
