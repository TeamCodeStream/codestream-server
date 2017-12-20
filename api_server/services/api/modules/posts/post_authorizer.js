'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class PostAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	authorizePost (callback) {
		BoundAsync.series(this, [
			this.authorizeStreamForPost,
			this.authorizeCodeBlocks
		], callback);
	}

	authorizeStreamForPost (callback) {
		if (this.post.streamId) {
			this.authorizeStream(this.post.streamId, callback);
		}
		else if (typeof this.post.stream === 'object') {
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

	authorizeCodeBlocks (callback) {
		if (!(this.post.codeBlocks instanceof Array)) {
			return callback();
		}
		BoundAsync.forEachLimit(
			this,
			this.post.codeBlocks,
			5,
			this.authorizeCodeBlock,
			callback
		);
	}

	authorizeCodeBlock (codeBlock, callback) {
		if (typeof codeBlock !== 'object') {
			return callback();
		}
		if (!codeBlock.streamId && !this.post.streamId) {
			return callback();
		}
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
					return callback(this.errorHandler.error('invalidParameter', { reason: 'only file type streams can have code blocks' }));
				}
				else if (stream.get('teamId') !== teamId
				) {
					return callback(this.errorHandler.error('createAuth', { reason: 'codeBlock not authorized for stream' }));
				}
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = PostAuthorizer;
