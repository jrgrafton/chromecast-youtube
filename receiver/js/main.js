window.onload = function() {
	var DEBUG = false;

	// Turn off logging when not in debugging
	if(!DEBUG) {
		console.log = function() {}
		console.debug = function() {}
		console.info = function() {}
	}

	// Load classes
	window.ui = new UI(document.body);
	window.youtubeWrapper = new YoutubeWrapper(
		document.getElementById("ytplayer"));

	// Switch to idle state when window loads
	window.ui.switchToState("idle");

	// Load tests or receiver code depending on environment
	if(navigator.userAgent.indexOf("armv7l") === -1) {
		window.e2eTests = new E2ETests();
		window.e2eTests.runTests();
	} else {
		window.customReceiver = new CustomReceiver();
	}
}