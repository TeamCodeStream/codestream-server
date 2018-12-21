// handle the "PUT /bump-posts" request to increment total posts for a user

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class BumpPostsRequest extends RestfulRequest {

	// authorize the request before processing....
	async authorize () {
		// acts on user object, no authorization needed
	}

	// process the request...
	async process () {
		let totalPosts = this.user.get('totalPosts') || 0;
		totalPosts++;
		const op = {
			$set: {
				totalPosts,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = {
			user: Object.assign({
				_id: this.user.id,	// DEPRECATE ME
				id: this.user.id
			}, this.updateOp)
		};
		super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the update on the user's me-channel
		const channel = `user-${this.user.id}`;
		const message = Object.assign(this.responseData, {
			requestId: this.request.id
		});
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish bump posts message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'bump-posts',
			summary: 'Bump a user\'s total posts count',
			access: 'No access rule, acts on user object corresponding to the passed token',
			description: 'For users on a third-party provider team, call this request whenever the user posts from CodeStream to the provider integration, to track the user\'s total number of posts',
			input: 'None',
			returns: {
				summary: 'Directive to set totalPosts for user',
				looksLike: {
					user: {
						id: '<ID of the user>',
						$set: {
							totalPosts: '<New post count>'
						}
					}
				}
			},
			publishes: {
				summary: 'Publishes a user object, with directives, to the user\'s user channel, with directive to increment the user\'s total posts',
				looksLike: {
					user: {
						id: '<ID of the user>',
						$set: {
							totalPosts: '<New post count>'
						}
					}
				}
			}
		};
	}
}

module.exports = BumpPostsRequest;
