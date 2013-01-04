function initSVM() {
	svm = new svmjs.SVM();
	svm.fromJSON(svm_vars);
	console.log("SVM initialized");
}

//main function called when clicking the search button
function evaluateAndDisplay (settings) {
	var coll = new TweetCollection();
	coll.fetch(settings.keyword, settings.num, 'en',  coll.displayWithSentiment(settings.elem));
}

//return a function that gets a json representation of tweets and prints them nicely in the element 'elem'
TweetCollection.prototype.displayWithSentiment = function (elem){
	var self = this;
	return function () {
		elem = $(elem);

		var positive = 0;
		var negative = 0;

		elem.html('');
		$(self.tc).each(function(){
			var actualTweet = this.text.delinkify().removeUsers().removeHash().toLowerCase();
			// create boolean vector and print result
			var res = BOW.getPresence(actualTweet.toBOW());
			if (res.sum != 0){
				var mood = (svm.predict([res.result]) == 1) ? "POSITIVE" : "NEGATIVE";
				if (mood == "POSITIVE") {
					var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-positive"><p class="text"> '+ this.text.removeUsers().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					positive = positive + 1;
				}
				else {
					var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-negative"><p class="text"> '+ this.text.removeUsers().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					negative = negative + 1;
				}
				elem.append(tweet);
			}
			else {
				var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-impossible"><p class="text"> '+ this.text.removeUsers().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
				elem.append()
			}
		});

		drawVisualization(positive, negative);
	}
}

//Class representing a collection of tweets. Empty when instantiated.
function TweetCollection () {
	this.tc = new Array();
}

TweetCollection.prototype.empty = function() {
	this.tc = new Array();
}

TweetCollection.prototype.fromJSON = function(json) {
	this.tc = json;
}

TweetCollection.prototype.toJSON = function(json) {
	return this.tc;
}

/**
 * Fetches an exact number of tweets based on the provided parameters.
 * See Twitter documentation for details about how to deal with next_page and max_id parameters.
 * https://dev.twitter.com/docs/api/1.1/get/search/tweets
 */
TweetCollection.prototype.fetch = function (keyword, num, lang, callback)
{ 	var self = this;
	
	var recursiveTweetFetch = function(url, callback) {
		// retrieve tweets recursively as needed
		$.getJSON(url, function(json){
			
			for (var i=0; (i<json.results.length) && (self.tc.length<num) ; i++){ 
				self.tc.push(json.results[i]); 
				}
			var newMaxId = json.results[json.results.length-1].id;	// used in case next_page is not included in the response		
			
			if (self.tc.length < num){
				if (typeof json.next_page === 'undefined'){
					var url = "http://search.twitter.com/search.json?q=" + keyword + "&rpp=100&callback=?&lang=" + lang + "&max_id=" + newMaxId;
				} else {
					var url = "http://search.twitter.com/search.json" + json.next_page + "&callback=?";
				}
				console.log("calling " + url)
				recursiveTweetFetch(url, callback);
			}
			else { 
				console.log("ended " + keyword + " - " + self.tc.length );
				callback(); }
		});
	}

	var url= "http://search.twitter.com/search.json?q="+keyword+"&rpp=100&callback=?&lang=" + lang;
	console.log("trying for " + url);
	recursiveTweetFetch(url, callback);
}

//Draw a pie chart with results
function drawVisualization(positive, negative) {
	// Create and populate the data table.
	var data = google.visualization.arrayToDataTable([
	                                                  ['Sentiment', 'Number of related tweets'],
	                                                  ['Positive', positive],
	                                                  ['Negative', negative],
	                                                  ]);

	var options = {'title':'Sentiments about the searched term are:',
			colors:['green','red']};

	// Create and draw the visualization.
	new google.visualization.PieChart(document.getElementById('chart')).
	draw(data, options);

	google.setOnLoadCallback(drawVisualization);
}