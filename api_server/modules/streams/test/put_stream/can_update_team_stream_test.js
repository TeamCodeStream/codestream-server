'use strict';

const PutStreamTest = require('./put_stream_test');

class CanUpdateTeamStream extends PutStreamTest {

	constructor (options) {
		super(options);
		this.isTeamStream = true;
	}

	get description () {
		return 'should return the updated stream when updating a team stream';
	}
}

module.exports = CanUpdateTeamStream;
