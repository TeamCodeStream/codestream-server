'use strict';

const MessageToUserTest = require('./message_to_user_test');

class AlreadyOnTeamNoCreatedTeamJoinMethodTest extends MessageToUserTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'when a user creates a team, but they are already on a team, they should not see join method changes in the message received about having beed added to a team';
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// issue the usual message, but remove the analytics stuff that we shouldn't see
		super.generateMessage(error => {
			if (error) { return callback(error); }
			['joinMethod', 'primaryReferral', 'originTeamId'].forEach(attribute => {
				delete this.message.user.$set[attribute];
			});
			// expected version numbers should be bumped since the user added to another team
			this.message.user.$set.version++;
			this.message.user.$version.before++;
			this.message.user.$version.after++;
			callback();
		});
	}
}

module.exports = AlreadyOnTeamNoCreatedTeamJoinMethodTest;
