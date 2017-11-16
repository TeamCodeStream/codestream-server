'use strict';

var ChannelOnTheFlyTest = require('./channel_on_the_fly_test');

class NameRequiredTest extends ChannelOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a channel stream on the fly with no name';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1001'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.name;
			callback();
		});
	}
}

module.exports = NameRequiredTest;
