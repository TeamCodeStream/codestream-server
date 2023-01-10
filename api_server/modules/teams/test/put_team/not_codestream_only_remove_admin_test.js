'use strict';

const AddAdminTest = require('./add_admin_test');

class NotCodeStreamOnlyAddAdminTest extends AddAdminTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return 'should return an error when trying to remove a user from a team when that team is associated with an org that is not codestream-only';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1004',
			reason: 'membership in this company is managed by New Relic'			
		};
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.makeOrgNotCodeStreamOnly(callback);
		});
	}
}

module.exports = NotCodeStreamOnlyAddAdminTest;
