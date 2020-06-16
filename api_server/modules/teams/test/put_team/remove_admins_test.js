'use strict';

const RemoveAdminTest = require('./remove_admin_test');

class RemoveAdminsTest extends RemoveAdminTest {

	constructor (options) {
		super(options);
		this.whichAdmins = [1, 2];
	}

	get description () {
		return 'should return the updated team and correct directive when removing multiple users as admins of a team';
	}
   
	// get the users we want to remove as admins from the team
	getRemovedAdmins () {
		return this.users.slice(1).map(data => data.user);
	}
}

module.exports = RemoveAdminsTest;
