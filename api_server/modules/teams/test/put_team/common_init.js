// base class for many tests of the "PUT /teams" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 4;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeAdmins,	// make other users into admins, as needed
			this.makeTeamData	// make the data to be used during the update
		], callback);
	}
	
	setTestOptions (callback) {
		return callback();
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
		this.expectedTeam = Object.assign({}, this.team, this.data, { plan: 'FREEPLAN' });
		this.path = '/teams/' + this.team.id;
		this.modifiedAfter = Date.now();
		const expectedVersion = 10;
		this.expectedData = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					name: this.data.name,
					modifiedAt: this.modifiedAfter,
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
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

	makeOrgNotCodeStreamOnly (callback) {
		// we make the org not codestream-only by performing an update operation
		// on the company, forcing a check against the linked NR org, but for
		// test purposes this will be a mock response
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/' + this.company.id,
				data: {
					name: RandomString.generate(10)
				},
				token: this.token,
				requestOptions: {
					headers: {
						'x-cs-mock-no-cs-only': true
					}
				}
			},
			error => {
				// we actually expect this to fail, as this operation is forbidden
				// when we find, through New Relic, that the org is not codestream-only anymore
				if (error) {
					return callback();
				} else {
					throw new Error('error not returned to PUT /companies when triggering not CS-only');
				}
			}
		);
	}
}

module.exports = CommonInit;
