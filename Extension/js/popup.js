var blacklistBtn = document.getElementById('btnBlacklistToggle');
blacklistBtn.onclick = function () {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
			var currentURL = new URL(tabs[0].url);
			var domain = currentURL.hostname;
			chrome.runtime.sendMessage(domain);
		
			if (document.getElementById("btnBlacklistToggle").innerHTML == "Blacklist this website"){
				document.getElementById("btnBlacklistToggle").innerHTML = "Remove from blacklist";
			}
			else{
				document.getElementById("btnBlacklistToggle").innerHTML = "Blacklist this website";
			}
		}
	);
	window.close();
};


chrome.storage.local.get(['blockStatus'], function(result) {
		
	if (result.blockStatus == "Site Clear") {
		document.getElementById("statusText").innerHTML = "No CryptoJacking has been detected on this website!";
		document.getElementById("btnBlacklistToggle").innerHTML = "Blacklist this website";
	}
	else {
		document.getElementById("statusText").innerHTML = "Scripts have been disabled because " +result.blockStatus+ " is blacklisted.";
		document.getElementById("btnBlacklistToggle").innerHTML = "Remove from blacklist";
	}
});

var helpBtn = document.getElementById('btnHelp');
helpBtn.onclick = function () {
	var newURL = "../html/help.html";
	chrome.tabs.create({
		url: newURL
	});
};


chrome.storage.local.get(['suspiciousSite'], function(result) {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
			var currentURL = new URL(tabs[0].url);
			var domain = currentURL.hostname;
			
			if (result.suspiciousSite >9){
				document.getElementById("statusText").innerHTML = "High CPU usage detected on "+ domain;
			};
		}
	);
});