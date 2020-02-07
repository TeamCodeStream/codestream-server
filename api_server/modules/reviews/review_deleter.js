// this class should be used to delete review documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');

class ReviewDeleter extends ModelDeleter {

	get collectionName () {
		return 'reviews';	// data collection to use
	}

	// convenience wrapper
	async deleteReview (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete a review 
	setOpForDelete () {
		// remove any links to other codemarks
		super.setOpForDelete();
		this.deleteOp.$set.modifiedAt = Date.now();
	}
	
	// called before the review is actually deleted
	async preDelete () {
		await this.getReview();			// get the review
		await this.deletePost();		// delete the associated post
		await super.preDelete();		// base-class preDelete
	}

	// get the review
	async getReview () {
		this.review = await this.request.data.reviews.getById(this.id, { excludeFields: ['reviewDiffs'] });
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'review' });
		}
		if (this.review.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
	}

	// delete its associated post
	async deletePost () {
		this.transforms.deletedPost = await this.request.postDeleter.deletePost(this.review.get('postId'));
	}
}

module.exports = ReviewDeleter;
