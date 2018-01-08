'use strict';

var Assert = require('assert');
var PostStreamTest = require('./post_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class PostDirectStreamTest extends PostStreamTest {

	constructor (options) {
		super(options);
		this.type = 'direct';
	}

	getExpectedFields () {
		let fields = Object.assign({}, super.getExpectedFields());
		fields.stream = [
			...fields.stream,
			...StreamTestConstants.EXPECTED_DIRECT_STREAM_FIELDS
		];
		return fields;
	}

	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.memberIds = this.users.splice(1, 3).map(user => user._id);
			callback();
		});
	}

	validateResponse (data) {
		if (this.data.memberIds.indexOf(this.currentUser._id) === -1) {
			this.data.memberIds.push(this.currentUser._id);
			this.data.memberIds.sort();
		}
		let stream = data.stream;
		let errors = [];
		let result = (
			((JSON.stringify(stream.memberIds) === JSON.stringify(this.data.memberIds)) || errors.push('memberIds array does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validateResponse(data);
	}
}

module.exports = PostDirectStreamTest;
