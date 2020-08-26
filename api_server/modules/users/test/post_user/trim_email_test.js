'use strict';

const PostUserTest = require('./post_user_test');

class TrimEmailTest extends PostUserTest {

	get description() {
		return 'should trim leading and trailing spaces from email upon user invite';
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = ` ${this.data.email} `;
			callback();
		});
	}
}

module.exports = TrimEmailTest;
