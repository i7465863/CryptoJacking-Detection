var oldInfo = false;
var warningCount = 0;
var blockedTabIds = [];
var tabUrls = {};
var blacklist = ["*://*.example.com/*"];
var cancelFunction= function (){return {cancel: true};};

setInterval(function(){ 

	chrome.system.cpu.getInfo(function(info) {
		var totalUsage = 0;

		for (var number = 0; number < info.numOfProcessors; number++) {
			var usage = info.processors[number].usage;

			if (oldInfo != false) {
				var oldUsage = oldInfo.processors[number].usage;
				var user = (oldUsage.user - usage.user) / (oldUsage.total - usage.total) * 100;
				var kernel = (oldUsage.kernel - usage.kernel) / (oldUsage.total - usage.total) * 100;
				totalUsage = totalUsage + user + kernel;
			} 
			else {
				var user = usage.user / usage.total * 100;
				var kernel = usage.kernel / usage.total * 100;
				totalUsage = totalUsage + user + kernel;
			}
		}
		oldInfo = info;
		var percent = Math.round(totalUsage / info.numOfProcessors);

		if (percent >= 25) {
			warningCount++;
			
			if (warningCount > 9){
				chrome.browserAction.setBadgeText({text: "Warn"});
				chrome.browserAction.setBadgeBackgroundColor({color: "#F00"});
			}
		}
		else{
			warningCount = 0;
		}
		chrome.storage.local.set({suspiciousSite: warningCount}, function() {});
	});	
}, 1000);


chrome.runtime.onInstalled.addListener(function () {
	var blacklistURL = chrome.runtime.getURL("txt/blacklist.txt");
	const request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		
		if (request.readyState == XMLHttpRequest.DONE) {
			blacklist = request.responseText.split(/\r?\n/);
			blockScripts();
		}
	}
	request.open("GET", blacklistURL);
	request.send();
});


chrome.runtime.onMessage.addListener(function(domain, sender, sendResponse) {
	
	domain = formatDomain(domain);
	if (blacklist.includes(domainMod)){
		var index = blacklist.indexOf(domainMod);
			if (index > -1){
				blacklist.splice(index, 1);
			}
	}
	else{
		blacklist.push(domainMod);
	}
	chrome.webRequest.onBeforeRequest.removeListener(cancelFunction);
	blockScripts();
	chrome.tabs.reload();
    return true; 
});


function blockScripts() {
	chrome.webRequest.onBeforeRequest.addListener(cancelFunction, {
		urls: blacklist, types: ["script"]
	}, ["blocking"]
	);
}


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	
	if ("url" in changeInfo) {
		var domain = (new URL(changeInfo.url)).hostname;
		tabUrls[tabId] = domain;
	} 
	else {
		return;
	}
	checkBlacklist(domain, tabId);
});


function checkBlacklist(domain, tabId) {
	domainMod = formatDomain(domain);
	
	if (blacklist.indexOf(domainMod) >= 0) {
		chrome.storage.local.set({blockStatus: domain}, function() {});
		chrome.browserAction.setBadgeText({text: "1"});
		chrome.browserAction.setBadgeBackgroundColor({color: "#0F0"});	
		blockedTabIds.push(tabId);
	}
	else{
		
		if (blockedTabIds.includes(tabId)){
			var index = blockedTabIds.indexOf(tabId);
			
			if (index > -1){
				blockedTabIds.splice(index, 1);
			}
		}
		chrome.browserAction.setBadgeText({text: ""});
		var value = "Site Clear";
		chrome.storage.local.set({blockStatus: value}, function() {});
	}
} 


chrome.tabs.onActivated.addListener(function (activeInfo) {
	
	if (tabUrls[activeInfo.tabId]){
		checkBlacklist(tabUrls[activeInfo.tabId], activeInfo.tabId);
	}
});

function formatDomain (domain){
	if (domain.includes("www.")) {
		domainMod = "*://*" + domain.replace("www", "") + "/*";
	}
	else {
		domainMod = "*://" + domain + "/*";
	}
	return domainMod;
}
