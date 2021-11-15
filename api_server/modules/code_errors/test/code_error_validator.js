'use strict';

const Assert = require('assert');
const CodeErrorTestConstants = require('./code_error_test_constants');
const DeepEqual = require('deep-equal');
const StreamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/test/stream_test_constants');

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
		const expectedStackTraces = this.test.expectedStackTraces || this.inputCodeError.stackTraces;
		Assert(codeError.streamId, 'code error has no streamId');
		Assert.equal(data.post.streamId, codeError.streamId, 'streamId of post and streamId of code error do not match');
		let errors = [];
		let result = (
			((codeError.id === codeError._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((codeError.teamId === this.test.team.id) || errors.push('teamId does not match the team')) &&
			((codeError.postId === (this.inputCodeError.postId || '')) || errors.push('postId does not match the post')) &&
			((codeError.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof codeError.createdAt === 'number') || errors.push('createdAt not number')) &&
			((codeError.lastActivityAt === codeError.createdAt) || errors.push('lastActivityAt should be set to createdAt')) &&
			((codeError.modifiedAt >= codeError.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((codeError.creatorId === this.test.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((codeError.accountId === this.inputCodeError.accountId) || errors.push('accountId not correct')) && 
			((codeError.objectId === this.inputCodeError.objectId) || errors.push('objectId not correct')) && 
			((codeError.objectType === this.inputCodeError.objectType) || errors.push('objectType not correct')) && 
			((codeError.numReplies === 0) || errors.push('codeError should have 0 replies')) &&
			((codeError.origin === expectedOrigin) || errors.push('origin not equal to expected origin')) &&
			(DeepEqual(codeError.stackTraces, expectedStackTraces) || errors.push('stackTraces does not match')) &&
			((codeError.providerUrl === this.inputCodeError.providerUrl) || errors.push('providerUrl does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the code error in the response has no attributes that should not go to clients
		this.test.validateSanitized(codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate the code error's permalink
		this.validatePermalink(codeError.permalink);

		// validate the array of followers
		const expectedFollowerIds = this.test.expectedFollowerIds || [this.test.currentUser.user.id];
		expectedFollowerIds.sort();
		const gotFollowerIds = [...(codeError.followerIds || [])];
		gotFollowerIds.sort();
		Assert.deepEqual(gotFollowerIds, expectedFollowerIds, 'code error does not have correct followerIds');

		// validate the created stream, if any
		if (!this.test.dontExpectCreatedStream) {
			this.validateCreatedStream(data);
		} else {
			Assert(!data.streams && !data.stream, 'stream sent in response');
		}
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

	// validate the stream created for the code error
	validateCreatedStream (data) {
		const stream = data.streams[0];
		let errors = [];
		let result = (
			((stream.id === stream._id) || errors.push('stream.id not set to stream._id')) && 	// DEPRECATE ME
			((stream.version === 1) || errors.push('stream.version should be 1')) &&
			((stream.deactivated === false) || errors.push('stream.deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('stream.createdAt not number')) &&
			((typeof stream.modifiedAt === 'number') || errors.push('stream.modifiedAt not number')) &&
			((stream.type === 'object') || errors.push('stream.object not set to "object"')) &&
			((stream.privacy === 'public') || errors.push('stream.privacy not set to "public"')) &&
			((stream.accountId === this.inputCodeError.accountId) || errors.push('stream.accountId not set to the accountId of the code error')) && 
			((stream.objectId === this.inputCodeError.objectId) || errors.push('stream.objectId not set to the objectId of the code error')) && 
			((stream.objectType === this.inputCodeError.objectType) || errors.push('stream.objectType not set to the objectType of the code error')) && 
			((stream.creatorId === this.test.currentUser.user.id) || errors.push('stream.creatorId not equal to current user id')) &&
			((stream.sortId === data.post.id) || errors.push('stream.sortId not set to post.id'))
		);
		Assert(result === true && errors.length === 0, 'stream response not valid: ' + errors.join(', '));

		// verify the stream has no attributes that should not go to clients
		this.test.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = CodeErrorValidator;
