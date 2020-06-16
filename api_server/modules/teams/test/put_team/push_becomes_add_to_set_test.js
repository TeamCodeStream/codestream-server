'use strict';

const AddAdminsTest = require('./add_admins_test');

class PushBecomesAddToSetTest extends AddAdminsTest {

	get description () {
		return 'should return the updated team and correct directive when adding multiple users as admins to a team, using $push instead of $addToSet';
	}
   
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$push = this.data.$addToSet;
			delete this.data.$addToSet;
			callback();
		});
	}
}

module.exports = PushBecomesAddToSetTest;
