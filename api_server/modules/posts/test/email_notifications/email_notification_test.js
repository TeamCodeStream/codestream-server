// serves as the base class for other email notification tests

'use strict';

var Assert = require('assert');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Path = require('path');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');

class EmailNotificationTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.dontNeedServer = true;	// we don't need a pubnub server since we're not sending any actual messages
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up pubnub clients, this will include setting up the users and team/repo used for the test
			this.subscribeToTeam,	// subscribe to the team channel as needed
			this.subscribeToRepo,	// subscribe to the repo channel as needed
			this.waitForSubscribe	// wait for the subscriptions to take effect
		], callback);
	}

	// subscribe to the team channel for the team we created, as requested for the specific test
	subscribeToTeam (callback) {
		if (!this.onlineForTeam) {
			return callback();	// not requested for this test
		}
		let channel = `team-${this.team._id}`;
		this.pubnubClientsForUser[this.currentUser._id].subscribe(
			channel,
			() => {},
			callback
		);
	}

	// subscribe to the repo channel for the repo we created, as requested for the specific test
	subscribeToRepo (callback) {
		if (!this.onlineForRepo) {
			return callback();	// not requested for this test
		}
		let channel = `repo-${this.repo._id}`;
		this.pubnubClientsForUser[this.currentUser._id].subscribe(
			channel,
			() => {},
			callback
		);
	}

	// wait for the subscriptions to take effect
	waitForSubscribe (callback) {
		setTimeout(callback, 2000);
	}

	// make the data we'll use for the test
	makeData (callback) {
		// establish the creator of the post that triggers the email, and their token
		// the current user and token will be usurped later to be the client that is set to
		// receive the email (simulated) via pubnub
		this.postCreator = this.currentUser;
		this.creatorToken = this.token;
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user, as needed
			this.createRepo,		// create the repo to be used in the test
			this.createStream,		// create a file stream in that repo
			this.setPreferences,	// set the user's email preference as needed for the test
			this.createInitialPost,	// create a first post, as needed, for tests involving "ongoing" emails versus "first" emails
			this.createParentPost,	// create a parent post, if needed
			this.setCurrentUser,	// set the current user, the one who will be listening for the pubnub message that represents the email message that would otherwise go out
			this.makePostData,		// make the data for the post what will trigger the email
		], callback);
	}

	// create another registered user as needed
	createOtherUser (callback) {
		if (!this.wantRegisteredUser) {
			return callback();
		}
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
		let emails = this.otherUserData ? [this.otherUserData.user.email] : null;
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				this.unregisteredUser = response.users.find(user => !user.isRegistered);
				callback();
			},
			{
				token: this.creatorToken,	// first user creates the repo
				withEmails: emails,	// include other registered users
				withRandomEmails: this.wantRegisteredUser ? 0 : 1, // create an unregistered user on the fly, as needed
				subscriptionCheat: true	// allows unregistered users to subscribe to me-channel, needed for mock email testing
			}
		);
	}

	// create a file-type stream to be used during the tests
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
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

	// set the user's email preferences, if needed
	setPreferences (callback) {
		let preference = this.getPreference();
		if (!preference) {
			return callback();
		}
		let data = {
			emailNotifications: preference
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.otherUserData.accessToken
			},
			callback
		);
	}

	// get the appropriate email notification presence for the test, to be overridden
	getPreference () {
		return null;
	}

	// create an initial post ... for tests that require emails simulating the "ongoing" emails sent to unregistered
	// users (as opposed to the very first user), we'll create a first post which should set their hasReceivedFirstEmail
	// flag, paving the way for subsequent emails
	createInitialPost (callback) {
		if (!this.wantInitialPost) {
			this.firstEmail = true;
			return callback();
		}
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream._id,
				token: this.creatorToken
			}
		);
	}

	// create a parent post, if needed, for testing that reply-to text appears in the email
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
				token: this.creatorToken
			}
		);
	}

	// set the current user, i.e., the user who will be looking for the pubnub message that represents
	// the email data that would otherwise be going out to the email server
	setCurrentUser (callback) {
		if (this.wantRegisteredUser) {
			// we want a registered user to get the email
			this.currentUser = this.otherUserData.user;
			this.token = this.otherUserData.accessToken;
		}
		else if (!this.creatorIsListener) {
			// we want an unregistered user to the get the email,
			// otherwise the current user will stay the same, meaning the user that will create the post
			this.currentUser = this.unregisteredUser;
			this.token = this.unregisteredUser._id;
		}
		callback();
	}

	// make the data that will be used for the post that triggers the email notification
	makePostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				// to simulate a mention, mention the current user's username with an @ in the text
				if (this.wantMention) {
					let index = this.postFactory.randomUpto(data.text.length);
					data.text = `${data.text.slice(0, index)}@${this.currentUser.username}${data.text.slice(index)}`;
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
				wantCodeBlocks: this.wantCodeBlock ? 1 : 0	// for testing code in the email
			}
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the notification, we use their me-channel
		// we'll be sending the data that we would otherwise send to the outbound email
		// service (sendgrid) on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser._id}`;
		callback();
	}

	// generate the message that triggers the test
	generateMessage (callback) {
		// create a post that will trigger the email notification
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.creatorToken,
				testEmails: true
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
		if (!message.from && !message.to) { return false; }	// ignore anything not matching
		this.validateCreator(message);
		this.validateReceiver(message);
		this.validateSubstitutions(message);
		this.validateSubject(message);
		this.validateTemplateId(message);
		this.validateReplyTo(message);
		return true;
	}

	// validate that the creator name is correct by looking at the "from" field in the email data
	validateCreator (message) {
		let creatorName = this.getUserName(this.postCreator);
		creatorName = `${creatorName} (via CodeStream)`;
		Assert.equal(message.from.email, 'alerts@codestream.com', 'incorrect from address');
		Assert.equal(message.from.name, creatorName, 'incorrect from name');
	}

	// validate that the reveiver of the email has correct name info, by looking at the
	// "to" field in the email data
	validateReceiver (message) {
		let personalization = message.personalizations[0];
		let to = personalization.to[0];
		const receiverName = this.getUserName(this.currentUser);
		Assert.equal(to.email, this.currentUser.email, 'incorrect to address');
		Assert.equal(to.name, receiverName, 'incorrect to name');
	}

	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions (message) {
		let substitutions = message.personalizations[0].substitutions;
		this.validateIntro(substitutions['{{intro}}']);
		this.validateRepoUrl(substitutions['{{repoUrl}}']);
		if (this.wantParentPost) {
			Assert.equal(this.parentPost.text, substitutions['{{replyText}}']);
		}
		this.validateReplyToDisplay(substitutions['{{displayReplyTo}}']);
		Assert.equal(this.post.text, substitutions['{{text}}']);
		if (this.wantCodeBlock) {
			let codeBlock = this.post.codeBlocks[0];
			Assert.equal(codeBlock.code, substitutions['{{code}}']);
			Assert.equal(codeBlock.preContext, substitutions['{{preContext}}']);
			Assert.equal(codeBlock.postContext, substitutions['{{postContext}}']);
		}
		this.validateSubject(substitutions['{{subject}}']);
		this.validateInstallText(substitutions['{{installText}}']);
		this.validateCodeBlockDisplay(substitutions['{{displayCodeBlock}}']);
		this.validateInstallTextDisplay(substitutions['{{displayInstallText}}']);
	}

	// validate that the intro paragraph is correct in the email notification,
	// given various possible scenarios
	validateIntro (intro) {
		let expectIntro;
		let creatorFirstName = this.postCreator.firstName;
		let creatorName = this.getUserName(this.postCreator);
		let filename = Path.basename(this.stream.file);
		let teamName = this.team.name;
		let installLink = this.getInstallLink();
		if (this.currentUser.isRegistered) {
			if (this.onlineForTeam && !this.onlineForRepo) {
				// registered user who is online only for the team, but doesn't have the repo open
				expectIntro = `We noticed that you don’t currently have the following repository open in your IDE and didn’t want you to miss this message from ${creatorFirstName} about <b>${filename}</b>.`;
			}
			else {
				// registered user who is offline
				expectIntro = `We noticed that you don’t currently have your IDE open and didn’t want you to miss this message from ${creatorFirstName} about <b>${filename}</b>.`;
			}
		}
		else if (this.firstEmail) {
			// the first email sent to an unregistred user
			expectIntro = `You’ve been added to ${teamName} on CodeStream, where ${creatorName} has started a discussion about <b>${filename}</b>. We’ll send you an email when the other developers on your team ask and answer questions about code, and you can participate in the discussion by simply replying to the email. Or, <a clicktracking="off" href="${installLink}">learn more about CodeStream</a> and install the plugin so that you can chat right from within your IDE!`;
		}
		else {
			// subsequent emails sent to an unregistered user
			expectIntro = `${creatorName} has posted a new message about <b>${filename}</b>.`;
		}
		Assert.equal(intro, expectIntro, 'incorrect intro');
	}

	// get the expected install link ... the link we expect users to click on to find out
	// how to install CodeStream
	getInstallLink () {
		let campaign = this.getCampaign();
		return `http://codestream.com?utm_medium=${this.currentUser.email}&utm_source=product&utm_campaign=${campaign}`;
	}

	// get the "campaign" field we expect to see in the email for analytics
	getCampaign () {
		return (
			(this.firstEmail && this.wantMention && 'first_mention_notification_unreg') ||
			(this.firstEmail && !this.wantMention && 'first_newmessage_notification_unreg') ||
			(!this.firstEmail && this.wantMention && 'mention_notification_unreg') ||
			(!this.firstEmail && !this.wantMention && 'newmessage_notification_unreg')
		);
	}

	// get the url of the repo that we expect to see in the email
	validateRepoUrl (repoUrl) {
		// for now, attach https:// to the normalized url ... possible an assumption?
		let expectUrl = `https://${this.repo.normalizedUrl}`;
		Assert.equal(repoUrl, expectUrl, 'incorrect repo url');
	}

	// validate that the style for display of the install text (instructions with link
	// to learn how to install the plugin) is correct
	validateReplyToDisplay (display) {
		// if this is a reply to a post, make sure we display the reply-to text,
		// otherwise, make sure it's hidden
		if (this.wantParentPost) {
			Assert(!display, 'displayReplyTo is set');
		}
		else {
			Assert.equal(display, 'display:none', 'displayReplyTo is not set to display:none');
		}
	}

	// validate that the subject of the email is correct, based on various scenarios
	validateSubject () {
		let creatorFirstName = this.postCreator.firstName;
		let filename = Path.basename(this.stream.file);
		if (this.wantMention) {
			if (this.firstEmail) {
				// the user was mentioned in the post, and this is the first email they've ever
				// received from CodeStream
				return `${creatorFirstName} mentioned you in a discussion about ${filename}`;
			}
			else {
				// the user was mentioned in the post, and they've already received their first
				// email from CodeStream
				return `You've been mentioned in a discussion about ${filename}`;
			}
		}
		else {
			if (this.firstEmail) {
				// the user was not mentioned in the post, and this is the first email
				// they've ever received from CodeStream
				return `${creatorFirstName} is discussing ${filename}`;
			}
			else {
				// the user was not mentioned in the post, and they've already received
				// their first email from CodeStream
				return `New message about ${filename}`;
			}
		}
	}

	// validate that the install text is correct, text which shows an unregistered
	// user how to install the plugin
	validateInstallText (installText) {
		if (!this.firstEmail && !this.wantRegisteredUser) {
			let installLink = this.getInstallLink();
			return Assert.equal(installText, `<a clicktracking=off href="${installLink}">Install the CodeStream plugin</a> and move the conversation out of your Inbox, and into your IDE.`, 'installText is incorrect');
		}
	}

	// validate that the style for display is correct for displaying a code block
	// (so if there is a code block, the style is not set to display:none, otherwise it is
	validateCodeBlockDisplay (display) {
		if (this.wantCodeBlock) {
			Assert(!display, 'displayCodeBlock is set');
		}
		else {
			Assert.equal(display, 'display:none', 'displayCodeBlock is not set to display:none');
		}
	}

	// validate that the style for display of the install text (instructions with link
	// to learn how to install the plugin) is correct
	validateInstallTextDisplay (display) {
		// if this is the first email the user has received form CodeStream, the
		// link is present in the intro text, so make sure it is hidden ... and
		// if the user is registered, there is no need to tell them how to install!
		if (this.firstEmail || this.currentUser.isRegistered) {
			Assert.equal(display, 'display:none', 'displayInstallText is not set to display:none');
		}
		else {
			Assert(!display, 'displayInstallText is set');
		}
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.templateId, EmailConfig.notificationEmailTemplateId, 'incorrect templateId');
	}

	// validate that the reply-to info in the email is correct
	validateReplyTo (message) {
		// it should be set to the stream ID ... this is how we identify where the reply
		// goes if the user replies to the email
		let replyTo = `${this.stream._id}.${this.team._id}@${EmailConfig.replyToDomain}`;
		Assert.equal(message.reply_to.email, replyTo, 'incorrect reply_to');
		Assert.equal(message.reply_to.name, 'CodeStream', 'incorrect reply_to name');
	}

	// get the expected username for the given user
	getUserName (user) {
		const firstName = user.firstName;
		const lastName = user.lastName;
		if (firstName && lastName) {
			return firstName + ' ' + lastName;
		}
		else if (firstName) {
			return firstName;
		}
		else {
			return user.email;
		}
	}
}

module.exports = EmailNotificationTest;
