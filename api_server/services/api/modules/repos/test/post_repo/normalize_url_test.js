'use strict';

var Post_Repo_Test = require('./post_repo_test');
var Random_String = require('randomstring');

class Normalize_Url_Test extends Post_Repo_Test {

	get_description () {
		return `should return valid repo when creating a new repo, and the URL should be appropriately normalized`;
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.base_url = `ABC${Random_String.generate(8)}.CoM`;
			this.data.url = `wWw.${this.base_url}/?x=1&y=2#frag`;
			callback();
		});
	}

	validate_response (data) {
		this.data.url = 'http://' + this.base_url.toLowerCase();
		super.validate_response(data);
	}
}

module.exports = Normalize_Url_Test;
