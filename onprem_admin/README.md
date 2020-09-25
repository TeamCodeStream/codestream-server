# On-Prem Administration

The On-Prem Admin utility is a web application for configuring and managing your
CodeStream On-Prem installation.

## Development

## Technologies

*	Node.js >= 12.14.1
*	Bootstrap 4.x
*	React / Redux
*	Javascript ES6

## Architecture

The admin project is a Single Page App (SPA) with its own api server.
The server renders and serves a initial html document which includes
an initial state. The client loads the page and fires up the SPA.

### Directory Tree

| dir | desc |
| --- | --- |
| api/ | api server - provide interface to client-side SPA for getting data from or managing the server functions |
| config/ | load server configuration - same as all other codestream server-side services. Also provides a global read-only object which is initialized ONLY in the `bin/admin_server.js` script (server entry point) |
| lib/ | server code (exlcuding start-up script) |
| views/ | server-side express rendering uses ejs |
| src/ | client-side code |
| src/components/ | react components |
| src/components/lib/ | components disconnected from the redux store |
| store/ | the redux store |
| store/index.js | A store factory which produces Store's with our middleware configuration |
| store/actions/ actions & action creators (application logic goes here) |
| store/reducers/ | reducers |
| public/ | staticly served files using express' static serving middleware |
| public/fonts/ | client-side fonts (downloaded from Google or whereever) |
| public/fonts/fa/ | fontawesome.com resources |

### Redux Store / State

The state is initialized by the server (in `lib/serverRenderApp.js`) when it
receives a client request. The state is sent as data in the response so that one
client request provides the app (entry point is `src/index.js`), an initial
rendering from state initialized on the server and the initialized state.  When
the browser fires up `src/index.js` it creates a Store from that initial data
(which is provided through the `window` object).

**Learn the structure of the State first!** All the application logic exists
within this organization of data so it's pretty critical to understand it first.

The **components** generally follow the user interface.
