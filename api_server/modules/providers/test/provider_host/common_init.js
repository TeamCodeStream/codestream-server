'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

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
		if (this.hasCodeHosting) {
			this.providerHostData.hasCodeHosting = true;
		}
		const expectedVersion = this.oneUserPerOrg ? 5 : 4;
		this.expectedData = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					modifiedAt: this.modifiedAfter,
					[`providerHosts.${starredHost}`]: this.providerHostData,
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
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
