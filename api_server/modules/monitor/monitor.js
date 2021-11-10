'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
//const NewRelic = require('newrelic');
//const FS = require('fs');
//const ChildProcess = require("child_process");

class NewRelicModule extends APIServerModule {

	services () {
		return; // disable pending license key availability
		return async () => {
			this.newrelic = NewRelic;

			const custom = {
				service: 'api',
				csEnvironment: this.api.config.sharedGeneral.runTimeEnvironment
			};
			this.newrelic.addCustomAttributes(custom);

			return { newrelic: this.newrelic };
		};
	}

	/*
	async readCommitSha () {
		const sha = await this.readCommitShaFromServerInfo();
		if (sha) {
			return sha;
		}

		this.api.log('Unable to read api-server info, retrieving commit SHA from git instead...');
		return this.readCommitShaFromGit();
	}

	async readCommitShaFromServerInfo () {
		const path = process.env.CSSVC_BACKEND_ROOT + '/api_server/api-server.info';

		let data;
		try {
			const apiServerInfo = await FS.readFile(path);
			if (!apiServerInfo) { 
				return; 
			}
			data = JSON.parse(apiServerInfo);
		}
		catch (error) {
			return;
		}

		if (
			typeof data.repoCommitId === 'object' &&
			data.primaryRepo &&
			data.repoCommitId[data.primaryRepo]
		) {
			return data.repoCommitId[data.primaryRepo];
		} 
	}

	async readCommitShaFromGit () {
		return new Promise((resolve, reject) => {
			ChildProcess.exec('git rev-parse HEAD', (error, stdout) => {
				if (error) reject(error);
				resolve(stdout);
			});
		});
	}
	*/
}

module.exports = NewRelicModule;
