'use strict';

const ApiConfig = require('../../config/config');
const RandomUserFactory = require('../../modules/users/test2/random_user_factory');

class CodeStreamApiTester {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
	}

	async before () {
		const config = await this.getConfig();

		const testData = this.testRunner.getTestData();
		const apiRequester = testData.getCacheItem('apiRequester');

		this.userFactory = new RandomUserFactory({ 
			apiRequester: apiRequester,
			confirmationCheat: config.sharedSecrets.confirmationCheat
		});

		apiRequester.setOptions({
			protocol: 'https',
			host: process.env.CS_API_TEST_SERVER_HOST || config.apiServer.publicApiUrlParsed.host,
			port: process.env.CS_API_TEST_SERVER_PORT || (process.env.CS_API_TEST_SERVER_HOST && "443") || config.apiServer.port
		});

		this.setCodeStreamRequestHeaderOptions();

		return this.setup();
	} 

	async getConfig () {
		const testData = this.testRunner.getTestData();
		let config = testData.getCacheItem('config');
		if (!config) {
			config = await ApiConfig.loadPreferredConfig();
			testData.setCacheItem('config', config);
		}
		return config;
	}
	
	// make header options to go out with the API request
	setCodeStreamRequestHeaderOptions () {
		const { 
			reallySendEmails,
			reallySendMessages,
			reallyTrack,
			testEmails,
			testTracking,
			trackOnChannel
		} = this.testOptions;
		const requestOptions = this.testOptions.requestOptions = this.testOptions.requestOptions || {};
		this.testOptions.requestOptions.headers = this.testOptions.requestOptions.headers || {};

		if (!reallySendEmails) {
			// since we're just doing testing, block actual emails from going out
			requestOptions.headers['X-CS-Block-Email-Sends'] = true;
		}
		if (!reallySendMessages) {
			// since we're just doing testing, block actual messages from going out over the broadcaster
			requestOptions.headers['X-CS-Block-Message-Sends'] = true;
		}
		if (!reallyTrack) {
			// since we're just doing testing, block analytics tracking
			requestOptions.headers['X-CS-Block-Tracking'] = true;
		}
		if (testEmails) {
			// we're doing email testing, block them from being sent but divert contents
			// to a pubnub channel that we'll listen on
			requestOptions.headers['X-CS-Test-Email-Sends'] = true;
		}
		if (testTracking) {
			// we're doing analytics tracking testing, block the tracking from being sent
			// but divert contents to a pubnub channel that we'll listen on
			requestOptions.headers['X-CS-Test-Tracking'] = true;
		}
		if (trackOnChannel) {
			// if a special channel is specified for tracking testing, use that
			requestOptions.headers['X-CS-Track-Channel'] = trackOnChannel;
		}
		requestOptions.headers['X-CS-Test-Num'] = `API-${this.testRunner.getTestNum()}`;	// makes it easy to log requests associated with particular tests
	}

	async setup () {
		const { needRegisteredUsers } = this.testOptions;
		
		if (needRegisteredUsers) {
			await this.setupRegisteredUsers();
		}
	}

	getRequestToken () {
		if (this.testOptions.suppressToken) {
			return;
		} else if (this.testOptions.sendInvalidToken) {
			return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
		} 

		const testData = this.testRunner.getTestData();
		const userData = testData.findOneByTag('users', 'currentUser');
		if (userData) {
			let token = userData.accessToken;
			if (this.testOptions.tokenHook) {
				token = this.testOptions.tokenHook(token, {
					testRunner: this.testRunner,
					codeStreamTester: this
				});
			}
			return token;
		}
	}

	async setupRegisteredUsers () {
		const { needRegisteredUsers } = this.testOptions;
		const testData = this.testRunner.getTestData();

		const existingUsers = testData.findAllByTag('users', 'registered');
		const needUsers = needRegisteredUsers - existingUsers.length;
		if (needUsers.length <= 0) {
			return;
		}

		await this.promiseN(needUsers, async () => {
			const userResponse = await this.userFactory.createRandomUser();
			testData.addToCollection(
				'users',
				userResponse,
				{
					tagIfFirst: 'currentUser',
					tag: 'registered'
				}
			);
		});
	}

	async promiseN (n, fn) {
		const a = [];
		for (let i = 0; i < n; i++) { 
			a.push(1); 
		}
		return Promise.all(a.map(async _ => {
			await fn();
		}))
	}
}

module.exports = CodeStreamApiTester;


