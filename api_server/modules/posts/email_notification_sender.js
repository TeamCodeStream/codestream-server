// handle sending email notifications in response to a new post

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class EmailNotificationSender {

	constructor (options) {
		Object.assign(this, options);
	}

	// send email notifications for a new post to all members that are not
	// currently online for the repo and the team
	sendEmailNotifications (callback) {
		if (!this.stream || this.stream.get('type') !== 'file') {
			// for now, not sending notifications for non-file type streams
			return callback();
		}
		BoundAsync.series(this, [
			this.getRepoSubscribedMembers,	// get users who are subscribed to the repo channel
			this.getTeamSubscribedMembers,	// get users who are subscribed to the team channel
			this.getOfflineMembers,			// get offline members: those who are not subscribed to the repo channel
			this.filterByPreference,		// filter to those who haven't turned email notifications off
			this.getParentPost,				// get the parent post if this is a reply
			this.sendNotifications,			// send out the notifications`
			this.updateFirstEmails			// update "firstEmail" flags, indicating who has received their first email notification
		], callback);
	}

	// get the team members that are currently subscribed to the repo channel for the
	// repo to which the stream belongs
	getRepoSubscribedMembers (callback) {
		// query the messager service (pubnub) for who is subscribed to the team channel
		let channel = 'repo-' + this.repo.id;
		this.request.api.services.messager.getSubscribedUsers(
			channel,
			(error, userIds) => {
				if (error) {
					return callback(`Unable to obtain subscribed users for channel ${channel}: ${error}`);
				}
				this.onlineUserIdsForRepo = userIds;
				callback();
			}
		);
	}

	// get the team members that are currently subscribed to the team channel (they are online)
	getTeamSubscribedMembers (callback) {
		// query the messager service (pubnub) for who is subscribed to the team channel
		let channel = 'team-' + this.team.id;
		this.request.api.services.messager.getSubscribedUsers(
			channel,
			(error, userIds) => {
				if (error) {
					return callback(`Unable to obtain subscribed users for channel ${channel}: ${error}`);
				}
				this.onlineUserIdsForTeam = userIds;
				callback();
			}
		);
	}

	// get the user objects for the offline members
	getOfflineMembers (callback) {
		// filter out members who are online for the repo
		let offlineMemberIds = this.team.get('memberIds').filter(memberId => {
			return this.onlineUserIdsForRepo.indexOf(memberId) === -1;
		});
		if (offlineMemberIds.length === 0) {
			this.offlineMembers = [];
			return callback();
		}
		this.request.data.users.getByIds(
			offlineMemberIds,
			(error, members) => {
				if (error) { return callback(error); }
				// don't send notifications to deactivated users, and don't send to the author
				// of the post
				this.offlineMembers = members.filter(member => {
					return !member.get('deactivated') && member.id !== this.creator.id;
				});
				process.nextTick(callback);
			}
		);
	}

	// filter the offline members to those who haven't turned email notifications off
	filterByPreference (callback) {
		this.toReceiveEmails = this.offlineMembers.filter(user => {
			let preferences = user.get('preferences');
			if (!preferences) {
				return true;	// default to on
			}
			// for now, you can just turn them off, but we'll get more sophisticated later...
			let on = preferences.emailNotifications !== 'off';
			if (!on) {
				this.request.log(`User ${user.id} has email notifications turned off`);
			}
			return on;
		});
		process.nextTick(callback);
	}

	// get the parent post to this post, if this is a reply
	getParentPost (callback) {
		if (this.toReceiveEmails.length === 0) {
			return callback();	// don't bother if no one to send to
		}
		if (!this.post.get('parentPostId')) {
			return callback();	// not a reply!
		}
		this.request.data.posts.getById(
			this.post.get('parentPostId'),
			(error, parentPost) => {
				if (error) { return callback(error); }
				this.parentPost = parentPost;
				callback();
			}
		);
	}

	// send email notifications to all the offline members
	sendNotifications (callback) {
		BoundAsync.forEachSeries(
			this,
			this.toReceiveEmails,
			this.sendNotificationToUser,
			callback
		);
	}

	// send an email notification to the given user
	sendNotificationToUser (user, callback) {
		let options = {
			request: this.request,
			user: user,
			post: this.post,
			parentPost: this.parentPost,
			stream: this.stream,
			repo: this.repo,
			team: this.team,
			creator: this.creator,
			firstEmail: !user.get('hasReceivedFirstEmail'),
			offlineForRepo: this.onlineUserIdsForTeam.indexOf(user.id) !== -1 // online for team, but offline for repo
		};
		this.request.api.services.email.sendEmailNotification(
			options,
			error => {
				if (error) {
					this.request.warn(`Unable to send email notification to ${user.get('email')}: ${JSON.stringify(error)}`);
				}
				process.nextTick(callback);
			}
		);
	}

	// update each user as needed to indicate they have now received their first
	// email notification
	updateFirstEmails (callback) {
		let usersToUpdate = this.offlineMembers.filter(member => !member.get('hasReceivedFirstEmail'));
		if (usersToUpdate.length === 0) {
			return callback();
		}
		let ids = usersToUpdate.map(user => user.id);
		this.request.data.users.updateDirect(
			{ _id: this.request.data.users.inQuerySafe(ids) },
			{ $set: { hasReceivedFirstEmail: true } },
			error => {
				if (error) {
					this.request.warn(`Unable to update hasReceivedFirstEmail flags for users ${ids}: ${JSON.stringify(error)}`);
				}
				process.nextTick(callback);
			}
		);
	}
}

module.exports = EmailNotificationSender;
