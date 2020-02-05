// this class should be used to create all review documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Review = require('./review');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const CodemarkHelper = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_helper');
const ReviewAttributes = require('./review_attributes');
const RepoMatcher = require(process.env.CS_API_TOP + '/modules/repos/repo_matcher');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');
const ChangesetCreator = require(process.env.CS_API_TOP + '/modules/changesets/changeset_creator');

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
				string: ['teamId', 'streamId', 'postId', 'title']
			},
			optional: {
				string: ['text', 'status'],
				'array(string)': ['reviewers', 'followerIds', 'fileStreamIds', 'tags'],
				'array(object)': ['repoChangesets', 'markers']
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

		// same for the repo change-set, preemptively validate
		if (this.attributes.repoChangesets) {
			await this.validateRepoChangesets();
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

	// validate the repo change-sets sent with the review creation, this is too important to just drop,
	// so we return an error instead
	async validateRepoChangesets () {
		const result = new Review().validator.validateArrayOfObjects(
			this.attributes.repoChangesets,
			{
				type: 'array(object)',
				maxLength: ReviewAttributes.repoChangesetIds.maxLength,
				maxObjectLength: 1000000
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `repoChangesets: ${result}` });
		}
	}

	// right before the document is saved...
	async preSave () {
		// special for-testing header for easy wiping of test data
		if (this.request.isForTesting()) {
			this.attributes._forTesting = true;
		}

		// establish some default attributes
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.creatorId = this.request.user.id;

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
			teamId: this.team.id,
			teamRepos: this.teamRepos
		});

		// validate the repo change-sets against the team repos
		await this.validateRepoChangesetsForTeamRepos();

		// handle any markers that come with this review
		await this.handleMarkers();

		// handle any change sets that come with this review
		await this.handleRepoChangesets();

		// validate reviewers
		await this.validateReviewers();

		// handle followers, either passed in or default for the given situation
		this.attributes.followerIds = ArrayUtilities.union(
			this.attributes.reviewers || [],
			this.attributes.followerIds || []
		);
		this.attributes.followerIds = await this.codemarkHelper.handleFollowers(
			this.attributes,
			{
				mentionedUserIds: this.mentionedUserIds,
				team: this.team
			}
		);

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

	// validate the repo change-sets sent with the review creation, this is too important to just drop,
	// so we return an error instead
	async validateRepoChangesetsForTeamRepos () {
		// check that all repo IDs are valid and owned by the team
		const teamRepoIds = this.teamRepos.map(repo => repo.id);
		const repoIds = this.attributes.repoChangesets.map(set => set.repoId);
		const nonTeamRepoIds = ArrayUtilities.difference(repoIds, teamRepoIds);
		if (nonTeamRepoIds.length > 0) {
			throw this.errorHandler.error('notFound', { info: `repo(s) ${nonTeamRepoIds.join(',')}`});
		}
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

	// handle any change sets tied to the code review
	async handleRepoChangesets () {
		if (!this.attributes.repoChangesets || !this.attributes.repoChangesets.length) {
			return;
		}
		for (let changeset of this.attributes.repoChangesets) {
			await this.handleChangeset(changeset);
		}
		this.attributes.repoChangesetIds = this.transforms.createdChangesets.map(changeset => changeset.id);
		this.attributes.changesetRepoIds = ArrayUtilities.unique(
			this.transforms.createdChangesets.map(changeset => changeset.get('repoId'))
		);
		delete this.attributes.repoChangesets;
	}

	// handle a single changeSet attached to the review
	async handleChangeset (changesetInfo) {
		// handle the change set itself separately
		Object.assign(changesetInfo, {
			teamId: this.team.id
		});
		const changeset = await new ChangesetCreator({
			request: this.request,
			reviewId: this.attributes.id
		}).createChangeset(changesetInfo);
		this.transforms.createdChangesets = this.transforms.createdChangesets || [];
		this.transforms.createdChangesets.push(changeset);
	}

	// validate the reviewers ... all users must be on the same team
	async validateReviewers () {
		if (!this.attributes.reviewers || this.attributes.reviewers.length === 0) {
			return;
		}

		// get the users and make sure they're on the same team
		await this.codemarkHelper.validateUsersOnTeam(this.attributes.reviewers, this.team.id, 'reviewers');
	}
}

module.exports = ReviewCreator;
