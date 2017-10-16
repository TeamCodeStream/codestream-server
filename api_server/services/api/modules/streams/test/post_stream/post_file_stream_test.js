'use strict';

var Assert = require('assert');
var Post_Stream_Test = require('./post_stream_test');
const Stream_Test_Constants = require('../stream_test_constants');

class Post_File_Stream_Test extends Post_Stream_Test {

	constructor (options) {
		super(options);
		this.type = 'file';
	}

	get_expected_fields () {
		let fields = Object.assign({}, super.get_expected_fields());
		fields.stream = [
			...fields.stream,
			...Stream_Test_Constants.EXPECTED_FILE_STREAM_FIELDS
		];
		return fields;
	}

	make_stream_options (callback) {
		super.make_stream_options(() => {
			this.stream_options.repo_id = this.repo._id;
			callback();
		});
	}

	validate_response (data) {
		let stream = data.stream;
		let errors = [];
		let result = (
			((stream.repo_id === this.data.repo_id) || errors.push('repo_id does not match')) &&
			((stream.file === this.data.file) || errors.push('file does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validate_response(data);
	}
}

module.exports = Post_File_Stream_Test;
