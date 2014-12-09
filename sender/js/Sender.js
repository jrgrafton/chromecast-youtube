 function Sender() {
    this.applicationID_ = "917A9D6E";
    this.apiConfig_ = null;
    this.session_ = null;

    // Setup functions
    this.initResponders_();
    this.ccInitAPI_();
};

/**********************/
/** Public functions **/
/**********************/
Sender.prototype.ccGetVolume = function() {
    if(!this.session_) {
        return 0;
    } else {
        return this.session_.receiver.volume.level;
    }
}


/***************************/
/** Sender initialisation **/
/***************************/
Sender.prototype.ccInitAPI_ = function() {
    console.debug("Sender.js: ccInitAPI_()");

    // Create API config with session listeners
    var sessionRequest = new chrome.cast.SessionRequest(this.applicationID_);
    this.apiConfig_ = new chrome.cast.ApiConfig(sessionRequest, 
        this.ccSessionCreatedListener_.bind(this),
        this.ccReceiversUpdatedListener_.bind(this)
    );

    this.ccConnectToDevice_();
}

Sender.prototype.ccConnectToDevice_ = function() {
    // Initialise Chromecast
    chrome.cast.initialize(this.apiConfig_, this.ccDidConnect_.bind(this),
        this.ccDidFailConnect_.bind(this));
}

Sender.prototype.ccDidConnect_ = function() {
    console.debug("Sender.js: ccDidConnect_()");
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
    $(document).trigger({
        type: "session-updated",
        session: this.session_,
        isAlive: false
    });
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

    // Update session with new media
    this.session_.media = [media];

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-loaded",
        media: media
    });
}

Sender.prototype.ccMediaUpdatedListener_ = function(isAlive) {
    console.debug("Sender.js: ccMediaUpdatedListener_()");

    var media = null;
    if(isAlive && this.session_.media.length > 0) {
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
    $(document).on("receiver-connect-request", function(e) {
        this.ccCreateSession_();
    }.bind(this));

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

    $(document).on("media-status-request", function(e) {
        if(!this.session_ || this.session_.media.length === 0) return;
        this.respondMediaStatusRequest_(e);
    }.bind(this));
}


Sender.prototype.respondMediaPlayRequest_ = function() {
    console.debug("Sender.js: respondMediaPlayRequest_()");

        // Media update listener will dispatch 
    // state change back to requesting entity
    this.session_.media[0].play(new chrome.cast.media.PauseRequest(),
        function() {
            console.log("UI.js: Play request completed successfully");
        },
        function(e) {
            console.log("UI.js: Play request failed");
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
            console.log("UI.js: Pause request completed successfully");
        },
        function(e) {
            console.log("UI.js: Pause request failed");
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
            console.log("UI.js: Seek request completed successfully");
        },
        function(e) {
            console.log("UI.js: Seek request failed");
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
            console.log("UI.js: Stop request completed successfully");
        },
        function(e) {
            console.log("UI.js: Stop request failed");
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
    
    // Clear current media
    this.session_.media = [];
    this.session_.loadMedia(request,
        function() {
            console.log("UI.js: Load request completed successfully");
        },
        function(e) {
            console.log("UI.js: Load request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaVolumeRequest_ = function(data) {
    console.debug("Sender.js: respondMediaVolumeRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    this.session_.setReceiverVolumeLevel(data.volume,
        function() {
            console.log("UI.js: Volume request completed successfully");
        }.bind(this),
        function(e) {
            console.log("UI.js: Volume request failed");
            console.error(e);
        }
    )
}

Sender.prototype.respondMediaStatusRequest_ = function(data) {
    console.debug("Sender.js: respondMediaStatusRequest_()");

    // Media update listener will dispatch 
    // state change back to requesting entity
    var request = chrome.cast.media.GetStatusRequest();
    this.session_.media[0].getStatus(request,
        function(media) {
            console.log("UI.js: Status request completed successfully");
        }.bind(this),
        function(e) {
            console.log("UI.js: Status request failed");
            console.error(e);
        }
    )
}