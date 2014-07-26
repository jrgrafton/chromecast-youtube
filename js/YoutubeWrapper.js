/** 
	TODO: Hook into all youtube events 
**/

function YoutubeWrapper(iframeElement) {
	this.iframeElement = iframeElement;
	this.playerEmbedURL = "https://www.youtube.com/embed/";
	this.playerDefaultParams = ["autoplay=1", "controls=0", "modestbranding=1",
		"enablejsapi=1", "showinfo=0", "rel=0"];
}

YoutubeWrapper.prototype.resetVideo = function(id, callback) {
	this.iframeElement.setAttribute("src", "about:blank");
	callback();
}

YoutubeWrapper.prototype.loadVideo = function(id, callback) {
	var urlComponents = [this.playerEmbedURL, id, "?", 
		this.playerDefaultParams.join("&")];
	this.iframeElement.setAttribute("src", urlComponents.join(""));
}

YoutubeWrapper.prototype.pauseVideo = function(callback) {

}

YoutubeWrapper.prototype.playVideo = function(callback) {
	this.resetVideo();
}

YoutubeWrapper.prototype.stopVideo = function(callback) {
	
}

YoutubeWrapper.prototype.seekTo = function(location, callback) {

}

YoutubeWrapper.prototype.getState = function() {
	return null;
} 