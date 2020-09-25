'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import Table from '../../../lib/Table';
// import axios from 'axios';
import { loadConfigurationHistory } from '../../../../store/actions/presentation';

class History extends React.Component {
	async componentDidMount() {
		// component just finished mounting
		this.props.dispatch(loadConfigurationHistory());
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	render() {
		return (
			<div className="History layout-history">
				<p className="text-center">
					Each item in this list represents a configuration compatible with the current database schema.
				</p>
				<Table
					columnOrder={['schemaVersion', 'revision', 'dateString', 'desc', '_active', '_loadable', '_deletable']}
					headers={['Schema', 'Revision', 'Date', 'Description']}
					columnTitles={{
						schemaVersion: 'Schema',
						revision: 'Revision',
						dateString: 'Date',
						desc: 'Description',
					}}
					rows={this.props.configSummary}
				/>
			</div>
		);
	}
}

History.propTypes = {
	configSummary: PropTypes.array.isRequired,
};

const mapState = state => ({
	configSummary: state.presentation.configuration.history.summary || [],
});

const mapDispatch = dispatch => ({
	dispatch,
	loadConfigurationHistory: (e) => dispatch(loadConfigurationHistory()),
});

export default connect(mapState, mapDispatch)(History);
