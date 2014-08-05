/**
 * A generic player interface.
 *
 * @interface
 */
cast.receiver.media.Player = function() {};


/**
 * Registers an API that the player should call when there is an error.
 * @param {function(Object)} errorCallback The callback method called when the
 *     player has an error.
 */
cast.receiver.media.Player.prototype.registerErrorCallback =
    function(errorCallback) {};


/**
 * Registers an API that the player should call when the media has ended.
 * @param {function()} endedCallback The callback method called when the player
 *     has ended.
 */
cast.receiver.media.Player.prototype.registerEndedCallback =
    function(endedCallback) {};


/**
 * Registers an API that the player should call when load is complete.
 * @param {function()} loadCallback The callback method called when the player
 *     has completed load succesfully.
 */
cast.receiver.media.Player.prototype.registerLoadCallback =
    function(loadCallback) {};


/**
 * Called to unregister for error callbacks.
 */
cast.receiver.media.Player.prototype.unregisterErrorCallback = function() {};


/**
 * Called to unregister for ended callbacks.
 */
cast.receiver.media.Player.prototype.unregisterEndedCallback = function() {};


/**
 * Called to unregister for load callbacks.
 */
cast.receiver.media.Player.prototype.unregisterLoadCallback = function() {};


/**
 * Loads content to be played.
 * @param {string} contentId The content ID. Should be treated as an opaque
 *     string.
 * @param {boolean} autoplay Whether the content should play after load.
 * @param {number=} opt_time The expected current time after load (in seconds).
 */
cast.receiver.media.Player.prototype.load =
    function(contentId, autoplay, opt_time) {};


/**
 * Resets the player. After this call the player state should be IDLE (no
 * media loaded).
 */
cast.receiver.media.Player.prototype.reset = function() {};


/**
 * Starts playback.
 */
cast.receiver.media.Player.prototype.play = function() {};


/**
 * Sets playback to start at a new time position.
 * @param {number} time The expected current time after seek (in seconds).
 * @param {cast.receiver.media.SeekResumeState=} opt_resumeState The expected
 *     state after seek.
 */
cast.receiver.media.Player.prototype.seek = function(time, opt_resumeState) {};


/**
 * Pauses playback.
 */
cast.receiver.media.Player.prototype.pause = function() {};


/**
 * @return {cast.receiver.media.PlayerState} The current state of the player.
 */
cast.receiver.media.Player.prototype.getState = function() {};


/**
 * @return {number} Current time (in seconds) of the playback.
 */
cast.receiver.media.Player.prototype.getCurrentTimeSec = function() {};


/**
 * @return {number} Duration of the video, in seconds.
 */
cast.receiver.media.Player.prototype.getDurationSec = function() {};


/**
 * @return {cast.receiver.media.Volume} The media volume.
 */
cast.receiver.media.Player.prototype.getVolume = function() {};


/**
 * @param {cast.receiver.media.Volume} volume New volume.
 */
cast.receiver.media.Player.prototype.setVolume = function(volume) {};