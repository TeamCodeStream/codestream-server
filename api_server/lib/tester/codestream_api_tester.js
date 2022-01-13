// Herein we define a CodeStream API Tester class
// This class manages running API Server Tests against a CodeStream API Server, and validating results

'use strict';

const ApiConfig = require('../../config/config');
const RandomUserFactory = require('../../modules/users/test2/random_user_factory');

class CodeStreamApiTester {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
	}

	// before the test is run, do setup for the test
	async before () {
		// get our configuration, storing it in the master cache so it is accessible to all tests
		// from here on out
		const config = await this.getConfig();

		// get the API Requester, which handles actually sending the requests to the API Server
		const testData = this.testRunner.getTestData();
		const apiRequester = testData.getCacheItem('apiRequester');

		// instantiate a "random user factory", responsible for creating any users needed for the test
		this.userFactory = new RandomUserFactory({ 
			apiRequester: apiRequester,
			confirmationCheat: config.sharedSecrets.confirmationCheat
		});

		// set connection options for the API Requester, based on environment and configuration
		apiRequester.setConnectionOptions({
			protocol: 'https',
			host: process.env.CS_API_TEST_SERVER_HOST || config.apiServer.publicApiUrlParsed.host,
			port: process.env.CS_API_TEST_SERVER_PORT || (process.env.CS_API_TEST_SERVER_HOST && "443") || config.apiServer.port
		});

		// set headers associated with CodeStream API calls, based on test options
		this.setCodeStreamRequestHeaderOptions();

		// do the test setup, creating needed items in the database for running the test
		return this.setup();
	} 

	// get the current CodeStream config, loading it and saving it as needed
	async getConfig () {
		// we pull the config from the master cache, which is available to all tests,
		// if it doesn't exist, load it and save it to the master cache
		const testData = this.testRunner.getTestData();
		let config = testData.getCacheItem('config');
		if (!config) {
			config = await ApiConfig.loadPreferredConfig();
			testData.setCacheItem('config', config);
		}
		return config;
	}
	
	// make header options to go out with the API request, based on test options
	// for the particular test that will be running
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

	// do test setup for the test ... tests say what the need (registered users, standard teams, etc.)
	// and the setup creates what is needed on demand ... the data created then becomes available
	// for all subsequent tests
	async setup () {
		const { needRegisteredUsers } = this.testOptions;
		
		// setup registered users, as needed
		if (needRegisteredUsers) {
			await this.setupRegisteredUsers();
		}
	}

	// return the access token to supply with the test request, as determined by test options
	getRequestToken () {
		if (this.testOptions.suppressToken) {
			return;
		} else if (this.testOptions.sendInvalidToken) {
			return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
		} 

		// registered users are stored in the master data cache, and one will be defined as
		// the "current" one ... use that user's access token 
		const testData = this.testRunner.getTestData();
		const userData = testData.findOneByTag('users', 'currentUser');
		if (userData) {
			let token = userData.accessToken;

			// tests can define a "token hook", which might munge the token for particular tests
			if (this.testOptions.tokenHook) {
				token = this.testOptions.tokenHook(token, {
					testRunner: this.testRunner,
					codeStreamTester: this
				});
			}
			return token;
		}
	}

	// setup any registered users needed for the test
	async setupRegisteredUsers () {
		const { needRegisteredUsers } = this.testOptions;
		const testData = this.testRunner.getTestData();

		// if we already have all the registered users we need, don't do anything
		const existingUsers = testData.findAllByTag('users', 'registered');
		const needUsers = needRegisteredUsers - existingUsers.length;
		if (needUsers.length <= 0) {
			return;
		}

		// create as many "random" registered users as we need to coomplete the test, in parallel
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

	// utility to run an async function N times, in parallel
	async promiseN (n, fn) {
		// not at all elegant, but i couldn't find a better way to do it
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


