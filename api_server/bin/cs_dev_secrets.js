#!/usr/bin/env node

const shellescape = require('shell-escape');
const { readVaultDevSecrets } = require('../../shared/server_utils/dev_secrets');

async function main() {
	const env = await readVaultDevSecrets();
	for (const key in env) {
		console.log(`export ${key}=${shellescape([env[key]])}`);
	}
}

(async () => {
	try {
		await main();
	} catch (e) {
		console.error('Error', e);
	}
	process.exit();
})();
