'use strict';

var Channel_On_The_Fly_Test = require('./channel_on_the_fly_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Duplicate_Channel_Test extends Channel_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a channel stream on the fly with a name that is already taken';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1004',
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_duplicate_stream
		], callback);
	}

	create_duplicate_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, stream) => {
				if (error) { return callback(error); }
				this.duplicate_stream = stream;
				callback();
			},
			Object.assign({}, this.stream_options, { name: this.data.stream.name })
		);
	}
}

module.exports = Duplicate_Channel_Test;
