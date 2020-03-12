'use strict';

const PutUserTest = require('./put_user_test');
const Assert = require('assert');

class ModifiedReposTest extends PutUserTest {

	get description () {
		return 'should be able to set modifiedRepos for a given team';
	}

	// form the data for the post update
	makeUserData (callback) {
		super.makeUserData(() => {
			const data = [{
				a: 'a',
				b: 2
			}, {
				c: 'c',
				d: 3
			}];
			this.data.modifiedRepos = {
				[this.team.id]: data
			};
			this.expectedData.user.$set[`modifiedRepos.${this.team.id}`] = data;
			this.expectedUser.modifiedRepos = { [this.team.id]: data };
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.user.$set[`modifiedReposModifiedAt.${this.team.id}`] >= this.modifiedAfter, 'modifiedReposModifiedAt for team not set');
		this.expectedData.user.$set[`modifiedReposModifiedAt.${this.team.id}`] = data.user.$set[`modifiedReposModifiedAt.${this.team.id}`];
		super.validateResponse(data);
	}
}

module.exports = ModifiedReposTest;
