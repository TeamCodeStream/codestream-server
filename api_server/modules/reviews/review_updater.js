// this class should be used to update review documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Review = require('./review');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ReviewHelper = require('./review_helper');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');

class ReviewUpdater extends ModelUpdater {

	get modelClass () {
		return Review;	// class to use to create a review model
	}

	get collectionName () {
		return 'reviews';	// data collection to use
	}

	// convenience wrapper
	async updateReview (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['title', 'text', 'status', 'pullRequestUrl', 'pullRequestProviderId', 'pullRequestTitle', 'ticketUrl', 'ticketProviderId'],
			boolean: ['allReviewersMustApprove'],
			object: ['$addToSet', '$push', '$pull']
		};
	}

	// validate the input attributes
	validateAttributes () {
		const addRemoveAttributes = ['reviewers', 'tags', 'reviewChangesets'];
		
		// we restrict directives only to certain attributes
		const error = this.normalizeDirectives(addRemoveAttributes);
		if (error) { 
			return error;
		}

		this.haveAddAndRemove = {};
		for (let attribute of addRemoveAttributes) {
			// $push is made equivalent to $addToSet
			if (this.attributes.$push && this.attributes.$push[attribute]) {
				this.attributes.$addToSet = this.attributes.$addToSet || {};
				this.attributes.$addToSet[attribute] = [
					...(this.attributes.$addToSet[attribute] || []),
					...this.attributes.$push[attribute]
				];
				delete this.attributes.$push[attribute];
			}
			
			// can't add and remove the same thing
			if (
				this.attributes.$addToSet &&
				this.attributes.$pull &&
				this.attributes.$addToSet[attribute] &&
				this.attributes.$pull[attribute]
			) {
				const offendingElements = ArrayUtilities.intersection(this.attributes.$addToSet[attribute], this.attributes.$pull[attribute]);
				if (offendingElements.length > 0) {
					return `can not add and remove ${attribute} at the same time: ${offendingElements}`;
				}
				this.haveAddAndRemove[attribute] = true;
			}
		}
		delete this.attributes.$push;
	}

	normalizeDirectives (addRemoveAttributes) {
		for (let directive of ['$addToSet', '$push', '$pull']) {
			if (this.attributes[directive]) {
				const value = this.attributes[directive];
				delete this.attributes[directive];
				for (let attribute of addRemoveAttributes) {
					if (value[attribute]) {
						if (directive === '$pull' && attribute === 'reviewChangesets') {
							// can't remove changesets, only add them
							return `cannot $pull ${attribute}`;
						}
						if (attribute === 'reviewChangesets' && !(value[attribute] instanceof Array)) {
							value[attribute] = [value[attribute]];
						}
						else if (attribute !== 'reviewChangesets' && typeof value[attribute] === 'string') {
							value[attribute] = [value[attribute]];
						}
						else if (!(value[attribute] instanceof Array)) {
							return `${attribute} must be array`;
						}
						this.attributes[directive] = this.attributes[directive] || {};
						this.attributes[directive][attribute] = value[attribute];
					}
				}
			}
		}
	}

	// called before the review is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		this.review = await this.data.reviews.getById(this.id);

		// confirm that users being added or removed as reviewers are legit
		await this.confirmUsers();

		// validate any change in tags
		await this.validateTags();

		// if we're adding changesets, validate the repo IDs, and extract any diffs, since
		// these are stored separately
		await this.handleChangesets();

		// we have to special case adding and removing array attributes at the same time, since
		// mongo won't allow us to $addToSet and $pull the same attribute ... in this case,
		// we'll treat the $pull part after the $addToSet part with a separate operation
		this.pullOps = {};
		for (let attribute in this.haveAddAndRemove) {
			this.pullOps[attribute] = this.attributes.$pull[attribute];
			delete this.attributes.$pull[attribute];
		}
		if (Object.keys(this.haveAddAndRemove).length > 0) {
			delete this.attributes.$pull;
		}

		// if we are adding reviewers, make sure they are followers
		this.handleReviewers();

		// if we're updating to approved, set the approvedAt attribute
		if (this.attributes.status === 'approved') {
			this.attributes.approvedAt = this.attributes.modifiedAt;
		}
		
		await super.preSave();
	}

	// get all the repos known to this team
	async getTeamRepos () {
		this.team = await this.data.teams.getById(this.review.get('teamId'));
		if (!this.team) {
			this.teamRepos = []; // shouldn't happen
			return;
		}
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

	// validate any tags being added (we don't really care about ones being removed)
	async validateTags () {
		if (!this.attributes.$addToSet || !this.attributes.$addToSet.tags) {
			return;
		}
		if (!this.team) {
			this.team = await this.data.teams.getById(this.review.get('teamId'));
		}
		const teamTags = this.team.get('tags') || {};
		for (let tag of this.attributes.$addToSet.tags) {
			const teamTag = Object.keys(teamTags).find(id => {
				return id === tag && !teamTags[id].deactivated;
			});
			if (!teamTag) {
				throw this.errorHandler.error('notFound', { info: 'tag' });
			}
		}
	}

	// handle the changesets the come in with the review
	async handleChangesets () {
		if (this.attributes.$addToSet && this.attributes.$addToSet.reviewChangesets) {
			await this.getTeamRepos();
			await ReviewHelper.validateReviewChangesetsForTeamRepos(
				this.attributes.$addToSet.reviewChangesets,
				this.teamRepos,
				this.request
			);
			await ReviewHelper.handleReviewChangesets(this.attributes.$addToSet, true);
			this.attributes.$unset = this.attributes.$unset || {};
			this.attributes.$unset.approvedBy = true;
			this.attributes.$unset.approvedAt = true;
		}
	}

	// handle any reviewers being added or removed
	async handleReviewers () {
		if (this.attributes.$addToSet && this.attributes.$addToSet.reviewers) {
			const currentFollowerIds = this.review.get('followerIds') || [];
			const newFollowerIds = ArrayUtilities.difference(this.attributes.$addToSet.reviewers, currentFollowerIds);
			if (newFollowerIds.length > 0) {
				this.attributes.$addToSet.followerIds = newFollowerIds;
			}
		}
	}

	// confirm that the IDs for the users being added or removed as reviewers are valid
	async confirmUsers () {
		let userIds = [];
		if (this.attributes.$addToSet && this.attributes.$addToSet.reviewers) {
			userIds.push(...this.attributes.$addToSet.reviewers);
		}
		if (this.attributes.$pull && this.attributes.$pull.reviewers) {
			userIds.push(...this.attributes.$pull.reviewers);
		}
		if (userIds.length === 0) {
			return;
		}

		// all users must actually exist
		const users = await this.request.data.users.getByIds(userIds);
		const foundUserIds = users.map(user => user.id);
		const notFoundUserIds = ArrayUtilities.difference(userIds, foundUserIds);
		if (notFoundUserIds.length > 0) {
			throw this.errorHandler.error('notFound', { info: `one or more users: ${notFoundUserIds}` });
		}

		// all users must be a member of the team that owns the review
		if (users.find(user => !user.hasTeam(this.review.get('teamId')))) {
			throw this.errorHandler.error('updateAuth', { reason: 'one or more users are not a member of the team that owns the review' });
		}
	}


	// we have to special case adding and removing array attributes at the same time, since
	// mongo won't allow us to $addToSet and $pull the same attribute
	async handleAddRemove () {
		// so here we are being called right before the response is returned to the server,
		// the add part of the operation has happened successfully and persisted to the database,
		// so we need to "cheat" and do the remove part ... we'll do a direct-to-database operation,
		// then return the operation in the response as if it was atomic
		const op = {};
		for (let attribute in this.pullOps) {
			op.$pull = op.$pull || {};
			op.$pull[attribute] = { $in: this.pullOps[attribute] };
			this.request.responseData.review.$pull = this.request.responseData.review.$pull || {};
			this.request.responseData.review.$pull = { [attribute]: this.pullOps[attribute] };
		}

		if (op.$pull) {
			await this.data.reviews.updateDirect({ id: this.data.reviews.objectIdSafe(this.review.id) }, op);
		}
	}
}

module.exports = ReviewUpdater;
