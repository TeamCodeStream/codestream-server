'use strict';

class EmailHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	async handleMessage (message) {
		this.message = message;
		this.logger.log(`Processing a ${this.message.type} email request: ${JSON.stringify(this.message)}`, this.requestId);
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
			if (this.newrelic) {
				this.newrelic.noticeError(error);
			}
			return this.logger.warn(`Email handling for ${this.message.type} email failed: ${message}`, this.requestId);
		}
		this.logger.log(`Successfully processed a ${this.message.type} email request: ${JSON.stringify(this.message)}`, this.requestId);
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

	// analytics category, this should be overridden
	getCategory () {
	}

	async getSendOptions () {
		const options = {
			type: this.message.type,
			user: this.user,
			email: this.message.email || this.user.email,
			subject: this.subject,
			content: this.content,
			category: this.getCategory(),
			requestId: this.requestId
		};
		if (this.message.testing) {
			options.testCallback = this.testCallback.bind(this);
		}
		if (this.message.fromSupport) {
			options.from = { email: this.outboundEmailServer.config.email.supportEmail, name: 'CodeStream' };
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
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const trace = error instanceof Error ? error.stack : '';
			this.logger.warn(`Unable to send ${this.message.type} email to ${this.user.email}: ${message}\n${trace}`, this.requestId);
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
