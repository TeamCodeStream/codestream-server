// handle the "POST /provider-share/:provider" request to share a post to its parent thread

'use strict';

const SlackSharingHelper = require('./slack_sharing_helper');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const PostPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_publisher');
const PostUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_updater');

class ProviderShareRequest extends RestfulRequest {

	async authorize () {
		// check that user is the author of the post to be shared
		const postId = this.request.body.postId;
		if (!postId) {
			throw this.errorHandler.error('parameterRequired', { info: 'postId' });
		}
		this.post = await this.user.authorizePost(postId.toLowerCase(), this);
		if (!this.post || this.post.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('updateAuth');
		}
	}

	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['postId']
			}
		});
	}

	async process () {
		await this.requireAndAllow();
		this.provider = this.request.params.provider.toLowerCase();
		if (!this.post.get('parentPostId')) {
			throw this.errorHandler.error('notFound', { info: 'parentPost' });
		}
		this.parentPost = await this.data.posts.getById(this.post.get('parentPostId'));
		if (!this.parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parentPost' });
		}
		if (this.provider === 'slack') {
			await this.prepareSlack();
		} else {
			throw this.errorHandler.error('invalidParameter', { info: `provider ${this.provider} not supported` });
		}
		if (this.sharingHelper && this.destination) {
			const sharedTo = await this.sharingHelper.sharePost(this.post, this.destination);
			if (sharedTo) {
				this.updateOp = await new PostUpdater({
					request: this
				}).updatePost(this.post.id, {
					sharedTo: (this.post.get('sharedTo') || []).concat([sharedTo])
				});
				this.responseData['post'] = this.updateOp;
			}
		}
	}

	async prepareSlack () {
		const parentSharedTo = this.parentPost.get('sharedTo').find(_ => _.providerId === 'slack*com');
		if (!parentSharedTo) {
			throw this.errorHandler.error('invalidParameter', { reason: 'parent post was not shared' });
		}
		const destinationKeys = ['providerId', 'teamId', 'channelId', 'parentPostId'];
		this.destination = {
			providerId: parentSharedTo.providerId,
			teamId: parentSharedTo.teamId,
			teamName: parentSharedTo.teamName,
			channelId: parentSharedTo.channelId,
			channelName: parentSharedTo.channelName,
			parentPostId: parentSharedTo.postId
		};
		const alreadyShared = (this.post.get('sharedTo') || [])
			.find(x => destinationKeys.every(y => x[y] === this.destination[y]));
		if (alreadyShared) {
			this.destination = alreadyShared;
		}
		const team = await this.data.teams.getById(this.post.get('teamId'));
		if (!team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		const slackTeamId = parentSharedTo.teamId;
		if (!slackTeamId) {
			return;
		}
		const serverProviderToken = team.get('serverProviderToken');
		if (
			!serverProviderToken &&
			!serverProviderToken.slack &&
			!serverProviderToken.slack.multiple &&
			!serverProviderToken.slack.multiple[slackTeamId]
		) {
			return;
		}
		const accessToken = serverProviderToken.slack.multiple[slackTeamId];
		if (!accessToken) {
			throw this.errorHandler.error('notFound', { info: 'accessToken' });
		}
		this.sharingHelper = new SlackSharingHelper({
			request: this,
			asBot: true,
			accessToken
		});
	}

	async postProcess () {
		if (!this.updateOp) { return; }
		await new PostPublisher({
			data: {
				posts: this.updateOp
			},
			request: this,
			broadcaster: this.api.services.broadcaster,
			teamId: this.post.get('teamId')
		}).publishPost();
	}
}

module.exports = ProviderShareRequest;
