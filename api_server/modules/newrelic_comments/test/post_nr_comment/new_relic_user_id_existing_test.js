'use strict';

const NewRelicUserIdTest = require('./new_relic_user_id_test');

class NewRelicUserIdExistingTest extends NewRelicUserIdTest {

	get description () {
		return 'when creating a New Relic comment, if a New Relic user ID is provided and the creator of the comment is identified with an existing registered CodeStream user, the New Relic user ID should be stored in the creator\'s provider identities';
	}

	makeNRCommentData (callback) {
		// use an existing registered as the creator of the comment
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			if (this.oneUserPerOrg) { return callback(); }
			const { user } = this.users[0];
			this.data.creator.email = user.email;
			Object.assign(this.expectedResponse.post.creator, {
				email: user.email,
				fullName: user.fullName,
				username: user.username
			});
			callback();
		});
	}

	inviteAndRegisterFauxUser (callback) {
		if (this.oneUserPerOrg) { return super.inviteAndRegisterFauxUser(callback); }
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

module.exports = NewRelicUserIdExistingTest;
