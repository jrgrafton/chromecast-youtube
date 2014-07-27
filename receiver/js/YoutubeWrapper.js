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
		'rel': "0",
	}

	this.currentVideoID = null;
	this.ytPlayer = null;
	this.updateProgressEvent = null;
	this.UPDATE_PROGRESS_EVENT_INTERVAL = 500;
}

YoutubeWrapper.prototype.loadVideo = function(id, callback) {
	console.debug("YoutubeWrapper.js: loadVideo(" + id + ")");
	document.dispatchEvent(new Event("video-loading"));
	this.currentVideoID = id;

	if(this.ytPlayer === null) {
   	 	window.onYouTubePlayerReady = function(playerId) {
   	 		this.ytPlayer = document.getElementById(playerId);

   	 		/*this.ytPlayer.addEventListener("onReady", 
   	 			this.playerReadyEvent_.bind(this, callback));
   	 		this.ytPlayer.addEventListener("onPlaybackQualityChange", 
   	 			this.playerQualityChangeEvent_.bind(this));*/
   	 		
   	 		/*this.ytPlayer.addEventListener("onError", 
   	 			this.playerErrorEvent_.bind(this));*/
			window.playerStateChangeEvent_ = this.playerStateChangeEvent_.bind(this);
			this.ytPlayer.addEventListener("onStateChange",
				"playerStateChangeEvent_" );
	   	 	callback();
   	 	}.bind(this);

    	var atts = { id: "ytplayer" };
    	var params = { allowScriptAccess: "always" };
    	this.playerDefaultParams
   	 	swfobject.embedSWF("http://www.youtube.com/v/" + id + "?" +
   	 		"rel=0&showinfo=0&modestbranding=1&controls=0&autohide=1&" +
   	 		"autoplay=1&enablejsapi=1&playerapiid=ytplayer",
            "ytplayer", "100%", "100%", "8", null, null, params, atts);
	} else {
		this.ytPlayer.loadVideoById(id, 0, "default");
		callback();
	}
}

YoutubeWrapper.prototype.pauseVideo = function() {
	console.debug("YoutubeWrapper.js: pauseVideo()");
	this.ytPlayer.pauseVideo();
}

YoutubeWrapper.prototype.playVideo = function() {
	console.debug("YoutubeWrapper.js: playVideo()");
	this.ytPlayer.playVideo();
}

YoutubeWrapper.prototype.stopVideo = function() {
	console.debug("YoutubeWrapper.js: stopVideo()");
	document.dispatchEvent(new Event("video-stopped"));
	if(this.ytPlayer !== null) this.ytPlayer.stopVideo();
	clearInterval(this.updateProgressEvent);
}

YoutubeWrapper.prototype.seekVideo = function(seconds) {
	console.debug("YoutubeWrapper.js: seekTo(" + seconds + ")");
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

YoutubeWrapper.prototype.getStateText_ = function() {
	console.log("YoutubeWrapper.js: getStateText_()");
	switch(this.ytPlayer.getPlayerState()) {
		case 0:
			return "ended";
		break;
		case 1:
			return "playing";
		break;
		case 2:
			return "paused";
		break;
		case 3:
			return "buffering";
		break;
		case 5:
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
		window.videoInformationCallback = function(data) {
			console.log(data);
			// Video data needs to be fetched via AJAX for SWF embeds
			stateEvent.data = {
				author: data.entry.author[0].name.$t, 
				title: data.entry.title.$t
			};//this.ytPlayer.getVideoData();
			stateEvent.data.videoProgress = this.getVideoProgress();
			stateEvent.data.videoLength = this.getVideoLength();
			stateEvent.data.image = "http://img.youtube.com/vi/" +
				this.currentVideoID + "/0.jpg";
			console.log(stateEvent.data);
			// Set time update interval
			this.updateProgressEvent = setInterval(function() {
				this.playerUpdateProgressEvent_();
			}.bind(this), this.UPDATE_PROGRESS_EVENT_INTERVAL);

			document.dispatchEvent(stateEvent);
		}.bind(this);

		var scriptTag = document.createElement('script');
		var scriptSrc = "http://gdata.youtube.com/feeds/api/videos/"+ this.currentVideoID +
		"?v=2&alt=json-in-script&callback=videoInformationCallback"
		scriptTag.src = scriptSrc;
		document.getElementsByTagName('head')[0].appendChild(scriptTag);
	} else {
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