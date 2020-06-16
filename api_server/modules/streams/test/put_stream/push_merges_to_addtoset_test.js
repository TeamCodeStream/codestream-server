'use strict';

const AddUsersTest = require('./add_users_test');

class PushMergesToAddToSetTest extends AddUsersTest {

	get description () {
		return 'should return the updated stream and correct directive when adding multiple users to a stream, using $push and $addToSet';
	}
   
	makeStreamData (callback) {
		super.makeStreamData(() => {
			this.data.$push = { memberIds: [this.data.$addToSet.memberIds[0]] };
			this.data.$addToSet.memberIds.splice(0, 1);
			callback();
		});
	}
}

module.exports = PushMergesToAddToSetTest;
