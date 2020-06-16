'use strict';

const GetUnreadStreamsTest = require('./get_unread_streams_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetNoUnreadStreamsTest extends GetUnreadStreamsTest {

	get description () {
		return 'should return no streams when asking for streams with unread messages and there are none';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do standard test prep...
			this.readAll	// but then indicate that we're up to date in all streams
		], callback);
	}

	readAll (callback) {
		this.doApiRequest({
			method: 'put',
			path: '/read/all',
			token: this.token
		}, error => {
			if (error) { return callback(error); }
			this.expectedStreams = [];	// since we're up to date in all streams, we expect no streams in the response
			callback();
		});
	}
}

module.exports = GetNoUnreadStreamsTest;
