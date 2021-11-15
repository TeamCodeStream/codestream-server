// base class for many tests of the "PUT /open" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			//this.closeStream,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		//this.streamOptions.creatorIndex = 0;
		//this.streamOptions.type = 'direct';
		callback();
	}

	closeStream (callback) {
		if (this.dontCloseFirst) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/streams/close/' + this.teamStream.id,
				data: {},
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	setPath (callback) {
		this.path = `/streams/open/${this.teamStream.id}`;
		const version = this.expectedUserVersion || 6;
		this.expectedResponse = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$unset: {
					[`preferences.closedStreams.${this.teamStream.id}`]: true
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
				_id: this.teamStream.id,	// DEPRECATE ME
				id: this.teamStream.id,
				$unset: {
					isClosed: true
				}
			}
		};
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = CommonInit;
