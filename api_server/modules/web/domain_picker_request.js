// handle the "GET /web/domain-picker" request to offer a web-based domain picker to users who have gone through signup flow

'use strict';

const WebRequestBase = require('./web_request_base');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const GetEligibleJoinCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/get_eligible_join_companies');
const WebmailCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/webmail_companies');

const UserPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_publisher');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const WebErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/errors');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class DomainPickerRequest extends WebRequestBase {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthenticatorErrors);
		this.errorHandler.add(UserErrors);
	}

	async authorize () {
		// only applies to the user in the token payload, no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.verifyToken();		// make sure the token is valid, and parse the payload
		await this.getUser();			// get the user associated with the ID in the token
		// get list of companies the user is eligible to join, if none, proceed to
		// company creation in IDE
		if (await this.getEligibleJoinCompanies())  {
			await this.showDomainPicker();	// show the domain picker
		}  else {
			await this.sendResponse();			// redirect to final auth complete
		}
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['t']
				}
			}
		);
		this.token = this.request.query.t;
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}
	}

	// parse and verify the passed token
	async verifyToken () {
		try {
			this.payload = this.api.services.tokenHandler.verify(this.token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (this.payload.type !== 'dpck') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a domain-picker token' });
		}
	}

	// get the user associated with the ID in the token payload
	async getUser () {
		if (!this.payload.uid) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no uid found in token' });
		}
		this.user = await this.data.users.getById(this.payload.uid);
		if (!this.user) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'user not found' });
		}
	}

	// get list of companies the user is not a member of, but is eligible to join
	async getEligibleJoinCompanies () {
		this.email = this.user.get('email');
		this.domain = EmailUtilities.parseEmail(this.email).domain.toLowerCase();
		this.isWebmail = WebmailCompanies.includes(this.domain);

		const ignoreDomain = this.isWebmail;
		const ignoreInvite = false;

		this.eligibleJoinCompanies = await GetEligibleJoinCompanies(
			this.email,
			this,
			{ ignoreDomain, ignoreInvite }
		);
		return this.eligibleJoinCompanies.length > 0;
	}

	async showDomainPicker () {
		// get redirect url for when selection is complete, this re-auths against the provider
		// so we can (finally) get an IdP token
		//const redirectUri = this.getReauthRedirectUri();
		const host = this.api.config.apiServer.marketingSiteUrl;
		const authCompletePage = this.serviceAuth.getAuthCompletePage();
		const redirectUri = `${host}/auth-complete/${authCompletePage}`;
				
		const byInvite = this.eligibleJoinCompanies.filter(ejc => ejc.byInvite);
		const byDomain = this.eligibleJoinCompanies.filter(ejc => ejc.byDomain);
		const companyName = this.isWebmail ? 'My Organization' : this.domain;
		const csrf = this.request.csrfToken();
 		const templateProps = {
			byInvite,
			byDomain,
			companyName,
			signupToken: this.payload.st,
			csrf,
			segmentKey: this.api.config.telemetry.segment.webToken,
			redirectUri,
			provider: this.provider
		};

		await super.render('domain_picker', templateProps);
	}

	// send the redirect response for final auth complete
	async sendResponse () {
		const host = this.api.config.apiServer.marketingSiteUrl;
		const authCompletePage = this.serviceAuth.getAuthCompletePage();
		const redirect = `${host}/auth-complete/${authCompletePage}`;
		this.response.redirect(redirect);
		this.responseHandled = true;
	}

	// after the initial auth process is complete, and user chooses what company they want
	// to join (or have created one), then we do a re-auth to establish IDP identity within
	// the organiziation ... kind of insane
	getReauthRedirectUri () {
		const expiresIn = 60 * 1000;
		const expiresAt = Date.now() + expiresIn;
		const code = this.api.services.tokenHandler.generate(
			payload,
			'rauth',
			{ expiresAt }
		);

		// set up options for initiating a redirect 
		const { authOrigin, publicApiUrl, callbackEnvironment } = this.api.config.apiServer;
		let state = `${callbackEnvironment}!${code}`;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			state,
			provider: this.provider,
			request: this,
			redirectUri,
			sharing: true,
			signupToken: payload.st,
			publicApiUrl
		};
		this.log('redirectUri: ' + redirectUri);

		// get the specific query data to use in the redirect, and respond with the redirect url
		const { parameters, url } = this.serviceAuth.getRedirectData(options); 
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `${url}?${query}`;
	}
}

module.exports = DomainPickerRequest;
