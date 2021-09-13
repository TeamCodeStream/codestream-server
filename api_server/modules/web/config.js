// built in list of tag colors
const tagMap = {
	blue: '#3578ba',
	green: '#7aba5d',
	yellow: '#edd648',
	orange: '#f1a340',
	red: '#d9634f',
	purple: '#b87cda',
	aqua: '#5abfdc',
	gray: '#888888'
};

// list of ides and their protocols along with additional metadata
// used to open codemarks/reviews/foos with a selected IDE of choice
const ides = [
	{
		ideName: 'VS Code',
		protocol: 'vscode://codestream.codestream/',
		moniker: 'vsc',
		downloadUrl:
			'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream'
	},
	{
		ideName: 'VS Code Insiders',
		protocol: 'vscode-insiders://codestream.codestream/',
		moniker: 'vsc-insiders',
		downloadUrl:
			'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream'
	},
	{
		ideName: 'Visual Studio',
		protocol: 'codestream-vs://codestream/',
		moniker: 'vs',
		downloadUrl:
			'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs'
	},
	{},
	{
		ideName: 'IntelliJ IDEA',
		protocol: 'jetbrains://idea/codestream/',
		moniker: 'jb-idea',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'PyCharm',
		protocol: 'jetbrains://pycharm/codestream/',
		moniker: 'jb-pycharm',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'WebStorm',
		protocol: 'jetbrains://web-storm/codestream/',
		moniker: 'jb-web-storm',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'PhpStorm',
		protocol: 'jetbrains://php-storm/codestream/',
		moniker: 'jb-phpstorm',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'RubyMine',
		protocol: 'jetbrains://rubymine/codestream/',
		moniker: 'jb-rubymine',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'Rider',
		protocol: 'jetbrains://rd/codestream/',
		moniker: 'jb-rider',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'CLion',
		protocol: 'jetbrains://clion/codestream/',
		moniker: 'jb-clion',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'GoLand',
		protocol: 'jetbrains://goland/codestream/',
		moniker: 'jb-goland',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'DataGrip',
		protocol: 'jetbrains://datagrip/codestream/',
		moniker: 'jb-datagrip',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'AppCode',
		protocol: 'jetbrains://appcode/codestream/',
		moniker: 'jb-appcode',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{
		ideName: 'Android Studio',
		protocol: 'jetbrains://studio/codestream/',
		moniker: 'jb-studio',
		downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream'
	},
	{},
	/*
	{
		ideName: 'Atom',
		protocol: 'atom://codestream/',
		moniker: 'atom',
		downloadUrl: 'https://atom.io/packages/codestream'
	}
	*/
];

const lastOriginToIdeMonikers = {
	'Atom': 'atom',
	'VS Code': 'vsc',
	'JetBrains': undefined,
	'VS': 'vs'
};

module.exports = {
	ides: ides,
	tagMap: tagMap,
	lastOriginToIdeMonikers: lastOriginToIdeMonikers,
	defaultCookieName: 'cs__ide-mru'
};