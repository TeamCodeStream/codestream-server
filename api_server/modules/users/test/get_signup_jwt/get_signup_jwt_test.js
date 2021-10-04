'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const JWT = require('jsonwebtoken');

class GetSignupJWTTest extends CodeStreamAPITest {

	get description () {
		return 'should return JWT with user data in the payload when checking if a registered user has confirmed email';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/signup-jwt';
	}

	getExpectedFields () {
		return ['token'];
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.login,
			this.setExpectedResponse
		], callback);
	}

	// do a login request to set the lastOrigin
	login (callback) {
		const request = {
			method: 'put',
			path: '/no-auth/login',
			data: {
				email: this.currentUser.user.email,
				password: this.currentUser.password
			}
		};
		if (!this.noIDE) {
			request.requestOptions = {
				headers: {
					'X-CS-Plugin-IDE': this.useIDE || 'VS Code'
				}
			};
		}
		this.doApiRequest(request, callback);
	}

	// set the expected response
	setExpectedResponse (callback) {
		const { user } = this.currentUser;
		this.requestSentAfter = Date.now();
		this.expectedResponse = {
			header: {
				alg: 'HS256',
				typ: 'JWT'
			},
			payload: {
				id: user.id,
				email: user.email,
				name: user.fullName,
				protocolHandling: true,
				ide: 'vscode',
				iat: 0 // placeholder
			}
		};
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.token, 'no token in response');
		const decoded = this.verify(data.token);
		Assert(decoded.payload.iat >= Math.floor(this.requestSentAfter/1000), 'iat not set to time of request');
		this.expectedResponse.payload.iat = decoded.payload.iat;
		Assert.deepStrictEqual(decoded, this.expectedResponse, 'response is incorrect');
	}

	verify (token) {
		const secret = this.apiConfig.sharedSecrets.signupFlowJWT;
		const decoded = JWT.verify(token, secret, { complete: true });
		delete decoded.signature; // don't care
		return decoded;
	}
}

module.exports = GetSignupJWTTest;
