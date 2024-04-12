// provide a factory for creating random repos, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomEntityFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the entity by submitting a request to the server
	createEntity (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/entities',
			data: data,
			token: token
		}, callback);
	}

	// generate a random entity guid
	randomEntityGuid (options = {}) {
		return RandomString.generate(79);
	}

	// get some random attributes to create a random entity
	getRandomEntityData (options = {}) {
		let data = {
			entityId: this.randomEntityGuid(options)
		};
		return data;
	}

	// create a random entity in the database
	createRandomEntity (callback, options = {}) {
		const data = this.getRandomEntityData(options);
		this.createEntity(data, options.token, callback);
	}
}

module.exports = RandomEntityFactory;
