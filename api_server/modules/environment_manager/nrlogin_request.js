// handle the "POST /xenv/nrlogin" request, to finish New Relic authentication in a different region
// from the one where the auth process was originally launched

'use strict';

const XEnvRequest = require('./xenv_request');
const ProviderIdentityConnector = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_identity_connector');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');

class NRLoginRequest extends XEnvRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(NewRelicIDPErrors);
	}

	// process the request...
	async process () {
		await this.requireAndAllow();
		try {
			await this.connectIdentity();
		}
		catch (error) {
			this.warn(ErrorHandler.log(error));
			this.errorCode = typeof error === 'object' && error.code ? error.code : WebErrors['unknownError'].code;
		}
		await this.saveSignupToken();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['token', 'signupToken', 'tokenType', 'nrOrgId', 'email', 'refreshToken'],
				number: ['nrUserId', 'expiresAt']
			},
			optional: {
				string: ['username', 'fullName', 'companyName', '_pubnubUuid'],
				number: ['signupTokenExipresIn'],
				object: ['nrUserInfo']
			}
		});
	}

	// connect the given NR user identity to a CS user identity, either by matching the user, or creating it
	async connectIdentity () {
		const {
			token,
			tokenType,
			refreshToken,
			expiresAt,
			email,
			username,
			fullName,
			_pubnubUuid,
			nrUserId,
			nrUserInfo,
			nrOrgId,
			companyName
		} = this.request.body;
		this.connector = new ProviderIdentityConnector({
			request: this,
			provider: 'newrelicidp',
			okToCreateUser: true,
			wasNREmailSignOn: true,
			tokenData: {
				accessToken: token,
				refreshToken,
				tokenType,
				expiresAt
			},
			_pubnubUuid
		});
	
		await this.connector.connectIdentity({
			email,
			fullName,
			username,
			nrUserId,
			nrUserInfo,
			nrOrgId,
			companyName
		});
		this.user = this.connector.user;
		this.team = this.connector.team;
		this.log('NEWRELIC IDP TRACK: Connected user identity, nrUserId=' + nrUserId);

		// set signup status
		if (this.connector.createdTeam) {
			this.signupStatus = 'teamCreated';
		} else if (this.connector.createdUser) {
			this.signupStatus = 'userCreated';
		} else {
			this.signupStatus = 'signedIn';
		}
	}

	// signup token allows a client session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		this.log('NEWRELIC IDP TRACK: Saving signup token...');

		const { signupToken } = this.request.body;
		let { signupTokenExpiresIn } = this.request.body;
		if (signupTokenExpiresIn) {
			const TEN_MINUTES = 10 * 60 * 1000;
			signupTokenExpiresIn = parseInt(expiresIn);
			if (signupTokenExpiresIn > TEN_MINUTES) {
				signupTokenExpiresIn = TEN_MINUTES;
			}
		}

		await this.api.services.signupTokens.insert(
			signupToken,
			this.user ? this.user.id : null,
			{
				requestId: this.request.id,
				expiresIn: signupTokenExpiresIn,
				more: {
					signupStatus: this.signupStatus,
					error: this.errorCode,
					provider: 'newrelicidp',
					teamId: this.team && this.team.id,
					sharing: true
				}
			}
		);
	}
}

module.exports = NRLoginRequest;
