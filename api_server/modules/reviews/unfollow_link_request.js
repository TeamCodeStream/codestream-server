// handle the GET /no-auth/unfollow-link/review/:id request to unfollow a review from an email link

'use strict';

const UnfollowReviewRequest = require('./unfollow_review_request');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const WebErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/errors');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');

class UnfollowLinkRequest extends UnfollowReviewRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	// authorize the request for the current user
	async authorize () {
		// authentication is passed as a JSONWebToken in the query parameters
		let error;
		try {
			const token = this.request.query.t;
			if (!token) {
				error = this.errorHandler.error('missingAuthorization');
			}
			else {
				this.tokenPayload = this.api.services.tokenHandler.verify(token);
			}
		}
		catch (e) {
			error = e;
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				error = this.errorHandler.error('tokenExpired');
			}
			else {
				error = this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (!error && this.tokenPayload.type !== 'unf') {
			error = this.errorHandler.error('tokenInvalid', { reason: 'not an unfollow token' });
		}

		if (error) {
			this.gotError = error;
		}
		else {
			await this.getUser();
			return super.authorize();
		}
	}

	// process the request...
	async process () {
		if (this.gotError) { return; }

		try {
			await super.process();
		}
		catch (error) {
			this.gotError = error;
		}
	}

	// get the user who initiated this request from the token payload
	async getUser () {
		this.user = await this.data.users.getById(this.tokenPayload.uid);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// handle the response to the request, overriding the base response to do a redirect
	async handleResponse () {
		if (this.gotError) {
			this.warn(ErrorHandler.log(this.gotError));
			const errorCode = typeof this.gotError === 'object' && this.gotError.code ? this.gotError.code : WebErrors['unknownError'].code;
			this.response.redirect(`/web/unfollow-review-error?error=${errorCode}`);
		}
		else {
			this.response.redirect('/web/unfollow-review-complete');
		}
	}

	// override base postProcess to check for error first
	async postProcess () {
		if (!this.gotError) {
			this.responseData = { review: this.updateOp };
			await this.trackUnfollow();
			return super.postProcess();
		}
	}

	// track an event indicating the user unfollowed
	async trackUnfollow () {
		const team = await this.data.teams.getById(this.review.get('teamId'));
		const company = team && await this.data.companies.getById(team.get('companyId'));
		const trackObject = {
			Change: 'Review Unfollowed',
			'Source of Change': 'Email link'
		};
		this.api.services.analytics.trackWithSuperProperties(
			'Notification Change',
			trackObject,
			{
				request: this,
				user: this.user,
				team,
				company
			}
		);

	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unfollow-link',
			summary: 'Respond to email link to unfollow a review',
			access: 'User must be a member of the team that owns the review, or if the review is within a private channel or DM, user must be a member of that stream.',
			description: 'Remove the current user as a follower of the review specified.',
			input: 'A "t" parameter must be present in the query parameters, interpreted as a JSONWebToken which identifies the user',
			returns: 'Redirects to /web/unfollow-review-complete',
			publishes: 'The response data will be published on the team channel for the team that owns the reviews'
		};
	}
}

module.exports = UnfollowLinkRequest;
