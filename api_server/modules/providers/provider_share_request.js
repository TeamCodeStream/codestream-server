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
		let destination;
		this.provider = this.request.params.provider.toLowerCase();
		if (!this.post.get('parentPostId')) {
			throw this.errorHandler.error('notFound', { info: 'parentPost' });
		}
		const parentPost = await this.data.posts.getById(this.post.get('parentPostId'));
		if (!parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parentPost' });
		}
		if (this.provider === 'slack') {
			const parentSharedTo = parentPost.get('sharedTo').find(_ => _.providerId === 'slack*com');
			if (!parentSharedTo) {
				// TODO: throw error
				return;
			}
			const destinationKeys = ['providerId', 'teamId', 'channelId', 'parentPostId'];
			destination = {
				providerId: parentSharedTo.providerId,
				teamId: parentSharedTo.teamId,
				teamName: parentSharedTo.teamName,
				channelId: parentSharedTo.channelId,
				channelName: parentSharedTo.channelName,
				parentPostId: parentSharedTo.postId
			};
			const alreadyShared = (this.post.get('sharedTo') || [])
				.some(x => destinationKeys.every(y => x[y] === destination[y]));
			if (alreadyShared) {
				return;
			}
			const team = await this.data.teams.getById(this.post.get('teamId'));
			if (!team) {
				throw this.errorHandler.error('notFound', { info: 'team' });
			}
			const slackTeamId = parentSharedTo.teamId;
			if (!slackTeamId) {
				return;
			}
			const serverProviderInfo = team.get('serverProviderInfo');
			if (
				!serverProviderInfo &&
				!serverProviderInfo.slack &&
				!serverProviderInfo.slack.multiple &&
				!serverProviderInfo.slack.multiple[slackTeamId]
			) {
				return;
			}
			const accessToken = serverProviderInfo.slack.multiple[slackTeamId].accessToken;
			if (!accessToken) {
				throw this.errorHandler.error('notFound', { info: 'accessToken' });
			}
			this.sharingHelper = new SlackSharingHelper({
				request: this,
				asBot: true,
				accessToken
			});
		} else {
			throw this.errorHandler.error('invalidParameter', { info: `provider ${this.provider} not supported` });
		}
		if (this.sharingHelper && destination) {
			const sharedTo = await this.sharingHelper.sharePost(this.post, destination);
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
