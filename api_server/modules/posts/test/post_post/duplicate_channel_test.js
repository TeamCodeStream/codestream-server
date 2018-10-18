'use strict';

const ChannelOnTheFlyTest = require('./channel_on_the_fly_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class DuplicateChannelTest extends ChannelOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a channel stream on the fly with a name that is already taken';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1004',
		};
	}

	// before the test runs...
	makePostData (callback) {
		BoundAsync.series(this, [
			this.createDuplicateStream,	// pre-create a channel stream with the same name as we'll use in the test
			super.makePostData
		], callback);
	}

	// create a channel stream which will look like a duplicate when we run the test
	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			{
				teamId: this.team._id,
				type: 'channel',
				token: this.token
			}
		);
	}
}

module.exports = DuplicateChannelTest;
