'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class _UserCreator {

	constructor (factory) {
		this.factory = factory;
	}

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
					accessToken: this.token
				}
			);
		});
	}

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

	registerUser (data, callback) {
		this.data = data;
		this._registerUser(callback);
	}

	_confirmUser (callback) {
		let data = {
			userId: this.user._id,
			email: this.user.email,
			confirmationCode: this.user.confirmationCode
		};
		this.factory.apiRequester.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				this.token = response.accessToken;
				callback();
			}
		);
	}

	confirmUser (user, callback) {
		this.user = user;
		this._confirmUser(callback);
	}
}

class RandomUserFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	randomEmail () {
		return `somebody.${RandomString.generate(12)}@${RandomString.generate(12)}.com`;
	}

	randomNamedUser () {
		return {
			email: this.randomEmail(),
			firstName: RandomString.generate(10),
			lastName: RandomString.generate(10)
		};
	}
	
	getRandomUserData (options = {}) {
		let email = this.randomEmail();
		let secondaryEmails = [
			this.randomEmail(),
			this.randomEmail()
		];
		let firstName = RandomString.generate(10);
		let lastName = RandomString.generate(10);
		let _confirmationCheat = SecretsConfig.confirmationCheat;
		let _forceConfirmation = 1;
		let data = { email, secondaryEmails, firstName, lastName, _confirmationCheat, _forceConfirmation };
		if (options.timeout) {
			data.timeout = options.timeout;
		}
		if (!options.noPassword) {
			data.password = RandomString.generate(12);
		}
		if (!options.noUsername) {
			data.username = RandomString.generate(12);
		}
		Object.assign(data, options.with || {});
		return data;
	}

	createUser (data, callback) {
		new _UserCreator(this).createUser(data, callback);
	}

	createRandomUser (callback, options = {}) {
		let data = this.getRandomUserData(options);
		if (options.noConfirm) {
			new _UserCreator(this).registerUser(data, callback);
		}
		else {
			new _UserCreator(this).createUser(data, callback);
		}
	}

	registerRandomUser (callback, options = {}) {
		let data = this.getRandomUserData(options);
		new _UserCreator(this).registerUser(data, callback);
	}

	createRandomNthUser (n, callback, options = {}) {
		this.createRandomUser(callback, options);
	}

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

	registerUser (user, callback) {
		new _UserCreator(this).registerUser(user, callback);
	}

	confirmUser (user, callback) {
		new _UserCreator(this).confirmUser(user, callback);
	}
}

module.exports = RandomUserFactory;
