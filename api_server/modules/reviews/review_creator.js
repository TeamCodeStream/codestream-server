// this class should be used to create all review documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Review = require('./review');
const MarkerCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/marker_creator');
const CodemarkHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_helper');
const ReviewAttributes = require('./review_attributes');
const RepoMatcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_matcher');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const PermalinkCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/permalink_creator');
const ReviewHelper = require('./review_helper');

class ReviewCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this });
	}

	get modelClass () {
		return Review;	// class to use to create a review model
	}

	get collectionName () {
		return 'reviews';	// data collection to use
	}

	// convenience wrapper
	async createReview (attributes) {
		return await this.createModel(attributes);
	}

	// these attributes are required or optional to create an codemark document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'streamId', 'postId', 'title'],
				'array(object)': ['reviewChangesets']
			},
			optional: {
				string: ['text', 'status', 'entryPoint'],
				object: ['authorsById'],
				boolean: ['allReviewersMustApprove', '_dontCreatePermalink'],
				'array(string)': ['reviewers', 'followerIds', 'codeAuthorIds', 'fileStreamIds', 'tags'],
				'array(object)': ['markers']
			}
		};
	}

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have markers, preemptively make sure they are valid, 
		// we are strict about markers, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.markers) {
			await this.validateMarkers();
		}
	}

	// validate the markers sent with the review creation, this is too important to just drop,
	// so we return an error instead
	async validateMarkers () {
		const result = new Review().validator.validateArrayOfObjects(
			this.attributes.markers,
			{
				type: 'array(object)',
				maxLength: ReviewAttributes.markerIds.maxLength,
				maxObjectLength: 100000
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `markers: ${result}` });
		}
	}

	// right before the document is saved...
	async preSave () {
		// can not accept empty reviewChangesets
		if (this.attributes.reviewChangesets.length === 0) {
			throw this.errorHandler.error('invalidParameter', { reason: 'reviewChangesets cannot be empty' });
		}

		// special for-testing header for easy wiping of test data
		if (this.request.isForTesting()) {
			this.attributes._forTesting = true;
		}

		// establish some default attributes
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.originDetail = this.originDetail || this.request.request.headers['x-cs-plugin-ide-detail'] || '';
		this.attributes.creatorId = this.request.user.id;

		// this is just for testing
		this.dontCreatePermalink = this.attributes._dontCreatePermalink;
		delete this.attributes._dontCreatePermalink;

		// pre-allocate an ID
		this.createId();
		
		// get the team that will own this codemark
		await this.getTeam();

		// if we have tags, make sure they are all valid
		await this.codemarkHelper.validateTags(this.attributes.tags, this.team);

		// we'll need all the repos for the team if there are markers, and we'll use a "RepoMatcher" 
		// to match the marker attributes to a repo if needed
		await this.getTeamRepos();
		this.repoMatcher = new RepoMatcher({
			request: this.request,
			team: this.team,
			teamRepos: this.teamRepos
		});

		// validate the repo change-sets against the team repos
		await ReviewHelper.validateReviewChangesetsForTeamRepos(
			this.attributes.reviewChangesets,
			this.teamRepos,
			this.request
		);

		// handle any markers that come with this review
		await this.handleMarkers();

		// handle any change sets that come with this review
		await ReviewHelper.handleReviewChangesets(this.attributes);

		// validate reviewers
		await this.validateReviewersAndAuthors();

		// handle followers, either passed in or default for the given situation
		this.attributes.followerIds = ArrayUtilities.unique([
			...(this.attributes.reviewers || []),
			...(this.attributes.followerIds || []),
			...(this.attributes.codeAuthorIds || [])
		]);
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

	// get the team that will own this review
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
				teamId: this.team.id
			},
			{ 
				hint: RepoIndexes.byTeamId 
			}
		);
	}

	// create a permalink url to the codemark
	async createPermalink () {
		this.attributes.permalink = await new PermalinkCreator({
			request: this.request,
			review: this.attributes,
			markers: this.transforms.createdMarkers || []
		}).createPermalink();
	}

	// handle any markers tied to the codemark
	async handleMarkers () {
		if (!this.attributes.markers || !this.attributes.markers.length) {
			return;
		}
		for (let marker of this.attributes.markers) {
			await this.handleMarker(marker);
		}
		this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
		this.attributes.fileStreamIds = this.transforms.createdMarkers.
			filter(marker => marker.get('fileStreamId')).
			map(marker => marker.get('fileStreamId'));
		delete this.attributes.markers;
	}

	// handle a single marker attached to the codemark
	async handleMarker (markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id
		});
		if (this.attributes.streamId) {
			markerInfo.postStreamId = this.attributes.streamId;
		}
		if (this.attributes.postId) {
			markerInfo.postId = this.attributes.postId;
		}
		const marker = await new MarkerCreator({
			request: this.request,
			reviewId: this.attributes.id,
			repoMatcher: this.repoMatcher,
			teamRepos: this.teamRepos
		}).createMarker(markerInfo);
		this.transforms.createdMarkers = this.transforms.createdMarkers || [];
		this.transforms.createdMarkers.push(marker);
	}

	// validate the reviewers ... all users must be on the same team
	async validateReviewersAndAuthors () {
		const userIds = ArrayUtilities.union(
			this.attributes.reviewers || [],
			Object.keys(this.attributes.authorsById || {})
		);
		if (userIds.length === 0) {
			return;
		}

		// get the users and make sure they're on the same team
		await this.codemarkHelper.validateUsersOnTeam(userIds, this.team.id, 'reviewers or authors', this.usersBeingAddedToTeam);
	}
}

module.exports = ReviewCreator;
