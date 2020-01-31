'use strict';

const Assert = require('assert');
const CodemarkTestConstants = require('./codemark_test_constants');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const MarkerValidator = require(process.env.CS_API_TOP + '/modules/markers/test/marker_validator');

class CodemarkValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateCodemark (data) {
		// verify we got back an codemark with the attributes we specified
		const codemark = data.codemark;
		const expectedOrigin = this.expectedOrigin || '';
		let errors = [];
		let result = (
			((codemark.id === codemark._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((codemark.teamId === this.test.team.id) || errors.push('teamId does not match the team')) &&
			((codemark.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof codemark.createdAt === 'number') || errors.push('createdAt not number')) &&
			((codemark.lastActivityAt === codemark.createdAt) || errors.push('lastActivityAt should be set to createdAt')) &&
			((codemark.modifiedAt >= codemark.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((codemark.creatorId === this.test.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((codemark.type === this.inputCodemark.type) || errors.push('type does not match')) &&
			((codemark.status === this.inputCodemark.status) || errors.push('status does not match')) &&
			((codemark.color === this.inputCodemark.color) || errors.push('color does not match')) &&
			((codemark.text === this.inputCodemark.text) || errors.push('text does not match')) &&
			((codemark.title === this.inputCodemark.title) || errors.push('title does not match')) &&
			((codemark.numReplies === 0) || errors.push('codemark should have 0 replies')) &&
			((codemark.origin === expectedOrigin) || errors.push('origin not equal to expected origin'))
		);
		if (this.inputCodemark.providerType || this.usingCodeStreamChannels) {
			result = result && (
				((codemark.streamId === (this.inputCodemark.streamId || '')) || errors.push('streamId does not match the stream')) &&
				((codemark.postId === (this.inputCodemark.postId || '')) || errors.push('postId does not match the post'))
			);
		}
		else {
			result = result && (
				((codemark.streamId === '') || errors.push('streamId is not empty')) &&
				((codemark.postId === '') || errors.push('postId is not empty'))
			);
		}
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the codemark in the response has no attributes that should not go to clients
		this.test.validateSanitized(codemark, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate the codemark's permalink
		this.validatePermalink(codemark.permalink);

		// if we are expecting a provider type, check it now
		if (this.test.expectProviderType) {
			Assert.equal(codemark.providerType, this.inputCodemark.providerType, 'providerType is not equal to the given providerType');
		}
		else {
			Assert.equal(typeof codemark.providerType, 'undefined', 'codemark providerType should be undefined');
		}

		// if we are expecting a marker with the codemark, validate it
		if (this.test.expectMarkers) {
			new MarkerValidator({
				test: this.test,
				objectName: 'codemark',
				inputObject: this.inputCodemark,
				usingCodeStreamChannels: this.usingCodeStreamChannels
			}).validateMarkers(data);
		}
		else {
			Assert(typeof data.markers === 'undefined', 'markers array should not be defined');
		}
	}

	// validate the returned permalink URL is correct
	validatePermalink (permalink) {
		const type = this.test.permalinkType === 'public' ? 'p' : 'c';
		const origin = ApiConfig.publicApiUrl.replace(/\//g, '\\/');
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

module.exports = CodemarkValidator;
