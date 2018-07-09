'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');

class UpdatedMatchedRepoMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'members of the team should receive a message with a repo update when a post is posted with a code block and remotes are specified that match known remotes for the repo but there are new remotes as well';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createPostCreator,	// create a user who will create a post (and a stream on the fly)
			this.createRepo,		// create a repo
			this.createStream       // create a pre-existing stream in that repo
		], callback);
	}

	// create a user who will then create a team and repo
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will then create a post
	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

	// create a repo
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [
					this.currentUser.email,
					this.postCreatorData.user.email
				],	// include me, and the user who will create the post
				withRandomEmails: 1,	// include another random user, for good measure
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo (and team)
			}
		);
	}

	// create pre-existing stream in the repo, this will be a private stream, so the
	// other users should not receive a message about the test post, but they should see 
	// that a new repo has been added to the team
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team._id,
				token: this.postCreatorData.accessToken
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a code block from a stream to be created "on-the-fly" ...
		// this should trigger a message to the team channel that indicates the stream was created
		const addRemote = this.repoFactory.randomUrl();
		const normalizedRemote = NormalizeUrl(addRemote);
		const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
		const remotes = [
			this.repo.normalizedUrl,
			addRemote
		];
		this.postFactory.createRandomPost(
			error => {
				if (error) { return callback(error); }
				this.message = { 
					repos: [{
						_id: this.repo._id,
						$push: {
							remotes: [{
								url: normalizedRemote,
								normalizedUrl: normalizedRemote,
								companyIdentifier
							}]
						}
					}]
				}; 
				callback();
			},
			{
				token: this.postCreatorData.accessToken,	// the "post creator"
				teamId: this.team._id,
				streamId: this.stream._id,
				wantCodeBlocks: 1,
				codeBlockStream: {
					remotes,
					file: this.streamFactory.randomFile()
				}
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		// ignore the message publishing the new file-stream, we only want the repo message
		if (message.message.stream) { return false; }
		return true;
	}
}

module.exports = UpdatedMatchedRepoMessageTest;
