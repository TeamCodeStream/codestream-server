// base class for many tests of the "PUT /open" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.closeStream,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		this.streamOptions.creatorIndex = 0;
		this.streamOptions.type = 'direct';
		callback();
	}

	closeStream (callback) {
		if (this.dontCloseFirst) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/close/' + this.stream.id,
				data: {},
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	setPath (callback) {
		this.path = `/open/${this.stream.id}`;
		const version = this.expectedUserVersion || 5;
		this.expectedResponse = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$unset: {
					[`preferences.closedStreams.${this.stream.id}`]: true
				},
				$set: {
					version
				},
				$version: {
					before: version - 1,
					after: version
				}
			},
			stream: {
				_id: this.stream.id,	// DEPRECATE ME
				id: this.stream.id,
				$unset: {
					isClosed: true
				}
			}
		};
		callback();
	}
}

module.exports = CommonInit;
