// provide a factory for creating random users, for testing purposes

'use strict';

const RandomString = require('randomstring');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

// utility class to actually handle the registration and confirmation as needed
class _UserCreator {

	constructor (factory) {
		this.factory = factory;
	}

	// create a registered and confirmed user
	async createUser (data) {
		this.data = data;
		await this._registerUser();
		await this._confirmUser();
		return {
			user: this.user,
			accessToken: this.token,
			broadcasterToken: this.broadcasterToken,
			password: this.data.password,
			companyName: this.data.companyName
		};
	}

	// register a user by issuing a POST /no-auth/register request
	async _registerUser () {
		const response = await this.factory.apiRequester.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data
			}
		);
		this.user = response.user;
		return { user: this.user };
	}

	// register a user with the given data
	async registerUser (data) {
		this.data = data;
		await this._registerUser();
	}

	// confirm a user registration by issuing a POST /no-auth/confirm request
	async _confirmUser (options = {}) {
		const data = {
			email: this.user.email,
			confirmationCode: this.user.confirmationCode
		};
		const response = await this.factory.apiRequester.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data,
				requestOptions: {
					headers: options.headers || {}
				}
			}
		);
		this.user = response.user;
		this.token = response.accessToken;
		this.broadcasterToken = response.broadcasterToken;
	}

	// confirm registration for a given user
	async confirmUser (user, options = {}) {
		this.user = user;
		await this._confirmUser(options);
	}
}

// We use a pool of UUIDs for interacting with PubNub during unit testing ...
// this is to avoid using the actual IDs of the users we are creating, which would
// mean a new UUID for every created user, every time ... since we are billed per
// user, that would be bad...
let _NextPubnubUuid = 0;

class UserFactory {

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
			fullName: this.randomFullName(),
			companyName: this.randomCompanyName()
		};
	}

	// generate a random full name
	randomFullName () {
		return `${RandomString.generate(8)} ${RandomString.generate(10)}`;
	}
	
	// generate a random company name
	randomCompanyName () {
		return `company${RandomString.generate(10)}`;
	}

	// get some random data to use for creating a user, with options specified
	getRandomUserData (options = {}) {
		let email = this.randomEmail(options);
		let secondaryEmails = [
			this.randomEmail(),
			this.randomEmail()
		];
		let fullName = this.randomFullName();
		let timeZone = 'America/New_York';
		let companyName = this.randomCompanyName();
		let _confirmationCheat = SecretsConfig.confirmationCheat;	// have the server give us the confirmation code, avoiding email
		let _forceConfirmation = 1;									// force confirmation, even if environment settings have it turned off
		let data = { email, secondaryEmails, fullName, companyName, timeZone, _confirmationCheat, _forceConfirmation };
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
			data.wantLink = true;
			if (options.expiresIn) {
				data.expiresIn = options.expiresIn;
			}
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
	async createUser (data) {
		return await new _UserCreator(this).createUser(data);
	}

	// create a random user, generating random data with options specified
	async createRandomUser (options = {}) {
		const data = this.getRandomUserData(options);
		if (options.noConfirm) {
			// only register, no confirm
			return await new _UserCreator(this).registerUser(data);
		}
		else {
			// make them fully confirmed
			return await new _UserCreator(this).createUser(data);
		}
	}

	// create a random user who is not yet confirmed
	async registerRandomUser (options = {}) {
		const data = this.getRandomUserData(options);
		return await new _UserCreator(this).registerUser(data);
	}

	// create a single random user in a series
	async createRandomNthUser (n, options = {}) {
		await this.createRandomUser(options);
	}

	// create several random users
	async createRandomUsers (howmany, options = {}) {
		for (let i = 0; i < howmany; i++) {
			await this.createRandomNthUser(i, options);
		}
	}

	// register the user given some user data
	async registerUser (user) {
		return await new _UserCreator(this).registerUser(user);
	}

	// confirm registration of a user given some user data
	async confirmUser (user, options = {}) {
		return await new _UserCreator(this).confirmUser(user, options);
	}
}

module.exports = UserFactory;
