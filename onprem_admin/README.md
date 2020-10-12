# On-Prem Administration

The On-Prem Admin utility is a web application for configuring and managing your
CodeStream On-Prem installation.

## Architecture

### Technology Components

*	Node.js >= 12.14.1
*	Bootstrap 4
*	React / Redux
*	Javascript ES6 (babel)

The admin project is a browser-based Single Page App (SPA) with its own server
and api.

The server renders and serves only an initial html document which includes an
initial state. The client loads the page and fires up the SPA. The admin server
contains its own API (/api/) and maintains a socket.io connection to the client
for broadcasting a server-side status as a heartbeat.

### Directory Tree

| dir | desc |
| --- | --- |
| api/ | api server - provide interface to client-side SPA for getting data from or managing the server functions (all routes beginning with /api/) |
| config/ | admin server configuration - same as other codestream server-side services but also provides a global read-only object which is initialized ONLY in the `bin/admin_server.js` script (server entry point) |
| lib/ | server code (exlcuding entry point script) |
| views/ | express uses ejs rendering engine |
| src/ | client-side code |
| src/lib/ | utility funcs and the like, shared between client and server apps |
| src/components/ | react components |
| src/components/lib/ | components disconnected from the redux store |
| store/ | the redux store |
| store/index.js | A store factory which produces Store's with our middleware configuration |
| store/actions/ | actions & action creators (application logic goes here) |
| store/reducers/ | reducers |
| public/ | staticly served files using express' static serving middleware |
| public/fonts/ | client-side fonts (downloaded from Google or whereever) |
| public/fonts/fa/ | fontawesome.com resources |


### Redux Store / State

Top-level Slices (state reductions)

| reducer | desc |
| --- | --- |
| config | native configuration data object |
| installation | on-prem installation data (OP & image versions, installation type (Single Linux Host), and such ) |
| presentation | data objects specific to and organized by componenent |
| originalConfig | copy of config used for reverting values. Loading a config resets this object. |
| status | system statuses and miscellaneous |

The client's initial state is taken from the server state at the time of the
request (in `lib/serverRenderApp.js`) when it receives a client request. The
state is sent as data in the response so that the client app's entry point
(`src/index.js`) creates its redux store using `window.__PRELOADED_STATE`.

### Exploring the Code - Start Here
`bin/admin_server.js` fires up the service. Start there. It's expected this is
being invoked from within a shell environment configured for backend CodeStream
services development. It's an express server. It routes api requests (/api/) and
client app bookmarkable links (/, /configuration/general, ...).

`lib/serverRenderApp.js` Every non-api request will execute a server-side
rendering of the app (based on the URL) using the current state of the server as
the initial state for the client. The response includes this initial rendering,
the redux state and the app.

`src/index.js` is where the client app boots up. Redux store is created using
the server-initialized data. A subscription to the redux store compares the
`config` slice with the `originalConfig` slice to determine if changes are made
(updating the state if need be). A socket IO connection to the server is also
established. The server will emit status updates as a heartbeat every minute or
so.

### Generic, Higher Level Components

#### FormFieldSet
#### Accordion
#### Table


### Bootstrap Layout Notes
