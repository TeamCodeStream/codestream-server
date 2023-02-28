"use strict";

class NewRelicListener {

	constructor (options) {
		Object.assign(this, options);
	}

	async listen () {
		const queueUrl = this.api.config.sharedGeneral.newRelicMessageQueue;
		if (!queueUrl) {
			this.api.warn('Not listening to New Relic message queue, queue url not configured');
			return;
		}

		this.api.log('Trying to listen to New Relic message queue...');
		await this.api.services.queueService.listen({
			name: 'NRMsgQueue', // when url is provided, we can use any name we want here
			url: queueUrl,
			handler: this.handleNewRelicMessage.bind(this),
			dontLogRx: true
		});
		this.api.log('Successfully listening to New Relic message queue');
	}

	async handleNewRelicMessage (message, requestId, callback) {
		if (callback) {
			callback(true); // immediately release the message
		}

		if (!message.Message) return;
		let payload;
		try {
			payload = JSON.parse(message.Message);
		} catch (ex) {
			this.api.warn('Could not parse payload from New Relic message:', ex.message);
		}

		switch (payload.type) {
			case "organization.update": 
				this.onOrganizationUpdate(payload);
				break;

			case "organization.create": 
				this.onOrganizationCreate(payload);
				break;

			case "user.create": 
				this.onUserCreate(payload);
				break;

			case "user.update": 
				this.onUserUpdate(payload);
				break;

			case "user.delete":
				this.onUserDelete(payload);
				break;
		}
	}

	onOrganizationUpdate (payload) {
		//this.api.log('ORGANIZATION UPDATE:\n' + JSON.stringify(payload, 0, 5));
	}

	onOrganizationCreate (payload) {
		//this.api.log('ORGANIZATION CREATE:\n' + JSON.stringify(payload, 0, 5));
	}

	onUserCreate (payload) {
		//this.api.log('USER CREATE:\n' + JSON.stringify(payload, 0, 5));
	}

	onUserUpdate (payload) {
		//this.api.log('USER UPDATE:\n' + JSON.stringify(payload, 0, 5));
	}

	onUserDelete (payload) {
		//this.api.log('USER DELETE:\n' + JSON.stringify(payload, 0, 5));
	}
}

module.exports = NewRelicListener;