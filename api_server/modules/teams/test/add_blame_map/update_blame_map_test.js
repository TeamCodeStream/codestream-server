'use strict';

const FetchTest = require('./fetch_test');

class UpdateBlameMapTest extends FetchTest {

	get description() {
		return 'should update a blame map entry and respond with appropriate directive when adding a blame map entry for a user where the email already exists in the blame map';
	}

	makeBlameMapData (callback) {
		super.makeBlameMapData(error => {
			if (error) { return callback(error); }

			// substitute a different blame-map entry for one that already existed, 
			// instead of creating a new one
			const replaceKey = this.data.email.replace(/\./g, '*');
			const existingKey = Object.keys(this.expectedSettings.blameMap).find(key => {
				return this.expectedSettings.blameMap[key] === this.users[1].user.id;
			});
			delete this.expectedSettings.blameMap[replaceKey];
			delete this.expectedResponse.team.$set[`settings.blameMap.${replaceKey}`];
			this.data.email = existingKey.replace(/\*/g, '.');
			this.expectedResponse.team.$set[`settings.blameMap.${existingKey}`] = this.data.userId;
			this.expectedSettings.blameMap[existingKey] = this.data.userId;
			callback();
		});
	}
}

module.exports = UpdateBlameMapTest;
