let blacklistBtn = document.getElementById('btn blacklistToggle');
blacklistBtn.onclick = function () {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
			const currentURL = new URL(tabs[0].url);
			var domain = currentURL.hostname;
			chrome.runtime.sendMessage(domain);
		
			if (document.getElementById("btn blacklistToggle").innerHTML == "Blacklist this website"){
				document.getElementById("btn blacklistToggle").innerHTML = "Remove from blacklist";
			}
			else{
				document.getElementById("btn blacklistToggle").innerHTML = "Blacklist this website";
			}
		}
	);
	window.close();
};


chrome.storage.local.get(['blockStatus'], function(result) {
		
	if (result.blockStatus == "Site Clear") {
		document.getElementById("status text").innerHTML = "No Cryptojacking Detected";
		document.getElementById("btn blacklistToggle").innerHTML = "Blacklist this website";
	}
	else {
		document.getElementById("status text").innerHTML = "Cryptojacking detected on "+ result.blockStatus + " \nScripts disabled";
		document.getElementById("btn blacklistToggle").innerHTML = "Remove from blacklist";
	}
});

let helpBtn = document.getElementById('btn help');
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
			const currentURL = new URL(tabs[0].url);
			var domain = currentURL.hostname;
			
			if (result.suspiciousSite >9){
				document.getElementById("status text").innerHTML = "High CPU Usage detected on "+ domain +" \nBlacklist if unexpected";
			};
		}
	);
});