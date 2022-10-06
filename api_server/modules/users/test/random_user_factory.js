// provide a factory for creating random users, for testing purposes

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

// utility class to actually handle the registration and confirmation as needed
class _UserCreator {

	constructor (factory) {
		this.factory = factory;
	}

	// create a registered and confirmed user
	createUser (data, callback) {
		this.data = data;
		BoundAsync.series(this, [
			this._registerUser,
			this._confirmUser
		], (error) => {
			callback(
				error,
				{
					user: this.user,
					accessToken: this.token,
					broadcasterToken: this.broadcasterToken,
					password: this.data.password
				}
			);
		});
	}

	// register a user by issuing a POST /no-auth/register request
	_registerUser (callback) {
		this.factory.apiRequester.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				callback(null, { user: this.user });
			}
		);
	}

	// register a user with the given data
	registerUser (data, callback) {
		this.data = data;
		this._registerUser(callback);
	}

	// confirm a user registration by issuing a POST /no-auth/confirm request
	_confirmUser (callback, options = {}) {
		let data = {
			email: this.user.email,
			confirmationCode: this.user.confirmationCode
		};
		this.factory.apiRequester.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data,
				requestOptions: {
					headers: options.headers || {}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				this.token = response.accessToken;
				this.broadcasterToken = response.broadcasterToken;
				callback();
			}
		);
	}

	// confirm registration for a given user
	confirmUser (user, callback, options = {}) {
		this.user = user;
		this._confirmUser(callback, options);
	}
}

// We use a pool of UUIDs for interacting with PubNub during unit testing ...
// this is to avoid using the actual IDs of the users we are creating, which would
// mean a new UUID for every created user, every time ... since we are billed per
// user, that would be bad...
let _NextPubnubUuid = 0;

class RandomUserFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// generate a random email
	randomEmail (options = {}) {
		const domain = options.wantWebmail ? 'gmail' : RandomString.generate(12);
		return `somebody.${RandomString.generate(12)}@${domain}.com`;
	}

	// generate random data for a user with a first and last name
	randomNamedUser () {
		return {
			email: this.randomEmail(),
			fullName: this.randomFullName()
		};
	}

	// generate a random full name
	randomFullName () {
		return `${RandomString.generate(8)} ${RandomString.generate(10)}`;
	}
	
	// get some random data to use for creating a user, with options specified
	getRandomUserData (options = {}) {
		let email = this.randomEmail(options);
		let fullName = this.randomFullName();
		let timeZone = 'America/New_York';
		let _forceConfirmation = 1;	// force confirmation, even if environment settings have it turned off
		let data = { email, fullName, timeZone, _forceConfirmation, _confirmationCheat: options.confirmationCheat };
		if (options.timeout) {
			data.timeout = options.timeout;
		}
		if (!options.noPassword) {
			data.password = RandomString.generate(12);
		}
		if (options.username) {
			data.username = options.username;
		}
		else if (!options.noUsername) {
			data.username = RandomString.generate(12);
		}
		if (options.wantLink) {
			throw 'wantLink is deprecated';
			/*
			data.wantLink = true;
			if (options.expiresIn) {
				data.expiresIn = options.expiresIn;
			}
			*/
		}
		Object.assign(data, options.with || {});
		data._pubnubUuid = this.getNextPubnubUuid();
		return data;
	}

	getNextPubnubUuid () {
		_NextPubnubUuid = (_NextPubnubUuid + 1) % 100;
		return `TEST-UUID-${_NextPubnubUuid}`;
	}

	// create a registered and confirmed user, given user data
	createUser (data, callback) {
		new _UserCreator(this).createUser(data, callback);
	}

	// create a random user, generating random data with options specified
	createRandomUser (callback, options = {}) {
		let data = this.getRandomUserData(options);
		if (options.noConfirm) {
			// only register, no confirm
			new _UserCreator(this).registerUser(data, callback);
		}
		else {
			// make them fully confirmed
			new _UserCreator(this).createUser(data, callback);
		}
	}

	// create a random user who is not yet confirmed
	registerRandomUser (callback, options = {}) {
		let data = this.getRandomUserData(options);
		new _UserCreator(this).registerUser(data, callback);
	}

	// create a single random user in a series
	createRandomNthUser (n, callback, options = {}) {
		this.createRandomUser(callback, options);
	}

	// create several random users
	createRandomUsers (howmany, callback, options = {}) {
		BoundAsync.times(
			this,
			howmany,
			(n, timesCallback) => {
				this.createRandomNthUser(n, timesCallback, options);
			},
			callback
		);
	}

	// register the user given some user data
	registerUser (user, callback) {
		new _UserCreator(this).registerUser(user, callback);
	}

	// confirm registration of a user given some user data
	confirmUser (user, callback, options = {}) {
		new _UserCreator(this).confirmUser(user, callback, options);
	}
}

module.exports = RandomUserFactory;
