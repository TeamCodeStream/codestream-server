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
			return 'can not $addToSet and $pull reviewers at the same time';
		}
	}

	// called before the review is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		this.review = await this.data.reviews.getById(this.id);
		await this.getUsers();
		await super.preSave();
	}

	// confirm that the IDs for the users being added or removed as reviewers are valid
	async getUsers () {
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
}

module.exports = ReviewUpdater;
