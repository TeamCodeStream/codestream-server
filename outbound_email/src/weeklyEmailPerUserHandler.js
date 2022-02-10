'use strict';

const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const WeeklyEmailRenderer = require('./weeklyEmailRenderer');
const Utils = require('./utils');
const Juice = require('juice');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
// suppress certain results when team size gets too big
const SUPPRESS_TEAM_SIZE = 25;

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
		this.haveContent = false; // (this.latestNews || '').length > 0; // suppress showing emails if nothing else to show but news
		await this.getReviews();		// get all recent reviews in those teams
		await this.getCodemarks();		// get all recent codemarks in those teams
		await this.getRecentPosts();	// get all recent posts in those teams
		await this.getOtherPosts();		// get any posts associated with reviews or codemarks not covered by the "recent" fetch above
		await this.getParents();		// get the parent posts/codemarks/reviews not covered by any other fethces, above
		await this.categorizeReviews();	// categorize reviews depending on user relationship
		await this.categorizeCodemarks();	// categorize codemarks depending on user relationship
		await this.collate();			// collate some collections into a combined collection
		await this.getMyMentions();		// get posts/codemarks/reviews in which the user is mentioned
		await this.getMyUnreads();		// get all unread items not covered by the above categories
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
				teamId: this.teamData.team.id,
				deactivated: false
			},
			{
				hint: {
					teamId: 1,
					lastActivityAt: -1
				},
				sort: { lastActivityAt: -1 },
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
				teamId: this.teamData.team.id,
				type: { $ne: 'link' },
				deactivated: false,
			},
			{
				hint: {
					teamId: 1,
					lastActivityAt: -1
				},
				sort: { lastActivityAt: -1 },
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
				teamId: this.teamData.team.id,
				deactivated: false
			},
			{
				hint: {
					teamId: 1,
					//streamId: 1,
					_id: -1
				},
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
				...(await this.data.posts.getByIds(postIds))
			];
		}
	}

	// get any parent or grandparent posts not covered by the other fetches, along with codemarks and reviews
	async getParents (posts = undefined) {
		const alreadyHavePostIds = this.teamData.posts.map(post => post.id);
		const postsWithParents = (posts || this.teamData.posts).filter(post => post.parentPostId);
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
			childPost.parentPost = this.teamData.posts.find(p => p.id === childPost.parentPostId);
			if (!childPost.parentPost) {
				this.logger.warn(`Post ${childPost.id} has no parent post for ${childPost.parentPostId}`);
				return posts;
			}
			if (childPost.parentPost.parentPost) {
				// this will happen on the "recursive" round to get grandparents
				childPost.grandparentPost = childPost.parentPost.parentPost;
			}
			if (!posts.find(p => p.id === childPost.parentPost.id)) {
				posts.push(childPost.parentPost);
			}
			return posts;
		}, []);

		// get codemarks
		const parentCodemarkIds = parentPosts.reduce((codemarkIds, parentPost) => {
			if (parentPost.codemarkId && !codemarkIds.includes(parentPost.codemarkId)) {
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
			if (parentPost.reviewId && !reviewIds.includes(parentPost.reviewId)) {
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
			review.post = this.teamData.posts.find(post => post.id === review.postId);
			if (this.postHasDeactivatedAncestor(review.post)) { return; }
			if (!review.post) {
				this.logger.warn(`Review ${codemark.id} has no post for ${review.postId}`);
				return;
			}
			review.post.review = review;
			review.isReview = true; // since we'll be collating with codemarks
			if (
				review.status === 'approved' &&
				review.approvedAt > this.userData.contentCreatedSince
			) {
				if (this.teamData.users.length <= SUPPRESS_TEAM_SIZE) {
					this.userData.closedReviews.push(review);
				}
			} else if (review.status === 'open') {
				if ((review.reviewers || []).includes(this.user.id)) {
					this.userData.myReviews.push(review);
				} else if (review.createdAt > this.userData.contentCreatedSince) {
					if (this.teamData.users.length <= SUPPRESS_TEAM_SIZE) {
						this.userData.newReviews.push(review);
					}
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
			if (!codemark.pinned) {	 // these are considered "archived" and should not show up in weekly emails
				return;
			}
			codemark.post = this.teamData.posts.find(post => post.id === codemark.postId);
			if (!codemark.post) {
				this.logger.warn(`Codemark ${codemark.id} has no post for ${codemark.postId}`);
				return;
			}
			if (this.postHasDeactivatedAncestor(codemark.post)) { return; }
			codemark.isCodemark = true; // since we'll be collating with reviews
			codemark.post.codemark = codemark;
			if (codemark.post.parentPost) { return; } // codemarks under reviews don't show up as separate items
			if (codemark.status === 'closed') {
				if (codemark.modifiedAt > this.userData.contentCreatedSince) {
					if (this.teamData.users.length <= SUPPRESS_TEAM_SIZE) {
						this.userData.closedCodemarks.push(codemark);
					}
				}
			} else if ((codemark.assignees || []).includes(this.user.id)) {
				this.userData.myCodemarks.push(codemark);
			} else if (codemark.createdAt > this.userData.contentCreatedSince) {
				if (this.teamData.users.length <= SUPPRESS_TEAM_SIZE) {
					this.userData.newCodemarks.push(codemark);
				}
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
		this.userData.coveredPostIds = [
			...this.userData.myReviews.map(review => review.postId),
			...this.userData.myCodemarks.map(codemark => codemark.postId)
		];
	}

	// get any reviews/codemarks/posts for the team in which the current user is mentioned
	async getMyMentions () {
		this.userData.mentions = await this.getMyPosts(this.postMentionsMe, 'mentions');
		this.haveContent = this.haveContent || this.userData.mentions.length > 0;
	}

	// get any unread items for the team and user that are not covered by the other categories
	async getMyUnreads () {
		if (this.teamData.users.length > SUPPRESS_TEAM_SIZE) {
			this.userData.unreads = [];
			return;
		}
		this.userData.unreads = await this.getMyPosts(this.postIsUnread, 'unreads');
		this.haveContent = this.haveContent || this.userData.unreads.length > 0;
	}

	async getMyPosts (isMatchingPostCallback, section) {
		return this.teamData.posts.reduce((accum, post) => {
			const ancestorPost = post.grandparentPost || post.parentPost;
			const ancestorItem = ancestorPost && (ancestorPost.codemark || ancestorPost.review);

			// first see if the post qualifies at all
			if (
				this.postHasDeactivatedAncestor(post) ||
				post.createdAt <= this.userData.contentCreatedSince ||
				post.creatorId === this.user.id ||
				!isMatchingPostCallback.call(this, post) ||
				!ancestorPost ||
				!ancestorItem ||
				this.userData.coveredPostIds.includes(post.id)
			) {
				return accum;
			}

			// since we display replies nested under their ancestor item, add to the array of replies
			// for that ancestor item (tracked separately per user and per section)
			const replies = ancestorItem.replies = ancestorItem.replies || {};
			const repliesPerUser = replies[this.user.id] = replies[this.user.id] || {};
			const repliesPerSection = repliesPerUser[section] = repliesPerUser[section] || [];
			repliesPerSection.push(post.codemark || post);
			this.userData.coveredPostIds.push(post.id);

			// if the item is not already in the final array, add it now
			if (!accum.find(item => item.id === ancestorItem.id)) {
				accum.push(ancestorItem);
			}

			return accum;
		}, []);
	}
				
	// does this post mention me?
	postMentionsMe (post) {
		return (post.mentionedUserIds || []).includes(this.user.id);
	}

	// is this post unread for me?
	postIsUnread (post) {
		return post.seqNum > ((this.user.lastReads || {})[post.streamId] || 0);
	}

	// sort all collections in descending creation order
	async sort () {
		const collections = [
			'myReviews',
			'myCodemarks',
			'mentions',
			'unreads',
			'newCodemarksReviews',
			'closedCodemarksReviews'
		];
		await Promise.all(collections.map(async collection => {
			this.userData[collection].sort((a, b) => {
				return b.createdAt - a.createdAt;
			});
		}));

		// also sort all replies in descending creation order
		const replySections = [
			'mentions',
			'unreads'
		];
		await Promise.all(replySections.map(async section => {
			await Promise.all(this.userData[section].map(async item => {
				if (
					item.replies &&
					item.replies[this.user.id] &&
					item.replies[this.user.id][section]
				) {
					item.replies[this.user.id][section].sort((a, b) => {
						return b.createdAt - a.createdAt;
					});
				}
			}));
		}));
	}

	// return whether the given post has a deactivated ancestor
	// this prevents replies to deactivated reviews/codemarks from showing up in the weekly email
	postHasDeactivatedAncestor (post) {
		return (
			post.deactivated ||
			(post.parentPost && post.parentPost.deactivated) ||
			(post.grandparentPost && post.grandparentPost.deactivated)
		);
	}

	// get the "unsubscribe" link for a given user
	getUnsubscribeLink (user) {
		const token = new TokenHandler(this.outboundEmailServer.config.sharedSecrets.auth).generate(
			{
				uid: user.id
			},
			'unsscr'
		);
		return `${this.outboundEmailServer.config.apiServer.publicApiUrl}/no-auth/unsubscribe-weekly?t=${token}`;
	}

	// render the email given all the data we've collected
	async renderEmail () {
		this.renderOptions = {
			logger: this.logger,
			user: this.user,
			userData: this.userData,
			teamData: this.teamData,
			styles: this.pseudoStyles,	// only pseudo-styles go in the <head>
			ideLinks: Utils.getIDELinks(),
			latestNews: this.latestNews,
			unsubscribeLink: this.getUnsubscribeLink(this.user)
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
			if (true /*this.user.email.match(/.*@codestream\.com$/)*/) {
				this.logger.log(`Sending weekly email to ${this.user.email}...`);
				await this.sender.sendEmail(options);
			} /*else {
				this.logger.log(`Would have sent weekly email to ${this.user.email}`);
			}*/
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
		const teamName = true/*this.teamData.team.isEveryoneTeam*/ ? this.teamData.company.name : this.teamData.team.name;
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
