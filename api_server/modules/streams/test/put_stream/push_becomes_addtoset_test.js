'use strict';

const AddUsersTest = require('./add_users_test');

class PushBecomesAddToSetTest extends AddUsersTest {

	get description () {
		return 'should return the updated stream and correct directive when adding multiple users to a stream, using $push instead of $addToSet';
	}
   
	makeStreamData (callback) {
		super.makeStreamData(() => {
			this.data.$push = this.data.$addToSet;
			delete this.data.$addToSet;
			callback();
		});
	}
}

module.exports = PushBecomesAddToSetTest;
