function E2ETests() {
	this.testVideos_ = ["i_mKY2CQ9Kk", "C_S5cXbXe-4", "GsxBxvjXj2M",
		"z3U0udLH974", "tntOCGkgt98"];
	this.tests = [];
	this.discoverTests_();

	// Psuedo static vars
	this.TEST_START_DELAY = 1000;
	this.NEXT_TEST_DELAY = 1000 * 10;
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
		try {
			var testName = this.tests.shift();
			this.setup_(function() {
				this[testName](function() {
					if(this.tests.length > 0) {
						setTimeout(function() {
							this.runNextTest_();
						}.bind(this), this.NEXT_TEST_DELAY);
					} else {
						//alert("tests complete");
					}
				}.bind(this));
			}.bind(this));
		}
		catch(e) {
			console.error("Aborting test run - test failed with error: "
				+ e.stack);
		}
}

E2ETests.prototype.setup_ = function(callback) {
	window.youtubeWrapper.stopVideo();
	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);
		callback();
	}.bind(this);

	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.loadVideo(this.testVideos_.shift(), function() {});
}

E2ETests.prototype.testResumeVideo_ = function(callback) {
	var playListener = function() {
		document.removeEventListener("video-playing", playListener);
		this.verifyState("playing");
		callback();
	}.bind(this);
	var pauseListener = function(e) {
		document.removeEventListener("video-paused", pauseListener);
		setTimeout(function() {
			document.addEventListener("video-playing", playListener);
			window.youtubeWrapper.playVideo();
		}, 2000);
	}.bind(this);

	document.addEventListener("video-paused", pauseListener);

	setTimeout(function() {
		// To give video extra time to load on Chromecast
		window.youtubeWrapper.pauseVideo();
	}, 2000);
}

E2ETests.prototype.testPausingVideo_ = function(callback) {
	var pauseListener = function(e) {
		document.removeEventListener("video-paused", pauseListener);
		this.verifyState("paused");
		callback();
	}.bind(this);

	document.addEventListener("video-paused", pauseListener);

	setTimeout(function() {
		// To give video extra time to load on Chromecast
		window.youtubeWrapper.pauseVideo();
	}, 2000);
	
}


E2ETests.prototype.testSeekVideo_ = function(callback) {
	var bufferingListener = function() {
		document.removeEventListener("video-buffering", bufferingListener);
		this.verifyState("buffering");
		callback();
	}.bind(this);

	document.addEventListener("video-buffering", bufferingListener);
	var seekTo = Math.round(window.youtubeWrapper.getVideoLength() / 2);
	window.youtubeWrapper.seekVideo(seekTo);
}

E2ETests.prototype.testStopVideo_ = function(callback) {
	var unstartedListener = function() {
		document.removeEventListener("video-unstarted", unstartedListener);
		this.verifyState("unstarted");
		callback();
	}.bind(this);
	setTimeout(function() {
		window.youtubeWrapper.stopVideo();
		document.addEventListener("video-unstarted", unstartedListener);
	}, 5000)
}

E2ETests.prototype.verifyState = function(expectedState) {
	var playerState = window.youtubeWrapper.getState();
	if(playerState !== expectedState) {
		throw "Expected: video to be in " + expectedState + " state"
	}
}

E2ETests.prototype.testFinishingVideo_ = function(callback) {
	var endedListener = function() {
		document.removeEventListener("video-ended", endedListener);
		setTimeout(function() {
			this.verifyState("ended");
			callback();
		}.bind(this), 1000);
	}.bind(this);
	document.addEventListener("video-ended", endedListener);

	var movieLength = window.youtubeWrapper.getVideoLength() - 10;
	window.youtubeWrapper.seekVideo(movieLength);
}