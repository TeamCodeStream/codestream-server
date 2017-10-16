'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');
var Assert = require('assert');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Duplicate_Direct_Test extends Direct_On_The_Fly_Test {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a direct stream on the fly with matching members';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_duplicate_stream
		], callback);
	}

	create_duplicate_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicate_stream = response.stream;
				callback();
			},
			Object.assign({}, this.stream_options, {
				member_ids: this.data.stream.member_ids,
				token: this.token
			})
		);
	}

	validate_response (data) {
		Assert(data.stream._id === this.duplicate_stream._id, 'returned stream should be the same as the existing stream');
		super.validate_response(data);
	}
}

module.exports = Duplicate_Direct_Test;
