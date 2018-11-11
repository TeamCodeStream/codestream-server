// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const CodemarkDeleter = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_deleter');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class PostDeleter extends ModelDeleter {

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
		await this.deleteCodemark();	// delete any referenced codemark
		await this.getParentPost();		// get the parent post (if this is a reply)
		await this.updateNumReplies();	// update numReplies field in a parent codemark, if needed
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

	// delete any referenced codemark
	async deleteCodemark () {
		if (!this.post.get('codemarkId') || this.dontDeleteCodemark) {
			return;
		}
		this.transforms.deletedCodemark = await new CodemarkDeleter({
			request: this.request,
			dontDeletePost: true
		}).deleteCodemark(this.post.get('codemarkId'));
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

	// update numReplies for parent post and possibly its associated codemark
	async updateNumReplies () {
		if (!this.parentPost) {
			return;
		}
		await this.updatePostReplies();
		await this.updateCodemarkReplies();
	}

	// decrement numReplies for the parent post to the deleted post, as needed
	async updatePostReplies () {
		if (!this.parentPost.get('numReplies')) {
			return;
		}
		const op = {
			$set: {
				numReplies: this.parentPost.get('numReplies') - 1
			}
		};
		this.transforms.updatedParentPost = await new ModelSaver({
			request: this.request,
			collection: this.request.data.posts,
			id: this.parentPost.id
		}).save(op);
	}

	// decrement numReplies for the codemark referenced by the parent post 
	// to the deleted post, as needed
	async updateCodemarkReplies () {
		if (!this.parentPost.get('codemarkId')) {
			return;
		}
		const codemark = await this.request.data.codemarks.getById(this.parentPost.get('codemarkId'));
		if (!codemark || !codemark.get('numReplies')) { 
			return; 
		}
		const op = { 
			$set: {
				numReplies: codemark.get('numReplies') - 1
			}
		};
		this.transforms.updatedParentCodemark = await new ModelSaver({
			request: this.request,
			collection: this.request.data.codemarks,
			id: codemark.id
		}).save(op);
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
