'use strict';

module.exports = {
	register: {
		method: 'post',
		path: '/no-auth/register'
	},
	confirm: {
		method: 'post',
		path: '/no-auth/confirm'
	},
	getMe: {
		method: 'get',
		path: '/users/me'
	},
	invite: {
		method: 'post',
		path: '/users'
	}
}