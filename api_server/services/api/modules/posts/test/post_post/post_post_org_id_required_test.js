'use strict';

var Post_Commit_Post_Test = require('./post_commit_post_test');

class Post_Post_Org_ID_Required_Test extends Post_Commit_Post_Test {

	get description () {
		return 'should return an error if no org_id is passed';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
  			info: [{
				org_id: 'is required'
			}]
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			delete this.data.org_id;
			callback();
		});
	}
}

module.exports = Post_Post_Org_ID_Required_Test;
