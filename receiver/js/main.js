window.onload = function() {
	// Load classes
	window.ui = new UI(document.body);
	window.youtubeWrapper = new YoutubeWrapper(
		document.getElementById("ytplayer"));

	// Switch to idle state when window loads
	window.ui.switchToState("idle");

	// Load tests or receiver code depending on environment
	if(!window.cast) {
		console.log = function() {}
		console.debug = function() {}
		console.info = function() {}

		window.e2eTests = new E2ETests();
		window.e2eTests.runTests();
	} else {
		//window.customReceiver = new CustomReceiver();
	}
}