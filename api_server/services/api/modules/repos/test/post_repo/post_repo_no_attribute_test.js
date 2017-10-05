'use strict';

var Post_Repo_Test = require('./post_repo_test');

class Post_Repo_No_Attribute_Test extends Post_Repo_Test {

	get_description () {
		return `should return error when attempting to create a repo with no ${this.attribute}`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				[this.attribute]: 'is required'
			}]
		};
	}

	before (callback) {
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = Post_Repo_No_Attribute_Test;
