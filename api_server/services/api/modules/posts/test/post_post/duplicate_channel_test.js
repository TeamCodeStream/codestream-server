'use strict';

var ChannelOnTheFlyTest = require('./channel_on_the_fly_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

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
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream	// pre-create a channel stream with the same name as we'll use in the test
		], callback);
	}

	// create a channel stream which will look like a duplicate when we run the test
	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, stream) => {
				if (error) { return callback(error); }
				this.duplicateStream = stream;
				callback();
			},
			// use the name of the pre-created channel stream when we try to run the test
			Object.assign({}, this.streamOptions, { name: this.data.stream.name })
		);
	}
}

module.exports = DuplicateChannelTest;
