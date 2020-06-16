'use strict';

const PutStreamTest = require('./put_stream_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NoDuplicateNameTest extends PutStreamTest {

	get description () {
		return 'should return an error when trying to update a channel stream with a name that is already taken';
	}

	getExpectedError () {
		return {
			code: 'STRM-1008'
		};
	}

	// before the test runs...
	before (callback) {
		// run standard setup, but make another stream 
		// and try to rename our test stream to the same name
		BoundAsync.series(this, [
			super.before,
			this.makeOtherStream
		], callback);
	}

	makeOtherStream (callback) {
		// make another stream, and try to rename our test stream to the same name
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.name = response.stream.name;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team.id, // create the stream in the team we already created
				memberIds: [this.currentUser.user.id], // include current user in stream 
				token: this.users[1].accessToken // the "other user" is the stream creator
			}
		);
	}
}

module.exports = NoDuplicateNameTest;
