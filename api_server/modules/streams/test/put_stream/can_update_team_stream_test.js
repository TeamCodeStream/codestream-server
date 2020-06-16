'use strict';

const PutStreamTest = require('./put_stream_test');

class CanUpdateTeamStream extends PutStreamTest {

	get description () {
		return 'should return the updated stream when updating a team stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = CanUpdateTeamStream;
