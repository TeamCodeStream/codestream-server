'use strict';

var Post_Team_Test = require('./post_team_test');

class Post_Team_No_Org_ID_Test extends Post_Team_Test {

	get description () {
		return 'should return an error if the user belongs to more than one org and no org_id is passed';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			info: [{
				org_id: 'is required'
			}]
		};
	}

	authenticate(callback) {
		this.user_options = {
			additional_random_companies: 1
		};
		super.authenticate(callback);
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			delete this.data.org_id;
			callback();
		});
	}
}

module.exports = Post_Team_No_Org_ID_Test;
