// base class for many tests of the "PUT /close" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		this.streamOptions.creatorIndex = 0;
		this.streamOptions.type = 'direct';
		callback();
	}

	setPath (callback) {
		this.path = `/close/${this.stream.id}`;
		this.expectedResponse = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`preferences.closedStreams.${this.stream.id}`]: true,
					version: 4
				},
				$version: {
					before: 3,
					after: 4
				}
			},
			stream: {
				_id: this.stream.id,	// DEPRECATE ME
				id: this.stream.id,
				$set: {
					isClosed: true
				}
			}
		};
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = CommonInit;
