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

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream
		], callback);
	}

	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, stream) => {
				if (error) { return callback(error); }
				this.duplicateStream = stream;
				callback();
			},
			Object.assign({}, this.streamOptions, { name: this.data.stream.name })
		);
	}
}

module.exports = DuplicateChannelTest;
