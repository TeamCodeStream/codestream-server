'use strict';

const AddAdminTest = require('./add_admin_test');

class AddAdminsTest extends AddAdminTest {

	get description () {
		return 'should return the updated team and correct directive when adding multiple users to as admins to a team';
	}
   
	// get the users we want to add to the team as admins
	getAddedAdmins () {
		return this.users.splice(1).map(data => data.user);
	}
}

module.exports = AddAdminsTest;
