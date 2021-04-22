// this class should be used to create all post documents in the database

'use strict';

const Post = require('./post');
const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const LastReadsUpdater = require('./last_reads_updater');
const PostPublisher = require('./post_publisher');
//const EmailNotificationQueue = require('./email_notification_queue');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const StreamPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_publisher');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodemarkCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_creator');
const ReviewCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/review_creator');
const CodemarkHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_helper');
const Errors = require('./errors');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const UserInviter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_inviter');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class PostCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}
	
	get modelClass () {
		return Post;	// class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async createPost (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for post creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['streamId']
			},
			optional: {
				string: ['text', 'parentPostId', '_subscriptionCheat'],
				object: ['codemark', 'review', 'inviteInfo'],
				boolean: ['dontSendEmail'],
				number: ['reviewCheckpoint', '_delayEmail', '_inviteCodeExpiresIn'],
				'array(string)': ['mentionedUserIds', 'addedUsers'],
				'array(object)': ['files', 'sharedTo']
			}
		};
	}

	// called before the post is actually saved
	async preSave () {
		if (this.attributes.codemark && this.attributes.review) {
			throw this.errorHandler.error('noCodemarkAndReview');
		}
		if (this.attributes.parentPostId && this.attributes.review) {
			throw this.errorHandler.error('noReplyWithReview');
		}


		// many attributes that are allowed but don't become attributes of the created user
		['dontSendEmail', 'addedUsers', 'inviteInfo', '_subscriptionCheat', '_delayEmail', '_inviteCodeExpiresIn'].forEach(parameter => {
			this[parameter] = this.attributes[parameter];
			delete this.attributes[parameter];
		});
		
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.originDetail = this.originDetail || this.request.request.headers['x-cs-plugin-ide-detail'] || '';
		this.attributes.creatorId = this.user.id;
		this.attributes.createdAt = Date.now();
		if (this.request.isForTesting && this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.createId();				// create an ID for the post
		await this.getStream();			// get the stream for the post
		await this.getTeam();			// get the team that owns the stream
		await this.getCompany();		// get the company that owns the team
		await this.createAddedUsers();	// create any unregistered users being mentioned
		await this.createCodemark();	// create the associated codemark, if any
		await this.createReview();		// create the associated review, if any
		await this.getSeqNum();			// requisition a sequence number for the post
		await super.preSave();			// base-class preSave
		await this.updateStream();		// update the stream as needed
		await this.updateLastReads();	// update lastReads attributes for affected users
		await this.updateParents();		// update the parent post and codemark if applicable
		await this.updatePostCount();	// update the post count for the author of the post
		this.updateTeam();				// update info for team, note, no need to "await"
	}

	// get the stream we're trying to create the post in
	async getStream () {
		this.stream = await this.data.streams.getById(this.attributes.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream'});
		}
		if (this.stream.get('type') === 'file') {
			// creating posts in a file stream is no longer allowed
			throw this.errorHandler.error('createAuth', { reason: 'can not post to a file stream' });
		}
		if (this.addedUsers && this.addedUsers.length && !this.stream.get('isTeamStream')) {
			throw this.errorHandler.error('validation', { reason: 'cannot add users to a stream that is not a team stream' });
		}
	}

	// get the team that owns the stream for which the post is being created
	async getTeam () {
		this.team = await this.data.teams.getById(this.stream.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	// post gets the same teamId as the stream
	}

	// get the company that owns the team for which the post is being created
	// only needed for analytics so we only do this for inbound emails 
	async getCompany () {
		if (!this.forInboundEmail) {
			// only needed for inbound email, for tracking
			return;
		}
		this.company = await this.data.companies.getById(this.team.get('companyId'));
	}

	// create any added users being mentioned, these users get invited "on-the-fly"
	async createAddedUsers () {
		// trickiness ... we need to include the codemark or review ID in the invited user objects, but we
		// don't know them yet, and we need to create the users first to make them followers ... so here we
		// lock down the IDs we will use later in creating the codemark or review
		if (this.attributes.codemark) {
			this.codemarkId = this.request.data.codemarks.createId();
			this.inviteTrigger = `C${this.codemarkId}`;
		}
		if (this.attributes.review) {
			this.reviewId = this.request.data.reviews.createId();
			this.inviteTrigger = `R${this.reviewId}`;
		}

		// filter to users that have a valid email
		this.addedUsers = (this.addedUsers || []).filter(email => {
			return typeof EmailUtilities.parseEmail(email) === 'object';
		});
		if (!this.addedUsers || this.addedUsers.length === 0) {
			return;
		}

		this.userInviter = new UserInviter({
			request: this.request,
			team: this.team,
			subscriptionCheat: this._subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			inviteCodeExpiresIn: this._inviteCodeExpiresIn,
			delayEmail: this._delayEmail,
			inviteInfo: this.inviteInfo,
			user: this.user,
			dontSendInviteEmail: true, // we don't send invite emails when users are invited this way, they get extra copy in their notification email instead
			dontPublishToInviter: true // we don't need to publish messages to the inviter, they will be published as the creator of the post instead
		});

		const userData = this.addedUsers.map(email => {
			return { 
				email,
				inviteTrigger: this.inviteTrigger
			};
		});
		this.transforms.invitedUsers = await this.userInviter.inviteUsers(userData);
	}

	// create an associated codemark, if applicable
	async createCodemark () {
		if (!this.attributes.codemark) {
			return;
		}
		const codemarkAttributes = Object.assign({}, this.attributes.codemark, {
			teamId: this.team.id,
			streamId: this.stream.id,
			postId: this.attributes.id
		});
		if (this.attributes.parentPostId) {
			codemarkAttributes.parentPostId = this.attributes.parentPostId;
		}
		const mentionedUserIds = this.attributes.mentionedUserIds || [];
		const usersBeingAddedToTeam = (this.transforms.invitedUsers || []).map(userData => userData.user.id);
		mentionedUserIds.push(...usersBeingAddedToTeam);
		this.transforms.createdCodemark = await new CodemarkCreator({
			request: this.request,
			origin: this.attributes.origin,
			mentionedUserIds,
			usersBeingAddedToTeam,
			useId: this.codemarkId // if locked down previously
		}).createCodemark(codemarkAttributes);
		delete this.attributes.codemark;
		this.attributes.codemarkId = this.transforms.createdCodemark.id;
	}

	// create an associated code review, if applicable
	async createReview () {
		if (!this.attributes.review) {
			return;
		}
		const reviewAttributes = Object.assign({}, this.attributes.review, {
			teamId: this.team.id,
			streamId: this.stream.id,
			postId: this.attributes.id
		});
		const usersBeingAddedToTeam = (this.transforms.invitedUsers || []).map(userData => userData.user.id);
		reviewAttributes.reviewers = (reviewAttributes.reviewers || []).concat(usersBeingAddedToTeam);
		this.transforms.createdReview = await new ReviewCreator({
			request: this.request,
			origin: this.attributes.origin,
			mentionedUserIds: this.attributes.mentionedUserIds || [],
			usersBeingAddedToTeam,
			useId: this.reviewId, // if locked down previously
		}).createReview(reviewAttributes);
		delete this.attributes.review;
		this.attributes.reviewId = this.transforms.createdReview.id;
	}

	// requisition a sequence number for this post
	async getSeqNum () {
		let seqNum = null;
		let numRetries = 0;
		let gotError = null;
		// this is a mutex-type operation ... we never want to assign the same
		// sequence number to two posts ... we maintain the next sequence number
		// in the stream document, and use findAndModify to increment the next
		// sequence number and fetch the current sequence number in the same
		// atomic operation, ensuring no one will ever get the same value ...
		// since we can get race conditions here (very rare), we'll put this in
		// a retry loop
		while (!seqNum && numRetries < 20) {
			let foundStream;
			try {
				foundStream = await this.data.streams.findAndModify(
					{ id: this.data.streams.objectIdSafe(this.attributes.streamId) },
					{ $inc: { nextSeqNum: 1 } },
					{ fields: { nextSeqNum: 1 } }
				);
			}
			catch (error) {
				numRetries++;
				gotError = error;
				continue;
			}
			gotError = null;
			seqNum = foundStream.nextSeqNum;
		}
		if (gotError) {
			throw gotError;
		}
		this.attributes.seqNum = seqNum;
	}

	// update the stream associated with the created post
	async updateStream () {
		// update the mostRecentPostId attribute, and the sortId attribute
		// (which is the same if there is a post in the stream) to the ID of
		// the created post
		const op = {
			$set: {
				mostRecentPostId: this.attributes.id,
				mostRecentPostCreatedAt: this.attributes.createdAt,
				sortId: this.attributes.id,
				modifiedAt: Date.now()
			}
		};
		// increment the number of markers in this stream
		if (this.transforms.createdMarkers && this.transforms.createdMarkers.length) {
			const numAddedMarkers = this.transforms.createdMarkers.length;
			op.$set.numMarkers = (this.stream.get('numMarkers') || 0) + numAddedMarkers;
		}
		this.transforms.streamUpdateForPost = await new ModelSaver({
			request: this.request,
			collection: this.data.streams,
			id: this.stream.id
		}).save(op);
	}

	// update the lastReads attribute for each user in the stream or team,
	// for those users for whom this post represents a new unread message
	async updateLastReads () {
		await new LastReadsUpdater({
			data: this.data,
			user: this.user,
			stream: this.stream,
			team: this.team,
			previousPostSeqNum: this.attributes.seqNum - 1,
			logger: this
		}).updateLastReads();
	}

	// if this is a reply, update the numReplies attribute for the parent post and/or parent codemark
	async updateParents () {
		if (!this.model.get('parentPostId')) {
			return;
		}
		this.parentPost = await this.data.posts.getById(this.model.get('parentPostId'));
		if (!this.parentPost) { 
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}

		if (this.parentPost.get('parentPostId')) {
			// the only reply to a reply we allow is if the parent post of the post we are replying to is a review post
			this.grandParentPost = await this.data.posts.getById(this.parentPost.get('parentPostId'));
			if (this.grandParentPost && !this.grandParentPost.get('reviewId')) {
				throw this.errorHandler.error('noReplyToReply');
			}
		}
		await this.updateParentPost();
		await this.updateGrandParentPost();
		await this.updateParentCodemark();
		await this.updateParentReview();
	}

	// update numReplies for a parent post to this post
	async updateParentPost () {
		const op = { 
			$set: {
				numReplies: (this.parentPost.get('numReplies') || 0) + 1,
				modifiedAt: Date.now()
			} 
		};
		this.transforms.postUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: this.parentPost.id
		}).save(op);
	}
	
	// update numReplies for a grandparent post to this post
	async updateGrandParentPost () {
		if (!this.grandParentPost) { return; }
		const op = { 
			$set: {
				numReplies: (this.grandParentPost.get('numReplies') || 0) + 1,
				modifiedAt: Date.now()
			} 
		};
		this.transforms.grandParentPostUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: this.grandParentPost.id
		}).save(op);
	}
	
	// update numReplies for the parent post's codemark, if any
	async updateParentCodemark () {
		if (!this.parentPost.get('codemarkId')) {
			return;
		}
		const codemark = await this.request.data.codemarks.getById(this.parentPost.get('codemarkId'));
		if (!codemark) { return; }

		const now = Date.now();
		const op = { 
			$set: {
				numReplies: (codemark.get('numReplies') || 0) + 1,
				lastReplyAt: now,
				lastActivityAt: now,
				modifiedAt: now
			}
		};

		// handle any followers that need to be added to the codemark, as needed
		await this.handleFollowers(codemark, op);

		this.transforms.updatedCodemarks = this.transforms.updatedCodemarks || [];
		const codemarkUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.codemarks,
			id: codemark.id
		}).save(op);
		this.transforms.updatedCodemarks.push(codemarkUpdate);
	}

	// update numReplies for the parent post's review, if any
	async updateParentReview () {
		if (!this.parentPost.get('reviewId') && !this.grandParentPost) {
			return;
		}
		const reviewId = this.parentPost.get('reviewId') || this.grandParentPost.get('reviewId');
		const review = await this.request.data.reviews.getById(reviewId, { excludeFields: ['reviewDiffs', 'checkpointReviewDiffs'] });
		if (!review) { return; }

		const now = Date.now();
		const op = { 
			$set: {
				numReplies: (review.get('numReplies') || 0) + 1,
				lastReplyAt: now,
				lastActivityAt: now,
				modifiedAt: now
			}
		};

		// handle any followers that need to be added to the review, as needed
		await this.handleFollowers(review, op);

		this.transforms.updatedReviews = this.transforms.updatedReviews || [];
		const reviewUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.reviews,
			id: review.id
		}).save(op);
		this.transforms.updatedReviews.push(reviewUpdate);
	}

	// handle followers to parent codemark or review as needed
	async handleFollowers (codemarkOrReview, op) {
		// if this is a legacy codemark, created before codemark following was introduced per the "sharing" model,
		// we need to fill its followerIds array with the appropriate users
		if (codemarkOrReview.get('followerIds') === undefined) {
			op.$set.followerIds = await new CodemarkHelper({ request: this.request }).handleFollowers(
				codemarkOrReview.attributes,
				{
					mentionedUserIds: this.parentPost.get('mentionedUserIds'),
					team: this.team,
					stream: this.stream,
					parentPost: this.parentPost
				}
			);
		}

		// also add this user as a follower if they have that preference, and are not a follower already
		const userNotificationPreference = (this.user.get('preferences') || {}).notifications || 'involveMe';
		const followerIds = codemarkOrReview.get('followerIds') || [];
		if (userNotificationPreference === 'involveMe' && followerIds.indexOf(this.user.id) === -1) {
			if (op.$set.followerIds) {
				// here we're just adding the replying user to the followerIds array for the legacy codemark,
				// described above
				if (op.$set.followerIds.indexOf(this.user.id) === -1) {
					op.$set.followerIds.push(this.user.id);
				}
			}
			else {
				op.$addToSet = { followerIds: this.user.id };
			}
		}

		// if a user is mentioned that is not following the codemark/review, and they have the preference to
		// follow codemarks/reviews they are mentioned in, then we'll presume to make them a follower
		// fetch preferences for the members
		const mentionedUserIds = this.attributes.mentionedUserIds || [];
		let newFollowerIds = ArrayUtilities.difference(mentionedUserIds, followerIds);
		if (newFollowerIds.length === 0) { return; }
		let newFollowers = await this.request.data.users.getByIds(
			newFollowerIds,
			{
				fields: ['id', 'preferences'],
				noCache: true,
				ignoreCache: true
			}
		);
		newFollowers = newFollowers.filter(user => {
			const preferences = user.get('preferences') || {};
			const notificationPreference = preferences.notifications || 'involveMe';
			return (
				!user.get('deactivated') && 
				(
					notificationPreference === 'all' ||
					notificationPreference === 'involveMe'
				)
			);
		});
		newFollowerIds = newFollowers.map(follower => follower.id);
		if (newFollowerIds.length > 0) {
			if (op.$set.followerIds) {
				op.$set.followerIds = ArrayUtilities.union(op.$set.followerIds, newFollowerIds);
			}
			else {
				op.$addToSet = op.$addToSet || { followerIds: [] };
				op.$addToSet.followerIds = ArrayUtilities.union(op.$addToSet.followerIds, newFollowerIds);
			}
		}
	}

	// update the total post count for the author of the post, along with the date/time of last post,
	// also clear lastReads for the stream 
	async updatePostCount () {
		const op = {
			$set: { 
				lastPostCreatedAt: this.attributes.createdAt,
				totalPosts: (this.user.get('totalPosts') || 0) + 1,
				modifiedAt: Date.now()
			},
			$unset: { [`lastReads.${this.stream.id}`]: true }
		};
		if (this.transforms.createdReview) {
			op.$set.totalReviews = (this.user.get('totalReviews') || 0) + 1;
		}
		this.transforms.updatePostCountOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// update the time the last post was created for the team
	async updateTeam () {
		return this.data.teams.updateDirectWhenPersist(
			{
				_id: this.data.teams.objectIdSafe(this.team.id)
			},
			{
				$set: {
					lastPostCreatedAt: this.attributes.createdAt
				}
			}
		);
	}

	// after the post was created...
	async postCreate (options) {
		// all these operations are independent and can happen in parallel
		await awaitParallel([
			this.publishCreatedStreamsForMarkers,	// publish any streams created on-the-fly for the markers, as needed
			this.publishRepos,					// publish any created or updated repos to the team
			this.publishPost.bind(this, options && options.postPublishData), // publish the actual post to members of the team or stream
			this.publishParents,				// if this post was a reply and we updated the parent post or codemark, publish that
			this.triggerNotificationEmails,		// trigger email notifications to members who should receive them
			this.publishToAuthor,				// publish directives to the author's me-channel
			this.trackPost,						// for server-generated posts, send analytics info
			this.updateMentions					// for mentioned users, update their mentions count for analytics
		], this);

		await this.postProcessInvitedUsers();
	}

	// if we invited users, handle additional post-response processing
	async postProcessInvitedUsers () {
		if (this.userInviter) {
			return this.userInviter.postProcess();
		}
	}

	// if we created any streams on-the-fly for the markers, publish them as needed
	async publishCreatedStreamsForMarkers () {
		// streams created on-the-fly for markers are necessarily going to be file streams,
		// these should automatically get published to the whole team
		await Promise.all((this.transforms.createdStreamsForMarkers || []).map(async stream => {
			await this.publishStream(stream);
		}));
	}

	// publish any created or updated repos to the team
	async publishRepos () {
		// the repos only need to be published if the stream for the post (this.stream, 
		// which is possibly different from the stream to be published) is a private stream ... 
		// otherwise the repos will be published along with the post anyway, to the entire team
		if (!this.stream.hasPrivateContent()) {
			return;
		}

		const repos = (this.transforms.createdRepos || []).map(repo => repo.getSanitizedObject({ request: this.request }))
			.concat(this.transforms.repoUpdates || []);
		if (repos.length === 0) {
			return;
		}

		const teamId = this.team.id;
		const channel = 'team-' + teamId;
		const message = {
			repos: repos,
			requestId: this.request.request.id
		};
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish repos message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish a given stream
	async publishStream (stream) {
		// the stream only needs to be published if the stream for the post (this.stream, 
		// which is possibly different from the stream to be published) is a private stream ... 
		// otherwise the stream will be published along with the post anyway, to the entire team
		if (!this.stream.hasPrivateContent()) {
			return;
		}

		const sanitizedStream = stream.getSanitizedObject({ request: this.request });
		await new StreamPublisher({
			stream: sanitizedStream,
			data: { stream: sanitizedStream },
			request: this.request,
			broadcaster: this.api.services.broadcaster,
			isNew: true
		}).publishStream();
	}
	
	// publish the post to the appropriate broadcaster channel
	async publishPost (customData) {
		await new PostPublisher({
			request: this.request,
			data: customData || this.request.responseData,
			broadcaster: this.api.services.broadcaster,
			stream: this.stream.attributes
		}).publishPost();
	}

	// if the parent post or codemark was updated, publish the parent post or codemark
	async publishParents () {
		if (!this.transforms.postUpdate && (this.transforms.updatedCodemarks || []).length === 0) {
			return;
		}
		const data = {};
		if (this.transforms.postUpdate) {
			data.post = this.transforms.postUpdate;
		}
		if (this.transforms.updatedCodemarks) {
			data.codemarks = this.transforms.updatedCodemarks;
		}
		if (this.transforms.updatedReviews) {
			data.reviews = this.transforms.updatedReviews;
		}

		await new PostPublisher({
			request: this.request,
			data,
			broadcaster: this.api.services.broadcaster,
			stream: this.stream.attributes	// assuming stream for the parent post is the same as for the reply
		}).publishPost();
	}

	// send an email notification as needed to users who are offline
	async triggerNotificationEmails () {
		if (this.requestSaysToBlockEmails()) {
			// don't do email notifications for unit tests, unless asked
			this.request.log('Would have triggered email notifications for stream ' + this.stream.id);
			return;
		}
		if (this.dontSendEmail) {
			this.request.log('Email notification trigger blocked by caller for stream ' + this.stream.id);
			return;
		}

		// users being added to the team get special treatment in the notification
		const newUsers = (this.transforms.invitedUsers || [])
			.filter(userData => !userData.wasOnTeam)
			.map(userData => userData.user.id);
		const message = {
			type: 'notification_v2',
			postId: this.model.id,
			usersBeingAddedToTeam: newUsers
		};
		this.request.log(`Triggering V2 email notifications for post ${this.model.id}...`);
		this.request.api.services.email.queueEmailSend(message, { request: this.request });
	}

	// publish a message reflecting this post to the post's author
	// this includes an increase in the post count, and a clearing of the 
	// author's lastReads for the stream
	async publishToAuthor () {
		const channel = `user-${this.user.id}`;
		const message = {
			requestId: this.request.request.id,
			user: this.transforms.updatePostCountOp
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish author update message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// track this post for analytics, with the possibility that the user may have opted out
	async trackPost () {
		const { request, user, team, company } = this;

		// only track for email replies, client-originating posts are tracked by the client
		if (!this.forInboundEmail || !this.parentPost) {
			return;
		}

		const dateOfLastPost = new Date(this.model.get('createdAt')).toISOString();
		const trackData = {
			'Parent ID': this.parentPost.get('codemarkId') || this.parentPost.get('reviewId') || 
				(this.grandParentPost && this.grandParentPost.get('reviewId')),
			Endpoint: 'Email',
			'Date of Last Post': dateOfLastPost
		};
		if (user.get('totalPosts') === 1) {
			trackData['First Post?'] = new Date(this.model.get('createdAt')).toISOString();
		}

		let parentType;
		if (this.parentPost.get('reviewId')) {
			parentType = 'Review';
		}
		else if (this.parentPost.get('codemarkId')) {
			if (this.grandParentPost) {
				parentType = 'Review.Codemark';
			}
			else {
				parentType = 'Codemark';
			}
		}
		else if (this.grandParentPost) {
			parentType = 'Review.Reply';
		}
		else {
			parentType = 'Post'; // but should never happen
		}
		trackData['Parent Type'] = parentType;

		this.api.services.analytics.trackWithSuperProperties(
			'Reply Created',
			trackData,
			{ request, user, team, company }
		);
	}

	// for unregistered users who are mentioned, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentions () {
		await this.getMentionedUsers();
		await this.updateMentionedUsers();
	}

	// get any mentioned users so we can tell who is unregistered
	async getMentionedUsers () {
		const userIds = this.attributes.mentionedUserIds || [];
		if (this.transforms.createdReview && this.transforms.createdReview.get('reviewers')) {
			userIds.push(...this.transforms.createdReview.get('reviewers'));
		}
		if (userIds.length === 0) {
			return;
		}
		this.mentionedUsers = await this.data.users.getByIds(
			userIds,
			{
				noCache: true,
				fields: ['id', 'isRegistered']
			}
		);
	}

	// for unregistered users who are mentioned, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentionedUsers () {
		await Promise.all((this.mentionedUsers || []).map(async user => {
			await this.updateMentionsForUser(user);
		}));
	}

	// for an unregistered mentioned user, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentionsForUser (user) {
		if (user.get('isRegistered')) {
			return ;	// we only do this for unregistered users
		}
		const update = {
			$set: {
				internalMethod: 'mention_notification',
				internalMethodDetail: this.user.id
			},
			$inc: {
				numMentions: 1
			}
		};

		// if a review or codemark was created, update the user's invite trigger and last invite type
		if (this.inviteTrigger) {
			update.$set.inviteTrigger = this.inviteTrigger;
			update.$set.lastInviteType = this.inviteTrigger.startsWith('R') ? 'reviewNotification' : 'codemarkNotification';
		}

		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(user.id) },
			update
		);
	}

	// determine if special header was sent with the request that says to block emails
	requestSaysToBlockEmails () {
		return (
			(
				this.request.api.config.email.suppressEmails &&
				!this.request.request.headers['x-cs-test-email-sends']
			) ||
			(
				this.request.request.headers &&
				this.request.request.headers['x-cs-block-email-sends']
			)
		);
	}
}

module.exports = PostCreator;
