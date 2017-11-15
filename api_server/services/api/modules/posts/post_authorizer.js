'use strict';

class PostAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	authorizePost (callback) {
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
				return callback(this.errorHandler.error('attributeRequired', { info: 'teamId' }));
			}
		}
		else {
			return callback(this.errorHandler.error('attributeRequired', { info: 'streamId' }));
		}
	}

	authorizeStream (streamId, callback) {
		this.user.authorizeStream(
			streamId,
			this.request,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('createAuth', { reason: 'not authorized for stream' }));
				}
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
}

module.exports = PostAuthorizer;
