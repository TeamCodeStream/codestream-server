'use-strict';

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from '@reach/router';
import Actions from '../../store/actions/presentation';


const ConfigNav = props => {
	return (
		<nav className="navbar navbar-expand-md bg-secondary navbar-dark text-uppercase layout-pane-configuration-nav">
			<section className="navbar-nav">
				<Link
					className={`nav-item nav-link ${props.activePane === 'topology' ? 'active' : ''}`}
					to="/configuration/topology"
					onClick={() => props.selectConfigPane('topology')}
				>
					topology
				</Link>
				<Link
					className={`nav-item nav-link ${props.activePane === 'general' ? 'active' : ''}`}
					to="/configuration/general"
					onClick={() => props.selectConfigPane('general')}
				>
					general
				</Link>
				<Link
					className={`nav-item nav-link ${props.activePane === 'email' ? 'active' : ''}`}
					to="/configuration/email"
					onClick={() => props.selectConfigPane('email')}
				>
					email
				</Link>
				<Link
					className={`nav-item nav-link ${props.activePane === 'integrations' ? 'active' : ''}`}
					to="/configuration/integrations"
					onClick={() => props.selectConfigPane('integrations')}
				>
					integrations
				</Link>
				<Link
					className={`nav-item nav-link ${props.activePane === 'history' ? 'active' : ''}`}
					to="/configuration/history"
					onClick={() => props.selectConfigPane('history')}
				>
					History
				</Link>
			</section>
		</nav>
	);
};

const mapState = (state) => ({
	activePane: state.presentation.configuration.paneSelected,
});

const mapDispatch = (dispatch) => ({
	selectConfigPane: (pane) => dispatch({
		type: Actions.PRESENTATION_CONFIG_NAV_SELECT,
		payload: pane
	}),
});

export default connect(mapState, mapDispatch)(ConfigNav);
