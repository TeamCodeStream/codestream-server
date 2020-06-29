'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CodemarkInviteTriggerTest extends CodemarkMarkerTest {

	get description () {
		return 'when a codemark mentions an unregistered user, the lastInviteType and inviteTrigger of the unregistered user should get updated';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// run the parent's test, but then...
			this.checkUser	// ...we'll check that the unregistered user object has been updated
		], callback);
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// add users to the mentionedUserIds array
			this.unregisteredUser = this.users.find(user => !user.user.isRegistered);
			this.data.mentionedUserIds = [this.unregisteredUser.user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, this.unregisteredUser.user.id];
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// just save the ID of the codemark created
		this.codemarkId = data.codemark.id;
		super.validateResponse(data);
	}

	// check the unregistered user object for the correct updates
	checkUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/' + this.unregisteredUser.user.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user.lastInviteType, 'codemarkNotification', 'lastInviteType should be "codemarkNotification"');
				Assert.equal(response.user.inviteTrigger, `C${this.codemarkId}`);
				callback();
			}
		);
	}
}

module.exports = CodemarkInviteTriggerTest;
