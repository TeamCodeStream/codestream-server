// utility class for checking whether the current user is authorized
// to create a post in a given stream

'use strict';

class PostAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	// authorize post creation for the current user in the given stream
	async authorizePost () {
		await this.authorizeStreamForPost();
		await this.authorizeCodeBlocks();
	}

	// authorize that the creator of a post has access to the stream they are
	// trying to create the post in
	async authorizeStreamForPost () {
		if (this.post.streamId) {
			// we have the stream ID, we can simply authorize against the stream
			await this.authorizeStream(this.post.streamId);
		}
		else if (typeof this.post.stream === 'object') {
			// we're trying to create a stream on the fly with the post ...
			// if it's a file-type stream (with a repoId), we authorize against
			// the repo, otherwise against the team
			if (this.post.stream.repoId) {
				await this.authorizeRepo(this.post.stream.repoId);
			}
			else if (this.post.stream.teamId) {
				await this.authorizeTeam(this.post.stream.teamId);
			}
			else {
				throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
			}
		}
		else {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
	}

	// authorize the current user against the passed stream (by ID)
	async authorizeStream (streamId) {
		this.stream = await this.user.authorizeStream(streamId, this.request);
		if (!this.stream) {
			throw this.errorHandler.error('createAuth', { reason: 'not authorized for stream' });
		}
	}

	// authorize the current user against the passed repo (by ID)
	async authorizeRepo (repoId) {
		const teamId = this.post.stream ? this.post.stream.teamId : this.stream.get('teamId');
		const repo = await this.request.data.repos.getById(repoId);
		if (!repo) {
			throw this.errorHandler.error('notFound', { info: 'repo' });
		}
		if (repo.get('teamId') !== teamId) {
			throw this.errorHandler.error('createAuth', { reason: 'repo not owned by this team '});
		}
		const authorized = await this.user.authorizeRepo(repoId, this.request);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'not authorized for repo' });
		}
	}

	// authorize the current user against the passed team (by ID)
	async authorizeTeam (teamId) {
		const authorized = await this.user.authorizeTeam(teamId, this.request);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
	}

	// authorize each code block in the post ... since code blocks can come from a different
	// stream that the stream the post is being created in, we must check that the user also
	// has access to the streams for the code blocks
	async authorizeCodeBlocks () {
		if (!(this.post.codeBlocks instanceof Array)) {
			return;	// no code blocks, no problemo
		}
		for (let codeBlock of this.post.codeBlocks) {
			await this.authorizeCodeBlock(codeBlock);
		}
	}

	// check that the current user is authorized to send a code block
	async authorizeCodeBlock (codeBlock) {
		if (typeof codeBlock !== 'object') {
			return;	// failsafe
		}

		// if the code block doesn't refer to a stream ID, then either it will not be 
		// attached to any stream (ok), or it will be attached to a stream created on-the-fly,
		// that belongs to a repo ... in the latter case, the user must have access to the repo
		if (!codeBlock.streamId) {
			if (codeBlock.file) {
				if (codeBlock.repoId) {
					await this.authorizeRepo(codeBlock.repoId);
				}
			}
			return;
		}

		// verify we have access to the stream the code block comes from, which might be
		// different than the stream we are posting to 
		const stream = await this.user.authorizeStream(codeBlock.streamId, this.request);
		if (!stream) {
			throw this.errorHandler.error('notFound', { info: 'codeBlock stream' });
		}

		// can't pull a code block from a stream that is not a file stream
		if (stream.get('type') !== 'file') {
			throw this.errorHandler.error('invalidParameter', { reason: 'only file type streams can have code blocks' });
		}

		// the team that owns the stream must be the same as the team the owns the stream the post
		// is being created in
		const teamId = this.post.stream ? this.post.stream.teamId : this.stream.get('teamId');
		if (stream.get('teamId') !== teamId) {
			throw this.errorHandler.error('createAuth', { reason: 'codeBlock not authorized for stream' });
		}
	}
}

module.exports = PostAuthorizer;
