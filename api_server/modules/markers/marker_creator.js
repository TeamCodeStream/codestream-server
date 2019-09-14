// this class should be used to create all marker documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Marker = require('./marker');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const RepoCreator = require(process.env.CS_API_TOP + '/modules/repos/repo_creator');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class MarkerCreator extends ModelCreator {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async createMarker (attributes) {
		return await this.createModel(attributes);
	}

	// these attributes are required or optional to create a marker document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'code']
			},
			optional: {
				string: ['fileStreamId', 'postId', 'postStreamId', 'providerType', 'code', 'file', 'repo', 'repoId', 'commitHash', 'commitHashWhenCreated', 'branchWhenCreated'],
				array: ['location', 'locationWhenCreated'],
				'array(string)': ['remotes'],
				'array(object)': ['referenceLocations']
			}
		};
	}

	async validateAttributes () {
		this.attributes.id = this.collection.createId();	 // pre-allocate an ID
		this.attributes.commitHashWhenCreated = this.attributes.commitHashWhenCreated || this.attributes.commitHash; // client can provide either
		delete this.attributes.commitHash;
		if (this.attributes.commitHashWhenCreated) {
			this.attributes.commitHashWhenCreated = this.attributes.commitHashWhenCreated.toLowerCase();
		}
		this.attributes.locationWhenCreated = this.attributes.locationWhenCreated || this.attributes.location;	// client can provider either
		delete this.attributes.location;
		this.attributes.creatorId = this.request.user.id;

		// validate incoming locations, which can include information from 
		// commitHashWhenCreated and locationWhenCreated, or can include multiple
		// reference locations
		const result = this.validateLocations();
		if (result) {
			return result;
		}

		// if there is a postId, there must be a postStreamId
		if (this.attributes.postId && !this.attributes.postStreamId) {
			return 'no postStreamId with postId';
		}

		// don't allow more than 100 remotes, just general protection against resource hogging
		if (this.attributes.remotes && this.attributes.remotes.length > 100) {
			return 'too many remotes';
		}

		// normalize the remotes
		if (this.attributes.remotes) {
			this.attributes.remotes = this.attributes.remotes.map(remote => NormalizeUrl(remote));
		}

		// markers that are to be tied to a stream (so they have a stream ID, or they
		// have a file and repo info) must have a commit hash
		if (
			this.attributes.fileStreamId || 
			(
				this.attributes.file &&
				(
					this.attributes.repoId ||
					this.attributes.remotes
				)
			)
		) {
			if (!this.attributes.commitHashWhenCreated) {
				return 'commitHash must be provided for markers attached to a stream with a repo';
			}
		}
	}
 
	// multiple locations, linked to commit hashes, may be provided with markers
	// each must have a commit hash and a valid set of location coordinates
	validateLocations () {
		// we can accept locations in proper form directly from the request...
		let unvalidatedLocations = [];
		if (this.attributes.referenceLocations) {
			unvalidatedLocations = this.attributes.referenceLocations;
			delete this.attributes.referenceLocations;
		}

		// ...and/or if given with commitHashWhenCreated and locationWhenCreated,
		// form another location from these
		if (
			this.attributes.commitHashWhenCreated &&
			this.attributes.locationWhenCreated &&
			!unvalidatedLocations.find(location => location.commitHash === this.attributes.commitHashWhenCreated)
		) {
			const referenceLocation = {
				commitHash: this.attributes.commitHashWhenCreated,
				location: this.attributes.locationWhenCreated
			};
			if (this.attributes.branchWhenCreated) {
				referenceLocation.branch = this.attributes.branchWhenCreated;
			}
			unvalidatedLocations.unshift(referenceLocation);
		}

		// make sure all the location objects are validated, including their actual location coordinates
		this.attributes.referenceLocations = [];
		for (let location of unvalidatedLocations) {
			if (typeof location.commitHash !== 'string' || location.commitHash.length === 0) {
				return 'locations must have commitHash which must be a string';
			}
			const result = MarkerCreator.validateLocation(location.location);
			if (result) {
				return `invalid location ${location.location}: ${result}`;
			}
			const validatedLocation = {
				commitHash: location.commitHash.toLowerCase(),
				location: location.location
			};
			if (typeof location.flags === 'object') {
				validatedLocation.flags = location.flags;
			}
			this.attributes.referenceLocations.push(validatedLocation);
		}
	}

	// validate a marker location, must be in the strict format:
	// [lineStart, columnStart, lineEnd, columnEnd, fifthElement]
	// the first four elements are coordinates and are required
	// the fifth element must be an object and can contain additional information about the marker location
	static validateLocation (location) {
		if (!(location instanceof Array)) {
			return 'location must be an array';
		}
		else if (location.length < 4) {
			return 'location array must have at least 4 elements';
		}
		else if (location.length > 5) {
			return 'location array is too long';
		}
		let firstFour = location.slice(0, 4);
		if (firstFour.find(coordinate => typeof coordinate !== 'number')) {
			return 'first four coordinations of location array must be numbers';
		}
		if (location.length === 5 && typeof location[4] !== 'object') {
			return 'fifth element of location must be an object';
		}
	}

	// right before the document is saved...
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (this.codemarkId) {
			this.attributes.codemarkId = this.codemarkId;
		}
		await this.getTeam();					// get the team that will own the marker
		await this.getStream();					// get the file-stream for the marker, if provided
		await this.getOrCreateRepo();			// get or create a repo to which the marker will belong, if applicable
		await this.createFileStream();			// create a file-stream for the marker, as needed
		if (this.trialRun) {
			// on a trial run, we're not actually saving the marker, so indicate to the base-class
			// that we don't want an actual save, but it will still create a model for us
			this.suppressSave = true;
			return;
		}
		await this.updateMarkerLocations();		// update the marker's location for the particular commit
		await super.preSave();					// proceed with the save...
	}

	// get the team that will own the marker
	async getTeam () {
		this.team = await this.request.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.request.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// get or create a repo to which the marker will belong, if applicable
	async getOrCreateRepo () {
		if (!this.attributes.commitHashWhenCreated) {
			// can't associate with a repo if no commit hash is given
			return;
		}

		// first, get all the repos owned by the team, then fetch the given repo or try to find a match 
		// to the remotes that are given
		await this.getTeamRepos();
		if (this.attributes.repoId) {
			await this.getRepo();
		}
		else if (this.attributes.remotes) {
			await this.findMatchingRepoOrCreate();
			if (this.repo) {
				this.attributes.repoId = this.repo.id;
			}
		}

		// add repo information directly to the marker
		if (this.repo) {
			if (this.repo.get('remotes')) {
				const remotes = this.repo.get('remotes').map(remote => remote.normalizedUrl);
				this.attributes.repo = remotes[0];
			}
			else if (this.repo.get('normalizedUrl')) {
				this.attributes.repo = this.repo.get('normalizedUrl');
			}
		}

		// now that we have a repo, remove any reference in the marker to the remotes
		delete this.attributes.remotes;
	}

	// get all the repos known to this team, we'll try to match the repo that any
	// markers are associated with with one of these repos
	async getTeamRepos () {
		this.teamRepos = await this.request.data.repos.getByQuery(
			{ 
				teamId: this.team.id
			},
			{ 
				hint: RepoIndexes.byTeamId 
			}
		);
	}

	// get the repo as given by a repo ID in the marker attibutes
	async getRepo () {
		this.repo = this.teamRepos.find(repo => repo.id === this.attributes.repoId);
		if (!this.repo) {
			this.repo = await this.request.data.repos.getById(this.attributes.repoId);
			if (!this.repo || this.repo.get('teamId') !== this.team.id) {
				throw this.request.errorHandler.error('notFound', { info: 'marker repo' });	
			}
		}

		if (this.attributes.remotes) {
			await this.updateRepoWithNewRemotes(this.repo, this.attributes.remotes);
		}
	}

	// given a set of remotes in the given marker attributes, try to find a repo owned by the
	// team that matches one of the remotes, if no match is found, create a new repo
	async findMatchingRepoOrCreate () {
		const matchingRepos = this.teamRepos.filter(repo => repo.matchesRemotes(this.attributes.remotes));
		if (matchingRepos.length === 0) {
			await this.createRepo();
		}
		else {
			this.repo = matchingRepos[0];
			if (matchingRepos.length === 1) {
				await this.updateRepoWithNewRemotes(this.repo, this.attributes.remotes);
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
		const op = {
			$push: {
				remotes: remotesToPush
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		const repoUpdateOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data.repos,
			id: repo.id
		}).save(op);
		this.transforms.repoUpdates = this.transforms.repoUpdates || [];
		this.transforms.repoUpdates.push(repoUpdateOp);
	}

	// create a new repo with the given remotes
	async createRepo () {
		const repoInfo = {
			teamId: this.team.id,
			remotes: this.attributes.remotes
		};
		this.repo = await new RepoCreator({
			request: this.request
		}).createRepo(repoInfo);
		this.transforms.createdRepos = this.transforms.createdRepos || [];
		this.transforms.createdRepos.push(this.repo);
	}

	// get the file stream for which the marker is being created
	async getStream () {
		if (!this.attributes.fileStreamId) {
			return;
		}
		this.stream = await this.request.data.streams.getById(this.attributes.fileStreamId);
		if (!this.stream) {
			throw this.request.errorHandler.error('notFound', { info: 'marker stream' });
		}
		if (this.stream.get('type') !== 'file') {
			throw this.request.errorHandler.error('createAuth', { reason: 'marker stream must be a file-type stream' });
		}
		if (this.stream.get('teamId') !== this.team.id) {
			throw this.request.errorHandler.error('createAuth', { reason: 'marker stream must be from the same team' });
		}

		// added to marker for informational purposes
		this.attributes.repoId = this.stream.get('repoId');
		this.attributes.file = this.stream.get('file');  
	}

	// create a file stream for this marker to reference
	async createFileStream () {
		if (this.stream || !this.repo || !this.attributes.file) {
			return;
		}
		const streamInfo = {
			teamId: this.team.id,
			repoId: this.repo.id,
			type: 'file',
			file: this.attributes.file
		};
		this.stream = await new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(streamInfo);
		this.attributes.fileStreamId = this.stream.id;
		this.transforms.createdStreamsForMarkers = this.transforms.createdStreamsForMarkers || [];
		this.transforms.createdStreamsForMarkers.push(this.stream);
	}

	// update the location of this marker in the marker locations structure for this stream and commit
	async updateMarkerLocations () {
		if (!this.stream) { return; } // this is only meaningful if we have a file stream
		await Promise.all(this.attributes.referenceLocations.map(async location => {
			await this.updateMarkerLocationsByCommitHash(location);
		}));
	}

	async updateMarkerLocationsByCommitHash (location) {
		const id = `${this.attributes.fileStreamId}|${location.commitHash}`.toLowerCase();
		let op = {
			$set: {
				teamId: this.attributes.teamId,
				[`locations.${this.attributes.id}`]: location.location
			}
		};
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			op.$set._forTesting = true;
		}
		await this.data.markerLocations.updateDirectWhenPersist(
			{ id },
			op,
			{ upsert: true }
		);

		// marker locations are special, they can be collapsed as long as the marker locations
		// structure refers to the same stream and commit hash
		const newMarkerLocation = {
			teamId: this.team.id,
			streamId: this.stream.id,
			commitHash: location.commitHash,
			locations: {
				[this.attributes.id]: location.location
			}
		};
		this.transforms.markerLocations = this.transforms.markerLocations || [];
		const markerLocations = this.transforms.markerLocations.find(markerLocations => {
			return (
				markerLocations.streamId === newMarkerLocation.streamId &&
				markerLocations.commitHash === newMarkerLocation.commitHash
			);
		});
		if (markerLocations) {
			Object.assign(markerLocations.locations, newMarkerLocation.locations);
		}
		else {
			this.transforms.markerLocations.push(newMarkerLocation);
		}
	}
}

module.exports = MarkerCreator;
