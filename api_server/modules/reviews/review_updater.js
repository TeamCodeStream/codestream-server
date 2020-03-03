// this class should be used to update review documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Review = require('./review');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

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
			string: ['title', 'text', 'status'],
			object: ['$addToSet', '$push', '$pull']
		};
	}

	// validate the input attributes
	validateAttributes () {
		// we restrict only to $addToSet.memberIds and $pull.memberIds
		for (let attribute of ['$addToSet', '$push', '$pull']) {
			if (this.attributes[attribute]) {
				const value = this.attributes[attribute];
				delete this.attributes[attribute];
				if (value.reviewers) {
					if (typeof value.reviewers === 'string') {
						value.reviewers = [value.reviewers];
					}
					else if (!(value.reviewers instanceof Array)) {
						return 'reviewers must be array';
					}
					this.attributes[attribute] = { reviewers: value.reviewers };
				}
			}
		}
		if (this.attributes.$push) {
			// $push is made equivalent to $addToSet
			this.attributes.$addToSet = this.attributes.$addToSet || {};
			this.attributes.$addToSet.reviewers = ((this.attributes.$addToSet || {}).reviewers || []).concat(this.attributes.$push.reviewers);
			delete this.attributes.$push;
		}

		if (this.attributes.$addToSet && this.attributes.$pull) {
			const offendingReviewers = ArrayUtilities.intersection(this.attributes.$addToSet.reviewers || [], this.attributes.$pull.reviewers || []);
			if (offendingReviewers.length > 0) {
				return `can not add and remove reviewers at the same time: ${offendingReviewers}`;
			}
			this.haveAddAndRemove = true;
		}
	}

	// called before the review is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		this.review = await this.data.reviews.getById(this.id);

		// confirm that users being added or removed as reviewers are legit
		await this.confirmUsers();

		// we have to special case adding and removing reviewers at the same time, since
		// mongo won't allow us to $addToSet and $pull the same attribute ... in this case,
		// we'll treat the $pull part after the $addToSet part with a separate operation
		if (this.haveAddAndRemove) {
			this.pullReviewers = this.attributes.$pull.reviewers;
			delete this.attributes.$pull;
		}

		await super.preSave();
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


	// we have to special case adding and removing reviewers at the same time, since
	// mongo won't allow us to $addToSet and $pull the same attribute
	async handleAddRemove () {
		if (!this.pullReviewers) {
			return;
		}

		// so here we are being called right before the response is returned to the server,
		// the add part of the operation has happened successfully and persisted to the database,
		// so we need to "cheat" and do the remove part ... we'll do a direct-to-database operation,
		// then return the operation in the response as if it was atomic
		const op = {
			$pull: {
				reviewers: { 
					$in: this.pullReviewers
				}
			}
		};
		await this.data.reviews.updateDirect({ id: this.data.reviews.objectIdSafe(this.review.id) }, op);
		this.request.responseData.review.$pull = { reviewers: this.pullReviewers };
	}
}

module.exports = ReviewUpdater;
