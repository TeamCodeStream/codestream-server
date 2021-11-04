// base class for many tests of the "PUT /companies/join/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setPath,
			this.enableDomainJoining
		], callback);
	}

	setTestOptions (callback) {
		// create a company and don't make the "current user" a member
		this.expectedVersion = 3;
		Object.assign(this.teamOptions, {
			createCompanyInstead: true,
			creatorIndex: 1,
			members: []
		});
		callback();
	}

	setPath (callback) {
		this.path = `/companies/join/${this.company.id}`;
		callback();
	}

	// enable domain-based joining for our existing company
	enableDomainJoining (callback) {
		const domain = this.users[0].user.email.split('@')[1];
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/' + this.company.id,
				data: {
					domainJoining: [this.useDomain || domain]
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Object.assign(this.company, response.company.$set);
				this.modifiedAfter = Date.now();
				this.expectedResponse = {
					user: {
						_id: this.users[0].user.id,
						id: this.users[0].user.id,
						$set: {
							modifiedAt: Date.now(), // placeholder
							joinMethod: 'Joined Team by Domain',
							primaryReferral: 'external',
							version: this.expectedVersion
						},
						$addToSet: {
							companyIds: this.company.id,
							teamIds: this.team.id
						},
						$version: {
							before: this.expectedVersion - 1,
							after: this.expectedVersion
						}
					},
					company: Object.assign(DeepClone(this.company)),
					team: Object.assign(DeepClone(this.team), {
						foreignMemberIds: [],
						removedMemberIds: [],
						version: 2
					})
				};
				this.expectedUser = Object.assign(
					DeepClone(this.users[0].user),
					this.expectedResponse.user.$set,
					{
						companyIds: [this.company.id],
						teamIds: [this.team.id]
					}
				);
				this.expectedResponse.team.memberIds.push(this.users[0].user.id);
				callback();
			}
		);
	}

	// perform the actual company join 
	doJoin (callback) {
		this.path = '/users/me';
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/join/' + this.company.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					...DeepClone(response),
					repos: [],
					users: 
						DeepClone(this.users.map(u => u.user)).sort((a, b) => {
							return a.id.localeCompare(b.id)
						})
				};
				Object.assign(this.currentUser.user, response.user.$set);
				this.currentUser.user.teamIds = [this.team.id];
				this.currentUser.user.companyIds = [this.company.id];
				delete this.message.team.companyMemberCount;
				this.message.team.version++;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
