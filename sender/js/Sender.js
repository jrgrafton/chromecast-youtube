 function Sender() {
    // See https://cast.google.com/publish/#/overview
    this.applicationID_ = "917A9D6E";
    this.session_ = null;

    // Wait for Chromecast to be detected
    window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
      if (loaded) {
        this.initializeCastApi_();
        this.initializeUI_(); // Initialize UI
      } else {
        console.log(errorInfo);
      }
    }.bind(this);
};

Sender.prototype = {
    // Connect to Chromecast device upon discovery
    initializeCastApi_ : function(){
        console.debug("Sender.js: initializeCastApi_()");
        
        // Create API config with session listeners
        var sessionRequest = new chrome.cast.SessionRequest(this.applicationID_);
        var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
        function(e) {
            this.session_ = e;
            console.log('connected to session: ' + e.sessionId);
        }.bind(this),
        function(e) {
            console.log(e);
            if (e === 'available') { console.log('receiver found'); }
            else { console.log('receiver list empty'); }
        });
    
        // Initialise Chromecast
        chrome.cast.initialize(apiConfig,
        function() {
            // Devices are available and can be connected to, lets grab a session
            console.log("initialization success");
            setTimeout(function() {
                if(this.session_ == null) {
                    console.log("no existing session found - requesting new one");
                    chrome.cast.requestSession(function(e) {
                        // Session established (receiver will have launched by this point)
                        console.log('session request success');
                        this.session_ = e;

                        // Initialise UI only after session exists
                        this.initializeUI_();
                    }.bind(this),
                    function(e) {
                        console.log('session request failure');
                        console.log(e);
                    });
                }
            }.bind(this), 1000);
        }.bind(this),
        function(e){
            console.log("initialization failure");
            console.log(e);
        });
    },
    // Initialize UI
    initializeUI_ : function(){
        console.debug("Sender.js: initializeUI_()");
        $("input").on("mouseup", function(e) {
            var commandName = $(e.target).data("command");
            var functionName = "command" + commandName.charAt(0).toUpperCase() +
                commandName.slice(1) + "_";
            this[functionName](e.target);
        }.bind(this))
    },
    commandLoad_ : function(e) {
        console.debug("Sender.js: commandLoad_()");
        var videoID = $("#videoID").val(); 
        var mediaInfo = new chrome.cast.media.MediaInfo(videoID, "yt");
        var request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.autoplay = true;
        request.currentTime = 0;
        this.session_.loadMedia(request,
            this.onMediaDiscovered_.bind(this, 'loadMedia'),
            this.onMediaError_.bind(this));
    },
    commandPause_ : function(e) {
        // Switch command for next press
        $(e).data("command", "play");
        $(e).html("Play");
        this.session_.media[0].pause(new chrome.cast.media.PlayRequest(),
            function() {
                console.debug("Pause request completed successfully");
        })
    },
    commandPlay_ : function(e) {
        // Switch command for next press
        $(e).data("command", "pause");
        $(e).html("Pause");
        this.session_.media[0].play(new chrome.cast.media.PlayRequest(),
            function() {
                console.debug("Play request completed successfully");
        })
    },
    commandSeek_ : function(e) {
        // Switch command for next press
        
    },
};