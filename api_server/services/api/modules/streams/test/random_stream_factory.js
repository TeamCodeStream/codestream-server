'use strict';

var RandomString = require('randomstring');

class RandomStreamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	createStream (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/streams',
			data: data,
			token: token
		}, callback);
	}

	randomName () {
		return 'channel ' + RandomString.generate(12);
	}

	randomFile () {
		return `/path/to/${RandomString.generate(12)}.${RandomString.generate(2)}`;
	}

	getRandomStreamData (callback, options = {}) {
		let type = options.type || 'file';
		if (!options.teamId) {
			return callback('must provide teamId for stream creation');
		}
		let data = {
			type: type,
			teamId: options.teamId
		};
		if (type === 'channel') {
			this.getRandomChannelStreamData(data, callback, options);
		}
		else if (type === 'direct') {
			this.getRandomDirectStreamData(data, callback, options);
		}
		else if (type === 'file') {
			this.getRandomFileStreamData(data, callback, options);
		}
		else {
			return callback('invalid type: ' + type);
		}
	}

	getRandomChannelStreamData (data, callback, options = {}) {
		if (options.memberIds) {
			data.memberIds = options.memberIds;
		}
		data.name = options.name || this.randomName();
		callback(null, data);
	}

	getRandomDirectStreamData (data, callback, options = {}) {
		if (options.memberIds) {
			data.memberIds = options.memberIds;
		}
		callback(null, data);
	}

	getRandomFileStreamData (data, callback, options = {}) {
		if (options.repoId) {
			data.repoId = options.repoId;
		}
		else {
			return callback('must provide repoId for file streams');
		}
		data.file = options.file || this.randomFile();
		callback(null, data);
	}

	createRandomStream (callback, options = {}) {
		this.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.createStream(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = RandomStreamFactory;
