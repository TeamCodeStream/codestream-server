'use strict';

class CommonInit {

	init (callback) {
		this.data = {
			email: this.currentUser.user.email
		};
		this.beforeLogin = Date.now();
		// ensure we have a login code generated to test
		const data = {
			email: this.currentUser.user.email,
			// TODO: use more appropriate secret
			_loginCheat: this.apiConfig.sharedSecrets.confirmationCheat
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/generate-login-code',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				console.log(this.data);
				this.data.loginCode = response.loginCode;
				console.log(this.data);
			}
		);
		console.log(this.data);
		callback();
	}
}

module.exports = CommonInit;
