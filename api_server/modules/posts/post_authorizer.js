// utility class for checking whether the current user is authorized
// to create a post in a given stream

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class PostAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	// authorize post creation for the current user in the given stream
	authorizePost (callback) {
		BoundAsync.series(this, [
			this.authorizeStreamForPost,
			this.authorizeCodeBlocks
		], callback);
	}

	// authorize that the creator of a post has access to the stream they are
	// trying to create the post in
	authorizeStreamForPost (callback) {
		if (this.post.streamId) {
			// we have the stream ID, we can simply authorize against the stream
			this.authorizeStream(this.post.streamId, callback);
		}
		else if (typeof this.post.stream === 'object') {
			// we're trying to create a stream on the fly with the post ...
			// if it's a file-type stream (with a repoId), we authorize against
			// the repo, otherwise against the team
			if (this.post.stream.repoId) {
				this.authorizeRepo(this.post.stream.repoId, callback);
			}
			else if (this.post.stream.teamId) {
				this.authorizeTeam(this.post.stream.teamId, callback);
			}
			else {
				return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
			}
		}
		else {
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId' }));
		}
	}

	// authorize the current user against the passed stream (by ID)
	authorizeStream (streamId, callback) {
		this.user.authorizeStream(
			streamId,
			this.request,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('createAuth', { reason: 'not authorized for stream' }));
				}
				this.stream = stream;
				return process.nextTick(callback);
			}
		);
	}

	// authorize the current user against the passed repo (by ID)
	authorizeRepo (repoId, callback) {
		this.user.authorizeRepo(
			repoId,
			this.request,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('createAuth', { reason: 'not authorized for repo' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	// authorize the current user against the passed team (by ID)
	authorizeTeam (teamId, callback) {
		this.user.authorizeTeam(
			teamId,
			this.request,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('createAuth', { reason: 'user not on team' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	// authorize each code block in the post ... since code blocks can come from a different
	// stream that the stream the post is being created in, we must check that the user also
	// has access to the streams for the code blocks
	authorizeCodeBlocks (callback) {
		if (!(this.post.codeBlocks instanceof Array)) {
			return callback();	// no code blocks, no problemo
		}
		BoundAsync.forEachLimit(
			this,
			this.post.codeBlocks,
			5,
			this.authorizeCodeBlock,
			callback
		);
	}

	// check that the current user is authorized to send a code block
	authorizeCodeBlock (codeBlock, callback) {
		if (typeof codeBlock !== 'object') {
			return callback();	// failsafe
		}
		if (!codeBlock.streamId && !this.post.streamId) {
			return callback();	// failsafe
		}
		// verify we have access to the stream the code block comes from, which might be
		// different than the stream we are posting to
		let teamId = this.post.stream ? this.post.stream.teamId : this.stream.get('teamId');
		this.user.authorizeStream(
			codeBlock.streamId || this.post.streamId,
			this.request,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));
				}
				else if (stream.get('type') !== 'file') {
					// can't pull a code block from a stream that is not a file stream
					return callback(this.errorHandler.error('invalidParameter', { reason: 'only file type streams can have code blocks' }));
				}
				else if (stream.get('teamId') !== teamId
				) {
					// the team that owns the stream must be the same as the team the owns the stream the post
					// is being created in
					return callback(this.errorHandler.error('createAuth', { reason: 'codeBlock not authorized for stream' }));
				}
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = PostAuthorizer;
