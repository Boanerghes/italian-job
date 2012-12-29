function initSVM() {
	svm = new svmjs.SVM();
	svm.fromJSON(svm_vars);
	console.log("SVM initialized");
}

// main function called when clicking the search button
function evaluateAndDisplay (settings) {
	var coll = new TweetCollection();
	coll.fetch(settings.keyword, settings.num, 'en',  coll.displayWithSentiment(settings.elem));
}

// return a function that gets a json representation of tweets and prints them nicely in the element 'elem'
TweetCollection.prototype.displayWithSentiment = function (elem){
	return function (json) {
		elem = $(elem);

		var positive = 0;
		var negative = 0;
		
		elem.html('');
		$(json.results).each(function(){
			var actualTweet = this.text.delinkify().removeUsers().removeHash().toLowerCase();
			// create boolean vector and print result
			var res = BOW.getPresence(actualTweet.toBOW());
			if (res.sum != 0){
				var mood = (svm.predict([res.result]) == 1) ? "POSITIVE" : "NEGATIVE";
				if (mood == "POSITIVE") {
				    //var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-negative"><p class="text"> ['+mood + " (" + res.sum + ")] " +this.text.delinkify().removeUsers().removeHash().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-positive"><p class="text"> '+ this.text.delinkify().removeUsers().removeHash().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					positive = positive + 1;
				}
				else {
				    //var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-negative"><p class="text"> ['+mood + " (" + res.sum + ")] " +this.text.delinkify().removeUsers().removeHash().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right-negative"><p class="text"> '+ this.text.delinkify().removeUsers().removeHash().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
					negative = negative + 1;
				}
				elem.append(tweet);
			}
		});
		
		drawVisualization(positive, negative);
	}
}

//Class representing a collection of tweets. Empty when instantiated.
function TweetCollection () {
	var tweets = '';
}

//Fetches tweets based on the provided parameters
TweetCollection.prototype.fetch = function (keyword, num, lang, callback)
{ 	
	var url= "http://search.twitter.com/search.json?q="+keyword+"&rpp="+num+"&callback=?"+"&lang=" + lang;
	$.getJSON(url, function(json){
		tweets = json;
		callback(json);
	});
}


//Transform a vector in a boolean presence array given an array of elements. The output array has the same 
//length of the bag of elements, subject of this procedure, and each of its elements reflects the presence of that particular element
//in the original vector.
Array.prototype.getPresence = function(elements) {

	var output=new Array();
	var sum = 0;

	for (var i=0; i<this.length; i++){
		if (jQuery.inArray(this[i], elements) != -1){
			output[i] = 1;
		}
		else {
			output[i] = 0;
		}
		sum += output[i];
	}
	return {result: output, sum : sum}
}

//simple function to transform a tweet to a bag of words
//TODO update this
String.prototype.toBOW = function() {
	return this.match(/\w+/g);
}

//remove links from a string
String.prototype.delinkify = function(){
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&;\?\/.=]+/g,"");
};


//remove users' names
String.prototype.removeUsers = function(){
	return this.replace(/[@]+[A-Za-z0-9-_]+/g,""); 
};


String.prototype.removeHash = function(){
	return this.replace(/[#]+[A-Za-z0-9-_]+/,function(t){
		return t;
	});
};


//Return the indexes of true boolean elements in an array.
Array.prototype.findTrueIndexes = function() {
	var output = new Array();

	for (var i=0; i< this.length; i++){
		if (this[i] == 1)
			output.push(i);
	}
	return output;
}


// various methods for training the SVM

function setUpAndTest() {
	posVector = new Array();
	negVector = new Array();
	var i = 0;
	this.tweetsToVector = function(tweet_coll, array) {
		$(tweet_coll.results).each( function(){ 
			var actualTweet = this.text.delinkify().removeUsers().removeHash().toLowerCase();
			var arr = actualTweet.toBOW();
			var res = BOW.getPresence(arr);
			if (res.sum != 0){ 
				array.push(res.result);
				console.log("PUSHED " + actualTweet + " " + res.result.findTrueIndexes());
			} 
			else console.log("REJECTED " + actualTweet);
		});	
	}
	this.recursiveFetch = function(keyword, array, max) {
		console.log("recursive call");
		var coll = new TweetCollection();
		coll.fetch(keyword, 100, "en", function(json){
			tweetsToVector(json, array);
			if (array.length < max){
				recursiveFetch(keyword, array, max);
			}
			else i++;
			if (i == 2) initializeSVM();
		});
	}

	recursiveFetch(":) OR :D OR :-) OR (: OR (-:", posVector, 10);
	recursiveFetch(":( OR ): OR :-( OR )-:", negVector, 10);

	this.initializeSVM = function (){
		console.log("initializing SVM");
		data = posVector.concat(negVector);
		labels = new Array();
		for (var i = 0; i<posVector.length + negVector.length; i++){
			labels[i] = (i < posVector.length) ? 1 : -1;
		}
		svm = new svmjs.SVM();
		svm.train(data, labels, {C: 1.0});

		console.log(JSON.stringify(svm.toJSON()));
	}

}


function calculateRecurrence() {
	this.tweetsToWordsCount = function(tweet_coll, destArray) {
		$(tweet_coll.results).each( function(){ 

			var actualTweet = this.text.delinkify().removeUsers().toLowerCase();
			destArray.push(actualTweet);

			var arr = actualTweet.toBOW();
			for ( var i =0; i<arr.length; i++) {
				var token = arr[i];
				if (words[token] == undefined) { words[token] = 1; }
				else { words[token] ++; }
			}
		});	
	}

	exec = false;
	this.recursiveFetch = function(keyword, destArray, max) {
		console.log("recursive call " + keyword);
		var coll = new TweetCollection();
		coll.fetch(keyword, 100, "en", function(json){
			tweetsToWordsCount(json, destArray);
			console.log ("ended recursive fetch - " + destArray.length);
			if (destArray.length <= max){
				recursiveFetch(keyword, destArray, max);
			}
			else {
				if (!exec){ exec = true;}
				else if (exec) {
					console.log("gone");
					trainSVM();
				}
			}
		});
	}

	this.trainSVM = function () {
		var sortable = [];

		for (token in words) {
			if (words.hasOwnProperty(token)){
				sortable.push([token, words[token]]);
			}
		}
		sortable.sort( function (a, b) {
			return b[1] - a[1];
		});

		newBOW = [];
		// update here for bigger BOW
		for (var i=0; i<200; i++) {
			newBOW.push(sortable[i][0]);
		}

		svm = new svmjs.SVM();
		labels = [];
		vectors = [];
		j = 0;

		for (var i=0; i<posTweets.length; i++){
			var vec = newBOW.getPresence(posTweets[i].toBOW());
			if (vec.sum != 0) {
				vectors[j] = vec.result;
				labels[j++] = 1;		
			}
		}
		for (var i=0; i<negTweets.length; i++){
			var vec = newBOW.getPresence(negTweets[i].toBOW());
			if (vec.sum != 0) {
				vectors[j] = vec.result;
				labels[j++] = -1;		
			}
		}
		console.log(j);
		svm.train(vectors, labels, {C: 1.0});
		console.log(JSON.stringify(svm.toJSON()));
	}

	var words = new Array();
	posTweets = [];
	negTweets = [];

	recursiveFetch(":) OR :D OR :-) OR (: OR (-:", posTweets, 2000);
	recursiveFetch(":( OR ): OR :-( OR )-:", negTweets, 2000);
}


// Draw a pie chart with results
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
      
