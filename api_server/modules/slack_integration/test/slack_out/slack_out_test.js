// serves as the base class for other slack integration output tests

'use strict';

const Assert = require('assert');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Slack = require(process.env.CS_API_TOP + '/config/slack');

class SlackOutTest extends CodeStreamMessageTest {

	constructor (options = {}) {
		super(options);
		this.streamType = this.streamType || 'channel';
		if (!options.privacy && this.streamType === 'channel') {
			this.privacy = 'public';
		}
	}

	get description () {
		let streamType = this.streamType === 'channel' ? 
			(this.isTeamStream ? 'team' : 'channel') :
			this.streamType;
		if (this.privacy) {
			streamType = `${this.privacy} ${streamType}`;
		}
		return `when a team has slack integration enabled, a new post in a ${streamType} stream owned by that team should send a message to the slack bot`;
	}

	// make the data we'll use for the test
	makeData (callback) {
		// establish the creator of the post that triggers the email, and their token
		// the current user and token will be usurped later to be the client that is set to
		// receive the simulated slack message via pubnub
		this.postCreator = this.currentUser;
		this.creatorToken = this.token;
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user, as needed
			this.createRepo,		// create the repo to be used in the test
			this.enableSlack,		// enable the slack integration as needed
			this.createStream,		// create a stream of the given type
			this.createFileStream,	// create a file stream, for code block, as needed
			this.createParentPost,	// create a parent post, if needed
			this.setCurrentUser,	// set the current user, the one who will be listening for the pubnub message that represents the slack message that would otherwise go out
			this.makePostData,		// make the data for the post what will trigger the message
		], callback);
	}

	// create another registered user as needed
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (and team) to be used during tests
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				token: this.creatorToken,						// first user creates the repo
				withEmails: [this.otherUserData.user.email]		// include the "second" user
			}
		);
	}

	// create a stream of the given type to be used during the tests
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				token: this.creatorToken,	// first user creates the stream
				type: this.streamType,
				repoId: this.streamType === 'file' ? this.repo._id : undefined,
				teamId: this.team._id,
				privacy: this.streamType === 'channel' ? this.privacy || 'private' : undefined,
				memberIds: this.streamType !== 'file' ? [this.otherUserData.user._id] : undefined,
				isTeamStream: this.isTeamStream
			}
		);
	}

	// create a file stream to be used during the tests, for any code blocks
	createFileStream (callback) {
		if (!this.wantCodeBlock) {
			return callback();
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.fileStream = response.stream;
				callback();
			},
			{
				token: this.creatorToken,	// first user creates the stream
				type: 'file',
				repoId: this.repo._id,
				teamId: this.team._id
			}
		);
	}

	// enable slack integration for the team
	enableSlack (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/slack-enable',
				data: {
					secret: Slack.secret,
					teamId: this.team._id,
					enable: true
				}
			},
			callback
		);
	}

	// create a parent post, if needed, for testing that reply-to text appears in the message
	createParentPost (callback) {
		if (!this.wantParentPost) {
			return callback();
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.parentPost = response.post;
				callback();
			},
			{
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	// set the current user, i.e., the user who will be looking for the pubnub message that represents
	// the email data that would otherwise be going out to the slack-bot
	setCurrentUser (callback) {
		// we want the "other" user to get the message
		this.currentUser = this.otherUserData.user;
		this.token = this.otherUserData.accessToken;
		callback();
	}

	// make the data that will be used for the post that triggers the slack message
	makePostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (this.wantMention) {
					// the mentionedUserIds array is passed by the client and represents the users who are mentioned
					// in the post
					data.mentionedUserIds = [this.currentUser._id];
				}
				// if we wanted a parent post, then make this post a reply
				if (this.parentPost) {
					data.parentPostId = this.parentPost._id;
				}
				this.data = data;
				callback();
			},
			{
				streamId: this.stream._id,
				wantCodeBlocks: this.wantCodeBlock ? 1 : 0,	// for testing code in the message,
				codeBlockStreamId: this.wantCodeBlock ? this.fileStream._id : undefined
			}
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// we use the team channel to send the mock message, this is the message that would
		// normally go to the slack-bot but we preempt it for testing
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	// generate the message that triggers the test
	generateMessage (callback) {
		// create a post that will trigger the slack message
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.creatorToken,
				testBotOut: true
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			}
		);
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (!message.postId) { return false; }	// not the message we want
		Assert(message.teamId === this.team._id, 'incorrect team ID');
		if (this.streamType === 'file') {
			Assert(message.repoId === this.repo._id, 'incorrect repo ID');
			Assert(message.repoUrl === 'https://' + this.repo.normalizedUrl, 'incorrect repo url');
		}
		else if (this.streamType === 'channel') {
			Assert(message.stream === this.stream.name, 'incorrect stream name');
		}
		Assert(message.streamId === this.stream._id, 'incorrect stream ID');
		Assert(message.file === this.stream.file, 'incorrect file');
		Assert(message.postId === this.post._id, 'incorrect postId');
		Assert(message.text === this.post.text, 'incorrect post text');
		Assert(message.creatorId === this.post.creatorId, 'incorrect creator ID');
		Assert(message.createdAt === this.post.createdAt, 'incorrect createdAt');
		Assert(message.creatorUsername === this.postCreator.username, 'incorrect creator username');
		Assert(message.creatorFirstName === this.postCreator.firstName, 'incorrect creator first name');
		Assert(message.creatorLastName === this.postCreator.lastName, 'incorrect creator last name');
		Assert(message.creatorEmail === this.postCreator.email, 'incorrect creator email');
		this.validateCodeBlock(message);
		this.validateMention(message);
		this.validateParentPost(message);
		return true;
	}

	// validate we got code blocks, if we expected them
	validateCodeBlock (message) {
		if (!this.wantCodeBlock) { return; }	// didn't want code block
		const codeBlock = message.codeBlocks[0];
		const expectedCodeBlock = this.post.codeBlocks[0];
		Assert(codeBlock.code === expectedCodeBlock.code, 'incorrect code');
		Assert(codeBlock.preContext === expectedCodeBlock.preContext, 'incorrect preContext');
		Assert(codeBlock.postContext === expectedCodeBlock.postContext, 'incorrect postContext');
		Assert(message.commitHashWhenPosted === this.post.commitHashWhenPosted, 'incorrect commitHashWhenPosted');
	}

	// validate we got a user mention, if we expected one
	validateMention (message) {
		if (!this.wantMention) { return; }	// didn't want a mention
		Assert(message.mentionedUserIds.length === 1 && message.mentionedUserIds[0] === this.currentUser._id,
			'mentionedUserIds does not contain current user');
		Assert(message.mentionedUsers.length === 1 && message.mentionedUsers[0] === this.currentUser.username,
			'mentionedUsers does not contain current user');
	}

	// validate we got a parent post, if we expected one
	validateParentPost (message) {
		if (!this.wantParentPost) { return; }	// didn't want a parent post
		const parentPost = message.parentPost;
		Assert(parentPost.postId === this.parentPost._id, 'incorrect postId');
		Assert(parentPost.text === this.parentPost.text, 'incorrect post text');
		Assert(parentPost.creatorId === this.parentPost.creatorId, 'incorrect creator ID');
		Assert(parentPost.createdAt === this.parentPost.createdAt, 'incorrect createdAt');
		Assert(parentPost.creatorUsername === this.otherUserData.user.username, 'incorrect creator username');
		Assert(parentPost.creatorFirstName === this.otherUserData.user.firstName, 'incorrect creator first name');
		Assert(parentPost.creatorLastName === this.otherUserData.user.lastName, 'incorrect creator last name');
		Assert(parentPost.creatorEmail === this.otherUserData.user.email, 'incorrect creator email');
	}
}

module.exports = SlackOutTest;
