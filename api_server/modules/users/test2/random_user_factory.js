// provide a factory for creating random users, for testing purposes

'use strict';

const RandomString = require('randomstring');
const UserRequests = require('./user_requests');

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
	randomNamedUser (options = {}) {
		const use = options.use || {};
		return {
			email: use.email || this.randomEmail(),
			username: use.username || this.randomUsername(),
			fullName: use.fullName || this.randomFullName(),
			companyName: use.companyName || this.randomCompanyName()
		};
	}

	// generate a random username
	randomUsername () {
		return RandomString.generate(12);
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
		const data = this.randomNamedUser(options);
		Object.assign(data, {
			_forceConfirmation: 1,
			_confirmationCheat: this.confirmationCheat,
			timeZone: 'Americe/New_York'
		});
		if (!options.noPassword) {
			data.password = RandomString.generate(12);
		}
		if (options.noUsername) {
			delete data.username;
		}
		data._pubnubUuid = this.getNextPubnubUuid();
		return data;
	}

	// return the next PubNub UUID from the rotating pool
	getNextPubnubUuid () {
		_NextPubnubUuid = (_NextPubnubUuid + 1) % 100;
		return `TEST-UUID-${_NextPubnubUuid}`;
	}

	// create an unregistered user in the database
	async createUnregisteredUser (data = {}, options = {}) {
		const response = await this.apiRequester.doApiRequest(
			{
				...UserRequests.register,
				data
			}
		);
		return response.user;
	}
	
	// confirm a user's registration
	async confirmUser (data = {}, options = {}) {
		return this.apiRequester.doApiRequest(
			{
				...UserRequests.confirm,
				data,
				headers: options.headers
			}
		);
	}

	// create a registered and confirmed user, given user data
	async createRegisteredUser (data = {}, options = {}) {
		const user = await this.createUnregisteredUser(data, options);
		return this.confirmUser({ 
			email: user.email,
			confirmationCode: user.confirmationCode
		}, options);
	}

	// create a random user in the database, given user data
	// the user can be registered or unregistered (unconfirmed), governed by a noConfirm flag
	async createRandomUser (data = {}, options = {}) {
		const userData = this.getRandomUserData(data, options);
		if (options.noConfirm) {
			return this.createUnregisteredUser(userData, options);
		} else {
			return this.createRegisteredUser(userData, options);
		}
	}
}

module.exports = RandomUserFactory;
