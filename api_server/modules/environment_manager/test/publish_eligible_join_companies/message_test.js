'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class MessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users matching a given email should receive a message on their user channel giving eligible join companies in response to a cross-environment request to publish eligible join companies for that email';
	}

	// set the name of the channel we'll listen on for the test message
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the test message
	generateMessage (callback) {
		this.message = {
			user: {
				id: this.currentUser.user.id,
				$set: {
					eligibleJoinCompanies: [{
						id: this.company.id,
						name: this.company.name,
						memberCount: 2,
						byInvite: true,
						accessToken: this.currentUser.accessToken
					}]
				},
				$version: {
					before: '*'
				}
			}
		};

		this.doApiRequest(
			{
				method: 'post',
				path: '/xenv/publish-ejc',
				data: { 
					email: this.currentUser.user.email
				},
				requestOptions: {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
					}
				}
			},
			callback
		);
	}
}

module.exports = MessageTest;
