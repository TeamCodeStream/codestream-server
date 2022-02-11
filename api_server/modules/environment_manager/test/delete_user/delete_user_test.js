'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class DeleteUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 1;
	}

	get description () {
		return 'should delete a user across environments when requested';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// we'll fetch "ourselves", either by literal ID, or by "me" in the path
			this.path = '/xenv/delete-user/' + this.currentUser.user.id;
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
				}
			};
			callback();
		});
	}
}

module.exports = DeleteUserTest;
