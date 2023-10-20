'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const UUID = require('uuid').v4;

class WebProviderAuthTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}`;
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath,
			this.setRedirectUri
		], callback);
	}

	setPath (callback) {
		this.path = `/web/provider-auth/${this.provider}`;
		const params = this.getQueryParameters();
		if (Object.keys(params).length > 0) {
			this.path += '?' + Object.keys(params).map(key => {
				return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
			}).join('&');
		}
		callback();
	}

	getQueryParameters () {
		const params = {};
		if (this.doSignupToken) {
			params.signupToken = this.signupToken = UUID();
		}
		if (this.doAccess) {
			params.access = this.access = 'string';
		}
		if (this.doNoSignup) {
			params.noSignup = '1';
		}
		if (this.idpDomain) {
			params.domain = this.idpDomain;
		}
		return params;
	}

	setRedirectUri (callback) {
		const authOrigin = this.apiConfig.apiServer.authOrigin;
		this.redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		this.state = `${this.apiConfig.apiServer.callbackEnvironment}!${this.authCode}`;
		callback();
	}

	validateResponse (data) {
		this.validateState(data);
		this.validateCookie();
		let redirectData;
		switch (this.provider) {
		case 'github':
			redirectData = this.getGithubRedirectData();
			break;
		case 'gitlab':
			redirectData = this.getGitlabRedirectData();
			break;
		case 'bitbucket':
			redirectData = this.getBitbucketRedirectData();
			break;
		case 'newrelicidp':
			redirectData = this.getNewRelicIDPRedirectData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}
		const { url, parameters } = redirectData;
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const expectedUrl = `${url}?${query}`;
		Assert.strictEqual(data, expectedUrl, `redirect url not correct for ${this.provider}`);
	}

	validateState (data) {
		if (this.provider === 'newrelicidp') return;

		const query = data.split('?')[1];
		const params = query.split('&');
		const stateParam = params.find(param => param.startsWith('state='));
		this.state = stateParam.split('=')[1];

		const stateParts = this.state.split('!');
		const env = stateParts[0];
		this.realState = stateParts[1];

		const { callbackEnvironment } = this.apiConfig.apiServer;
		Assert.strictEqual(env, callbackEnvironment, 'env not set to callback environment within state parameter');

		return this.validateRealState();
	}

	validateRealState () {
		const payload = new TokenHandler(this.apiConfig.sharedSecrets.auth).decode(this.realState);

		const { publicApiUrl } = this.apiConfig.apiServer;
		Assert.strictEqual(payload.userId, 'anon', 'userId not correct within state payload');
		Assert.strictEqual(payload.url, `${publicApiUrl}/web/provider-auth-complete/${this.provider}`, 'url not correct within state payload');
		Assert.strictEqual(payload.iss, 'CodeStream', 'iss not set to CodeStream within state payload');
		Assert.strictEqual(payload.alg, 'HS256', 'alg not set to HS256 within state payload');
		Assert(payload.exp * 1000 > Date.now(), 'exp not set to future time in state payload');
		Assert(payload.iat * 1000 >= Date.now() - 10000, 'iat not set to nowish in state payload');

		return payload;
	}

	extractCookie () {
		let cookie = this.httpResponse.headers['set-cookie'];
		if (cookie instanceof Array) {
			cookie = cookie.find(c => c.startsWith(`t-${this.provider}=`));
		}
		return (cookie || '').trim();
	}

	validateCookie () {
		const cookie = this.extractCookie();
		const re = `^t-${this.provider}=s(:|%3A)${this.realState}`;
		Assert(cookie.match(new RegExp(re)), 'cookie not found or does not match');
	}

	getGithubRedirectData () {
		const appClientId = this.apiConfig.integrations.github.appClientId;
		const parameters = {
			client_id: appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'repo,read:user,user:email,notifications,read:org'
		};
		const url = `https://github.com/login/oauth/authorize`;
		return { url, parameters };
	}

	getGitlabRedirectData () {
		const appClientId = this.apiConfig.integrations.gitlab.appClientId;
		const parameters = {
			client_id: appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'api'
		};
		const url = `https://gitlab.com/oauth/authorize`;
		return { url, parameters };
	}

	getBitbucketRedirectData () {
		const appClientId = this.apiConfig.integrations.bitbucket.appClientId;
		const scope = 'account team repository issue:write pullrequest:write';
		const parameters = {
			client_id: appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope
		};
		const url = `https://bitbucket.org/site/oauth2/authorize`;
		return { url, parameters };
	}

	getNewRelicIDPRedirectData () {
		const host = this.apiConfig.integrations.newRelicIdentity.loginServiceHost;
		const redirectUri = `${this.apiConfig.apiServer.publicApiUrl}/~nrlogin/${this.signupToken}`;
		const parameters = {
			scheme: redirectUri,
			response_mode: 'code',
			domain_hint: this.idpDomain || 'newrelic.com'
		};
		//const policy = this.doNoSignup ? 'cs' : 'cssignup';
		//const url = `${host}/idp/azureb2c-${policy}/redirect`;
		const url = `${host}/idp/azureb2c/redirect`;
		return { url, parameters };
	}
}

module.exports = WebProviderAuthTest;
