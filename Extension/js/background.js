//background.js provides the extension functionality that runs in the background to monitor CPU usage and handle blacklist updates
var oldInfo = false;
var warningCount = 0;
var blockedTabIds = [];
var tabUrls = {};
var blacklist = [];
var cancelFunction= function (){return {cancel: true};};

setInterval(function(){ 
	//This function retrieves CPU data and transforms it into percentage values
	chrome.system.cpu.getInfo(function(info) {
		var totalUsage = 0;
		var domain;
		chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
			try{
			domain = (new URL(tabs[0].url)).hostname;
			domain = formatDomain(domain);
			
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
		//This code displays the warning notification if CPU usage is consistently high
		if ((percent >= 25)&& (blacklist.includes(domain) ==false)) {
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
	}
			catch (e) {
				if (e instanceof TypeError) {
        console.log("Error handled");
    } 
			}
		}
	);
	
	});	
}, 1000);
//listen for messages from popup.js after blacklist button click
chrome.runtime.onMessage.addListener(function(domain, sender, sendResponse) {
	//add current domain to the blacklist
	domainMod = formatDomain(domain);
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
	checkBlacklist(domain);
    return true; 
});
//on extension installation, populate blacklist from blacklist.txt
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
//block scripts on urls included in the blacklist array
function blockScripts() {
	chrome.webRequest.onBeforeRequest.addListener(cancelFunction, {
		urls: blacklist, types: ["script"]
	}, ["blocking"]
	);
}

//check blacklist for current url on current tab update
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	
	if ("url" in changeInfo) {
		var domain = (new URL(changeInfo.url)).hostname;
		tabUrls[tabId] = domain;
	} 
	else {
		return;
	}
	checkBlacklist(domain);
});

//check blacklist for current domain and set notification if scripts on the domain are blocked
function checkBlacklist(domain) {
	var domainMod = formatDomain(domain);
	if (blacklist.indexOf(domainMod) >= 0) {
		chrome.storage.local.set({blockStatus: domain}, function() {});
		chrome.browserAction.setBadgeText({text: "1"});
		chrome.browserAction.setBadgeBackgroundColor({color: "#0F0"});
	}
	else{
		chrome.browserAction.setBadgeText({text: ""});
		var value = "Site Clear";
		chrome.storage.local.set({blockStatus: value}, function() {});
	}
} 

//checks blacklist for current url on tab switch
chrome.tabs.onActivated.addListener(function (activeInfo) {
	
	if (tabUrls[activeInfo.tabId]){
		checkBlacklist(tabUrls[activeInfo.tabId]);
	}
});
//formats domain to match script blocking accepted format
function formatDomain (domain){
	var domainMod;
	if (domain.includes("www.")) {
		domainMod = "*://*" + domain.replace("www", "") + "/*";
	}
	else {
		domainMod = "*://" + domain + "/*";
	}
	return domainMod;
}
