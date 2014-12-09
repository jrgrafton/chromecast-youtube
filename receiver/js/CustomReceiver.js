function CustomReceiver() {
	// Initialise object vars
	this.mediaElement_ = null;
	this.mediaManager_ = null;
	this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();
	this.mediaTypes_ = { 
		STANDARD : 0,
		YOUTUBE : 1
	};
	this.currentMediaType_ = null;
	this.player_ = null; // Interface to MediaManager used by YT player

	// Events that need to be hijacked for Youtube playback
	this.mediaOrigOnLoad_ = null;
	this.mediaOrigOnPause_ = null;
	this.mediaOrigOnPlay_ = null;
	this.mediaOrigOnStop_ = null;
	this.mediaOrigOnSeek_ = null;
	this.mediaOnSetVolume_ = null;
	this.mediaOrigOnGetStatus_ = null;

	// Startup functions
	cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

	this.initialiseMediaManagement_()
	this.hijackMediaEvents_();
	this.initialiseSessionManagement_()
	this.startReceiver_();
}

CustomReceiver.prototype.initialiseMediaManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseMediaManagement_()");
	this.mediaElement_ = document.getElementById('media');
	
	// Custom player to allow YT state to be propogated
	this.player_ = new cast.receiver.media.Player();
	this.player_.getPlayerState = function() {
		console.debug("CustomReceiver.js: getPlayerState()");
		return this.getPlayerState_();
	}.bind(this);
	this.player_.getPlayerCurrentTimeSec = function() {
		console.debug("CustomReceiver.js: getPlayerCurrentTimeSec()");
		return this.getPlayerCurrentTimeSec();
	}.bind(this);
	this.mediaManager_ = new cast.receiver.MediaManager(this.player_);

	// Default video type to be Youtube
	this.currentMediaType_ = this.mediaTypes_.YOUTUBE;

	// Broadcast any Youtube state changes
	document.addEventListener("video-ended", function() {
		console.debug("CustomReceiver.js: broadcast video-ended");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));
	document.addEventListener("video-buffering", function() {
		console.debug("CustomReceiver.js: broadcast video-buffering");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));
	document.addEventListener("video-unstarted", function() {
		console.debug("CustomReceiver.js: broadcast video-unstarted");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));
}

CustomReceiver.prototype.hijackMediaEvents_ = function() {
	console.debug("CustomReceiver.js: hijackMediaEvents_()");

	// Save original references
	this.mediaManager_['mediaOrigOnLoad'] = this.mediaManager_.onLoad;
	this.mediaManager_['mediaOrigOnMetadataLoaded'] =
		this.mediaManager_.onMetadataLoaded;
	this.mediaManager_['mediaOrigOnPause'] = this.mediaManager_.onPause;
	this.mediaManager_['mediaOrigOnPlay'] = this.mediaManager_.onPlay;
	this.mediaManager_['mediaOrigOnStop'] = this.mediaManager_.onStop;
	this.mediaManager_['mediaOrigOnSeek'] = this.mediaManager_.onSeek;
	this.mediaManager_['mediaOrigOnSetVolume'] = this.mediaManager_.onSetVolume;
	this.mediaManager_['mediaOrigOnGetStatus'] = this.mediaManager_.onGetStatus;

	this.mediaManager_.customizedStatusCallback = 
		this.mediaCustomizedStatusCallbackEvent_.bind(this);
	this.mediaManager_.onLoad = this.mediaOnLoadEvent_.bind(this);
	this.mediaManager_.onMetadataLoaded =
		this.mediaOnMetadataLoadedEvent_.bind(this);
	this.mediaManager_.onPause = this.mediaOnPauseEvent_.bind(this);
	this.mediaManager_.onPlay = this.mediaOnPlayEvent_.bind(this);
	this.mediaManager_.onStop = this.mediaOnStopEvent_.bind(this);
	this.mediaManager_.onSeek = this.mediaOnSeekEvent_.bind(this);
	this.mediaManager_.onSetVolume = this.mediaOnSetVolumeEvent_.bind(this);
}

CustomReceiver.prototype.initialiseSessionManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseSessionManagement_()");
	this.castReceiverManager_.onSenderDisconnected = function(event) {
	  	if(this.castReceiverManager_.getSenders().length == 0 && event.reason == 
	  		cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
	      	window.close();
	  	}
	}.bind(this)
}

CustomReceiver.prototype.startReceiver_ = function() {
	console.debug("CustomReceiver.js: startReceiver_()");

	var appConfig = new cast.receiver.CastReceiverManager.Config();
	appConfig.statusText = 'Casting Kittens';
	appConfig.maxInactivity = 6000;
	this.castReceiverManager_.start(appConfig);
}

CustomReceiver.prototype.shutdownReceiver = function() {
	this.castReceiverManager_.stop();
}

/* Start event processing */
CustomReceiver.prototype.mediaOnLoadEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnLoadEvent_()");
	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);

		// Broadcast media information
		var mediaInformation = new cast.receiver.media.MediaInformation();
		mediaInformation.contentId = event.data.media.contentId;
		mediaInformation.duration = window.youtubeWrapper.getVideoLength();
		mediaInformation.metadata = {
			author : e.data.author,
			title : e.data.title
		}
		console.debug("CustomReceiver.js: sending load complete");
		this.mediaManager_.setMediaInformation(mediaInformation, true, {});
		//this.mediaManager_['mediaOrigOnLoad'](event);
		this.mediaManager_.sendLoadComplete();
	}.bind(this);

	// @TODO: detection should be more intelligent than this
	if(event.data.media.contentId.indexOf("mp4") !== -1) {
		// Setup CDN video compatible MediaManager
		this.currentMediaType_ = this.mediaTypes_.STANDARD;

		// Stop any already playing Youtube Video
		window.youtubeWrapper.stopVideo();

		// Set Media element as default video source
		this.mediaManager_.setMediaElement(this.mediaElement_);
		this.mediaManager_['mediaOrigOnLoad'](event);

		var stateEvent =  new Event("video-loading");
		document.dispatchEvent(stateEvent);

		// Broadcast media information back to sender
		this.mediaManager_.broadcastStatus(true);
	} else {
		// Setup Youtube compatible MediaManager
		this.currentMediaType_ = this.mediaTypes_.YOUTUBE;
		this.mediaElement_.pause();
		this.mediaElement_.src='';

		// Load Youtube video
		this.mediaManager_.setMediaElement(this.player_);
		document.addEventListener("video-playing", playListener);
		window.youtubeWrapper.loadVideo(event.data.media.contentId, 
			event.data.currentTime, function() {});
	}
}

CustomReceiver.prototype.mediaOnMetadataLoadedEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnMetadataLoadedEvent_()");

	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		// Assume that autoplay is always true
		var stateEvent =  new Event("video-playing");
		// @TODO: This data should be sent over by the Sender for CDN videos
		stateEvent.data = {
			author : "Test video author",
			title : "Test video description",
			videoProgress : "00:00",
			videoLength : this.mediaManager_.getMediaInformation().duration,
			image : "http://placehold.it/200x200"
		}
		document.dispatchEvent(stateEvent);

		// Broadcast information event back to sender
		var mediaInformation = new cast.receiver.media.MediaInformation();
		mediaInformation.contentId =
			this.mediaManager_.getMediaInformation().contentId;
		mediaInformation.duration =
			this.mediaManager_.getMediaInformation().duration;
		mediaInformation.metadata = {
			author : "Test video author",
			title : "Test video title"
		}
		this.mediaManager_.setMediaInformation(mediaInformation, true, {});
		this.mediaManager_['mediaOrigOnMetadataLoaded'](event);
	}
}

CustomReceiver.prototype.mediaOnPauseEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPauseEvent_()");

	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		document.dispatchEvent(new Event("video-paused"));
		this.mediaManager_['mediaOrigOnPause'](event);
	} else {
		var pauseListener = function(e) {
			document.removeEventListener("video-paused", pauseListener);
			this.mediaManager_['mediaOrigOnPause'](event);
		}.bind(this);

		document.addEventListener("video-paused", pauseListener);
		window.youtubeWrapper.pauseVideo();
	}
}

CustomReceiver.prototype.mediaOnPlayEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPlayEvent_()");

	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		document.dispatchEvent(new Event("video-playing"));
		this.mediaManager_['mediaOrigOnPlay'](event);
	} else {
		var playListener = function(e) {
			document.removeEventListener("video-playing", playListener);
			this.mediaManager_['mediaOrigOnPlay'](event);
		}.bind(this);

		document.addEventListener("video-playing", playListener);
		window.youtubeWrapper.playVideo();
	}
}

CustomReceiver.prototype.mediaOnStopEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");
	
	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		document.dispatchEvent(new Event("video-stopped"));
		this.mediaManager_['mediaOrigOnStop'](event);
	} else {
		var unstartedListener = function() {
			document.removeEventListener("video-unstarted", unstartedListener);
			this.mediaManager_['mediaOrigOnStop'](event);
		}.bind(this);

		document.addEventListener("video-unstarted", unstartedListener);
		window.youtubeWrapper.stopVideo();
	}
}

CustomReceiver.prototype.mediaOnSeekEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSeekEvent_()");

	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		var length = this.mediaManager_.getMediaInformation().duration;
		var statusEvent = new Event("video-update-progress");
		statusEvent.data = {
			videoProgress : event.data.currentTime,
			videoLength : length
		}
		document.dispatchEvent(statusEvent);
		this.mediaManager_['mediaOrigOnSeek'](event);
	} else {
		var seekSeconds = event.data.currentTime;
		var playListener = function(e) {
			document.removeEventListener("video-playing", playListener);
			this.mediaManager_['mediaOrigOnSeek'](event);
		}.bind(this);

		// Attach playing event listener incase video never buffers
		document.addEventListener("video-playing", playListener);
		window.youtubeWrapper.seekVideo(seekSeconds);
	}
}

CustomReceiver.prototype.mediaOnSetVolumeEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSetVolumeEvent_()");
	
	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		this.mediaManager_['mediaOrigOnSetVolume'](event);
	} else {
		// No Youtube event for volume changed - set arbitrary timeout :/
		window.youtubeWrapper.setVolume(parseInt(event.data.volume.level * 100));
		setTimeout(function() {
			this.mediaManager_['mediaOrigOnSetVolume'](event);
		}.bind(this), 100);
	}
}

CustomReceiver.prototype.mediaCustomizedStatusCallbackEvent_ = 
	function(currentStatus) {
	console.debug("CustomReceiver.js: mediaCustomizedStatusCallbackEvent_()");

	if(this.currentMediaType_ === this.mediaTypes_.STANDARD) {
		return currentStatus;
	} else {
		// Get YTPlayerVolume
		var volume = new cast.receiver.media.Volume();
		volume.level = window.youtubeWrapper.getVolume() / 100;
		volume.muted = (volume.level === 0);

		currentStatus.currentTime = window.youtubeWrapper.getVideoProgress();
		currentStatus.playerState = this.getPlayerState_();
		currentStatus.volume = volume;
		console.log(currentStatus);
		return currentStatus;
	}
}


// START: Player functions
CustomReceiver.prototype.getPlayerState_ = function() {
	console.debug("CustomReceiver.js: getPlayerState_()");

	var youtubeState = window.youtubeWrapper.getState();
	console.log("CustomReceiver.js: Youtube state is: " + youtubeState);
	switch(youtubeState) {
		case "ended":
			return cast.receiver.media.PlayerState.IDLE;
		break;
		case "playing":
			return cast.receiver.media.PlayerState.PLAYING;
		break;
		case "paused":
			return cast.receiver.media.PlayerState.PAUSED;
		break;
		case "buffering":
			return cast.receiver.media.PlayerState.BUFFERING;
		break;
		case "cued":
			return cast.receiver.media.PlayerState.IDLE
		break;
		case "unstarted":
			return cast.receiver.media.PlayerState.IDLE;
		break;
	}
}

CustomReceiver.prototype.getPlayerCurrentTimeSec_ = function() {
	console.debug("CustomReceiver.js: getPlayerCurrentTimeSec_()");
	return window.youtubeWrapper.getVideoProgress();
}