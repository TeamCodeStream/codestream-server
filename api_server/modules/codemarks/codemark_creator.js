// this class should be used to create all codemark documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Codemark = require('./codemark');
const MarkerCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/marker_creator');
const CodemarkTypes = require('./codemark_types');
const CodemarkAttributes = require('./codemark_attributes');
const PermalinkCreator = require('./permalink_creator');
const CodemarkHelper = require('./codemark_helper');
const RepoMatcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_matcher');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const MarkerConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/marker_constants');

class CodemarkCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this.request });
	}

	get modelClass () {
		return Codemark;	// class to use to create an codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async createCodemark (attributes) {
		return await this.createModel(attributes);
	}

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have markers, preemptively make sure they are valid, 
		// we are strict about markers, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.markers) {
			await this.validateMarkers();
		}
		
		// if we have url container objects, validate them
		const result = 
			MarkerCreator.validateUrlObject(this.attributes, 'remoteCodeUrl') ||
			MarkerCreator.validateUrlObject(this.attributes, 'threadUrl');
		if (result) {
			throw this.errorHandler.error('validation', { info: result });
		}

		/*
		if (this.attributes.text && this.attributes.text.match(/nr codemark error/) && this.user.get('email').match(/codestream\.com$/)) {
			throw new Error('hash table index out of range');
		}
		*/
	}

	// validate the markers sent with the codemark creation, this is too important to just drop,
	// so we return an error instead
	async validateMarkers () {
		const result = new Codemark().validator.validateArrayOfObjects(
			this.attributes.markers,
			{
				type: 'array(object)',
				maxLength: CodemarkAttributes.markerIds.maxLength,
				maxObjectLength: MarkerConstants.maxMarkerLength
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `markers: ${result}` });
		}
	}

	// validate a url container object, really just restricting it to a name and a url, for now
	validateUrlObject (objectName) {
		const { urlObject } = this.attributes;
		if (!urlObject) return;
		const { name, url } = urlObject;
		if (!name || typeof name !== 'string' || !url || typeof url !== 'string') {
			throw this.errorHandler.error('validation', { info: `${objectName}: name and url are required and must be strings` } );
		}
		this.attributes[objectName] = { name, url };
	}

	// these attributes are required or optional to create an codemark document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				boolean: ['isChangeRequest', '_dontCreatePermalink'],
				string: ['postId', 'streamId', 'parentPostId', 'providerType', 'status', 'color', 'title', 'text', 'externalProvider', 'externalProviderHost', 'externalProviderUrl', 'createPermalink'],
				object: ['remoteCodeUrl', 'threadUrl'],
				'array(object)': ['markers', 'externalAssignees', 'attachments'],
				'array(string)': ['assignees', 'relatedCodemarkIds', 'tags', 'followerIds']
			}
		};
	}

	/* eslint complexity: ["error", 21] */
	// right before the document is saved...
	async preSave () {
		// special for-testing header for easy wiping of test data
		if (this.request.isForTesting()) {
			this.attributes._forTesting = true;
		}

		// establish some default attributes
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.originDetail = this.originDetail || this.request.request.headers['x-cs-plugin-ide-detail'] || '';
		this.attributes.creatorId = this.request.user.id;
		if (CodemarkTypes.INVISIBLE_TYPES.includes(this.attributes.type)) {
			this.attributes.invisible = true;
		}

		// are we requesting a permalink? really just need to know if a public permalink is requested
		this.permalinkType = this.attributes.createPermalink;
		delete this.attributes.createPermalink;

		// this is just for testing
		this.dontCreatePermalink = this.attributes._dontCreatePermalink;
		delete this.attributes._dontCreatePermalink;

		// pre-allocate an ID
		this.createId();
		
		// get the team that will own this codemark
		await this.getTeam();

		// if we have tags, make sure they are all valid
		await this.codemarkHelper.validateTags(this.attributes.tags, this.team);

		// if there is a color, that comes from an older version of the extension, 
		// and should be made into a tag
		if (this.attributes.color && !this.attributes.tags) {
			this.attributes.tags = [`_${this.attributes.color}`];	// assume this is the ID we want to use
		}

		// we'll need all the repos for the team if there are markers, and we'll use a "RepoMatcher" 
		// to match the marker attributes to a repo if needed
		if (this.attributes.markers && this.attributes.markers.length > 0) {
			await this.getTeamRepos();
			this.repoMatcher = new RepoMatcher({
				request: this.request,
				team: this.team,
				teamRepos: this.teamRepos
			});
		}

		// for link-type codemarks, we do a "trial run" of creating the markers ... this is because
		// we need the logic that associates code blocks with repos and file streams, but we don't
		// actuallly want to create the markers yet, in case we already have a duplicate codemark
		this.trialRun = this.attributes.type === 'link';
		await this.handleMarkers();	// handle any associated markers

		// now look for an existing codemark as needed
		if (await this.findExisting()) {
			return;
		}

		// if we did a trial run looking for an existing codemark, but didn't find one, 
		// now create the markers for real
		if (this.trialRun) {
			this.trialRun = false;
			await this.handleMarkers();
		}

		// link or unlink related codemarks to this one
		await this.codemarkHelper.changeCodemarkRelations({}, this.attributes, this.team.id);

		// validate assignees, for issues
		await this.codemarkHelper.validateAssignees({}, this.attributes, { team: this.team });

		// handle this codemark as attached to a review, if applicable
		if (this.attributes.parentPostId && !this.attributes.providerType) {
			this.parentPost = await this.data.posts.getById(this.attributes.parentPostId);
			if (!this.parentPost) {
				throw this.errorHandler.error('notFound', { info: 'parent post' });
			}
			if (this.parentPost.get('reviewId')) {
				await this.handleReviewCodemark();
			} else if (this.parentPost.get('codeErrorId')) {
				await this.handleCodeErrorCodemark();
			} else {
				delete this.attributes.isChangeRequest; // not applicable outside of a code review codemark
			}
		}
		else {
			delete this.attributes.isChangeRequest; // not applicable outside of a code review codemark
		}

		// handle followers, either passed in or default for the given situation
		// if this codemark is being attached to a review, make sure the creator of the review is
		// added as a follower of the codemark 
		this.attributes.followerIds = this.attributes.followerIds || [];
		if (this.review && !this.attributes.followerIds.includes(this.review.get('creatorId'))) {
			this.attributes.followerIds.push(this.review.get('creatorId'));
		}
		if (this.codeError && !this.attributes.followerIds.includes(this.codeError.get('creatorId'))) {
			this.attributes.followerIds.push(this.codeError.get('creatorId'));
		}
		this.attributes.followerIds = await this.codemarkHelper.handleFollowers(
			this.attributes,
			{
				mentionedUserIds: this.mentionedUserIds,
				team: this.team,
				usersBeingAddedToTeam: this.usersBeingAddedToTeam
			}
		);

		// create a permalink to this codemark, as needed
		if (!this.dontCreatePermalink) {
			await this.createPermalink();
		}

		// pre-set createdAt and lastActivityAt attributes
		this.attributes.createdAt = this.attributes.lastActivityAt = Date.now();
		
		// proceed with the save...
		await super.preSave();
	}

	// get the team that will own this codemark
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// get all the repos known to this team
	async getTeamRepos () {
		this.teamRepos = await this.data.repos.getByQuery(
			{ 
				teamId: this.team.id,
				deactivated: false
			},
			{ 
				hint: RepoIndexes.byTeamId 
			}
		);
	}

	// handle any markers tied to the codemark
	async handleMarkers () {
		if (!this.attributes.markers || !this.attributes.markers.length) {
			return;
		}
		if (this.trialRun) {
			this.trialRunMarkers = [];
		}
		for (let marker of this.attributes.markers) {
			await this.handleMarker(marker);
		}
		if (!this.trialRun) {
			this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
			this.attributes.fileStreamIds = this.transforms.createdMarkers.
				filter(marker => marker.get('fileStreamId')).
				map(marker => marker.get('fileStreamId'));
			delete this.attributes.markers;
		}
	}

	// handle a single marker attached to the codemark
	async handleMarker (markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id
		});
		if (this.attributes.providerType) {
			markerInfo.providerType = this.attributes.providerType;
		}
		if (this.attributes.streamId) {
			markerInfo.postStreamId = this.attributes.streamId;
		}
		if (this.attributes.postId) {
			markerInfo.postId = this.attributes.postId;
		}
		const marker = await new MarkerCreator({
			request: this.request,
			codemarkId: this.attributes.id,
			repoMatcher: this.repoMatcher,
			teamRepos: this.teamRepos,
			trialRun: this.trialRun // indicates not to create the marker for real
		}).createMarker(markerInfo);
		if (this.trialRun) {
			this.trialRunMarkers.push(marker);
		}
		else {
			this.transforms.createdMarkers = this.transforms.createdMarkers || [];
			this.transforms.createdMarkers.push(marker);
		}
	}

	// handle a codemark created as part of a code review
	async handleReviewCodemark () {
		// first make sure the user has access to the review, and that it belongs to the same team
		this.attributes.reviewId = this.parentPost.get('reviewId');
		this.review = await this.user.authorizeReview(this.attributes.reviewId, this.request, { excludeFields: ['reviewDiffs', 'checkpointReviewDiffs'] });
		if (!this.review) {
			throw this.errorHandler.error('createAuth', { reason: 'user does not have access to the review' });
		}
		if (this.review.get('teamId') !== this.attributes.teamId) {
			throw this.errorHandler.error('createAuth', { reason: 'review does not belong to the team that would own the codemark' });
		}

		// allow only comment type codemarks
		if (this.attributes.type !== 'comment') {
			throw this.errorHandler.error('validation', { reason: 'codemarks attached to reviews can only be comment-type codemarks' });
		}

		// if this is a change request, set the codemark change request status to "open"
		if (this.attributes.isChangeRequest) {
			this.attributes.status = 'open';
		}
	}

	// handle a codemark created as part of a code error
	async handleCodeErrorCodemark () {
		// first make sure the user has access to the code error
		this.attributes.codeErrorId = this.parentPost.get('codeErrorId');
		this.codeError = await this.user.authorizeCodeError(this.attributes.codeErrorId, this.request);
		if (!this.codeError) {
			throw this.errorHandler.error('createAuth', { reason: 'user does not have access to the code error' });
		}

		// allow only comment type codemarks
		if (this.attributes.type !== 'comment') {
			throw this.errorHandler.error('validation', { reason: 'codemarks attached to code errors can only be comment-type codemarks' });
		}

		// don't allow change requests
		// if this is a change request, set the codemark change request status to "open"
		if (this.attributes.isChangeRequest) {
			throw this.errorHandler.error('validation', { reason: 'codemarks attached to code errors can not be change requests' });
		}
	}

	// create a permalink url to the codemark
	async createPermalink () {
		if (this.existingPermalink) {
			this.attributes.permalink = this.existingPermalink;
		}
		else {
			this.attributes.permalink = await new PermalinkCreator({
				request: this.request,
				codemark: this.attributes,
				markers: this.transforms.createdMarkers || [],
				isPublic: this.permalinkType === 'public'
			}).createPermalink();
		}
		this.transforms.permalink = this.attributes.permalink;
	}

	// find an existing codemark that exactly matches this one, only for link-type codemarks
	// this saves us from creating duplicate codemarks when all we are interested in is a permalink
	async findExisting () {
		// only find existing codemarks for link-types
		if (this.attributes.type !== 'link') {
			return;
		}
		const info = await new PermalinkCreator({
			request: this.request
		}).findPermalink(
			this.attributes,
			this.trialRunMarkers || this.transforms.createdMarkers,
			this.permalinkType === 'public'
		);

		if (info) {
			this.existingModel = this.model = info.codemark;
			this.existingPermalink = info.url;
			return true;
		}
	}
}

module.exports = CodemarkCreator;
