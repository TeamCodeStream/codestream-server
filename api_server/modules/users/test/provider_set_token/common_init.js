'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeProviderTokenData	// make the data to be used during the update
		], callback);
	}
	
	// form the data for the team update
	makeProviderTokenData (callback) {
		this.data = {
			teamId: this.team.id,
			token: 'somerandomtoken'
		};
		if (this.testHost) {
			this.data.host = this.testHost;
		}
		this.expectedUser = Object.assign({}, this.currentUser.user);
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
					version: 4
				},
				$version: {
					before: 3,
					after: 4
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
			data: { }
		};
		this.expectedData.user.$set[setKey] = setData;
		if (this.testHost) {
			this.expectedUser.providerInfo[this.team.id][this.provider].hosts = {
				[starredHost]: setData
			};
		}
		else {
			this.expectedUser.providerInfo[this.team.id][this.provider] = setData;
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
