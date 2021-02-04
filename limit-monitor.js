module.exports = RED => {
	RED.nodes.registerType( 'limit-monitor', function( config ) {
		RED.nodes.createNode( this, config );

		const limit = parseFloat( config.limit ) || 0;
		const delay = Math.abs( ( parseFloat( config.delay ) || 0 ) ) * 1000;
		const hysteresis = Math.abs( parseFloat( config.hysteresis ) || 0 );

		// 1: no alarm
		// 2: delaying
		// 3: alarm
		let state;

		let timeout;

		const send = () => {
			this.send( {
				name: config.name,
				topic: config.topic,
				payload: state === 3,
				timestamp: new Date().getTime()
			} );
		};

		const setStatus = ( tmpState ) => {
			state = tmpState;

			switch( state ) {

				case 1:
					this.status( { fill: 'green', shape: 'dot', text: 'no alarm' } );
					break;

				case 2:
					this.status( { fill: 'yellow', shape: 'dot', text: 'delaying' } );
					break;

				case 3:
					this.status( { fill: 'red', shape: 'dot', text: 'alarm' } );
					break;

			}
		};

		setStatus( 1 );

		this.on( 'input', msg => {
			if( parseFloat( msg.payload ) !== Number.NaN ) {
				if( config.kind === '1' ) { // lower limit
					switch( true ) {

						case state === 1 && msg.payload <= limit:
							setStatus( 2 );
							timeout = setTimeout( () => {
								setStatus( 3 );
								send();
							}, delay );

							break;

						case state === 2 && msg.payload > limit:
							setStatus( 1 );
							clearTimeout( timeout );

							break;

						case state === 3 && msg.payload > limit - hysteresis:
							setStatus( 1 );
							send();

							break;

					}
				} else { // upper limit
					switch( true ) {

						case state === 1 && msg.payload >= limit:
							setStatus( 2 );
							timeout = setTimeout( () => {
								setStatus( 3 );
								send();
							}, delay );

							break;

						case state === 2 && msg.payload < limit:
							setStatus( 1 );
							clearTimeout( timeout );

							break;

						case state === 3 && msg.payload < limit - hysteresis:
							setStatus( 1 );
							send();

							break;

					}
				}
			}
		} );

		this.on( 'close', () => clearTimeout( timeout ) );
	} );
};