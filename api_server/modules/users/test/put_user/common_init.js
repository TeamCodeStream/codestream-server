// base class for many tests of the "PUT /users" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeUserData		// make the data to be used during the update
		], callback);
	}

	// form the data for the user update
	makeUserData (callback) {
		this.setTestData();
		this.expectedUser = DeepClone(this.currentUser.user);
		Object.assign(this.expectedUser, this.data);
		this.expectedUser.eligibleJoinCompanies = [{
			accessToken: this.currentUser.accessToken,
			byInvite: true,
			id: this.company.id,
			name: this.company.name,
			teamId: this.team.id,
			memberCount: 2
		}];
		this.path = '/users/' + (this.id || this.currentUser.user.id);
		this.modifiedAfter = Date.now();
		const expectedVersion = this.currentUser.user.version + 1;
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: expectedVersion,
					modifiedAt: Date.now(), // placeholder
					...this.data
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		callback();
	}

	// set the data to be used for the test
	setTestData () {
		this.data = {};
		this.attributes.forEach(attribute => {
			let value;
			const type = this.attributeType || 'string';
			switch (type) {
			default:
				value = RandomString.generate(10);
				break;
			case 'object':
				value = { x: 1, y: 'two' };
				break;
			case 'boolean':
				value = true;
				break;
			}
			this.data[attribute] = value;
		});
	}

	// perform the actual user update 
	updateUser (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/users/me',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Object.assign(this.expectedUser, response.user.$set, this.data, {
					lastReads: {},
					preferences: {
						acceptedTOS: true
					}
				});
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
