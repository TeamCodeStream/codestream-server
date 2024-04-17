'use strict';

const PostEntityTest = require('./post_entity_test');

class DeactivatedTeamTest extends PostEntityTest {

	get description () {
		return 'should return an error when trying to create a New Relic entity in a deactivated team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.doApiRequest({
				method: 'delete',
				path: '/teams/' + this.team.id,
				token: this.currentUser.accessToken,
				requestOptions: {
					headers: {
						'X-Delete-Team-Secret': this.apiConfig.sharedSecrets.confirmationCheat
					}
				}
			}, callback);
		});
	}
}

module.exports = DeactivatedTeamTest;
