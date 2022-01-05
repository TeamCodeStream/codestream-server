'use strict';

const ExistingObjectTest = require('./existing_object_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ForeginMembersTest extends ExistingObjectTest {

	constructor (options) {
		super(options);
		this.expectedUsers = ['creator', 'assignee'];
	}

	get description () {
		return 'when a user is assigned to a New Relic object that is already owned by a team, the assigner and assignee should be added as foreign members of the team unless they are already on the team';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.claimCodeError,
			this.createNRAssignment,
			this.getTeam
		], callback);
	}

	getTeam (callback) {
		this.doApiRequest({
			method: 'get',
			path: '/teams/' + this.team.id,
			token: this.token
		}, (error, response) => {
			if (error) { return callback(error); }
			this.path = `/users?teamId=${this.team.id}&ids=${response.team.foreignMemberIds.join(',')}`;
			callback();
		})
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert.strictEqual(data.users.length, this.expectedUsers.length, `${this.expectedUsers.length} users should have been returned`);
		this.expectedUsers.forEach(userType => {
			const user = data.users.find(u => {
				return u.email === this.requestData[userType].email;
			});
			Assert(user, `${userType} not found among the returned users`);
		});
	}
}

module.exports = ForeginMembersTest;
