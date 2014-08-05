function CustomReceiver() {
	// Initialise object vars
	this.mediaElement_ = null;
	this.mediaManager_ = null;
	this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();

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
	var player = new cast.receiver.media.Player();
	player.getState = function() { 
		return this.getMediaState_();
	}.bind(this);
	this.mediaManager_ = new cast.receiver.MediaManager(player);
}

CustomReceiver.prototype.hijackMediaEvents_ = function() {
	console.debug("CustomReceiver.js: hijackMediaEvents_()");

	// Save original references
	this.mediaManager_['mediaOrigOnLoad'] = this.mediaManager_.onLoad;
	this.mediaManager_['mediaOrigOnPause'] = this.mediaManager_.onPause;
	this.mediaManager_['mediaOrigOnPlay'] = this.mediaManager_.onPlay;
	this.mediaManager_['mediaOrigOnStop'] = this.mediaManager_.onStop;
	this.mediaManager_['mediaOrigOnSeek'] = this.mediaManager_.onSeek;
	this.mediaManager_['mediaOrigOnSetVolume'] = this.mediaManager_.onSetVolume;
	this.mediaManager_['mediaOrigOnGetStatus'] = this.mediaManager_.onGetStatus;

	this.mediaManager_.customizedStatusCallback = 
		this.mediaCustomizedStatusCallbackEvent_.bind(this);
	this.mediaManager_.onLoad = this.mediaOnLoadEvent_.bind(this);
	this.mediaManager_.onPause = this.mediaOnPauseEvent_.bind(this);
	this.mediaManager_.onPlay = this.mediaOnPlayEvent_.bind(this);
	this.mediaManager_.onStop = this.mediaOnStopEvent_.bind(this);
	this.mediaManager_.onSeek = this.mediaOnSeekEvent_.bind(this);
	this.mediaManager_.onSetVolume = this.mediaOnSetVolumeEvent_.bind(this);
}

CustomReceiver.prototype.initialiseSessionManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseSessionManagement_()");
	this.castReceiverManager_.onSenderDisconnected = function(event) {
	  	if(this.castReceiverManager_.getSenders().length == 0 &&
	    	event.reason == 
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


/* Start event processing */
CustomReceiver.prototype.mediaOnLoadEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnLoadEvent_()");
	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);

		// Broadcast media information
		var mediaInformation = new cast.receiver.media.MediaInformation();
		mediaInformation.playerState = cast.receiver.media.PlayerState.PLAYING;
		mediaInformation.duration = window.youtubeWrapper.getVideoLength();
		mediaInformation.metadata = {
			author : e.data.author,
			title : e.data.title
		}

		console.debug("CustomReceiver.js: sending load complete");
		this.mediaManager_['mediaOrigOnLoad'](event);
		this.mediaManager_.setMediaInformation(mediaInformation, true, {});
	}.bind(this);

	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.loadVideo(event.data.media.contentId, 
		event.data.currentTime, function() {});
}

CustomReceiver.prototype.mediaOnPauseEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPauseEvent_()");
	window.youtubeWrapper.pauseVideo();
	this.mediaOrigOnPause_(event);
}

CustomReceiver.prototype.mediaOnPlayEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPlayEvent_()");
	window.youtubeWrapper.playVideo();
	this.mediaOrigOnPlay_(event);
}

CustomReceiver.prototype.mediaOnStopEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");
	this.mediaOrigOnPlay(event);
	window.youtubeWrapper.stopVideo();
	this.mediaOrigOnStop_(event);
}

CustomReceiver.prototype.mediaOnSeekEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");
	console.debug(event.data);
	var seekSeconds = event.data.currentTime;
	window.youtubeWrapper.seekVideo(seekSeconds);
	this.mediaOrigOnSeek_(event);
}

CustomReceiver.prototype.mediaOnSetVolumeEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSetVolumeEvent_()");
	console.debug(event.data);
	var volume = event.data.volume;
	window.youtubeWrapper.setVolume(volume)
	window.mediaOrigOnSetVolume_(event);
}

CustomReceiver.prototype.mediaCustomizedStatusCallbackEvent_ = 
	function(currentStatus) {
	console.debug("CustomReceiver.js: mediaCustomizedStatusCallbackEvent_()");

	currentStatus.playerState = this.getMediaState_();
	return currentStatus;
}

CustomReceiver.prototype.getMediaState_ = function(currentStatus) {
	console.debug("CustomReceiver.js: getMediaState_()");

	return cast.receiver.media.PlayerState.PLAYING;
}