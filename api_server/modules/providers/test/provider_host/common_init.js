'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeProviderHostData	// make the data to be used during the update
		], callback);
	}
	
	// form the data for the team update
	makeProviderHostData (callback) {
		this.data = {
			host: this.host,
			appClientId: 'someClientId',
			appClientSecret: 'someClientSecret'
		};
		this.expectedTeam = Object.assign({}, this.team, this.data);
		this.path = `/provider-host/${this.provider}/${this.team.id}`;
		this.modifiedAfter = Date.now();
		const starredHost = this.host.replace(/\./g, '*');
		this.providerHostData = {
			id: starredHost,
			name: this.provider,
			isEnterprise: true,
			hasIssues: true,
			host: this.host
		};
		this.expectedData = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					modifiedAt: this.modifiedAfter,
					[`providerHosts.${starredHost}`]: this.providerHostData,
					version: 4
				},
				$version: {
					before: 3,
					after: 4
				}
			},
			providerId: starredHost
		};
		callback();
	}

	// perform the actual update 
	setProviderHost (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/provider-host/${this.provider}/${this.team.id}`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.setProviderHostResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
