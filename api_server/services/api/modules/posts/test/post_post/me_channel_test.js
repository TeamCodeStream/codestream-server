'use strict';

var Channel_On_The_Fly_Test = require('./channel_on_the_fly_test');

class Me_Channel_Test extends Channel_On_The_Fly_Test {

	get description () {
		return 'should return a valid post and stream with the user as the only member when creating a post and creating a channel stream on the fly with no member ids specified';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.member_ids;
			callback();
		});
	}

	validate_response (data) {
		this.data.stream.member_ids = []; // current user will be pushed
		super.validate_response(data);
	}
}

module.exports = Me_Channel_Test;
