'use strict';

var Post_Group_Post_Test = require('./post_group_post_test');

class Post_Post_Invalid_Group_Test extends Post_Group_Post_Test {

	get description () {
		return 'should return an error if invalid group attribute is provided';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1008',
			reason: 'group must be an object'
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.group = 1;
			callback();
		});
	}
}

module.exports = Post_Post_Invalid_Group_Test;
