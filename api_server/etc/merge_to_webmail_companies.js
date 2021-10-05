#!/usr/bin/env node

'use strict'

const WebmailCompanies = require('./webmail_companies');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

WebmailCompanies.sort();

const ToMerge = ["126.com", "163.com", "21cn.com", "alice.it", "aliyun.com", "aol.com", "aol.it", "arnet.com.ar", "att.net", "bell.net", "bellsouth.net", "blueyonder.co.uk", "bol.com.br", "bt.com", "btinternet.com", "charter.net", "comcast.net", "corp.mail.ru", "cox.net", "daum.net", "earthlink.net", "email.com", "email.it", "facebook.com", "fastmail.fm", "fibertel.com.ar", "foxmail.com", "free.fr", "freeserve.co.uk", "games.com", "globo.com", "globomail.com", "gmail.com", "gmx.com", "gmx.de", "gmx.fr", "gmx.net", "googlemail.com", "hanmail.net", "hotmail.be", "hotmail.ca", "hotmail.co.uk", "hotmail.com", "hotmail.com.ar", "hotmail.com.br", "hotmail.com.mx", "hotmail.de", "hotmail.es", "hotmail.fr", "hotmail.it", "hush.com", "hushmail.com", "icloud.com", "ig.com.br", "iname.com", "inbox.com", "inbox.ru", "itelefonica.com.br", "juno.com", "keemail.me", "laposte.net", "lavabit.com", "libero.it", "list.ru", "live.be", "live.cn", "live.co.uk", "live.com", "live.com.ar", "live.com.mx", "live.de", "live.fr", "live.it", "love.com", "mac.com", "mail.com", "mail.ru", "mailinator.com", "me.com", "msn.com", "nate.com", "naver.com", "neuf.fr", "ntlworld.com", "o2.co.uk", "oi.com.br", "online.de", "orange.fr", "orange.net", "outlook.com", "outlook.com.br", "outlook.de", "outlook.es", "pm.me", "pobox.com", "poste.it", "posteo.de", "prodigy.net.mx", "protonmail.ch", "protonmail.com", "qq.com", "r7.com", "rambler.ru", "rocketmail.com", "rogers.com", "safe-mail.net", "sbcglobal.net", "sfr.fr", "shaw.ca", "sina.cn", "sina.com", "sky.com", "skynet.be", "speedy.com.ar", "sympatico.ca", "talktalk.co.uk", "telenet.be", "teletu.it", "terra.com.br", "tin.it", "tiscali.co.uk", "tiscali.it", "tuta.io", "tutamail.com", "tutanota.com", "tutanota.de", "tvcablenet.be", "uol.com.br", "verizon.net", "virgilio.it", "virgin.net", "virginmedia.com", "voo.be", "wanadoo.co.uk", "wanadoo.fr", "web.de", "wow.com", "ya.ru", "yahoo.ca", "yahoo.co.id", "yahoo.co.in", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.uk", "yahoo.com", "yahoo.com.ar", "yahoo.com.br", "yahoo.com.mx", "yahoo.com.ph", "yahoo.com.sg", "yahoo.de", "yahoo.fr", "yahoo.it", "yandex.com", "yandex.ru", "yeah.net", "ygm.com", "ymail.com", "zipmail.com.br", "zoho.com"];

const Final = ArrayUtilities.unique([
	...WebmailCompanies,
	...ToMerge
]);
Final.sort();

Final.forEach(s => {
	console.log(`\t"${s}",`);
});