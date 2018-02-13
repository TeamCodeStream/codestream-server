// provide a factory for creating random streams, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomStreamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the post by submitting a request to the server
	createStream (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/streams',
			data: data,
			token: token
		}, callback);
	}

	// generate a random channel name
	randomName () {
		return 'channel ' + RandomString.generate(12);
	}

	// generate a random file (with a path)
	randomFile () {
		return `/path/to/${RandomString.generate(12)}.${RandomString.generate(2)}`;
	}

	// get some data to use for a random stream, given various options
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

	// get random data associated with a channel stream
	getRandomChannelStreamData (data, callback, options = {}) {
		if (options.memberIds) {	// member IDs must be provided (we can't just generate these randomly)
			data.memberIds = options.memberIds;
		}
		data.name = options.name || this.randomName();
		callback(null, data);
	}

	// get random data associated with a direct stream
	getRandomDirectStreamData (data, callback, options = {}) {
		if (options.memberIds) {	// member IDs must be provided (we can't just generate these randomly)
			data.memberIds = options.memberIds;
		}
		callback(null, data);
	}

	// get random data associated with a file-type stream
	getRandomFileStreamData (data, callback, options = {}) {
		if (options.repoId) {	// repo ID must be provided (we can't just generate it randomly)
			data.repoId = options.repoId;
		}
		else {
			return callback('must provide repoId for file streams');
		}
		data.file = options.file || this.randomFile();
		callback(null, data);
	}

	// create a random stream by generating random data and making a request to the server
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
