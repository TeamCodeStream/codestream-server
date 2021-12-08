'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setProviderHost,		// set the provider host to later delete
			this.setControlProviderHost, // set another provider host that we won't delete
			this.setExpectedData		// set data expected back from the test request
		], callback);
	}
	
	// set the provider host to later delete
	setProviderHost (callback) {
		this.providerHostData = {
			host: this.host,
			appClientId: RandomString.generate(10),
			appClientSecret: RandomString.generate(16)
		};
		this.setProviderHostRequest(this.providerHostData, callback);
	}

	// set a control provider host, this one we won't delete
	setControlProviderHost (callback) {
		this.controlProviderHostData = {
			host: 'control.' + this.host,
			appClientId: RandomString.generate(10),
			appClientSecret: RandomString.generate(16)
		};
		this.setProviderHostRequest(this.controlProviderHostData, callback);
	}

	// perform a provider-host request, to set a provider host for a given team
	setProviderHostRequest (data, callback) {
		const token = this.userToAddHostIndex === undefined ? this.token :
			this.users[this.userToAddHostIndex].accessToken;
		this.doApiRequest(
			{
				method: 'put',
				path: `/provider-host/${this.provider}/${this.team.id}`,
				data: data,
				token
			},
			callback
		);
	}

	// set the path and other properties to use for the test request
	setExpectedData (callback) {
		const starredControlHost = this.controlProviderHostData.host.replace(/\./g, '*');
		this.expectedTeam = Object.assign({}, this.team, { plan: 'FREEPLAN' });
		this.expectedTeam.providerHosts[starredControlHost] = {
			id: starredControlHost,
			name: this.provider,
			isEnterprise: true,
			hasIssues: true,
			host: this.controlProviderHostData.host
		};
		if (this.hasCodeHosting) {
			this.expectedTeam.providerHosts[starredControlHost].hasCodeHosting = true;
		}
		const starredHost = this.host.replace(/\./g, '*').toLowerCase();
		const encodedHost = encodeURIComponent(starredHost);
		this.path = `/provider-host/${this.provider}/${this.team.id}/${encodedHost}`;
		this.modifiedAfter = Date.now();
		this.expectedData = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					modifiedAt: this.modifiedAfter,
					version: 6
				},
				$unset: {
					[`providerHosts.${starredHost}`]: true
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};
		callback();
	}

	// perform the actual deletion of the host 
	deleteProviderHost (callback) {
		const starredHost = encodeURIComponent(this.host.replace(/\./g, '*')).toLowerCase();
		this.doApiRequest(
			{
				method: 'delete',
				path: `/provider-host/${this.provider}/${this.team.id}/${starredHost}`,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.deleteProviderHostResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
