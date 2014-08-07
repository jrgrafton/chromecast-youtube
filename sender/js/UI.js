 function UI() {
	this.UPDATE_INTERVAL_TIME = 500; // How often to update current time when media is playing
	this.updateInterval = null;
	this.mediaCurrentTime = 0;
	this.mediaTotalTime = 0;

    // Setup functions
    this.initUI_();
};

/*********************/
/** DOM interaction **/
/*********************/
UI.prototype.initUI_ = function() {
	console.debug("UI.js: initUI_()");
	this.initResponders_();
	this.initCommands_();
}

UI.prototype.updateUI_ = function(media) {
	console.debug("UI.js: updateUI_()");

	// Recreate progress update interval every time UI is updated
	console.log("UI.js: clearing update interval");
	clearInterval(this.updateInterval);

	if(media === null ||
			media.playerState === chrome.cast.media.PlayerState.IDLE) {

		// Meta
		$(".meta").css("visibility", "hidden");

		// Controls
		$(".progress-slider, .volume-slider").val(0);
		$(".current-time, .total-time").html("--:--");
		$(".current-volume").html("0");
		$("button.play").hide();
		$("button.pause").show().attr("disabled", true);
		$("button.pause, input[type=range]").show().attr("disabled", true);
	} else {
		console.log(media);
		
		var currentTimeRaw = media.currentTime;
	    var totalTimeRaw = media.media.duration;
	    var currentTime = this.secondsToTime_(currentTimeRaw);
	    var totalTime = this.secondsToTime_(totalTimeRaw);
	    var percentComplete = (100 / totalTimeRaw) * currentTimeRaw;
	    var percentVolume = media.volume.level * 100;

	    // Save current timing for use by other functions
	    this.mediaCurrentTime = parseInt(currentTimeRaw);
	    this.mediaTotalTime = parseInt(totalTimeRaw);
	    
	    // Current timing
	    if(!isNaN(percentComplete)) {
		    $(".current-time").html(currentTime);
		    $(".total-time").html(totalTime);
		    $(".progress-slider").val(percentComplete);
		}

	    // Current volume
	    $(".current-volume").html(percentVolume);
	    $(".volume-slider").val(percentVolume);

	    // Update author and title
	    $(".meta").css("visibility", "visible");
	    if(media.media.metadata) {
	    	$(".author").html(media.media.metadata.author + ": ");
	    	$(".title").html(media.media.metadata.title);
		}

	    // Enable all elements
	    $("button").removeAttr("disabled");
	    $("input").removeAttr("disabled");

	    // Update local UI with interval rather than polling receiver
	    if(media.playerState === chrome.cast.media.PlayerState.PLAYING) {
	    	console.log("UI.js: setting update interval");
	    	this.updateInterval = setInterval(function() {
	    		this.mediaCurrentTime += this.UPDATE_INTERVAL_TIME / 1000;
	    		$(".current-time").html(
	    			this.secondsToTime_(this.mediaCurrentTime));
	    	}.bind(this), this.UPDATE_INTERVAL_TIME);
	    } else if(media.playerState === chrome.cast.media.PlayerState.PAUSED) {
	    	$("button.play").show();
	    	$("button.pause").hide();
	    }
	}
}

UI.prototype.secondsToTime_ = function(seconds) {
    console.debug("UI.js: secondsToTime_()");
    var minutes = parseInt(Math.floor(seconds / 60));
    var seconds = parseInt(seconds % 60);
    if(isNaN(minutes)) minutes = 0;
    if(isNaN(seconds)) seconds = 0;

    if(seconds < 10) seconds = "0" + seconds;
    return minutes + ":" + seconds;
} 

/******************/
/** DOM commands **/
/******************/
UI.prototype.initCommands_ = function() {
	console.debug("UI.js: initCommands_()");
	$.each($("*[data-commands]"), function(index, element) {
		var commands = $(element).data("commands");
		for(var i = 0; i < commands.length; i++) {
			var command = commands[i];

			// Attach event listener to DOM element
			var name = command.name;
			var trigger = command.trigger;
			$(element).on(trigger, function(e) {
				var functionName = "command" +
					name.charAt(0).toUpperCase() +
					name.slice(1) + "_";
				this[functionName](element, e.type);
			}.bind(this))
		}
	}.bind(this));
}

UI.prototype.commandPlay_ = function(element, trigger) {
	console.debug("UI.js: commandPlay_()");

	// Toggle play / pause
	$("buttons").attr("disabled", true);
	$(element).hide();
	$("button.pause").show();

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-play-request"
    });
}

UI.prototype.commandPause_ = function(element, trigger) {
	console.debug("UI.js: commandPause_()");

	// Toggle play / pause
	$("button").attr("disabled", true);
	$(element).hide();
	$("button.play").show();

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-pause-request"
    });
}

UI.prototype.commandSeek_ = function(element, trigger) {
	console.debug("UI.js: commandSeek_()");
	clearInterval(this.updateInterval);

	var requestedPercentage = $(element).val();
	var requestedSeconds = this.mediaTotalTime * (requestedPercentage / 100);
	$(".current-time").html(this.secondsToTime_(requestedSeconds));

	if(trigger === "change") {
		// Broadcast event through DOM
	    $(document).trigger({
	        type: "media-seek-request",
	        seconds: requestedSeconds
	    });
	}
}

UI.prototype.commandStop_ = function(element, trigger) {
	console.debug("UI.js: commandStop_()");
	$(element).attr("disabled", true);

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-stop-request"
    });
}

UI.prototype.commandLoad_ = function(element, trigger) {
	console.debug("UI.js: commandLoad_()");

	// Disable all elements during load
	$("button").attr("disabled", true);
	$("input").attr("disabled", true);

    // Broadcast event through DOM
    $(document).trigger({
        type: "media-load-request",
        id : $("#videoID").val()
    });
}

UI.prototype.commandVolume_ = function(element, trigger) {
	console.debug("UI.js: commandVolume_()");

	// Change volume
	var requestedPercentage = $(element).val();
	$(".current-volume").html(requestedPercentage);

	if(trigger === "change") {
		// Broadcast event through DOM
	    $(document).trigger({
	        type: "media-volume-request",
	        volume: 0.01 * requestedPercentage
	    });
	}
}

/**********************/
/** Event responders **/
/**********************/
UI.prototype.initResponders_ = function() {
	console.debug("UI.js: initResponders_()");
	$(document).on("media-updated", function(e) {
        this.respondMediaUpdated_(e);
    }.bind(this));

    $(document).on("media-loaded", function(e) {
        this.respondMediaLoaded_(e);
    }.bind(this));

    $(document).on("session-updated", function(e) {
        this.respondSessionUpdated_(e);
    }.bind(this));
}

UI.prototype.respondMediaUpdated_ = function(data) {
	console.debug("UI.js: respondMediaUpdated_()");
	this.updateUI_(data.media);
}

UI.prototype.respondMediaLoaded_ = function(data) {
	console.debug("UI.js: respondMediaLoaded_()");
	this.updateUI_(data.media);
}

UI.prototype.respondSessionUpdated_ = function(data) {
	console.debug("UI.js: respondSessionUpdated_()");

	$("button.load").removeAttr("disabled");
	if(!data.isAlive) {
		this.updateUI_(null);
	} else if(data.session.media.length > 0) {
		this.updateUI_(data.session.media[0]);
	}
}
