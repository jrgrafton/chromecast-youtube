function E2ETests() {
	this.testVideoID = "VIDEO_ID_HERE";
}

function runTests() {
	try {
		for(var property in this.prototype) {
			var name = property.toString();
			if(name.indexOf("test") === 0) {
				console.info("Running test: " + name);
				this.setup_(function() {
					this[name]();
				}.bind(this));
			}
		}
	}
	catch(e) {
		console.error("Test failed with error: " + e.toString());
	}
}

function setup_(callback) {
	window.youtubeWrapper.resetVideo();
	window.youtubeWrapper.loadVideo(this.testVideoID, function() {
		callback();
	}.bind(this))
}

function testLoadingVideo_() {
	// Throw exception if fail to prevent further tests
}

function testPausingVideo_() {
	// Throw exception if fail to prevent further tests
}

function testPlayingVideo_() {
	// Throw exception if fail to prevent further tests
}

function testSeekingVideo_() {
	// Throw exception if fail to prevent further tests
}

function testStoppingVideo_() {
	// Throw exception if fail to prevent further tests
}

function testFinishingVideo_() {
	// Throw exception if fail to prevent further tests
}