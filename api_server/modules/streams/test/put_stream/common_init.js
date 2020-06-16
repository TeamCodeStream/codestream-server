// base class for many tests of the "PUT /streams" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeStreamData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 3;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.members = [0, 1];
		callback();
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			name: this.streamFactory.randomName(),
			purpose: this.streamFactory.randomPurpose()
		};
	}

	// form the data for the stream update
	makeStreamData (callback) {
		this.data = this.getUpdateData();
		this.expectedData = {
			stream: {
				_id: this.stream.id,	// DEPRECATE ME
				id: this.stream.id,
				$set: Object.assign(DeepClone(this.data), { version: this.expectedVersion }),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.path = '/streams/' + this.stream.id;
		this.modifiedAfter = Date.now();
		callback();
	}

	// perform the actual stream update 
	// the actual test is reading the stream and verifying it is correct
	updateStream (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/streams/${this.stream.id}`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedData.stream.$set.modifiedAt = response.stream.$set.modifiedAt;
				this.expectedStream = Object.assign({}, this.stream, this.data, { version: this.expectedVersion });
				this.requestData = this.data;
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
