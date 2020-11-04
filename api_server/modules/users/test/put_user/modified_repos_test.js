'use strict';

const PutUserTest = require('./put_user_test');
const Assert = require('assert');

class ModifiedReposTest extends PutUserTest {

	get description () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return `should be able to set ${which} for a given team`;
	}

	// form the data for the post update
	makeUserData (callback) {
		super.makeUserData(() => {
			const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
			const data = [{
				a: 'a',
				b: 2
			}, {
				c: 'c',
				d: 3
			}];
			this.data[which] = {
				[this.team.id]: data
			};
			this.expectedData.user.$set[`${which}.${this.team.id}`] = data;
			this.expectedUser[which] = { [this.team.id]: data };
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
