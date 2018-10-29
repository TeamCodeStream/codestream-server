// provide a module to handle requests associated with "items"

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const ItemCreator = require('./item_creator');
const ItemUpdater = require('./item_updater');
const Item = require('./item');

// expose these restful routes
const ITEM_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put'],
	baseRouteName: 'items',
	requestClasses: {
		'get': require('./get_item_request'),
		'getMany': require('./get_items_request'),
		'post': require('./post_item_request'),
		'put': require('./put_item_request')
	}
};

class Items extends Restful {

	get collectionName () {
		return 'items';	// name of the data collection
	}

	get modelName () {
		return 'item';	// name of the data model
	}

	get creatorClass () {
		return ItemCreator;	// use this class to instantiate items
	}

	get modelClass () {
		return Item;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single item, such as a question, issue, code trap, etc.';
	}

	get updaterClass () {
		return ItemUpdater;
	}

	getRoutes () {
		return  super.getRoutes(ITEM_STANDARD_ROUTES);
	}
}

module.exports = Items;
