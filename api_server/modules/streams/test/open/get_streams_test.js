'use strict';

const OpenTest = require('./open_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const TestStreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_stream_creator');

class GetStreamsTest extends OpenTest {

	constructor (options) {
		super(options);
		this.expectedUserVersion = 10;
	}

	get description () {
		return 'should not see the isClosed flag on the stream when the stream has been closed and then opened for the current user and then is fetched along with other streams';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 4;
			callback();
		});
	}
	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherStreams,
			this.setClosed
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
			users: this.users,
			streamOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.otherStreams.push(data.stream);
			callback();
		});
	}
		
	// set one of the fetched streams as closed
	setClosed (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/close/' + this.otherStreams[0].id,
				token: this.currentUser.accessToken
			},
			callback
		);
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
						Assert(!stream.isClosed, 'isClosed on test stream is set');
					}
					else if (stream.id === this.otherStreams[0].id) {
						Assert(stream.isClosed, 'isClosed on closed other stream is not set');
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
