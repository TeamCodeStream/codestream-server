'use strict';

var Get_Stream_Test = require('./get_stream_test');
const Stream_Test_Constants = require('../stream_test_constants');

class Get_Other_Channel_Stream_Test extends Get_Stream_Test {

	constructor (options) {
		super(options);
		this.type = 'channel';
		this.mine = false;
	}
	get description () {
		return 'should return a valid stream when requesting a channel stream created by someone else on my team';
	}

	get_expected_fields () {
		return { stream: [
			...Stream_Test_Constants.EXPECTED_STREAM_FIELDS,
			...Stream_Test_Constants.EXPECTED_CHANNEL_STREAM_FIELDS
		] };
	}
}

module.exports = Get_Other_Channel_Stream_Test;
