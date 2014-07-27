function E2ETests() {
	this.testVideoID_ = "i_mKY2CQ9Kk";
	this.tests = [];
	this.discoverTests_();

	// Psuedo static vars
	this.TEST_START_DELAY = 1000 * 3;
	this.NEXT_TEST_DELAY = 1000;
}

E2ETests.prototype.discoverTests_ = function() {
	for(var property in E2ETests.prototype) {
		var name = property.toString();
		if(name.indexOf("test") === 0) {
			this.tests.push(property);
		}
	}
}

E2ETests.prototype.runTests = function() {
	setTimeout(function() {
		this.runNextTest_();
	}.bind(this), this.TEST_START_DELAY);
}

E2ETests.prototype.runNextTest_ = function() {
	if(this.tests.length > 0) {
		try {
			var testName = this.tests.shift();
			this.setup_(function() {
				console.info("Running test: " + testName);
				this[testName](function() {
					setTimeout(function() {
						this.runNextTest_();
					}.bind(this), this.NEXT_TEST_DELAY)
					
				}.bind(this));
			}.bind(this));
		}
		catch(e) {
			console.error("Aborting test run - test failed with error: " + e.stack);
		}
	}
}

E2ETests.prototype.setup_ = function(callback) {
	window.youtubeWrapper.stopVideo();
	window.youtubeWrapper.loadVideo(this.testVideoID_, function() {
		callback();
	}.bind(this))
}

E2ETests.prototype.testLoadingVideo_ = function(callback) {
	var playerState = window.youtubeWrapper.getState();
	// TODO: Check player state (expected playing)
	callback();
}

/* E2ETests.prototype.testPausingVideo_ = function(callback) {
	window.youtubeWrapper.pauseVideo(function() {
		var playerState = window.youtubeWrapper.getState();
		// TODO: Check player state (expected paused)
	});
	callback();
}

E2ETests.prototype.testPlayingVideo_ = function(callback) {
	window.youtubeWrapper.pauseVideo(function() {
		window.youtubeWrapper.playVideo(function() {
			// TODO: Check state
			var playerState = window.youtubeWrapper.getState();
			callback();
		});
	});
}

E2ETests.prototype.testSeekVideo_ = function(callback) {
	var seekTo = Math.round(window.youtubeWrapper.getVideoLength() / 2);
	window.youtubeWrapper.seekVideo(seekTo, function() {
		window.youtubeWrapper.pauseVideo(function() {
			var playerProgress = window.youtubeWrapper.getVideoProgress();
			if(playerProgress !== seekTo) {
				//throw new exception() // TODO: Update syntax
			}
			callback();
		})
	});
}

E2ETests.prototype.testStopVideo_ = function(callback) {
	// Throw exception if fail to prevent further tests
	window.youtubeWrapper.stopVideo(function() {
		var playerState = window.youtubeWrapper.getState();
		// TODO: Check player state (expected stopped)
		callback();
	});
}

E2ETests.prototype.testFinishingVideo_ = function(callback) {
	// Throw exception if fail to prevent further tests
	var movieLength = window.youtubeWrapper.getVideoLength();
	window.youtubeWrapper.seekVideo(movieLength, function() {
		// Wait for it to end
		setTimeout(function() {
			callback();
		}, 1000);
	});
} */