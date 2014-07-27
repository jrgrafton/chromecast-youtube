function UI(rootNode) {
	this.rootNode = rootNode;
	this.pauseIdleTimeoutFunction = null;
	this.switchToPlayingTimeoutFunction = null;

	// Psuedo static vars
	this.STATES = ["idle", "video-loading", "video-info", "video-playing",
		"video-paused", "video-buffering"];
	this.PAUSE_IDLE_TIMEOUT = 1000 * 60 * 5; // Five minutes before idle state
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
}

UI.prototype.getState = function() {
	return document.body.classList[0] || null;
}

UI.prototype.subscribeToEvents_ = function() {
	document.addEventListener("video-loading", function() {
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

	document.addEventListener("video-buffering", function() {
		this.eventVideoExtendedBuffering();
	}.bind(this));
}

UI.prototype.eventVideoLoading_ = function() {
	clearTimeout(this.pauseIdleTimeoutFunction);
	this.switchToState("video-loading");
}

UI.prototype.secondsToTime_ = function(seconds) {
	var minutes = parseInt(Math.floor(seconds / 60));
	var seconds = "" + parseInt(seconds % 60);
	if(seconds.length === 1) "0" + seconds;
	return minutes + ":" + seconds;
} 

UI.prototype.updateVideoMeta_ = function(data) {
	document.querySelector(".movie-info .author").innerHTML = data.author;
	document.querySelector(".movie-info .title").innerHTML = data.title;

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
	clearTimeout(this.pauseIdleTimeoutFunction);
	clearTimeout(this.switchToPlayingTimeoutFunction);

	// Trigger video info for five seconds
	this.switchToState("video-info");
	this.switchToPlayingTimeoutFunction = setTimeout(function() {
		this.switchToState("video-playing");
	}.bind(this), this.INFO_TIMEOUT)
}

UI.prototype.eventVideoPause_ = function() {
	clearTimeout(this.pauseIdleTimeoutFunction);

	this.switchToState("video-paused");
	this.pauseIdleTimeoutFunction = setTimeout(function() {
		// Reset playing video and go into idle state
		window.youtubeWrapper.resetVideo();
		this.switchToState("idle");
	}.bind(this), this.PAUSE_IDLE_TIMEOUT);
}

UI.prototype.eventVideoBuffering_ = function() {
	this.switchToState("video-buffering");
}