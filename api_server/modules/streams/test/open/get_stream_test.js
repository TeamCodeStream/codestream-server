'use strict';

const OpenTest = require('./open_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class GetStreamTest extends OpenTest {

	get description () {
		return 'should not see the isClosed floag with the stream when a stream has been opened after first being closed';
	}

	// run the actual test...
	run (callback) {
		// we'll run the standard test, but then fetch the stream and ensure the isClosed flag is not there
		BoundAsync.series(this, [
			super.run,
			this.fetchStream
		], callback);
	}

	fetchStream (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/streams/' + this.stream.id,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(typeof response.stream.isClosed, 'undefined', 'isClosed on fetched stream is set');
				callback();
			}
		);
	}
}

module.exports = GetStreamTest;
