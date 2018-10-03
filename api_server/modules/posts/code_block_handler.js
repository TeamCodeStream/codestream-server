'use strict';

const SimpleRepoCreator = require(process.env.CS_API_TOP + '/modules/repos/simple_repo_creator');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class CodeBlockHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	async handleCodeBlock () {
		// validate the code block
		const error = await this.validate();
		if (error) {
			throw this.request.errorHandler.error('validation', { info: `codeBlocks: ${error}` });
		}

		// if the code block specifies a stream ID, get the corresponding stream
		// if the associated post is for a file stream, and the code block doesn't specify
		// a stream at all, we'll inherit from the post stream
		if (
			!this.codeBlock.streamId &&
			!this.codeBlock.file &&
			this.postStream.get('type') === 'file'
		) {
			this.codeBlock.streamId = this.postStream.id;
		}
		if (this.codeBlock.streamId) {
			await this.getStream();
		}

		// if the code block specifies a commit hash, then we need the repo information,
		// so either get the repo specified, or create one 
		if (this.codeBlock.commitHash) {
			await this.getOrCreateRepo();
		}

		// if the code block did not specify a stream ID, but did specify a file and repo,
		// then create a stream for the marker
		if (
			!this.stream &&
			this.repo && 
			this.codeBlock.file
		) {
			await this.createStream();
			if (this.stream) {
				this.codeBlock.streamId = this.stream.id;
			}
		}

		// if we have a commit hash and a stream ID, we can create a marker to the code
		if (
			this.codeBlock.commitHash &&
			this.stream 
		) {
			await this.createMarker();
		}

		// if we have a location and a marker, set the marker location
		if (
			this.codeBlock.location &&
			this.createdMarker
		) {
			await this.setMarkerLocation();
		}

		// return any "side effects" of handling the code block
		return {
			createdStream: this.createdStream,
			createdRepo: this.createdRepo,
			repoUpdate: this.updateRepoOp,
			createdMarker: this.createdMarker,
			markerLocation: this.markerLocation
		};
	}

	async validate () {
		const codeBlockAttributes = {
			required: {
				string: ['code']
			},
			optional: {
				string: ['preContext', 'postContext', 'repoId', 'file', 'streamId', 'commitHash'],
				array: ['location'],
				'array(string)': ['remotes']
			}
		};
		const info = RequireAllow.requireAllow(this.codeBlock, codeBlockAttributes, { strict: true });
		if (info && info.missing && info.missing.length) {
			return 'missing ' + info.missing.join(',');
		}
		else if (info && info.invalid && info.invalid.length) {
			return 'invalid ' + info.invalid.join(',');
		} 
	
		// the location coordinates must be valid
		if (typeof this.codeBlock.location !== 'undefined') {
			const result = MarkerCreator.validateLocation(this.codeBlock.location);
			if (result) {
				return result;
			}
		}

		// don't allow more than 100 remotes, just general protection against resource hogging
		if (this.codeBlock.remotes && this.codeBlock.remotes.length > 100) {
			return 'too many remotes';
		}

		// normalize the remotes
		if (this.codeBlock.remotes) {
			this.codeBlock.remotes = this.codeBlock.remotes.map(remote => NormalizeUrl(remote));
		}

		// code blocks that are to be tied to a stream (so they have a stream ID, or they
		// have a file and repo info) must have a commit hash
		this.codeBlock.commitHash = this.codeBlock.commitHash || this.postCommitHash;
		if (
			this.codeBlock.streamId || 
			(
				this.codeBlock.file &&
				(
					this.codeBlock.repoId ||
					this.codeBlock.remotes
				)
			)
		) {
			if (!this.codeBlock.commitHash) {
				return 'commitHash must be provided for codeBlocks attached to a stream';
			}
		}
	}
 
	async getStream () {
		if (this.codeBlock.streamId === this.postStream.id) {
			this.stream = this.postStream;
		}
		else {
			this.stream = await this.request.data.streams.getById(this.codeBlock.streamId);
			if (!this.stream) {
				throw this.request.errorHandler.error('notFound', { info: 'codeBlock stream' });
			}
		}
		if (this.stream.get('type') !== 'file') {
			throw this.request.errorHandler.error('invalidParameter', { reason: 'codeBlock stream must be a file-type stream' });
		}

		// added to code block for informational purposes
		this.codeBlock.repoId = this.stream.get('repoId');
		this.codeBlock.file = this.stream.get('file');  
	}

	async getOrCreateRepo () {
		if (this.codeBlock.repoId) {
			await this.getRepo();
		}
		else if (this.codeBlock.remotes) {
			await this.findMatchingRepoOrCreate();
			if (this.repo) {
				this.codeBlock.repoId = this.repo.id;
			}
		}

		// add repo information directly to the code block
		// the "repo" part is to be deprecated, to be fully replaced by the array of remotes
		if (this.repo) {
			if (this.repo.get('remotes')) {
				const remotes = this.repo.get('remotes').map(remote => remote.normalizedUrl);
				this.codeBlock.repo = remotes[0];
			}
			else if (this.repo.get('normalizedUrl')) {
				this.codeBlock.repo = this.repo.get('normalizedUrl');
			}
		}

		// now that we have a repo, remove any reference in the code block to the remotes
		delete this.codeBlock.remotes;
	}

	async getRepo () {
		if (this.postRepo && this.codeBlock.repoId === this.postRepo.id) {
			this.repo = this.postRepo;
		}
		else {
			this.repo = this.teamRepos.find(repo => repo.id === this.codeBlock.repoId);
			if (!this.repo) {
				throw this.request.errorHandler.error('notFound', { info: 'codeBlock repo' });
			}
		}
		if (this.codeBlock.remotes) {
			await this.updateRepoWithNewRemotes(this.repo, this.codeBlock.remotes);
		}
	}

	async findMatchingRepoOrCreate () {
		const matchingRepos = this.teamRepos.filter(repo => repo.matchesRemotes(this.codeBlock.remotes));
		if (matchingRepos.length === 0) {
			await this.createRepo();
		}
		else {
			this.repo = matchingRepos[0];
			if (matchingRepos.length === 1) {
				await this.updateRepoWithNewRemotes(this.repo, this.codeBlock.remotes);
			}
		}
	}

	// if we found a matching repo for the remotes passed in, check to see if all
	// the remotes passed in are known for this repo; if not, update the repo with
	// any unknown remotes
	async updateRepoWithNewRemotes (repo, remotes) {
		const repoRemotes = repo.getRemotes() || [];
		const newRemotes = ArrayUtilities.difference(remotes, repoRemotes);
		if (newRemotes.length === 0) {
			return;
		}
		const remotesToPush = newRemotes.map(remote => {
			return {
				url: remote,
				normalizedUrl: remote,
				companyIdentifier: ExtractCompanyIdentifier.getCompanyIdentifier(remote)
			};
		});
		this.updateRepoOp = {
			_id: repo.id,
			$push: {
				remotes: remotesToPush
			}
		};
		await this.request.data.repos.applyOpById(repo.id, this.updateRepoOp);
	}

	async createRepo () {
		const repoInfo = {
			teamId: this.team.id,
			remotes: this.codeBlock.remotes
		};
		this.createdRepo = await new SimpleRepoCreator({
			request: this.request
		}).createRepo(repoInfo);
		this.repo = this.createdRepo;
	}

	async createStream () {
		const streamInfo = {
			teamId: this.team.id,
			repoId: this.repo.id,
			type: 'file',
			file: this.codeBlock.file
		};
		this.createdStream = await new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(streamInfo);
		this.stream = this.createdStream;
	}

	// create a marker, associated with a given code block
	async createMarker () {
		let markerInfo = {
			teamId: this.team.id,
			streamId: this.stream.id,
			postId: this.postId,
			postStreamId: this.postStream.id,
			commitHash: this.codeBlock.commitHash,
			location: this.codeBlock.location,
			codeBlock: this.codeBlock,
			type: this.postAttributes.type,
			status: this.postAttributes.status,
			color: this.postAttributes.color
		};
		this.createdMarker = await new MarkerCreator({
			request: this.request
		}).createMarker(markerInfo);
		this.codeBlock.markerId = this.createdMarker.id;
	}

	async setMarkerLocation () {
		// add a marker location for the location of this code block
		this.markerLocation = {
			teamId: this.team.id,
			streamId: this.stream.id,
			commitHash: this.createdMarker.get('commitHashWhenCreated'),
			locations: {
				[this.createdMarker.id]: this.codeBlock.location
			}
		};
		delete this.codeBlock.location; // gets put into the marker location
	}
}

module.exports = CodeBlockHandler;
