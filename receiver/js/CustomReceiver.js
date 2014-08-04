function CustomReceiver() {
	// Initialise object vars
	this.mediaElement = null;
	this.mediaManager = null;
	this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

	// Events that need to be hijacked for Youtube playback
	this.mediaOrigOnLoad = null;
	this.mediaOrigOnPause = null;
	this.mediaOrigOnPlay = null;
	this.mediaOrigOnStop = null;

	this.mediaOrigOnSeek = null;
	this.mediaOnSetVolume = null;
	this.mediaOrigOnGetStatus = null;

	// Startup functions
	this.initialiseMediaManagement_()
	this.hijackMediaEvents_();
	this.initialiseSessionManagement_()
	this.startReceiver_();
}

CustomReceiver.prototype.initialiseMediaManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseMediaManagement_()");
	this.mediaElement = document.getElementById('media');
	this.mediaManager = new cast.receiver.MediaManager(window.mediaElement);

	this.hijackMediaEvents_();
}

CustomReceiver.prototype.hijackMediaEvents_ = function() {
	console.debug("CustomReceiver.js: hijackMediaEvents_()");
	// Save original references
	this.mediaOrigOnLoad = this.mediaManager.onLoad;
	this.mediaOrigOnPause = this.mediaManager.onPause;
	this.mediaOrigOnPlay = this.mediaManager.onPlay;
	this.mediaOrigOnStop = this.mediaManager.onStop;
	this.mediaOrigOnSeek = this.mediaManager.onSeek;
	this.mediaOnSetVolume = this.mediaManager.onSetVolume;
	this.mediaOrigOnGetStatus = this.mediaManager.onGetStatus;

	// Hijack functions
	this.mediaManager.onLoad = this.mediaOnLoadEvent_;
	this.mediaManager.onPause = this.mediaOnPauseEvent_;
	this.mediaManager.onPlay = this.mediaOnPlayEvent_;
	this.mediaManager.onStop = this.mediaOnStopEvent_;
	this.mediaManager.onSeek = this.mediaOnSeekEvent_;
	this.mediaManager.onSetVolume = this.mediaOnSetVolumeEvent_;
	this.mediaManager.onGetStatus = this.mediaOnGetStatusEvent_;
}

CustomReceiver.prototype.initialiseSessionManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseSessionManagement_()");
	this.castReceiverManager.onSenderDisconnected = function(event) {
	  	if(this.castReceiverManager.getSenders().length == 0 &&
	    	event.reason == 
	    	cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
	      window.close();
	  	}
	}.bind(this)
}

CustomReceiver.prototype.startReceiver_ = function() {
	console.debug("CustomReceiver.js: startReceiver_()");
	this.castReceiverManager.start();
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
		this.mediaManager.setMediaInformation(mediaInformation, true, {});
		this.mediaManager.sendLoadComplete();
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
}