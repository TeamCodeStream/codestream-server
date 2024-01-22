const fs = require('fs/promises');
const Fs = require('fs');
const existsSync = require('fs').existsSync;
const path = require('path');
const os = require('os');
const vault = require('node-vault');
const asyncPool = require('tiny-async-pool');

// const US_VAULT_HOST = process.env.US_VAULT_HOST || 'https://vault-prd1a.r10.us.nr-ops.net:8200';
// const BASE_VAULT = process.env.BASE_VAULT_PATH || 'containers/teams/codestream/base/codestream-server/';

// const secrets = [
// 	'BROADCAST_ENGINE_PUBNUB_BLUE_KEY_PUBLISH_KEY',
// 	'BROADCAST_ENGINE_PUBNUB_BLUE_KEY_SECRET_KEY',
// 	'BROADCAST_ENGINE_PUBNUB_BLUE_KEY_SUBSCRIBE_KEY',
// 	'BROADCAST_ENGINE_PUBNUB_GREEN_KEY_PUBLISH_KEY',
// 	'BROADCAST_ENGINE_PUBNUB_GREEN_KEY_SECRET_KEY',
// 	'BROADCAST_ENGINE_PUBNUB_GREEN_KEY_SUBSCRIBE_KEY',
// 	'EMAIL_DELIVERY_SENDGRID_APIKEY',
// 	'ENVIRONMENT_GROUP_SECRETS_REQUEST_AUTH',
// 	'INTEGRATIONS_ASANA_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_ASANA_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_BITBUCKET_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_BITBUCKET_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_DEVOPS_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_DEVOPS_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_GITHUB_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_GITHUB_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_GITLAB_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_GITLAB_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_JIRA_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_JIRA_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_LINEAR_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_LINEAR_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_MSTEAMS_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_MSTEAMS_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_MSTEAMS_CLOUD_BOT_APP_ID',
// 	'INTEGRATIONS_MSTEAMS_CLOUD_BOT_APP_PASSWORD',
// 	'INTEGRATIONS_NEWRELICGROK_CLOUD_API_KEY',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_ACCOUNT_NUMBER',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_BROWSER_INGEST_KEY',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_LICENSE_INGEST_KEY',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_TELEMETRY_ENDPOINT',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_WEBVIEW_AGENT_ID',
// 	'INTEGRATIONS_NEWRELIC_CLOUD_WEBVIEW_APP_ID',
// 	'INTEGRATIONS_NEW_RELIC_IDENTITY_CLOUD_NEW_RELIC_CLIENT_ID',
// 	'INTEGRATIONS_NEW_RELIC_IDENTITY_CLOUD_NEW_RELIC_CLIENT_SECRET',
// 	'INTEGRATIONS_NEW_RELIC_IDENTITY_CLOUD_PASSWORD_KEY',
// 	'INTEGRATIONS_NEW_RELIC_IDENTITY_CLOUD_USER_SERVICE_SECRET',
// 	'INTEGRATIONS_SLACK_CLOUD_APP_CLIENT_ID',
// 	'INTEGRATIONS_SLACK_CLOUD_APP_CLIENT_SECRET',
// 	'INTEGRATIONS_SLACK_CLOUD_APP_ID',
// 	'INTEGRATIONS_SLACK_CLOUD_APP_SIGNING_SECRET',
// 	'INTEGRATIONS_TRELLO_CLOUD_APP_CLIENT_ID',
// 	'TELEMETRY_SEGMENT_TOKEN',
// 	'TELEMETRY_SEGMENT_WEB_TOKEN',
// 	'UNIVERSAL_SECRETS_TELEMETRY'
// ];

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
