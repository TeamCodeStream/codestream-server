'use strict';

var Repo_Exists_Test = require('./repo_exists_test');

class Repo_Exists_Not_On_Team_Test extends Repo_Exists_Test {

	constructor (options) {
		super(options);
		this.test_options.dont_include_current_user = true;
	}

	get_description () {
		return 'should return the repo when trying to create a repo that already exists and the user is not on the team (the user should be added to the team)';
	}
}

module.exports = Repo_Exists_Not_On_Team_Test;
