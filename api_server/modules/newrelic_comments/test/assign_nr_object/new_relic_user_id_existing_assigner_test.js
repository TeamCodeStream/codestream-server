'use strict';

const NewRelicUserIdAssignerTest = require('./new_relic_user_id_for_assigner_test');

class NewRelicUserIdExistingAssignerTest extends NewRelicUserIdAssignerTest {

	get description () {
		return 'when assigning a user to a New Relic object, if a New Relic user ID is provided and the assigner is identified with an existing registered CodeStream user, the New Relic user ID should be stored in the assigner\'s provider identities';
	}

	makeNRRequestData (callback) {
		// use an existing registered as the creator of the comment
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			const { user } = this.users[0];
			this.data.creator.email = user.email;
			callback();
		});
	}

	inviteAndRegisterFauxUser (callback) {
		// override base class
		callback();
	}
}

module.exports = NewRelicUserIdExistingAssignerTest;
