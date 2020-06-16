// base class for many tests of the "PUT /join/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeStreamOptions,		// make options to use in issuing the test request to create a stream
			this.createDuplicateStream,	// if needed, create a stream, before the test request, that duplicates the attributes of the stream we will create for the test
			this.makeStreamData			// make the data to use when issuing the request
		], callback);
	}
	
	setTestOptions (callback) {
		this.userOptions.numRegistered = 3;
		this.teamOptions.numAdditionalInvites = 3;
		callback();
	}

	// make options to use in issuing the test request to create a stream
	makeStreamOptions (callback) {
		this.postStreamOptions = {
			type: this.type,		// stream type
			teamId: this.team.id	// ID of the team to own the stream
		};
		callback();
	}

	// if needed, create a stream, before the test request, 
	// that duplicates the attributes of the stream we will create for the test
	createDuplicateStream (callback) {
		if (!this.wantDuplicateStream) {	// only if needed for the test
			return callback();
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			Object.assign({}, this.postStreamOptions, { token: this.token })
		);
	}

	// make the data to use when issuing the request
	makeStreamData (callback) {
		this.streamFactory.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.postStreamOptions
		);
	}
}

module.exports = CommonInit;
