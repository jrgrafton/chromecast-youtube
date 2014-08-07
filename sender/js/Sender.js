 function Sender() {
    this.applicationID_ = "917A9D6E";
    this.session_ = null;

    // Setup functions
    this.initResponders_();
    this.ccInitAPI_();
};

/***************************/
/** Sender initialisation **/
/***************************/
Sender.prototype.ccInitAPI_ = function() {
    console.debug("Sender.js: ccInitAPI_()");

    // Create API config with session listeners
    var sessionRequest = new chrome.cast.SessionRequest(this.applicationID_);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest, 
        this.ccSessionCreatedListener_.bind(this),
        this.ccReceiversUpdatedListener_.bind(this)
    );


    this.ccConnectToDevice_(apiConfig);
}

Sender.prototype.ccConnectToDevice_ = function(apiConfig) {
    // Initialise Chromecast
    chrome.cast.initialize(apiConfig, this.ccDidConnect_.bind(this),
        this.ccDidFailConnect_.bind(this));
}

Sender.prototype.ccDidConnect_ = function() {
    console.debug("Sender.js: ccDidConnect_()");

    // Wait two seconds to allow existing session to be resumed
    setTimeout(function() {
        if(this.session_ === null) {
            this.ccCreateSession_();
        }
    }.bind(this), 2000);
}

Sender.prototype.ccDidFailConnect_ = function(e) {
    console.debug("Sender.js: ccDidFailConnect_()");
    console.error(e);
}

Sender.prototype.ccCreateSession_ = function() {
    console.debug("Sender.js: ccCreateSession_()");
    chrome.cast.requestSession(
        this.ccSessionCreatedListener_.bind(this),
        this.ccCreateSessionFailure_.bind(this)
    );
}

Sender.prototype.ccCreateSessionFailure_ = function(e) {
    console.debug("Sender.js: ccCreateSessionFailure_()");
    console.error(e);
}



/*********************/
/** Event listeners **/
/*********************/
Sender.prototype.ccReceiversUpdatedListener_ = function(e) {
    console.debug("Sender.js: ccReceiversUpdatedListener_()");

    if (e === 'available') { console.log('receiver found'); }
    else { console.log('receiver list empty'); }
}

Sender.prototype.ccSessionCreatedListener_ = function(session) {
    console.debug("Sender.js: ccSessionCreatedListener_()");
    this.session_ = session;

    // Add media loaded listener
    this.session_.removeMediaListener(this.ccMediaLoadedListener_.bind(this));
    this.session_.addMediaListener(this.ccMediaLoadedListener_.bind(this));

    // Add session update listener
    this.session_.removeUpdateListener(
        this.ccSessionUpdatedListener_.bind(this));
    this.session_.addUpdateListener(this.ccSessionUpdatedListener_.bind(this));

    // If session contains media attach listeners to it
    if(this.session_.media.length > 0) {
        // Add update listener
        this.session_.media[0].removeUpdateListener(this.ccMediaUpdatedListener_);
        this.session_.media[0].addUpdateListener(this.ccMediaUpdatedListener_.bind(this));
    }

    // Broadcast event through DOM
    $(document).trigger({
        type: "session-updated",
        session: this.session_,
        isAlive: true
    });
} 

Sender.prototype.ccSessionUpdatedListener_ = function(isAlive) {
    console.debug("Sender.js: ccSessionUpdatedListener_(" + isAlive + ")");

    // Broadcast event through DOM
    $(document).trigger({
        type: "session-updated",
        session: this.session_,
        isAlive: isAlive
    });
}

Sender.prototype.ccMediaLoadedListener_ = function(media) {
    console.debug("Sender.js: ccMediaLoadedListener_()");

    // Add update listener
    media.removeUpdateListener(this.ccMediaUpdatedListener_);
    media.addUpdateListener(this.ccMediaUpdatedListener_.bind(this));

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-loaded",
        media: media
    });
}

Sender.prototype.ccMediaUpdatedListener_ = function(isAlive) {
    console.debug("Sender.js: ccMediaUpdatedListener_()");
    var media = null;
    if(isAlive) {
        media = this.session_.media[0];
    }

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-updated",
        media: media,
        isAlive: isAlive
    });
}


/**********************/
/** Event responders **/
/**********************/
Sender.prototype.initResponders_ = function() {
    console.debug("Sender.js: initResponders_()");

    $(document).on("media-load-request", function(e) {
        if(!this.session_) return;
        this.respondMediaLoadRequest_(e);
    }.bind(this));

    $(document).on("media-play-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaPlayRequest_();
    }.bind(this));

    $(document).on("media-pause-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaPauseRequest_();
    }.bind(this));

    $(document).on("media-seek-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaSeekRequest_(e);
    }.bind(this));

    $(document).on("media-stop-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaStopRequest_();
    }.bind(this));

    $(document).on("media-volume-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaVolumeRequest_(e);
    }.bind(this));
}


Sender.prototype.respondMediaPlayRequest_ = function() {
    console.debug("Sender.js: respondMediaPlayRequest_()");

        // Media update listener will dispatch 
    // state change back to requesting entity
    this.session_.media[0].play(new chrome.cast.media.PauseRequest(),
        function() {
            console.log("Play request completed successfully");
        },
        function(e) {
            console.log("Play request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaPauseRequest_ = function() {
    console.debug("Sender.js: respondMediaPauseRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    this.session_.media[0].pause(new chrome.cast.media.PlayRequest(),
        function() {
            console.log("Pause request completed successfully");
        },
        function(e) {
            console.log("Pause request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaSeekRequest_ = function(data) {
    console.debug("Sender.js: respondMediaSeekRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    var request = new chrome.cast.media.SeekRequest();
    request.currentTime = data.seconds;
    this.session_.media[0].seek(request,
        function() {
            console.log("Seek request completed successfully");
        },
        function(e) {
            console.log("Seek request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaStopRequest_ = function() {
    console.debug("Sender.js: respondMediaStopRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    this.session_.media[0].stop(new chrome.cast.media.StopRequest(),
        function() {
            console.log("Stop request completed successfully");
        },
        function(e) {
            console.log("Stop request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaLoadRequest_ = function(data) {
    console.debug("Sender.js: respondMediaLoadRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    var mediaInfo = new chrome.cast.media.MediaInfo(data.id, "yt");
    var request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = 0;

    this.session_.loadMedia(request,
        function() {
            console.log("Load request completed successfully");
        },
        function(e) {
            console.log("Load request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaVolumeRequest_ = function(data) {
    console.debug("Sender.js: respondMediaVolumeRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    var request = new chrome.cast.media.VolumeRequest();
    request.volume = new chrome.cast.Volume(data.volume);
    this.session_.media[0].setVolume(request,
        function() {
            console.log("Volume request completed successfully");
            this.session_.setReceiverVolumeLevel(data.volume,
                function(){}, function(){})
        }.bind(this),
        function(e) {
            console.log("Volume request failed");
            console.error(e);
        }
    )
}