//popup.js provides dynamic updates to the popup window to cange element depending on the state of the current tab
var blacklistBtn = document.getElementById('btnBlacklistToggle');
var helpBtn = document.getElementById('btnHelp');
//send blacklist message of current url if blacklist button is clicked
blacklistBtn.onclick = function () {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
			var currentURL = new URL(tabs[0].url);
			var domain = currentURL.hostname;
			chrome.runtime.sendMessage(domain);
			//update blacklist button text depending on current url state
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
//load help.html on help button click
helpBtn.onclick = function () {
	var newURL = "../html/help.html";
	chrome.tabs.create({
		url: newURL
	});
};

//retrieve the status of the current tab to update the status text and blacklist button
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



//update status text on high CPU usage detection
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
