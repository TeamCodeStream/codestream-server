'use strict';

const CloseTest = require('./close_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const TestStreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_stream_creator');

class GetStreamsTest extends CloseTest {

	get description () {
		return 'should send the isClosed flag set with the stream when a stream has been closed for the current user and then is fetched along with other streams';
	}

	setTestOptions (callback) {
		this.expectedVersion = 8;
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 4;
			callback();
		});
	}
	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherStreams
		], callback);
	}

	// create a couple of other streams, these will not be closed and should not have isClosed set
	createOtherStreams (callback) {
		this.otherStreams = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createOtherStream,
			callback
		);
	}

	// create another stream, which will not be closed
	createOtherStream (n, callback) {
		const streamOptions = Object.assign({}, this.streamOptions);
		streamOptions.members = [n + 2];
		new TestStreamCreator({
			test: this,
			team: this.team,
			teamStream: this.teamStream,
			users: this.users,
			streamOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.otherStreams.push(data.stream);
			callback();
		});
	}
		
	// run the actual test...
	run (callback) {
		// we'll run the standard test, but then fetch the user's streams and check that the one set to closed has isClosed flag
		BoundAsync.series(this, [
			super.run,
			this.fetchStreams
		], callback);
	}

	// fetch all the direct streams for this user, and verify only the test stream has isClosed flag set
	fetchStreams (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: `/streams?teamId=${this.team.id}&type=direct`,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.streams.length, this.otherStreams.length + 1, 'did not fetch all direct streams');
				response.streams.forEach(stream => {
					if (stream.id === this.stream.id) {
						Assert(stream.isClosed, 'isClosed on test stream is not set');
					}
					else {
						Assert(!stream.isClosed, 'isClosed on other stream is set');
					}
				});
				callback();
			}
		);
	}
}

module.exports = GetStreamsTest;
