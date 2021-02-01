module.exports = RED => {
	RED.nodes.registerType( 'limit-monitor', function( config ) {
		RED.nodes.createNode( this, config );

		const limit = parseFloat( config.limit );
console.log( 'Grenzwert:', limit );
		let prevVal;
		let timeout;

		let timestamp;

		const getPayload = value => config.output == 1 ? !value ? false : true : !value ? 0 : 1;

		const setStatus = ( value, flash ) => {
			if( timestamp === 0 ) {
				this.status( { fill: 'grey', shape: 'dot', text: 'inactive' } );
			} else if( flash ) {
				this.status( { fill: 'green', shape: 'dot', text: `active: ${ getPayload( value ) } / ${ getPayload( !value ) }` } );
				setTimeout( setStatus, 250, value, false );
			} else {
				this.status( { fill: 'grey', shape: 'dot', text: `active: ${ getPayload( value ) } / ${ getPayload( !value ) }` } );
			}
		};

		const start = () => {
			if( timestamp === 0 ) {
				timestamp = new Date().getTime();
				update( true );
			}
		};

		const stop = () => {
			if( timestamp !== 0 ) {
				timestamp = 0;
				update( false );
			}
		};

		const update = value => {
			msg = {
				name: config.name,
				topic: config.topic,
				payload: getPayload( value ),
				timestamp: new Date().getTime()
			};

			setStatus( value, true );
			this.send( [ msg, { ...msg, payload: getPayload( !value ) } ] );

			if( timestamp !== 0 ) {
				while( timestamp <= msg.timestamp ) timestamp += config.period * 500;
				timeout = setTimeout( update, timestamp - msg.timestamp, !value );
			} else {
				clearTimeout( timeout );
			}
		};

		this.on( 'input', msg => {
			const value = parseFloat( msg.payload );

			switch( config.kind ) {

				case '1': // lower limit
					break;

				case '2': // upper limit
					break;

			}

			if( ( prevVal === undefined || prevVal < limit ) && msg.payload >= limit ) {
				console.log( 'Grenze überschritten' );
			} else {
				console.log( 'keine Grenzwertverletzung' );
			}
		} );
		this.on( 'close', () => clearTimeout( timeout ) );
	} );
};