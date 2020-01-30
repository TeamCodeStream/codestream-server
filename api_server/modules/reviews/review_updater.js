// this class should be used to update review documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Review = require('./review');

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
			string: ['title', 'description']
		};
	}

	// called before the review is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}
}

module.exports = ReviewUpdater;
