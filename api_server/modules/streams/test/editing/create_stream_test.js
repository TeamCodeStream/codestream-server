'use strict';

const EditingTest = require('./editing_test');
const StreamTestConstants = require('../stream_test_constants');
const Assert = require('assert');

class CreateStreamTest extends EditingTest {

	constructor (options) {
		super(options);
		this.dontWantExistingStream = true;
	}

	get description () {
		return 'should create and return the full stream when a user indicates they are editing a file, specified by path, and there is not yet a stream associated with the file';
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// validate that we got a normal stream
		const stream = data.streams[0];
		const editingUsers = stream.editingUsers;
		const editing = editingUsers[this.currentUser.user._id];
		const errors = [];
		const result = (
			((stream.id === stream._id) || errors.push('id not set to _id')) && 
			((stream.type === 'file') || errors.push('type is not file')) &&
			((stream.teamId === this.data.teamId) || errors.push('teamId does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((stream.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((stream.version === 1) || errors.push('version of created stream is not 1')) &&
			((Object.keys(editingUsers).length === 1) || errors.push('should only be a single key in editingUsers')) &&
			((editing.startedAt > this.editedAfter) || errors.push('startedAt for edit is not greater than before the editing was indicated')) &&
			((editing.commitHash === this.data.editing.commitHash) || errors.push('commitHash does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = CreateStreamTest;
