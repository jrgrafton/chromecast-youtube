function UI(rootNode) {
	this.rootNode = rootNode;
	this.switchToPlayingTimeoutFunction = null;

	this.idleStopTimeoutFunction = null;
	this.pauseStopTimeoutFunction = null;

	// Psuedo static vars
	this.STATES = ["idle", "video-loading", "video-info", "video-playing",
		"video-paused", "video-buffering"];

	this.IDLE_STOP_TIMEOUT = 1000 * 60 * 5; // Five minutes: idle --> stop()
	this.PAUSE_STOP_TIMEOUT = 1000 * 60 * 30; // Thirty minutes: paused --> stop()
	this.INFO_TIMEOUT = 1000 * 5; // Show info for five seconds after playing

	this.subscribeToEvents_();
}

UI.prototype.switchToState = function(state) {
	console.debug("UI.js: switchToState(" + state + ")");
	if(this.STATES.indexOf(state) !== -1) {
		var currentClasses = this.rootNode.classList;
		for(var i = 0; i < currentClasses.length; i++) {
			this.rootNode.classList.remove(currentClasses[i]);
		}
		this.rootNode.classList.add(state);
	}

	// Clear previous timeouts
	clearTimeout(this.pauseStopTimeoutFunction);
	clearTimeout(this.idleStopTimeoutFunction);

	// Start timeout for idle
	if(state === "idle") {
		this.idleStopTimeoutFunction = setTimeout(function() {
			window.customReceiver.shutdownReceiver();
		}.bind(this), this.IDLE_STOP_TIMEOUT);
	}

	// Start timeout for pause
	if(state === "video-paused") {
		this.pauseStopTimeoutFunction = setTimeout(function() {
			window.customReceiver.shutdownReceiver();
		}.bind(this), this.PAUSE_STOP_TIMEOUT);
	}
}

UI.prototype.getState = function() {
	return document.body.classList[0] || null;
}

UI.prototype.subscribeToEvents_ = function() {
	document.addEventListener("video-loading", function() {
		this.resetVideoMeta_();
		this.eventVideoLoading_();
	}.bind(this));

	document.addEventListener("video-playing", function(e) {
		this.updateVideoMeta_(e.data);
		this.eventVideoPlaying_();
	}.bind(this));

	document.addEventListener("video-update-progress", function(e) {
		this.updateVideoProgress_(e.data);
	}.bind(this));

	document.addEventListener("video-paused", function() {
		this.eventVideoPause_();
	}.bind(this));

	document.addEventListener("video-stopped", function() {
		clearTimeout(this.pauseStopTimeoutFunction);
		clearTimeout(this.switchToPlayingTimeoutFunction);
		this.switchToState("idle");
	}.bind(this));

	document.addEventListener("video-ended", function() {
		clearTimeout(this.pauseStopTimeoutFunction);
		clearTimeout(this.switchToPlayingTimeoutFunction);
		this.switchToState("idle");
	}.bind(this));

	document.addEventListener("video-buffering", function(e) {
		this.eventVideoBuffering_();
	}.bind(this));
}

UI.prototype.eventVideoLoading_ = function() {
	this.switchToState("video-loading");
}

UI.prototype.secondsToTime_ = function(seconds) {
	var minutes = parseInt(Math.floor(seconds / 60));
	var seconds = parseInt(seconds % 60);
	if(isNaN(minutes)) minutes = 0;
	if(isNaN(seconds)) seconds = 0;

	if(seconds < 10) seconds = "0" + seconds;
	return minutes + ":" + seconds;
} 

UI.prototype.resetVideoMeta_ = function(data) {
	document.querySelector(".movie-info .author").innerHTML = "Loading...";
	document.querySelector(".movie-info .title").innerHTML = "";

	document.querySelector(".movie-info .time-elapsed").innerHTML = "--:--";
	document.querySelector(".movie-info .time-total").innerHTML = "--:--";

	document.querySelector(".movie-info .movie-logo").setAttribute("style", "");
	document.querySelector(".movie-info .progress-bar .elapsed").setAttribute(
		"style", "width:0%");
}

UI.prototype.updateVideoMeta_ = function(data) {
	if(data.author.length !== 0) {
		document.querySelector(".movie-info .author").innerHTML = 
			data.author + ": ";
		document.querySelector(".movie-info .title").innerHTML = data.title;
	} 
	document.querySelector(".movie-info .time-elapsed").innerHTML =
		this.secondsToTime_(data.videoProgress);
	document.querySelector(".movie-info .time-total").innerHTML =
		this.secondsToTime_(data.videoLength);

	document.querySelector(".movie-info .movie-logo").setAttribute(
		"style", "background-image:url('" + data.image + "');");
}

UI.prototype.updateVideoProgress_ = function(data) {
	var percentage = 100 / data.videoLength * data.videoProgress;

	document.querySelector(".movie-info .time-elapsed").innerHTML =
		this.secondsToTime_(data.videoProgress);
	document.querySelector(".movie-info .progress-bar .elapsed").setAttribute(
		"style", "width:" + percentage + "%");
}

UI.prototype.eventVideoPlaying_ = function() {
	clearTimeout(this.switchToPlayingTimeoutFunction);

	// Trigger video info for five seconds
	this.switchToState("video-info");
	this.switchToPlayingTimeoutFunction = setTimeout(function() {
		this.switchToState("video-playing");
	}.bind(this), this.INFO_TIMEOUT)
}

UI.prototype.eventVideoPause_ = function() {
	clearTimeout(this.switchToPlayingTimeoutFunction);

	this.switchToState("video-paused");
}

UI.prototype.eventVideoBuffering_ = function() {
	clearTimeout(this.switchToPlayingTimeoutFunction);

	this.switchToState("video-buffering");
}