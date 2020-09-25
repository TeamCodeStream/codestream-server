'use-strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ConfigNav from '../subnav/ConfigNav';
import { globalNavItems } from '../../store/actions/presentation';

const SubNav = props => {
	if (props.paneSelected === globalNavItems.configuration) {
		return (
			<div className="row justify-content-center">
				<ConfigNav />
			</div>
		)
	};
	return <div className="mt-3">{' '}</div>;
	// return (
	// 	<div className="row justify-content-center">
	// 		{props.paneSelected === globalNavItems.configuration
	// 			? <ConfigNav />
	// 			: <></>
	// 		}
	// 	</div>
	// );
};

const mapState = (state) => ({
	paneSelected: state.presentation.nav.paneSelected,
});

// const mapDispatch = (dispatch) => ({});

export default connect(mapState)(SubNav);
