'use strict';

var Get_Stream_Test = require('./get_stream_test');
const Stream_Test_Constants = require('../stream_test_constants');

class Get_Other_Direct_Stream_Test extends Get_Stream_Test {

	constructor (options) {
		super(options);
		this.type = 'direct';
		this.mine = false;
	}
	get description () {
		return 'should return a valid stream when requesting a direct stream created by someone else on my team';
	}

	get_expected_fields () {
		return { stream: [
			...Stream_Test_Constants.EXPECTED_STREAM_FIELDS,
			...Stream_Test_Constants.EXPECTED_DIRECT_STREAM_FIELDS
		] };
	}
}

module.exports = Get_Other_Direct_Stream_Test;
