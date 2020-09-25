import produce from 'immer';
import Actions from '../actions/originalConfig';

export default (state = null, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(originalConfig): ${action.type}`);
		switch (action.type) {
			case Actions.ORIGINAL_CFG_LOAD_NEW_CONFIG:
				return action.payload;
		}
	});
