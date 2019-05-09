'use strict';

class EmailHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	async handleMessage (message) {
		this.message = message;
		this.logger.log(`Processing a ${this.message.type} email request: ${JSON.stringify(this.message)}`);
		try {
			await this.getUser();	
			await this.renderEmail();
			await this.sendEmail();
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`; 
			}
			else {
				message = JSON.stringify(error);
			}
			return this.logger.warn(`Email handling for ${this.message.type} email failed: ${message}`);
		}
		this.logger.log(`Successfully processed a ${this.message.type} email request: ${JSON.stringify(this.message)}`);
	}

	// get the user associated with the email
	async getUser () {
		this.user = await this.data.users.getById(this.message.userId);
		if (!this.user) {
			throw 'user not found:' + this.message.userId;
		}
	}

	// render the email, this should be overridden
	async renderEmail () {
		return '<html></html>';
	}

	async getSendOptions () {
		const options = {
			type: this.message.type,
			user: this.user,
			subject: this.subject,
			content: this.content
		}
		if (this.message.testing) {
			options.testCallback = this.testCallback.bind(this);
		}
		return options;
	}

	// send the email
	async sendEmail () {
		const options = await this.getSendOptions();
		try {
			await this.sender.sendEmail(options);
		}
		catch (error) {
			this.logger.warn(`Unable to send ${this.message.type} email to ${this.user.email}: ${JSON.stringify(error)}`);
		}
	}

	// when testing emails, we'll get the body that would otherwise be sent to
	// the email server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	async testCallback (body, options) {
		if (!options || !options.user || !this.broadcaster) { return; }
		const channel = `user-${options.user.id}`;
		await this.broadcaster.publish(
			body,
			channel,
			{ logger: this.logger }
		);
	}
}

module.exports = EmailHandler;
