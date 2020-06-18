# Version Matrix

The version matrix is a set of stored records that characterize the current
minimum version capability required by the API server to serve requests from
the client. In this way, outdated versions of the CodeStream extensions can
be forced to upgrade before servicing, and deprecated functionality can be
safely phased out.

In theory, separate minimum version enforcement can be set on an individual
basis for each extension type supported (VSCode, JetBrains, etc.). In practice,
however, we have found that all extensions usually are maintained at exactly
the same version. 

## Fields

For each extension, these fields are maintained:

| Field | Description |
| --- | --- |
| currentRelease | Indicates the current release of the extension that is available in the marketplace. |
| minimumPreferredRelease | Indicates the minimum version of the extension that the API server prefers to serve. Users using older versions of the extension are strongly encouraged to update, as some support for some functionality may be deprecated imminently. In most extensions, users will be given a visible warning that an upgrade is recommended. |
| earliestSupportedRelease | Indicates the earliest version the API server will serve. Requests older that this minimum version will be refused with a 400 status code. In most extensions, users will get a warning that they must upgrade to use CodeStream, and CodeStream will not work until they upgrade. |

## Database structure

Currently, the version matrix is stored in our database (mongo), in the **versionMatrix** collection. It looks like this:

RS-Production-0:PRIMARY> db.versionMatrix.find().pretty(1);
{
	"_id" : ObjectId("5b8082701a3a5d2711f0fc57"),
	"clientType" : "VS Code",
	"currentRelease" : "7.4.1",
	"minimumPreferredRelease" : "7.3.0",
	"earliestSupportedRelease" : "7.0.0"
}
{
	"_id" : ObjectId("5d83a95d970e5f999a86139a"),
	"clientType" : "VS",
	"currentRelease" : "7.4.1",
	"minimumPreferredRelease" : "7.3.0",
	"earliestSupportedRelease" : "7.0.0"
}
{
	"_id" : ObjectId("5d83a966970e5f999a86139b"),
	"clientType" : "JetBrains",
	"currentRelease" : "7.4.1",
	"minimumPreferredRelease" : "7.3.0",
	"earliestSupportedRelease" : "7.0.0"
}
{
	"_id" : ObjectId("5d83a96c970e5f999a86139c"),
	"clientType" : "Atom",
	"currentRelease" : "7.4.1",
	"minimumPreferredRelease" : "7.3.0",
	"earliestSupportedRelease" : "7.0.0"
}

**clientType** refers to the extension type (IDE) for the record in question.

## Handling requests

Incoming requests contain a header field (**X-CS-Plugin-IDE**) that announces the IDE the request is coming from, and another header field (**X-CS-Plugin-Version**) announcing the version of the extension running in the IDE. The plugin header field is used to match against **clientType** in the database, and the version header field is compared to the three version fields within. The API server returns a header field (**X-CS-Version-Disposition**) in the response that announced its disposition relative to the passed extension version. The API server also returns header fields the information obtained from the version matrix, as follows:

| Header | Matrix Field |
| --- | --- |
| X-CS-Current-Version | currentRelease |
| X-CS-Preferred-Version | minimumPreferredRelease |
| X-CS-Supported-Version | earliestSupportedRelease |

If the passed version is less than **earliestSupportedRelease**, the request is rejected, with the **X-CS-Version-Disposition** header set to "incompatible".
Otherwise, if the passed version is less than **minimumPreferredRelease**, the request is honored, but the **X-CS-Version-Disposition** header is set to "deprecated".
Otherwise, if the passed version is less than **earliestSupportedRelease**, the request is honored, but the **X-CS-Version-Disposition** header is set to "outdated".
Otherwise, the **X-CS-Version-Disposition** header is set to "ok".

