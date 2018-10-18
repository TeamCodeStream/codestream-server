// this class should be used to create all post documents in the database

'use strict';

const Post = require('./post');
const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const LastReadsUpdater = require('./last_reads_updater');
const PostAttributes = require('./post_attributes');
const PostPublisher = require('./post_publisher');
const CodeBlockHandler = require('./code_block_handler');
const EmailNotificationQueue = require('./email_notification_queue');
const IntegrationHandler = require('./integration_handler');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const StreamPublisher = require(process.env.CS_API_TOP + '/modules/streams/stream_publisher');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class PostCreator extends ModelCreator {

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

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have code blocks, preemptively make sure they are valid, 
		// we are strict about code blocks, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.codeBlocks) {
			await this.validateCodeBlocks();
		}
	}

	// validate the code blocks sent with the post creation
	async validateCodeBlocks () {
		// must be an array of objects
		const result = new Post().validator.validateArrayOfObjects(
			this.attributes.codeBlocks,
			PostAttributes.codeBlocks
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `codeBlocks: ${result}` });
		}
	}

	// get attributes that are required for post creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			optional: {
				string: ['streamId', 'text', 'commitHashWhenPosted', 'parentPostId', 'providerType', 'providerPostId', 'providerConversationId', 'type', 'color', 'status', 'title'],
				object: ['stream', 'providerInfo'],
				'array(object)': ['codeBlocks'],
				'array(string)': ['mentionedUserIds', 'assignees']
			}
		};
	}

	// validate attributes for the post we are creating
	async validateAttributes () {
		if (!this.attributes.streamId && typeof this.attributes.stream !== 'object') {
			// must have a stream ID or a stream object (for creating streams on the fly)
			return this.errorHandler.error('parameterRequired', { info: 'streamId or stream' });
		}
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
	}

	// called before the post is actually saved
	async preSave () {
		if (this.attributes.commitHashWhenPosted) {
			// commit hash always converted to lowercase
			this.attributes.commitHashWhenPosted = this.attributes.commitHashWhenPosted.toLowerCase();
		}
		this.attributes.creatorId = this.user.id;
		this.attributes.createdAt = Date.now();
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await this.getStream();			// get the stream for the post
		await this.getRepo();			// get the repo (for posts in file-type streams)
		await this.getTeam();			// get the team that owns the stream
		await this.getCompany();		// get the company that owns the team
		await this.createStream();		// create the stream, if requested to create on-the-fly
		this.createId();				// create an ID for the post
		await this.handleCodeBlocks();	// handle any code blocks tied to the post
		await this.getSeqNum();			// requisition a sequence number for the post
		await super.preSave();			// base-class preSave
		await this.updateStream();		// update the stream as needed
		await this.updateLastReads();	// update lastReads attributes for affected users
		await this.getParentPost();		// get parent post, if this is a reply
		await this.updateMarkersForReply();	// update markers, if this is a reply to a parent with a code block
		await this.updateParentPost();	// update the parent post with hasReplies, if this is a reply to a parent
		await this.updatePostCount();	// update the post count for the author of the post
	}

	// get the stream we're trying to create the post in
	async getStream () {
		if (!this.attributes.streamId) {
			return;	// stream will be created on-the-fly
		}
		this.stream = await this.data.streams.getById(this.attributes.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream'});
		}
	}

	// get the repo to which the stream belongs, if it is a file-type stream
	async getRepo () {
		const repoId = this.stream ?
			this.stream.get('repoId') :		// stream given by ID
			this.attributes.stream.repoId;	// on-the-fly stream
		if (!repoId) {
			return;	// not a file-type stream
		}
		this.repo = await this.data.repos.getById(repoId);
		if (!this.repo) {
			throw this.errorHandler.error('notFound', { info: 'repo'});
		}
		this.attributes.repoId = this.repo.id;	// post gets the same repoId as the stream
	}

	// get the team that owns the stream for which the post is being created
	async getTeam () {
		let teamId;
		if (this.repo) {
			teamId = this.repo.get('teamId');
		}
		else if (this.stream) {
			teamId = this.stream.get('teamId');
		}
		else if (this.attributes.stream) {
			teamId = this.attributes.stream.teamId;
		}
		if (!teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	// post gets the same teamId as the stream
	}

	// get the company that owns the team for which the post is being created
	// only needed for analytics so we only do this for inbound emails or integrations
	async getCompany () {
		if (!this.forInboundEmail && !this.forIntegration) {
			// only needed for inbound email or integration posts, for tracking
			return;
		}
		this.company = await this.data.companies.getById(this.team.get('companyId'));
	}

	// for streams created on-the-fly, create the stream now
	async createStream () {
		if (this.stream) {
			return; // not an on-the-fly stream creation
		}
		this.attributes.stream.teamId = this.team.id;
		this.transforms.createdStreamForPost = await new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(this.attributes.stream);
		this.stream = this.transforms.createdStreamForPost;
		this.attributes.streamId = this.stream.id;
		delete this.attributes.stream;
	}

	// handle any code blocks tied to the post
	async handleCodeBlocks () {
		if (!this.attributes.codeBlocks) {
			return;
		}
		this.transforms.createdRepos = [];
		this.transforms.repoUpdates = [];
		this.transforms.createdStreamsForCodeBlocks = [];
		this.transforms.createdMarkers = [];
		this.transforms.markerLocations = [];
		await Promise.all(this.attributes.codeBlocks.map(async codeBlock => {
			await this.handleCodeBlock(codeBlock);
		}));
	}

	// handle a single code block attached to the post
	async handleCodeBlock (codeBlock) {
		const postAttributes = {};
		['type', 'status', 'color'].forEach(attribute => {
			if (this.attributes[attribute]) {
				postAttributes[attribute] = this.attributes[attribute];
			}
		});
		// handle the code block itself separately
		const codeBlockInfo = await new CodeBlockHandler({
			codeBlock,
			request: this.request,
			team: this.team,
			postRepo: this.repo,
			postStream: this.stream,
			postId: this.attributes._id,
			postAttributes,
			postCommitHash: this.attributes.commitHashWhenPosted
		}).handleCodeBlock();

		// as a "side effect", this may have created any number of things, like a new repo, new stream, etc.
		// we'll track these things and attach them to the request response later, and also possibly publish
		// them on pubnub channels
		if (codeBlockInfo.createdRepo) {
			this.transforms.createdRepos.push(codeBlockInfo.createdRepo);
		}
		if (codeBlockInfo.repoUpdate) {
			this.transforms.repoUpdates.push(codeBlockInfo.repoUpdate);
		}
		if (codeBlockInfo.createdStream) {
			this.transforms.createdStreamsForCodeBlocks.push(codeBlockInfo.createdStream);
		}
		if (codeBlockInfo.createdMarker) {
			this.transforms.createdMarkers.push(codeBlockInfo.createdMarker);
		}
		if (codeBlockInfo.markerLocation) {
			// marker locations are special, they can be collapsed as long as the marker locations
			// structure refers to the same stream and commit hash
			const markerLocations = this.transforms.markerLocations.find(markerLocations => {
				return (
					markerLocations.streamId === codeBlockInfo.markerLocation.streamId &&
					markerLocations.commitHash === codeBlockInfo.markerLocation.commitHash
				);
			});
			if (markerLocations) {
				Object.assign(markerLocations.locations, codeBlockInfo.markerLocation.locations);
			}
			else {
				this.transforms.markerLocations.push(codeBlockInfo.markerLocation);
			}
		}
	}

	// requisition a sequence number for this post
	async getSeqNum () {
		if (this.transforms.createdStreamForPost) {
			// if we created the stream, start out with seqNum of 1
			this.attributes.seqNum = 1;
			return;
		}
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
					{ _id: this.data.streams.objectIdSafe(this.attributes.streamId) },
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
				mostRecentPostId: this.attributes._id,
				mostRecentPostCreatedAt: this.attributes.createdAt,
				sortId: this.attributes._id
			}
		};
		// increment the number of markers in this stream
		if (this.transforms.createdMarkers && this.transforms.createdMarkers.length) {
			op.$inc = { numMarkers: this.transforms.createdMarkers.length };
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

	// get the parent post, for replies
	async getParentPost () {
		// this only applies to replies
		if (!this.model.get('parentPostId')) {
			return;
		}
		this.parentPost = await this.data.posts.getById(this.model.get('parentPostId'));
	}

	// if the created post is a reply to a parent with code blocks, then the
	// markers for those code blocks get their numComments attribute incremented
	async updateMarkersForReply () {
		if (!this.parentPost) { return; }	
		// collect all marker IDs for code blocks referred to by the parent post
		const codeBlocks = this.parentPost.get('codeBlocks') || [];
		const parentPostMarkerIds = codeBlocks
			.map(codeBlock => codeBlock.markerId)
			.filter(markerId => markerId);
		if (parentPostMarkerIds.length === 0) {
			return;
		}
		this.transforms.markerUpdates = [];
		for (let markerId of parentPostMarkerIds) {
			await this.updateMarkerForParentPost(markerId);
		}
	}

	// for a single marker for a code block referred to by a parent post,
	// increment its numComments attribute
	async updateMarkerForParentPost (markerId) {
		const op = { $inc: { numComments: 1 } };
		const markerUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.markers,
			id: markerId
		}).save(op);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// if this is the first reply to a post, mark that the parent post now has replies
	async updateParentPost () {
		if (!this.parentPost) {
			// no need for this update if there is no parent post
			return; 
		}
		const op = { 
			$set: {
				hasReplies: true,
				numReplies: (this.parentPost.get('numReplies') || 0) + 1
			} 
		};
		const postUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: this.parentPost.id
		}).save(op);
		this.transforms.postUpdates = [postUpdate];
	}
	
	// update the total post count for the author of the post, along with the date/time of last post,
	// also clear lastReads for the stream 
	async updatePostCount () {
		const op = {
			$set: { 
				lastPostCreatedAt: this.attributes.createdAt,
				totalPosts: (this.user.get('totalPosts') || 0) + 1
			},
			$unset: { [`lastReads.${this.stream.id}`]: true }
		};
		this.transforms.updatePostCountOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// after the post was created...
	async postCreate () {
		// all these operations are independent and can happen in parallel
		await awaitParallel([
			this.publishCreatedStreamForPost,	// publish any stream created on-the-fly for the post, as needed
			this.publishCreatedStreamsForCodeBlocks,	// publish any streams created on-the-fly for the code blocks, as needed
			this.publishPost,					// publish the actual post to members of the team or stream
			this.publishParentPost,				// if this post was a reply and we updated the parent post, publish that
			this.triggerNotificationEmails,		// trigger email notifications to members who should receive them
			this.doIntegrationHooks,			// trigger any integration hooks from this post
			this.publishToAuthor,				// publish directives to the author's me-channel
			this.sendPostCountToAnalytics,		// update analytics post count for the post's author
			this.trackPost,						// for server-generated posts, send analytics info
			this.updateMentions					// for mentioned users, update their mentions count for analytics 
		], this);
	}

	// if we created a stream on-the-fly for the post, publish it as needed
	async publishCreatedStreamForPost () {
		if (this.transforms.createdStreamForPost) {
			await this.publishStream(this.transforms.createdStreamForPost, true);
		}
	}

	// if we created any streams on-the-fly for the code blocks, publish them as needed
	async publishCreatedStreamsForCodeBlocks () {
		// streams created on-the-fly for code blocks are necessarily going to be file streams,
		// these should automatically get published to the whole team
		await Promise.all((this.transforms.createdStreamsForCodeBlocks || []).map(async stream => {
			await this.publishStream(stream, true);
		}));
	}

	// publish a given stream
	async publishStream (stream, isNew) {
		// the stream only needs to be published if the stream for the post (this.stream, 
		// which is possibly different from the stream to be published) is a private stream ... 
		// otherwise the stream will be published along with the post anyway, to the entire team
		if (!this.stream.hasPrivateContent()) {
			return;
		}
		const sanitizedStream = stream.getSanitizedObject();
		await new StreamPublisher({
			stream: sanitizedStream,
			data: { stream: sanitizedStream },
			request: this.request,
			messager: this.api.services.messager,
			isNew
		}).publishStream();
	}
	
	// publish the post to the appropriate messager channel
	async publishPost () {
		await new PostPublisher({
			request: this.request,
			data: this.request.responseData,
			messager: this.api.services.messager,
			stream: this.stream.attributes
		}).publishPost();
	}

	// if the parent post was updated, publish the parent post
	async publishParentPost () {
		// the parent post will show up as the first element of the posts array
		// in the response
		if (!this.transforms.postUpdates || this.transforms.postUpdates.length === 0) {
			return;
		}
		await new PostPublisher({
			request: this.request,
			data: {
				post: this.transforms.postUpdates[0]
			},
			messager: this.api.services.messager,
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
		if (this.model.get('providerType') || Object.keys(this.team.get('providerInfo') || {}).length > 0) {
			this.request.log(`Post associated with provider ${this.model.get('providerType')} will not trigger notifications`);
			return;
		}

		const queue = new EmailNotificationQueue({
			request: this.request,
			fromSeqNum: this.model.get('seqNum'),
			initialTriggerTime: this.model.get('createdAt'),
			stream: this.stream
		});
		try {
			await queue.initiateEmailNotifications();
		}
		catch (error) {
			this.request.warn(`Unable to queue email notifications for stream ${this.stream.id} and post ${this.model.id}: ${error.toString()}`);
		}
	}

	// handle any integration hooks triggered by a new post
	async doIntegrationHooks () {
		await new IntegrationHandler({
			request: this.request
		}).handleNewPost({
			post: this.model,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			creator: this.user,
			parentPost: this.parentPost,
			parentPostCreator: this.parentPostAuthor
		});
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
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish author update message to user ${this.user._id}: ${JSON.stringify(error)}`);
		}
	}

	// send the post count update to our analytics service
	async sendPostCountToAnalytics () {
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return;
		}
		this.api.services.analytics.setPerson(
			this.user.id,
			{
				'Total Posts': this.user.get('totalPosts'),
				'Date of Last Post': new Date(this.user.get('lastPostCreatedAt')).toISOString()
			},
			{
				request: this.request,
				user: this.user
			}
		);
	}

	// track this post for analytics, with the possibility that the user may have opted out
	async trackPost () {
		// only track for inbound emails or integrations, client-originating posts are
		// tracked by the client
		if (!this.forInboundEmail && !this.forIntegration) {
			return;
		}
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return ;
		}

		const endpoint = this.forInboundEmail ? 'Email' :
			this.forIntegration.charAt(0).toUpperCase() + this.forIntegration.slice(1);
		const categories = {
			'channel': 'Private Channel',
			'direct': 'Direct Message',
			'file': 'Source File'
		};
		let category = categories[this.stream.get('type')] || '???';
		if (this.stream.get('type') === 'channel' && this.stream.get('privacy') === 'public') {
			category = 'Public Channel';
		}
		const companyName = this.company ? this.company.get('name') : '???';
		const trackObject = {
			distinct_id: this.user.id,
			Type: 'Chat',
			Thread: 'Parent',
			Category: category,
			'Email Address': this.user.get('email'),
			'Join Method': this.user.get('joinMethod'),
			'Team ID': this.team ? this.team.id : undefined,
			'Team Size': this.team ? this.team.get('memberIds').length : undefined,
			Company: companyName,
			'Endpoint': endpoint,
			'Plan': 'Free', // FIXME: update when we have payments
			'Date of Last Post': new Date(this.model.get('createdAt')).toISOString()
		};
		if (this.user.get('registeredAt')) {
			trackObject['Date Signed Up'] = new Date(this.user.get('registeredAt')).toISOString();
		}
		if (this.user.get('totalPosts') === 1) {
			trackObject['First Post?'] = new Date(this.model.get('createdAt')).toISOString();
		}

		this.api.services.analytics.track(
			'Post Created',
			trackObject,
			{
				request: this.request,
				user: this.user
			}
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
		if (userIds.length === 0) {
			return;
		}
		this.mentionedUsers = await this.data.users.getByIds(
			userIds,
			{
				noCache: true,
				fields: ['_id', 'isRegistered']
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
		await this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(user.id) },
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
