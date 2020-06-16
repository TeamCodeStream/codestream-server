// base class for many tests of the "PUT /teams" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 4;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeAdmins,	// make other users into admins, as needed
			this.makeTeamData	// make the data to be used during the update
		], callback);
	}
	
	// make other users into admins for the team, if desired for the test
	makeAdmins (callback) {
		const adminIds = [];
		if (!this.dontMakeCurrentUserAdmin) {
			adminIds.push(this.currentUser.user.id);
		}
		if (this.whichAdmins) {
			for (let i = 0; i < this.whichAdmins.length; i++) {
				adminIds.push(this.users[this.whichAdmins[i]].user.id);
			}
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: { $push: { adminIds } },
				token: this.users[1].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.team.adminIds.push(...adminIds);
				callback();
			}
		);
	}

	// form the data for the team update
	makeTeamData (callback) {
		this.data = {
			name: this.teamFactory.randomName()
		};
		this.expectedTeam = Object.assign({}, this.team, this.data);
		this.path = '/teams/' + this.team.id;
		this.modifiedAfter = Date.now();
		this.expectedData = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					name: this.data.name,
					modifiedAt: this.modifiedAfter,
					version: 7
				},
				$version: {
					before: 6,
					after: 7
				}
			}
		};
		callback();
	}

	// perform the actual team update 
	updateTeam (callback) {
		const token = this.otherUserUpdatesTeam ? this.users[1].accessToken : this.token;
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: this.data,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.updateTeamResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
