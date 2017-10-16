'use strict';

var Assert = require('assert');
var Post_Stream_Test = require('./post_stream_test');
const Stream_Test_Constants = require('../stream_test_constants');

class Post_Direct_Stream_Test extends Post_Stream_Test {

	constructor (options) {
		super(options);
		this.type = 'direct';
	}

	get_expected_fields () {
		let fields = Object.assign({}, super.get_expected_fields());
		fields.stream = [
			...fields.stream,
			...Stream_Test_Constants.EXPECTED_DIRECT_STREAM_FIELDS
		];
		return fields;
	}

	make_stream_options (callback) {
		super.make_stream_options(() => {
			this.stream_options.member_ids = this.users.splice(1, 3).map(user => user._id);
			callback();
		});
	}

	validate_response (data) {
		if (this.data.member_ids.indexOf(this.current_user._id) === -1) {
			this.data.member_ids.push(this.current_user._id);
			this.data.member_ids.sort();
		}
		let stream = data.stream;
		let errors = [];
		let result = (
			((JSON.stringify(stream.member_ids) === JSON.stringify(this.data.member_ids)) || errors.push('member_ids array does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validate_response(data);
	}
}

module.exports = Post_Direct_Stream_Test;
