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
	this.initialiseMediaManagement_()
	this.hijackMediaEvents_();
	this.initialiseSessionManagement_()
	this.startReceiver_();
}

CustomReceiver.prototype.initialiseMediaManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseMediaManagement_()");
	this.mediaElement_ = document.getElementById('media');
	this.mediaManager_ = new cast.receiver.MediaManager(this.mediaElement_);

	this.hijackMediaEvents_();
}

CustomReceiver.prototype.hijackMediaEvents_ = function() {
	console.debug("CustomReceiver.js: hijackMediaEvents_()");
	// Save original references
	this.mediaOrigOnLoad = this.mediaManager_.onLoad;
	this.mediaOrigOnPause = this.mediaManager_.onPause;
	this.mediaOrigOnPlay = this.mediaManager_.onPlay;
	this.mediaOrigOnStop = this.mediaManager_.onStop;
	this.mediaOrigOnSeek = this.mediaManager_.onSeek;
	this.mediaOnSetVolume = this.mediaManager_.onSetVolume;
	this.mediaOrigOnGetStatus = this.mediaManager_.onGetStatus;

	// Hijack functions
	this.mediaManager_.onLoad = this.mediaOnLoadEvent_;
	this.mediaManager_.onPause = this.mediaOnPauseEvent_;
	this.mediaManager_.onPlay = this.mediaOnPlayEvent_;
	this.mediaManager_.onStop = this.mediaOnStopEvent_;
	this.mediaManager_.onSeek = this.mediaOnSeekEvent_;
	this.mediaManager_.onSetVolume = this.mediaOnSetVolumeEvent_;
	this.mediaManager_.onGetStatus = this.mediaOnGetStatusEvent_;
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
	appConfig.statusText = 'Ready to play';
	appConfig.maxInactivity = 6000;
	this.castReceiverManager_.start(appConfig);
}


/* Start event processing */
CustomReceiver.prototype.mediaOnLoadEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnLoadEvent_()");
	var playListener = function(e) {
		document.removeEventListener("video-playing", videoPlayingListener);

		// Broadcast media information
		var mediaInformation = new cast.receiver.media.MediaInformation();
		mediaInformation.duration = window.youtubeWrapper.getVideoLength();
		mediaInformation.metadata = {
			author : e.data.author,
			title : e.data.title
		}
		this.mediaManager_.setMediaInformation(mediaInformation, true, {});
		this.mediaManager_.sendLoadComplete();
	}.bind(this);

	// Stop any currently playing video first 
	window.youtubeWrapper.stopVideo();
	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.loadVideo(event.data.media.contentId, 
		event.data.currentTime, function() {});
}

CustomReceiver.prototype.mediaOnPauseEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPauseEvent_()");
	window.youtubeWrapper.pauseVideo();
}

CustomReceiver.prototype.mediaOnPlayEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPlayEvent_()");
	window.youtubeWrapper.playVideo();
}

CustomReceiver.prototype.mediaOnStopEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");
	this.mediaOrigOnPlay(event);
	window.youtubeWrapper.stopVideo();
}

CustomReceiver.prototype.mediaOnSeekEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");
	console.debug(event.data);
	var seekSeconds = event.data.currentTime;
	window.youtubeWrapper.seekVideo(seekSeconds);
}

CustomReceiver.prototype.mediaOnSetVolumeEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSetVolumeEvent_()");
	console.debug(event.data);
	var volume = event.data.volume;
	window.youtubeWrapper.setVolume(volume)
}

CustomReceiver.prototype.mediaOnGetStatusEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnGetStatusEvent_()");
	console.debug(event.data);
	this.mediaOrigOnGetStatus_(event)
}