// handle the "POST /provider-set-token" request to set an access token
// for a third-party provider direct from the client

'use strict';

const ProviderInfoRequest = require('./provider_info_request');

class ProviderSetTokenRequest extends ProviderInfoRequest {

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		if (!this.request.body.token) {
			throw this.errorHandler.error('parameterRequired', { info: 'token' });
		}
		this.request.body.data = {
			accessToken: this.request.body.token,
			data: this.request.body.data
		};
		delete this.request.body.token;
		return super.requireAndAllow();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-set-token',
			summary: 'Set an access token associated with a third-party provider',
			access: 'Access tokens are issued per team, so user must be a member of the team passed with the request',
			description: 'Access tokens to access third-party provider APIs can be optionally set by the user from the client. This call sets the access token, along with any other provided properties.',
			input: {
				summary: 'Specify provider in the path, and teamId and token in the request body, along with optional attributes',
				looksLike: {
					'teamId*': '<ID of the team for which provider access is required>',
					'token*': '<Token to set>',
					'host': '<Provider host, for enterprise installations',
					'data': '<A free-form object containing any additonal data associated with the token>'
				}
			},
			returns: {
				summary: 'Returns a directive indicating how to update the user object with new token data',
				looksLike: {
					user: '<user directive>'
				}
			},
			errors: [
				'updateAuth',
				'parameterRequired',
				'unknownProvider',
				'notFound'
			]
		};
	}
}

module.exports = ProviderSetTokenRequest;
