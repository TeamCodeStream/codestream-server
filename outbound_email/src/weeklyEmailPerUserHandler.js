'use strict';

const ReviewIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/indexes');
const CodemarkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const WeeklyEmailRenderer = require('./weeklyEmailRenderer');
const Utils = require('./utils');
const Juice = require('juice');

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;

class WeeklyEmailPerUserHandler {

	constructor (options) {
		Object.assign(this, options);
		this.userData = {
			team: this.teamData.team,
			users: this.teamData.users
		};
	}

	async sendEmailToUser (user) {
		this.user = user;
		const lastEmailSentAt = (this.user.lastWeeklyEmailSentAt || {})[this.teamData.team.id] || 0;
		this.userData.contentCreatedSince = lastEmailSentAt || (Date.now() - ONE_WEEK - ONE_HOUR);

		await this.updateUser();		// update user info, optimistically assuming the send will succeed
		await this.getUsers();			// get all users from all the teams
		if (!await this.getContent()) {		// get all content, and categorize for the current user, if no content, we don't send
			this.logger.log(`User ${this.user.id} has no content to show so will receive no weekly email`);
			return;
		}
		await this.renderEmail();		// render the email
		await this.sendEmail();			// send the email
	}

	// update the user indicating a weekly email has been sent
	// note that we do this optimistically, and as soon as possible, to avoid the situation
	// where two processes may be trying to send emails to a user at the same time ...
	// the idea is that it is better to miss a weekly email than to send a duplicate
	async updateUser () {
		const op = {
			$set: {
				[`lastWeeklyEmailSentAt.${this.teamData.team.id}`]: Date.now(),
			}
		};
		if (!this.user.isRegistered) {
			op.$set.lastInviteType = 'weeklyEmail';
			op.$set.lastInviteSentAt = Date.now();
		}
		try {
			await this.data.users.updateDirect(
				{ id: this.data.users.objectIdSafe(this.user.id) },
				op
			);
		}
		catch (error) {
			this.logger.warn(`Unable to update user ${this.user.id} before email notification: ${JSON.stringify(error)}`);
		}
	}

	// get all users on the team
	async getUsers () {
		if (this.teamData.users) {
			return;
		}
		const memberIds = this.teamData.team.memberIds || [];
		this.teamData.users = await this.data.users.getByIds(memberIds);
	}

	// get all content, and categorize for the current user
	async getContent () {
		this.haveContent = (this.latestNews || '').length > 0;
		await this.getReviews();		// get all recent reviews in those teams
		await this.getCodemarks();		// get all recent codemarks in those teams
		await this.getRecentPosts();	// get all recent posts in those teams
		await this.getOtherPosts();		// get any posts associated with reviews or codemarks not covered by the "recent" fetch above
		await this.getParents();		// get the parent posts/codemarks/reviews not covered by any other fethces, above
		await this.categorizeReviews();	// categorize reviews depending on user relationship
		await this.categorizeCodemarks();	// categorize codemarks depending on user relationship
		await this.collate();			// collate some collections into a combined collection
		await this.getMyMentions();		// get posts/codemarks/reviews in which the user is mentioned
		await this.getMyUnreadPosts();	// get all unread posts not covered by the above categories
		await this.sort();				// sort all collections in descending creation order
		return this.haveContent;
	}

	// get all reviews for the team, unless previously fetched
	async getReviews () {
		if (this.teamData.reviews) {
			return;
		}
		this.teamData.reviews = await this.data.reviews.getByQuery(
			{
				teamId: this.teamData.team.id
			},
			{
				hint: ReviewIndexes.byLastActivityAt,
				sort: { byLastActivityAt: -1 },
				limit: 500,
				excludeFields: ['reviewDiffs', 'checkpointReviewDiffs']
			}
		);
	}

	// get all codemarks for the team, unless previously fetched
	async getCodemarks () {
		if (this.teamData.codemarks) {
			return;
		}
		this.teamData.codemarks = await this.data.codemarks.getByQuery(
			{
				teamId: this.teamData.team.id
			},
			{
				hint: CodemarkIndexes.byLastActivityAt,
				sort: { byLastActivityAt: -1 },
				limit: 500
			}
		);
	}

	// get all recent posts for the team, unless previously fetched
	async getRecentPosts () {
		if (this.teamData.posts) {
			return;
		}
		this.teamData.posts = await this.data.posts.getByQuery(
			{
				teamId: this.teamData.team.id
			},
			{
				hint: PostIndexes.byId,
				sort: { _id: -1 },
				limit: 500
			}
		);
	}

	// get all review or codemark posts not covered by the "recent" fetch above, for the team
	async getOtherPosts () {
		let postIds = [
			...this.teamData.reviews.map(review => review.postId),
			...this.teamData.codemarks.map(codemark => codemark.postId)
		];
		const alreadyHavePostIds = this.teamData.posts.map(post => post.id);
		postIds = ArrayUtilities.difference(postIds, alreadyHavePostIds); 

		if (postIds.length > 0) {
			this.teamData.posts = [
				...this.teamData.posts,
				await this.data.posts.getByIds(postIds)
			];
		}
	}

	// get any parent or grandparent posts not covered by the other fetches, along with codemarks and reviews
	async getParents (posts = undefined) {
		const alreadyHavePostIds = posts || this.teamData.posts.map(post => post.id);
		const postsWithParents = (this.teamData.posts || posts).filter(post => post.parentPostId);
		const needParentPostIds = postsWithParents.reduce((postIds, post) => {
			if (
				!alreadyHavePostIds.includes(post.parentPostId) &&
				!postIds.includes(post.parentPostId)
			) {
				postIds.push(post.parentPostId);
			}
			return postIds;
		}, []);

		if (needParentPostIds.length > 0) {
			const parentPosts = await this.data.posts.getByIds(needParentPostIds);
			this.teamData.posts = [
				...this.teamData.posts,
				...parentPosts
			];
		}

		// now get all those parent posts
		const parentPosts = postsWithParents.reduce((posts, childPost) => {
			const parentPost = this.teamData.posts.find(p => p.id === childPost.parentPostId);
			posts.push(parentPost);
			return posts;
		}, []);

		// get codemarks
		const parentCodemarkIds = parentPosts.reduce((codemarkIds, parentPost) => {
			if (parentPost.codemarkId) {
				codemarkIds.push(parentPost.codemarkId);
			}
			return codemarkIds;
		}, []);
		const alreadyHaveCodemarkIds = this.teamData.codemarks.map(codemark => codemark.id);
		const needCodemarkIds = ArrayUtilities.difference(parentCodemarkIds, alreadyHaveCodemarkIds);
		if (needCodemarkIds.length > 0) {
			const codemarks = await this.data.codemarks.getByIds(needCodemarkIds);
			this.teamData.codemarks = [
				...this.teamData.codemarks,
				...codemarks
			];
		}

		// get reviews
		const parentReviewIds = parentPosts.reduce((reviewIds, parentPost) => {
			if (parentPost.reviewId) {
				reviewIds.push(parentPost.reviewId);
			}
			return reviewIds;
		}, []);
		const alreadyHaveReviewIds = this.teamData.reviews.map(review => review.id);
		const needReviewIds = ArrayUtilities.difference(parentReviewIds, alreadyHaveReviewIds);
		if (needReviewIds.length > 0) {
			const reviews = await this.data.reviews.getByIds(needReviewIds);
			this.teamData.reviews = [
				...this.teamData.reviews,
				...reviews
			];
		}

		// get grandparent posts (and associated codemarks and reviews) as needed
		if (!posts && parentPosts.length > 0) {
			await this.getParents(parentPosts);
		}
	}

	// categorize reviews as:
	//  (1) open and assigned to user
	//  (2) open and not assigned to user
	//  (3) closed and not assigned to user
	async categorizeReviews () {
		this.userData.myReviews = [];
		this.userData.newReviews = [];
		this.userData.closedReviews = [];
		this.teamData.reviews.forEach(review => {
			review.isReview = true; // since we'll be collating with codemarks
			if (
				review.status === 'approved' &&
				review.approvedAt > this.userData.contentCreatedSince
			) {
				this.userData.closedReviews.push(review);
			} else if (review.status === 'open') {
				if ((review.reviewers || []).includes(this.user.id)) {
					this.userData.myReviews.push(review);
				} else if (review.createdAt > this.userData.contentCreatedSince) {
					this.userData.newReviews.push(review);
				}
			}
		});
		this.haveContent = this.haveContent || (
			this.userData.closedReviews.length > 0 ||
			this.userData.myReviews.length > 0 ||
			this.userData.newReviews.length > 0
		);
	}

	// categorize codemarks as:
	//  (1) open and assigned to user
	//  (2) open and not assigned to user
	//  (3) closed and not assigned to user
	async categorizeCodemarks () {
		this.userData.myCodemarks = [];
		this.userData.newCodemarks = [];
		this.userData.closedCodemarks = [];
		this.teamData.codemarks.forEach(codemark => {
			codemark.isCodemark = true; // since we'll be collating with reviews
			if (
				codemark.status === 'closed' &&
				codemark.modifiedAt > this.userData.contentCreatedSince
			) {
				this.userData.closedCodemarks.push(codemark);
			} else if ((codemark.assignees || []).includes(this.user.id)) {
				this.userData.myCodemarks.push(codemark);
			} else if (codemark.createdAt > this.userData.contentCreatedSince) {
				this.userData.newCodemarks.push(codemark);
			}
		});
		this.haveContent = this.haveContent || (
			this.userData.closedCodemarks.length > 0 ||
			this.userData.myCodemarks.length > 0 ||
			this.userData.newCodemarks.length > 0
		);
	}

	// collate new and closed reviews and codemarks into a single collection
	async collate () {
		this.userData.newCodemarksReviews = [
			...this.userData.newCodemarks,
			...this.userData.newReviews
		];
		this.userData.closedCodemarksReviews = [
			...this.userData.closedCodemarks,
			...this.userData.closedReviews
		];
	}

	// get any reviews/codemarks/posts for the team in which the current user is mentioned
	async getMyMentions () {
		this.userData.mentions = this.teamData.posts.filter(post => {
			return (
				!post.codemarkId &&
				!post.reviewId &&
				post.createdAt > this.userData.contentCreatedSince &&
				(post.mentionedUserIds || []).includes(this.user.id)
			);
		});
		this.haveContent = this.haveContent || this.userData.mentions.length > 0;
	}

	// get any unread posts for the team and user that are not covered by the other categories
	async getMyUnreadPosts () {
		const lastReads = this.user.lastReads || {};
		const coveredPostIds = [
			...this.teamData.reviews.map(review => review.postId),
			...this.teamData.codemarks.map(codemark => codemark.postId),
			...this.userData.mentions.map(post => post.id)
		];
		this.userData.unreadPosts = this.teamData.posts.reduce((accum, post) => {
			if (
				post.createdAt > this.userData.contentCreatedSince && 
				post.creatorId !== this.user.id && 
				post.seqNum > (lastReads[post.streamId] || 0) && 
				!coveredPostIds.includes(post.id)
			) {
				accum.push(post);
			}
			return accum;
		}, []);
		this.haveContent = this.haveContent || this.userData.unreadPosts.length > 0;
	}

	// sort all collections in descending creation order
	async sort () {
		const collections = [
			'myReviews',
			'myCodemarks',
			'mentions',
			'unreadPosts',
			'newCodemarksReviews',
			'closedCodemarksReviews'
		];
		await Promise.all(collections.map(async collection => {
			this.userData[collection].sort((a, b) => {
				return b.createdAt - a.createdAt;
			});
		}));
	}

	// render the email given all the data we've collected
	async renderEmail () {
		this.renderOptions = {
			user: this.user,
			userData: this.userData,
			teamData: this.teamData,
			styles: this.pseudoStyles,	// only pseudo-styles go in the <head>
			ideLinks: Utils.getIDELinks(),
			latestNews: this.latestNews
		}
		this.content = new WeeklyEmailRenderer().render(this.renderOptions);
		this.content = this.content.replace(/[\t\n]/g, '');

		// this puts our styles inline, which is needed for gmail's display of larger emails
		this.content = Juice(`<style>${this.styles}</style>${this.content}`);
}

	// send the email to the user, yay!
	async sendEmail () {
		const { senderEmail } = this.outboundEmailServer.config.email;
		const options = {
			type: 'weekly',
			from: { email: senderEmail, name: 'CodeStream' },
			user: this.user,
			subject: this.getSubject(),
			content: this.content,
			category: this.user.isRegistered ? 'weekly' : 'weekly_invite',
			requestId: this.requestId
		};
		try {
			if (this.user.email.match(/(dave|colin).*@codestream\.com$/)) {
				this.logger.log(`Sending weekly email to ${this.user.email}...`);
				await this.sender.sendEmail(options);
			} else {
				this.logger.log(`Would have sent weekly email to ${this.user.email}`);
			}
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`;
			}
			else {
				message = JSON.stringify(error);
			}
			this.logger.warn(`Unable to send weekly email to ${this.user.email}: ${message}`);
		}
	}

	// get the appropriate subject for the email
	getSubject () {
		const teamName = this.teamData.team.name;
		const earlierMonday = this.findEarlierMonday();
		return `${teamName} activity for the week of ${earlierMonday}`;
	}

	// get the date of the Monday earlier than this one, assuming one week ago
	findEarlierMonday () {
		const now = Date.now();
		const dayOfWeek = (new Date(now)).getDay();
		let lastMonday;
		if (dayOfWeek === 0) {
			// it's sunday? we really should be getting this on monday, 
			// but i guess we need to assume it's 6 days too late...
			lastMonday = now - ONE_WEEK - 6 * ONE_DAY;
		}
		else if (dayOfWeek === 1) {
			// this is more like it
			lastMonday = now - ONE_WEEK;
		} else {
			// this might mean our queue overflowed?
			lastMonday = now - (dayOfWeek - 1) * ONE_DAY;
		}
		return new Date(lastMonday).toLocaleDateString('en-US', { 
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
}

module.exports = WeeklyEmailPerUserHandler;
