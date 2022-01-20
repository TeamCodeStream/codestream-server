// Herein we define a CodeStream API Tester class
// This class manages running API Server Tests against a CodeStream API Server, and validating results

'use strict';

const ApiConfig = require('../../config/config');
const RandomUserFactory = require('../../modules/users/test2/random_user_factory');
const RandomCompanyFactory = require('../../modules/companies/test/random_company_factory');
const Assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const DeepEqual = require('deep-equal');

const DEFAULT_TEST_TIME_TOLERANCE = 3000;
const COMMAND_REGEX_STR = '{{{\\s*(.*?)\\s*(?:\\((.*?)\\))?\\s*}}}';
const COMMAND_REGEX_MATCH = new RegExp(COMMAND_REGEX_STR);
const COMMAND_REGEX_GLOBAL = new RegExp(COMMAND_REGEX_STR, 'g');

class CodeStreamApiTester {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
		this.testOptions.testTimeTolerance = DEFAULT_TEST_TIME_TOLERANCE;
		this.localCache = {};
	}

	// before the test is run, do setup for the test
	async before () {
		// get our configuration, storing it in the master cache so it is accessible to all tests
		// from here on out
		const config = await this.getConfig();

		// get the API Requester, which handles actually sending the requests to the API Server
		const testData = this.testRunner.getTestData();
		const apiRequester = testData.getCacheItem('apiRequester');

		// instantiate factories, responsible for creating objects needed for the test
		this.userFactory = new RandomUserFactory({ 
			apiRequester: apiRequester,
			confirmationCheat: config.sharedSecrets.confirmationCheat
		});
		this.companyFactory = new RandomCompanyFactory({
			apiRequester: apiRequester
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
		await this.setup();

		// cache any data we need for the test locally
		await this.cacheLocalData();

		// fill in test options based on setup data created
		return this.evalTestOptions();		
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

	// do test setup for the test ... tests say what the need (registered users, standard companies, etc.)
	// and the setup creates what is needed on demand ... the data created then becomes available
	// for all subsequent tests
	async setup () {
		const {
			needRegisteredUsers,
			needUnregisteredUsers,
			needStandardCompanies
		} = this.testOptions;
		

		// setup unregistered users, as needed
		if (needUnregisteredUsers) {
			await this.setupUnregisteredUsers();
		}

		// setup registered users, as needed
		if (needRegisteredUsers) {
			await this.setupRegisteredUsers();
		}

		// setup standard companies, as needed
		if (needStandardCompanies) {
			await this.setupStandardCompanies();
		}
	}

	// cache any data we need for the test locally, so we don't have to go find it in the master cache
	// every time we need to refer to it
	async cacheLocalData () {
		const { cacheLocal } = this.testOptions;
		if (typeof cacheLocal !== 'object') { return; }

		Object.keys(cacheLocal).forEach(key => {
			this.cacheLocalItem(key, cacheLocal[key]);
		});
	}

	// cache an item we need for the test locally, so we don't have to go find it in the master cache
	// every time we need to refer to it
	async cacheLocalItem (name, info) {
		const [ collection, tag, field ] = info;
		if (!collection || !tag) {
			throw new Error(`cacheLocal must have at least 2 arguments: collection, tag`);
		}
		const item = this.testRunner.getTestData().findOneByTag(collection, tag);
		if (!item) {
			throw new Error(`cacheLocal could not fetch an item from collection ${collection} for tag ${tag}`);
		}

		const value = this.extractValue(item, field);
		this.localCache[name] = value;
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
		const user = testData.findOneByTag('users', 'currentUser');
		if (user) {
			let token = user.__response.accessToken;

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

	// setup any unregistered users needed for the test
	async setupUnregisteredUsers () {
		const { needUnregisteredUsers } = this.testOptions;
		const testData = this.testRunner.getTestData();

		// if we already have all the unregistered users we need, don't do anything
		const existingUsers = testData.findAllByTag('users', 'unregistered');
		const needUsers = needUnregisteredUsers - existingUsers.length;
		if (needUsers.length <= 0) {
			return;
		}

		// create as many "random" unregistered users as we need to coomplete the test, in parallel
		await this.promiseN(needUsers, async () => {
			await this.createUnregisteredUser();
		});
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

		// create as many "random" registered users as we need to complete the test, in parallel
		await this.promiseN(needUsers, async () => {
			await this.createRegisteredUser(true)
		});
	}

	// create a user, storing in the master cache
	async createUser (options = {}) {
		const testData = this.testRunner.getTestData();

		// users can be created as registered or unregistered, or via an invite to a team 
		// (in which case the created user is unregistered until registering) 
		let userResponse;
		let data = {};
		if (options.useEmail) {
			data.email = options.useEmail;
		}
		if (options.inviteToTeamId) {
			userResponse = await this.userFactory.inviteRandomUser({ ...data, teamId: options.inviteToTeamId });
		} else {
			userResponse = await this.userFactory.createRandomUser(data, { noConfirm: !options.registered });
		}

		// hide the response in the user object
		const extra = { ...userResponse };
		delete extra.user;
		const user = { ...userResponse.user, __response: extra };

		// add any tags needed (always add "registered" tag for registered users, and delete their "unregistered" tag
		// if they already exist)
		const addTags = [...(options.additionalTags || [])];
		const deleteTags = [];
		if (options.registered) {
			addTags.push('registered');
			deleteTags.push('unregistered');
		}

		// merge this user into the users collection in the master cache
		// make the first user the "current user" (the user who will perform the test request) as needed
		testData.mergeToCollection(
			'users',
			user,
			{
				addTagIfFirst: options.tagAsCurrentIfFirst && 'currentUser',
				addTags,
				deleteTags
			}
		);

		return userResponse;
	}

	// create a registered user, storing in the master cache
	async createRegisteredUser (options = {}) {
		return this.createUser({
			registered: true,
			tagAsCurrentIfFirst: true,
			additionalTags: options.additionalTags
		});
	}

	// create an unregistered user, storing in the master cache
	async createUnregisteredUser (options = {}) {
		return this.createUser(options);
	}

	// invite a user, storing in the master cache
	async inviteUser (options = {}) {
		return this.createUser({
			inviteToTeamId: options.teamId,
			additionalTags: options.additionalTags
		});
	}

	// create a company, storing in the master cache
	async createCompany (tags = []) {
		const companyResponse = await this.companyFactory.createRandomCompany();
		testData.mergeToCollection(
			'companies',
			companyResponse.company,
			{
				addTags: tags
			}
		);
		testData.mergeToCollection(
			'teams',
			companyResponse.team,
			{
				addTags: tags
			}
		);
		testData.mergeArrayToCollection(
			'streams',
			companyResponse.streams,
			{
				addTags: tags
			}
		);
		return companyResponse;
	}

	// setup standard companies, giving us a sampling of user types, as needed
	async setupStandardCompanies () {
		const { needStandardCompanies} = this.testOptions;
		const testData = this.testRunner.getTestData();

		// if we already have all the standard companies we need, don't do anything
		const existingCompanies = testData.findAllByTag('standard');
		const needCompanies = needStandardCompanies - existingCompanies.length;
		if (needCompanies.length <= 0) {
			return;
		}

		// create as many "random" standard companies as we need to complete the test, in parallel
		await this.promiseN(needCompanies, async n => {
			await this.createStandardCompany();
		});
	}

	// create a "standard" company:
	//  - three registered users, one of whom will be tagged as the current user, and one as the company creator
	//  - two unregistered (invited) users
	async createStandardCompany (options = {}) {
		const testData = this.testRunner.getTestData();
		testData.untagAll('users', 'currentUser'); // we'll create a new current user

		// create a user to create a company...
		const companyCreator = await this.createRegisteredUser({ additionalTags: ['companyCreator'] });
		const companyResponse = await this.createCompany(['standard']);

		// invite 4 more users, and register two of them, making the first one the "current" user
		await this.promiseN(4, async n => {
			await this.inviteUser({
				teamId: companyResponse.team.id,
				token: companyCreator.user.accessToken
			});

			if (n < 2) {
				await this.createRegisteredUser({
					tagIfFirst: 'currentUser'
				});
			}
		});
	}

	// utility to run an async function N times, in parallel
	async promiseN (n, fn) {
		// not at all elegant, but i couldn't find a better way to do it
		const a = [];
		for (let i = 0; i < n; i++) { 
			a.push(i); 
		}
		return Promise.all(a.map(async n => {
			await fn(n);
		}))
	}

	// evaluate test options and substitute hard data as needed
	async evalTestOptions () {
		await this.evalRequestData();
	}

	// evaluate input data for the test request and substitute hard data as needed
	async evalRequestData () {
		const { data } = this.testOptions.request;
		if (!data) { return; }

		this.testOptions.request.data = this.evalRequestDataPart(data);
	}

	// evaluate a piece of request data for the test request and substitute hard data as needed
	evalRequestDataPart (data) {
		if (data instanceof Array) {
			const len = data.length;
			for (let i = 0; i < len; i++) {
				data[i] = this.evalRequestDataPart(data[i]);
			}
		} else if (typeof data === 'object') {
			for (let key in data) {
				data[key] = this.evalRequestDataPart(data[key]);
			}
		} else if (typeof data === 'string') {
			return this.evalRequestDataString(data);
		}
		return data;
	}

	// evaluate a string in the request data for the test request and substitute hard data as needed
	// this is the "meat" of the evaluation, for the strings will contain various instructions to dynamically
	// fill the data
	evalRequestDataString (str) {
		// extract embedded instructions
		return str.replace(COMMAND_REGEX_GLOBAL, (match, command, args) => {
			if (args) {
				args = args.split(',').map(arg => arg.trim());
			}
			return this.evalRequestDataCommand(command, args);
		});
	}

	// evaluate a substitution command within the request data for the test request, 
	// and substitute hard data from test setup data
	evalRequestDataCommand (command, args) {
		switch (command) {
			case 'randomEmail':
				return this.userFactory.randomEmail();
			case 'randomUsername':
				return this.userFactory.randomUsername();
			case 'randomPassword':
				return this.userFactory.randomPassword();
			case 'testOptions':
				return this.evalRequestDataTestOptions(args);
			case 'fromCache':
				return this.evalRequestDataFromCache(args);
			case 'fromLocalCache':
				return this.retrieveFromLocalCache(args);
			default:
				throw new Error(`unknown command in request data substitution: ${command}`);
		}
	}

	// evaluate a substitition command calling for information from the test options
	evalRequestDataTestOptions (args) {
		if (!args) {
			throw new Error(`testOptions command must have arguments`);
		}
		const [field] = args;
		return this.testOptions[field];
	}

	// evaluate a substitution command calling for data from the data cache, by tag
	evalRequestDataFromCache (args) {
		const [ collection, tag, field ] = args;
		if (!collection || !tag || !field) {
			throw new Error(`fromCache command requires 3 arguments`);
		}

		const item = this.testRunner.getTestData().findOneByTag(collection, tag);
		if (!item) {
			throw new Error(`fromCache command of ${tag} from ${collection} returned no item`);
		}

		return this.extractValue(item, field, `item retrieved from cache (${tag} from ${collection})`);
	}

	// retrieve a value from our local cache, given a field specifier
	retrieveFromLocalCache (args) {
		const [ field ] = args;
		if (!field) {
			throw new Error(`field must be specified to retrieve from local cache`);
		}
		return this.extractValue(this.localCache, field);
	}

	// retrieve a value from our local cache, and increment it, given a field specifier and optional increment
	incrementFromLocalCache (args) {
		const [ field, add = 1 ] = args;
		const value = this.retrieveFromLocalCache(args);
		if (typeof value !== 'number') {
			throw new Error(`field ${field} must be a number to increment`);
		}
		if (typeof add !== 'number') {
			throw new Error(`increment value ${add} must be a number`);
		}
		return value + add;
	}

	// extract a value from an item, given a field specifier
	extractValue (item, field, desc) {
		const fields = field.split('.');
		const traveledFields = [];
		let subItem = item;
		while (fields[0]) {
			traveledFields.push(fields[0]);
			if (fields.length === 1) {
				return subItem[fields[0]];
			} else if (typeof subItem[fields[0]] !== 'object') {
				throw new Error(`${desc} does not contain a sub-item ${traveledFields})`)
			} else {
				subItem = subItem[fields[0]];
				fields.shift();
			}
		}
		throw new Error(`cannot extract value, field specifier is malformed: ${field}`);
	}

	// evlauate a substitution command calling for data from the data cache, by tag, and 
	// incrementing it
	evalRequestDataIncrementFromCache (args) {
		const [ collection, tag, field ] = args;
		const value = this.evalRequestDataFromCache(args);
		if (typeof value !== 'number') {
			throw new Error(`value retrieved from cache (${tag}:${field} from ${collection}) must be a number to be incremented`);
		}

		const add = args[3] || 1;
		return value + add;
	}

	// validate response data to a test request, performing hard data substitution as needed,
	// based on test setup data
	async validateResponseData (actualResponse, expectedResponse) {
		const errors = [];
		expectedResponse = this.validateResponseDataPart(actualResponse, expectedResponse, errors, '__response__', actualResponse);
		if (errors.length > 0) {
			Assert.fail(`response data not correct:\n${errors.join('\n')}`);
		} else {
			Assert.deepStrictEqual(actualResponse, expectedResponse, `
response data not correct:\n\n
ACTUAL:\n${JSON.stringify(actualResponse), 0, 10}\n\n
EXPECTED:\n${JSON.stringify(expectedResponse, 0, 10)}
`);
		}
	}

	// validate error response data to a test request, performing hard data substitution as needed.
	// based on test setup data
	async validateErrorResponseData (actualResponse, expectedResponse) {
		const errors = [];
		expectedResponse = this.validateResponseDataPart(actualResponse, expectedResponse, errors, '__response__', actualResponse);

		if (errors.length > 0) {
			Assert.fail(`error response data not correct:\n${errors.join('\n')}`);
		} else {
			Assert.deepStrictEqual(actualResponse, expectedResponse, `
error response data not correct:\n\n
ACTUAL:\n${JSON.stringify(actualResponse), 0, 10}\n\n
EXPECTED:\n${JSON.stringify(expectedResponse, 0, 10)}
`);
		}
	}

	// validate a part of the response data to a test request, performing hard data substitution as needed,
	// based on test setup data
	validateResponseDataPart (actualData, expectedData, errors, name, siblingObject) {
		if (expectedData instanceof Array) {
			if (!(actualData instanceof Array)) {
				errors.push(`${name} is not an array`);
			} else if (actualData.length !== expectedData.length) {
				errors.push(`${name} has ${actualData.length} elements, expected ${expectedData.length}`);
			}
			const len = actualData.length;
			for (let i = 0; i < len; i++) {
				expectedData[i] = this.validateResponseDataPart(actualData[i], expectedData[i], errors, `${name}[${i}]`, actualData);
			}
		} else if (typeof expectedData === 'object') {
			if (typeof actualData !== 'object') {
				errors.push(`${name} is not an object`);
			} else {
				for (let key in expectedData) {
					expectedData[key] = this.validateResponseDataPart(actualData[key], expectedData[key], errors, `${name}.${key}`, actualData);
					if (expectedData[key] === undefined) {
						delete expectedData[key];
					}
				}
			}
		} else if (typeof expectedData === 'string') {
			expectedData = this.validateResponseDataString(actualData, expectedData, errors, name, siblingObject);
		}

		if (!DeepEqual(actualData, expectedData)) {
			errors.push (`\x1b[36m${name}\x1b[31m is incorrect (\x1b[32mactual\x1b[31m, expected):\n
\x1b[32m${JSON.stringify(actualData, 0, 10)}\n
\x1b[31m${JSON.stringify(expectedData, 0, 10)}
`);
		}
		return actualData;
	}

	// validate a string in the expected response data against the actual response, performing hard data
	// substitution as needed before the comparison
	validateResponseDataString (actual, expected, errors, name, siblingObject) {
		let asNumber, asBoolean;
		expected = expected.replace(COMMAND_REGEX_GLOBAL, (match, command, args) => {
			if (args) {
				args = args.split(',');
			}
			const substitute = this.validateResponseDataCommand(command, args, actual, errors, name, siblingObject);
			if (typeof substitute === 'number') {
				asNumber = true;
			} else if (typeof substitute === 'boolean') {
				asBoolean = true;
			}
			return substitute;
		});
		if (asNumber) {
			expected = parseInt(expected, 10);
		} else if (asBoolean) {
			expected = expected === 'true' ? true : false;
		} else if (expected === 'undefined') {
			expected = undefined;
		}

		if (expected && actual !== expected) {
			errors.push(`${name} expected to be "${expected}" but was "${actual}"`);
		} else {
			return expected;
		}
	}

	// evaluate a substitution command within the response data for the test request, 
	// and substitute hard data from test setup data
	validateResponseDataCommand (command, args, actual, errors, name, siblingObject) {
		switch (command) {
			case 'newId':
				return this.validateNewId(actual, errors, name);
			case 'currentTimestamp':
				return this.validateCurrentTimestamp(actual, errors, name);
			case 'sameAs':
				return this.validateSameAs(actual, args, errors, name, siblingObject);
			case 'closeTo':
				return this.validateCloseTo(actual, args, errors, name, siblingObject);
			case 'requestData':
				return this.validateRequestData(actual, args, errors, name);
			case 'testOptions':
				return this.evalRequestDataTestOptions(args);
			case 'fromLocalCache':
				return this.retrieveFromLocalCache(args);
			case 'incrementFromLocalCache':
				return this.incrementFromLocalCache(args);
			default: 
				throw new Error(`unknown command in response data substitution: ${command}`);
		}
	}

	// validate a new ID in the response to the test request
	validateNewId (value, errors, name) {
		if (typeof value !== 'string') {
			errors.push(`${name} is not a string, so is not a valid mongo ID`);
			return;
		}
		try {
			ObjectID(value);
		}
		catch (error) {
			errors.push(`${name} ("${value}") is not a valid mongo ID`);
		}
		return value;
	}

	// validate a "current" timestamp within the response data for the test request,
	// the timestamp should be set to some value shortly after the test was initiated
	validateCurrentTimestamp (value, errors, name) {
		const { testStartedAt, testTimeTolerance } = this.testRunner.testOptions;

		if (typeof value !== 'number') {
			errors.push(`${name} is not a number, so is not a valid timestamp`);
			return;
		}
		if (value < testStartedAt) {
			errors.push(`${name} (${value}) was not set to a timestamp greater than or equal to the time the test was run (${testStartedAt})`);
			return;
		}
		if (value > testStartedAt + testTimeTolerance) {
			errors.push(`${name} (${value}) was set to a timestamp too far ahead of the time the test was run (${testStartedAt})`);
			return;
		}
		return value;
	}

	// validate a value in the response data for the test request, that should be the same
	// as another value from its sibling object
	validateSameAs (actual, args, errors, name, siblingObject) {
		if (!args) {
			throw new Error(`sameAs command for ${name} in expectedResponse must have arguments`);
		}
		const [sameAsValue] = args;
		if (!sameAsValue) {
			throw new Error(`sameAs command for ${name} in expectedResponse must have at least one argument`);
		}

		const expectedValue = siblingObject[sameAsValue];
		if (actual !== expectedValue) {
			errors.push(`${name} was expected to be the same as ${sameAsValue} (${JSON.stringify(expectedValue)}) but was ${JSON.stringify(actual)}`);
		}
		return actual;
	}

	// validate a value in the response data for the test request, that should be nearly 
	// the same as another value from its sibling object, within a specific tolerance (numbers only)
	validateCloseTo (actual, args, errors, name, siblingObject) {
		if (!args) {
			throw new Error(`closeTo command for ${name} in expectedResponse must have arguments`);
		}
		let [closeToValue, tolerance] = args;
		if (!closeToValue) {
			throw new Error(`closeTo command for ${name} in expectedResponse must have at least one argument`);
		}
		tolerance = parseInt(tolerance || '0', 10);
		if (isNaN(tolerance)) {
			throw new Error(`non-numeric tolerance applied to closeTo command for ${name}`);

		}
		const expectedValue = siblingObject[closeToValue];
		if (typeof actual !== 'number') {
			errors.push(`${name} was expected to be a number`);
			return;
		}
		if (typeof expectedValue !== 'number') {
			errors.push(`${name} should be close to ${expectedValue} but ${expectedValue} is not a number`);
			return;
		}
		if (actual < expectedValue - tolerance || actual > expectedValue + tolerance) {
			errors.push(`${name} was expected to be close to ${closeToValue} (${JSON.stringify(expectedValue)}) but was ${JSON.stringify(actual)}`);
		} 

		return actual;
	}

	// validate a value in the response data for the test request, that should be the same
	// as a value in the request data
	validateRequestData (actual, args, errors, name) {
		if (!args) {
			throw new Error(`requestData command for ${name} in expectedResponse must have arguments`);
		}
		const [requestDataValue] = args;
		if (!requestDataValue) {
			throw new Error(`requestData command for ${name} in expectedResponse must have at least one argument`);
		}

		const expectedValue = this.testRunner.testOptions.request.data[requestDataValue];
		if (actual !== expectedValue) {
			errors.push(`${name} was expected to be the same as ${requestDataValue} in the test request (${JSON.stringify(expectedValue)}) but was ${JSON.stringify(actual)}`);
		}
		return actual;
	}
}

module.exports = CodeStreamApiTester;


