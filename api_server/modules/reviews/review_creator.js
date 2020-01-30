// this class should be used to create all review documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Review = require('./review');
const CodemarkHelper = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_helper');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

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
				object: ['repoChangeset']
			}
		};
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

		// validate reviewers
		await this.validateReviewers();

		// handle followers, either passed in or default for the given situation
		this.attributes.followerIds = await this.handleFollowers();

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

	// validate the reviewers ... all users must be on the same team
	async validateReviewers () {
		if (!this.attributes.reviewers || this.attributes.reviewers.length === 0) {
			return;
		}

		// get the users and make sure they're on the same team
		this.codemarkHelper.validateUsersOnTeam(this.attributes.reviewers, this.team.id, 'reviewers');
	}

	// handle followers added to a code review
	async handleFollowers () {
		// get the stream, if this is a review for a CodeStream team
		let stream;
		if (this.attributes.streamId) {
			stream = await this.request.data.streams.getById(this.attributes.streamId);
		}

		// ensure review creator is a follower if they want to be
		let followerIds = [];
		if (
			this.attributes.creatorId &&
			followerIds.indexOf(this.attributes.creatorId) === -1
		) {
			followerIds.push(this.attributes.creatorId);
		}

		// if the stream is a DM, everyone in the DM is a follower
		if (stream && stream.get('type') === 'direct') {
			followerIds = ArrayUtilities.union(followerIds, stream.get('memberIds'));
		}

		// reviewers are followers
		followerIds = ArrayUtilities.union(followerIds, this.attributes.reviewers || []);

		// users passed in are explicitly followers, overriding other rules
		followerIds = ArrayUtilities.union(followerIds, this.attributes.followerIds || []);

		return followerIds;
	}
}

module.exports = ReviewCreator;
