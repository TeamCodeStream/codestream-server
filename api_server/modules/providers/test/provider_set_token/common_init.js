'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeProviderTokenData	// make the data to be used during the update
		], callback);
	}
	
	// form the data for the update
	makeProviderTokenData (callback) {
		this.data = {
			teamId: this.team.id,
			token: 'somerandomtoken',
			data: {
				baseUrl: 'https://someurl.com'
			}
		};
		if (this.testHost) {
			this.data.host = this.testHost;
		}
		this.expectedUser = Object.assign({}, this.currentUser.user);
		this.expectedUser.numUsersInvited = 2;
		this.expectedUser.providerInfo = {
			[this.team.id]: {
				[this.provider]: {
				}
			}
		};
			
		this.path = `/provider-set-token/${this.provider}`;
		this.modifiedAfter = Date.now();
		this.expectedData = {
			user: {
				id: this.currentUser.user.id,
				_id: this.currentUser.user.id,	// DEPRECATE ME
				$set: {
					modifiedAt: this.modifiedAfter,
					version: 6
				},
				$unset: {
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};

		let setKey = `providerInfo.${this.team.id}.${this.provider}`;
		const starredHost = this.testHost ? this.testHost.replace(/\./g, '*') : '';
		if (this.testHost) {
			setKey += `.hosts.${starredHost}`;
		}
		const setData = {
			accessToken: this.data.token,
			data: this.data.data,
			isApiToken: true
		};
		this.expectedData.user.$set[`${setKey}.accessToken`] = this.data.token;
		this.expectedData.user.$set[`${setKey}.isApiToken`] = true;
		this.expectedData.user.$set[`${setKey}.data`] = this.data.data;
		this.expectedData.user.$unset[`${setKey}.tokenError`] = true;
		if (this.testHost) {
			this.expectedUser.providerInfo[this.team.id][this.provider].hosts = {
				[starredHost]: setData
			};
		}
		else {
			this.expectedUser.providerInfo[this.team.id][this.provider] = setData;
			this.expectedUser.providerInfo[this.team.id][this.provider].isApiToken = true;
		}
		callback();
	}

	// perform the actual update 
	setProviderToken (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/provider-set-token/${this.provider}`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.setProviderTokenResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
