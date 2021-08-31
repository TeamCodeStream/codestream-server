'use strict';

const Assert = require('assert');
const CodeErrorTestConstants = require('./code_error_test_constants');
const MarkerValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/marker_validator');

class CodeErrorValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateCodeError (data) {
		// verify we got back an code error with the attributes we specified
		const codeError = data.codeError;
		const expectedOrigin = this.expectedOrigin || '';
		let errors = [];
		let result = (
			((codeError.id === codeError._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((codeError.teamId === this.test.team.id) || errors.push('teamId does not match the team')) &&
			((codeError.streamId === (this.inputCodeError.streamId || '')) || errors.push('streamId does not match the stream')) &&
			((codeError.postId === (this.inputCodeError.postId || '')) || errors.push('postId does not match the post')) &&
			((codeError.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof codeError.createdAt === 'number') || errors.push('createdAt not number')) &&
			((codeError.lastActivityAt === codeError.createdAt) || errors.push('lastActivityAt should be set to createdAt')) &&
			((codeError.modifiedAt >= codeError.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((codeError.creatorId === this.test.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((codeError.status === this.inputCodeError.status) || errors.push('status does not match')) &&
			((codeError.numReplies === 0) || errors.push('codeError should have 0 replies')) &&
			((codeError.origin === expectedOrigin) || errors.push('origin not equal to expected origin')) &&
			((codeError.stackTraces === this.inputCodeError.stackTraces) || errors.push('stackTraces does not match'))
			((codeError.providerUrl === this.inputCodeError.providerUrl) || errors.push('providerUrl does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the code error in the response has no attributes that should not go to clients
		this.test.validateSanitized(codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);

		// if we are expecting a marker with the code error, validate it
		if (this.test.expectMarkers) {
			new MarkerValidator({
				test: this.test,
				objectName: 'codeError',
				inputObject: this.inputCodeError,
				usingCodeStreamChannels: true
			}).validateMarkers(data);
		}
		else {
			Assert(typeof data.markers === 'undefined', 'markers array should not be defined');
		}

		// validate the code error's permalink
		this.validatePermalink(codeError.permalink);
	}

	// validate the returned permalink URL is correct
	validatePermalink (permalink) {
		const type = 'e';
		const origin = this.test.apiConfig.apiServer.publicApiUrl.replace(/\//g, '\\/');
		const regex = `^${origin}\\/${type}\\/([A-Za-z0-9_-]+)\\/([A-Za-z0-9_-]+)$`;
		const match = permalink.match(new RegExp(regex));
		Assert(match, `returned permalink "${permalink}" does not match /${regex}/`);

		const teamId = this.decodeLinkId(match[1]);
		Assert.equal(teamId, this.test.team.id, 'permalink does not contain proper team ID');
	}

	decodeLinkId (linkId) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Buffer.from(linkId, 'base64').toString('hex');
	}
}

module.exports = CodeErrorValidator;
