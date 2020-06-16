# EMAILGEN

Is a command line utility to send various flavors of emails related to codemarks, reviews, and replies. Its code uses a syntax that allows for easily chaining operations together to craft any combination of post objects. It uses the CodeStream REST api.

## PREREQUISITES

These are the other requirements to build & run 
- A local version of `node` installed and in your PATH
- A CodeStream team, with two users tied to email addresses you control (to mention each other)
- Both CodeSTream users have `Automatically follow all new codemarks and reviews` enabled

## BUILD

```
npm install --no-save
```


## RUN

it can be run from the command line with passed in arguments, or the arguments can live in a `.emailgen.json` file as JSON. 


| Param        | Argument | Description           | Required  |
| -------------|:-------------:|:-------------:| -----:|
| email      | `--email` | Your CodeStream email (username) | YES |
| password     | `--password` | Your CodeStream password      |   YES |
| serverUrl | `--serverUrl` | The url of the server you want to target      |    YES |
| teamId     | `--teamId` | The id of the team you want to target      |   YES |
| otherEmail      | `--otherEmail` | Email of another user you would want to assign reviews, or at-mention, or annoy with emails | NO |
| verbose | `--verbose` | If true, outputs additional logging      |    NO |
| failFast | `--failFast` | If true, fails the process after the first error      |    NO |
| help | `--help` | Returns the help screen     |    NO |
| config* | `--config` | Read from a non-standard config location     |    NO |

Example `.emailgen.json` file
```
{
    "email": "foo@codestream.com",
    "password": "cheese",
    "serverUrl": "https://foo-api.codestream.us",
    "otherEmail": "foo+1@codestream.com",
    "teamId": "123",
    "verbose": false,
    "failFast": true
}
```
The parameters in the `.emailgen.json` file mirror the command line arguments if you were you pass them into the command line tool (* except for the `config`), for example:

```
node ./node_modules/ts-node/dist/bin.js emailgen.ts --email=foo@codestream.com --password=cheese --serverUrl=https://foo-api.codestream.us --teamId=123 --otherEmail=foo+1@codestream.com
```

There is also a shortcut npm script for `pd` which already includes the pd serverUrl (note the additional ` -- ` after pd): 

```
npm run pd -- --email=foo@codestream.com --password=cheese  --teamId=123 --otherEmail=foo+1@codestream.com
```

Finally, you can also pass in a completely custom path to a config file as such: 

```
npm run start -- --config C:\Users\brian\code\CodeStream\emailgen\.emailgen.json
```