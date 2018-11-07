'use strict';

const CloseTest = require('./close_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class GetStreamTest extends CloseTest {

	get description () {
		return 'should send the isClosed flag set with the stream when a stream has been closed for the current user and then is fetched';
	}

	// run the actual test...
	run (callback) {
		// we'll run the standard test, but then fetch the stream and look for the isClosed flag
		BoundAsync.series(this, [
			super.run,
			this.fetchStream
		], callback);
	}

	fetchStream (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/streams/' + this.stream._id,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.stream.isClosed, 'isClosed on fetched stream is not set');
				callback();
			}
		);
	}
}

module.exports = GetStreamTest;
