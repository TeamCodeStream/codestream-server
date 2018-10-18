// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const MarkerDeleter = require(process.env.CS_API_TOP + '/modules/markers/marker_deleter');
const Post = require('./post');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class PostDeleter extends ModelDeleter {

	get modelClass () {
		return Post;    // class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async deletePost (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op 
	setOpForDelete () {
		// wipe out the text and replace with something generic
		super.setOpForDelete();
		this.deleteOp.$set.text = 'this post has been deleted';
		this.deleteOp.$set.modifiedAt = Date.now();
	}

	// called before the delete is actually deleted
	async preDelete () {
		await this.getPost();			// get the post
		await this.deleteMarkers();		// delete any associated markers
		await this.getParentPost();		// get the parent post (if this is a reply)
		await this.updateNumComments();	// update numComments field in a parent marker, if needed
		this.addEditToHistory();		// add this deactivation to the maintained history of edits
		await super.preDelete();		// base-class preDelete
	}

	// get the post
	async getPost () {
		this.post = await this.request.data.posts.getById(this.id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (this.post.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
	}

	// delete any associated markers
	async deleteMarkers () {
		const codeBlocks = this.post.get('codeBlocks') || [];
		const markerIds = codeBlocks
			.map(codeBlock => codeBlock.markerId)
			.filter(markerId => markerId);
		this.transforms.markerUpdates = [];
		await Promise.all(markerIds.map(async markerId => {
			await this.deleteMarker(markerId);
		}));
	}

	// delete a single associated marker
	async deleteMarker (markerId) {
		const markerUpdate = await new MarkerDeleter({
			request: this.request
		}).deleteMarker(markerId);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// get the parent post, if the deleted post is a reply
	async getParentPost () {
		if (!this.post.get('parentPostId')) {
			return;
		}
		this.parentPost = await this.request.data.posts.getById(
			this.post.get('parentPostId')
		);
	}

	// if the deleted post is a reply to a post with code block(s),
	// update the numComments attribute of the associated marker(s)
	async updateNumComments () {
		if (!this.parentPost || !(this.parentPost.get('codeBlocks') instanceof Array)) {
			return;
		}
		const markerIds = this.parentPost.get('codeBlocks')
			.map(codeBlock => codeBlock.markerId)
			.filter(markerId => markerId);
		this.transforms.markerUpdates = this.transforms.markerUpdates || [];
		await Promise.all(markerIds.map(async markerId => {
			await this.updateNumCommentsForMarker(markerId);
		}));
	}

	// if the deleted post is a reply to a post with code block(s),
	// update the numComments attribute of the given marker
	async updateNumCommentsForMarker (markerId) {
		if (!markerId) { return; }
		// update the database, and also save the marker op for publishing to clients
		const op = { 
			$inc: { 
				numComments: -1 
			} 
		};
		const markerUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.markers,
			id: markerId
		}).save(op);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// add an edit to the maintained history of edits
	addEditToHistory () {
		this.deleteOp.$push = this.deleteOp.$push || {};
		this.deleteOp.$push = {
			editHistory: {
				editorId: this.user.id,
				editedAt: Date.now(),
				previousAttributes: {
					deactivated: false,
					text: this.post.get('text')
				},
				setAttributes: {
					deactivated: true,
					text: this.deleteOp.$set.text
				}
			}
		};
	}

	async postDelete () {
		// have to clean the editHistory part of the update op out, this does not 
		// get sent back in the response to clients
		if (this.updateOp.$push && this.updateOp.$push.editHistory) {
			delete this.updateOp.$push.editHistory;
			if (Object.keys(this.updateOp.$push).length === 0) {
				delete this.updateOp.$push;
			}
		}
		await super.postDelete();
	}
}

module.exports = PostDeleter;
