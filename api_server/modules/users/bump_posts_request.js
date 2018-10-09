// handle the "PUT /bump-posts" request to increment total posts for a user

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class BumpPostsRequest extends RestfulRequest {

	// authorize the request before processing....
	async authorize () {
		// acts on user object, no authorization needed
	}

	// process the request...
	async process () {
		let totalPosts = this.user.get('totalPosts') || 0;
		totalPosts++;
		this.op = { $set: { totalPosts } };
		await this.data.users.applyOpById(
			this.user.id,
			this.op
		);
		this.responseData = {
			user: Object.assign({_id: this.user.id}, this.op)
		};
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
						_id: '<ID of the user>',
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
						_id: '<ID of the user>',
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
