'use strict';

const InviteInfoTest = require('./invite_info_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class TeamNotFoundTest extends InviteInfoTest {

	get description () {
		return 'should return an error when requesting invite info but the invite code indicates a deactivated team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			// deactivate the team the user is being invited to
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'delete',
					path: '/teams/' + this.team.id,
					data: {
						_secret: SecretsConfig.confirmationCheat
					},
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = TeamNotFoundTest;
