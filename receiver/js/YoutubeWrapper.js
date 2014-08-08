/** 
	TODO: Hook into all youtube events 
**/
function YoutubeWrapper(iframeElement) {
	this.iframeElement = iframeElement;
	this.playerEmbedURL = "https://www.youtube.com/embed/";
	this.playerDefaultParams = {
		'autoplay': "1",
		'autohide': "1", 
		'controls': "0",
		'modestbranding': "1",
		'enablejsapi': "1",
		'showinfo': "0",
		'rel': "0"
	}

	this.ytPlayer = null;
	this.updateProgressEvent = null;
	this.UPDATE_PROGRESS_EVENT_INTERVAL = 500;
}

YoutubeWrapper.prototype.loadVideo = function(id, startTime, callback) {
	console.debug("YoutubeWrapper.js: loadVideo(" + id + ")");
	document.dispatchEvent(new Event("video-loading"));

	if(this.ytPlayer == null) {
		// Set start time
		this.playerDefaultParams.start = startTime;

		// Create YT player
		this.ytPlayer = new YT.Player('ytplayer', {
			videoId: id,
			playerVars: this.playerDefaultParams,
			width: "100%",
			height: "100%",
			events: {
				'onReady':
					this.playerReadyEvent_.bind(this, callback),
				'onPlaybackQualityChange':
					this.playerQualityChangeEvent_.bind(this),
				'onStateChange':
					this.playerStateChangeEvent_.bind(this),
				'onError':
					this.playerErrorEvent_.bind(this),
			}

		});
	} else {
		this.ytPlayer.loadVideoById(id, startTime, "default");
		callback();
	}
}

YoutubeWrapper.prototype.pauseVideo = function() {
	console.debug("YoutubeWrapper.js: pauseVideo()");
	this.ytPlayer.pauseVideo();
}

YoutubeWrapper.prototype.playVideo = function() {
	console.debug("YoutubeWrapper.js: playVideo()");
	if(this.ytPlayer) {
		this.ytPlayer.playVideo();
	}
}

YoutubeWrapper.prototype.stopVideo = function() {
	console.debug("YoutubeWrapper.js: stopVideo()");
	clearInterval(this.updateProgressEvent);
	document.dispatchEvent(new Event("video-stopped"));
	if(this.ytPlayer !== null) {
		this.ytPlayer.stopVideo();
		this.ytPlayer.clearVideo();
	}
}

YoutubeWrapper.prototype.seekVideo = function(seconds) {
	console.debug("YoutubeWrapper.js: seekTo(" + seconds + ")");

	// Immediately update UI since event can take a while to propogate
	clearInterval(this.updateProgressEvent);
	window.ui.updateVideoProgress_({
		videoLength: this.getVideoLength(),
		videoProgress: seconds
	});
	this.ytPlayer.seekTo(seconds, true);
}

YoutubeWrapper.prototype.getState = function() {
	console.debug("YoutubeWrapper.js: getState()");
	return this.getStateText_();
} 

YoutubeWrapper.prototype.getVideoLength = function() {
	console.debug("YoutubeWrapper.js: getVideoLength()");
	return this.ytPlayer.getDuration();
}

YoutubeWrapper.prototype.getVideoProgress = function() {
	console.debug("YoutubeWrapper.js: getVideoProgress()");
	return this.ytPlayer.getCurrentTime();
}

YoutubeWrapper.prototype.setVolume = function(volume) {
	console.debug("YoutubeWrapper.js: setVolume(" + volume + ")");
	return this.ytPlayer.setVolume(volume);
}

YoutubeWrapper.prototype.getVolume = function() {
	console.debug("YoutubeWrapper.js: getVolume()");
	return this.ytPlayer.getVolume();
}

YoutubeWrapper.prototype.getMetaData = function() {
	console.debug("YoutubeWrapper.js: getMetaData()");
	return this.ytPlayer.getVideoData();;
}

YoutubeWrapper.prototype.getStateText_ = function() {
	switch(this.ytPlayer.getPlayerState()) {
		case YT.PlayerState.ENDED:
			return "ended";
		break;
		case YT.PlayerState.PLAYING:
			return "playing";
		break;
		case YT.PlayerState.PAUSED:
			return "paused";
		break;
		case YT.PlayerState.BUFFERING:
			return "buffering";
		break;
		case YT.PlayerState.CUED:
			return "cued";
		break;
		default:
			return "unstarted";
		break;
	}
}

/**
 * Start: Youtube player events
**/
YoutubeWrapper.prototype.playerReadyEvent_ = function(callback) {
	console.debug("YoutubeWrapper.js: playerReadyEvent_()");
	callback();
}

YoutubeWrapper.prototype.playerQualityChangeEvent_ = function() {
	console.debug("YoutubeWrapper.js: playerQualityChangeEvent_()");
	console.debug("Playback quality: " + this.ytPlayer.getPlaybackQuality());
}

YoutubeWrapper.prototype.playerStateChangeEvent_ = function() {
	console.debug("YoutubeWrapper.js: playerStateChangeEvent_()");
	console.debug("State: " + this.getStateText_());

	clearInterval(this.updateProgressEvent);
	var stateEvent =  new Event("video-" + this.getStateText_());
	if(this.getStateText_() === "playing") {
		// Augment event with video data
		stateEvent.data = this.ytPlayer.getVideoData();
		stateEvent.data.videoProgress = this.getVideoProgress();
		stateEvent.data.videoLength = this.getVideoLength();
		stateEvent.data.image = "http://img.youtube.com/vi/" +
			stateEvent.data.video_id + "/0.jpg";

		// Set time update interval
		this.updateProgressEvent = setInterval(function() {
			this.playerUpdateProgressEvent_();
		}.bind(this), this.UPDATE_PROGRESS_EVENT_INTERVAL);
	}

	// Prevent Youtube from triggering pause event before finishing
	if(this.getStateText_() === "paused") {
		if(this.getVideoLength() - this.getVideoProgress() < 1) {
			// Override event with video ended
			var stateEvent =  new Event("video-ended");
		}
	}

	// Dispatch event upon Youtube player state change
	document.dispatchEvent(stateEvent);
}
YoutubeWrapper.prototype.playerUpdateProgressEvent_ = function() {
	console.debug("YoutubeWrapper.js: playerUpdateProgressEvent_()");
	var stateEvent =  new Event("video-update-progress");
	stateEvent.data = {};
	stateEvent.data.videoProgress = this.getVideoProgress();
	stateEvent.data.videoLength = this.getVideoLength();
	document.dispatchEvent(stateEvent);
}

YoutubeWrapper.prototype.playerErrorEvent_ = function(e) {
	console.debug("YoutubeWrapper.js: playerErrorEvent_()");
	console.error("Error with video: " + e);
}