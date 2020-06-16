// base class for many tests of the "PUT /close" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

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
		const expectedVersion = this.expectedVersion || 5;
		this.expectedResponse = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`preferences.closedStreams.${this.stream.id}`]: true,
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
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
