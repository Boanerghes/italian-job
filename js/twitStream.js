function init(settings) {
	var coll = new TweetCollection();
	coll.fetch(settings.keyword, settings.num, 'it', function() { coll.displayTweets(settings.elem); });
}


// Class representing a collection of tweets. Empty when instantiated.
function TweetCollection () {
	var tweets = '';
}

// Fetches tweets based on the provided parameters
TweetCollection.prototype.fetch = function (keyword, num, lang, callback)
{ 	
	var url= "http://search.twitter.com/search.json?q="+keyword+"&rpp="+num+"&callback=?"+"&lang=" + lang;
	$.getJSON(url, function(json){
		tweets = json;
		callback(json);
	});
}



// Display the tweets stored in the object in the 'elem' DOM position.
// TODO what does it happen if no tweets have been retrieved?!
TweetCollection.prototype.displayTweets = function(elem) {
	TweetCollection.displayTweets(elem)(tweets);
}

// A curried function getting a DOM position and returning a function that gets 
// the json representation of a list of tweets and populate the DOM elemnt with them.
TweetCollection.displayTweets = function(elem){
	return function(json) {
		elem=$(elem);
		
		elem.html('');
	    $(json.results).each(function(){
	    	var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right"><p class="text">'+this.text.delinkify().removeUsers().linktag().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
			elem.append(tweet);
	    });
	}
}

// simple function to transform a tweet to a bag of words
// TODO update this
String.prototype.toBOW = function() {
	return this.match(/w+/g);
}

// remove links from a string
String.prototype.delinkify=function(){
    return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&;\?\/.=]+/g,"");
};


// remove users' names
String.prototype.removeUsers=function(){
    return this.replace(/[@]+[A-Za-z0-9-_]+/g,""); 
};


String.prototype.linktag=function(){
    return this.replace(/[]+[A-Za-z0-9-_]+/,function(t){
        return t;
    });
};
