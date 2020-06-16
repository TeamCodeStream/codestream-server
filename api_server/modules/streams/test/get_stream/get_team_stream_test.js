'use strict';

const GetStreamTest = require('./get_stream_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class GetTeamStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		delete this.streamOptions.creatorIndex;
	}

	get description () {
		return 'should return a valid stream when requesting a team stream';
	}

	getExpectedFields () {
		const fields = DeepClone(super.getExpectedFields());
		let index = fields.stream.indexOf('purpose');
		fields.stream.splice(index, 1);
		index = fields.stream.indexOf('memberIds');
		fields.stream.splice(index, 1);
		return fields;
	}

	setPath (callback) {
		this.stream = this.teamStream;
		this.path = '/streams/' + this.teamStream.id;
		callback();
	}
}

module.exports = GetTeamStreamTest;
