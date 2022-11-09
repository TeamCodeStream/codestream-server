'use strict';

const NewRelicUserIdAssigneeTest = require('./new_relic_user_id_for_assignee_test');

class NewRelicUserIdExistingAssigneeTest extends NewRelicUserIdAssigneeTest {

	get description () {
		return 'when assigning a user to a New Relic object, if a New Relic user ID is provided and the assignee of the comment is identified with an existing registered CodeStream user, the New Relic user ID should be stored in the assignee\'s provider identities';
	}

	makeNRRequestData (callback) {
		// use an existing registered as the creator of the comment
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			const { user } = this.users[0];
			this.data.assignee.email = user.email;
			callback();
		});
	}

	before (callback) {
		if (this.oneUserPerOrg) {
			console.log('NOTE: under one-user-per-org, no connection with the original faux user and the register is maintained, so this test will pass superifically and should be deprecated');
			return callback();
		} else {
			super.before(callback);
		}
	}

	inviteAndRegisterFauxUser (callback) {
		// override base class
		callback();
	}

	run (callback) {
		if (this.oneUserPerOrg) {
			console.log('NOTE: under one-user-per-org, no connection with the original faux user and the register is maintained, so this test will pass superifically and should be deprecated');
			return callback();
		} else {
			super.run(callback);
		}
	}
}

module.exports = NewRelicUserIdExistingAssigneeTest;
