// mp 1/2013
// various methods for training the SVM
// not very clean, should be refactored


/**
 *  Uses a huge predefined BOW (the first in the list) and train the requested number of positive and
 *  negative tweets processed using it.
 */
function simpleBowTrain(test_size) {
	// transform a collection of tweets in a collection of boolean arrays
	var tweetsToVector = function(tweet_coll, destArray, bow) {
		$(tweet_coll).each( function(){ 
			var actualTweet = this.text.delinkify().removeUsers().removeHash().toLowerCase();
			var arr = actualTweet.toBOW();
			var res = bow.getPresence(arr);
			if (res.sum != 0){ 
				destArray.push(res.result);
			} 
		});	
	}
	
	/**
	 *  Fetches the requested tweets, converts them to vectors
	 *  according to the proper BOW and train the SVM.
	 */
	var smartFetch = function(keyword, array, max) {
		var coll = new TweetCollection();
		coll.fetch(keyword, max, "en", function(json){
			tweetsToVector(coll.tc, array, bow_args[1]);

			i++;
			if (i == 2) initializeSVM();
		});
	}

	var initializeSVM = function (){
		console.log("initializing SVM");
		var data = posVector.concat(negVector);
		var labels = new Array();
		for (var i = 0; i<posVector.length + negVector.length; i++){
			labels[i] = (i < posVector.length) ? 1 : -1;
		}
		var svm = new svmjs.SVM();
		svm.train(data, labels, {C: 1.0});

		console.log(JSON.stringify(svm.toJSON()));
	}
	
	posVector = new Array();
	negVector = new Array();
	var i = 0; // utility flag -- TODO change this to something more smart
	
	smartFetch(":) OR :D OR :-) OR (: OR (-:", posVector, test_size);
	smartFetch(":( OR ): OR :-( OR )-:", negVector, test_size);
}

/**
 *  Retrieves the requested number of tweets, calculates the most relevant words
 *  summing up the overall occurrences (summing both from negative and positive).
 *  Created a BOW usign the 200 most relevant words and train the SVM with tweets 
 *  processed using this bag.
 */
function recurrenceTrain(test_size, bow_size) {
	var tweetsToWordsCount = function(tweet_coll, destArray) {
		$(tweet_coll).each( function(){

			var actualTweet = this.text.delinkify().removeUsers().toLowerCase();
			destArray.push(actualTweet);

			var arr = actualTweet.toBOW();
			for ( var i =0; i<arr.length; i++) {
				var token = arr[i];
				if (token.length > 1) {
					if (words[token] == undefined) { words[token] = 1; }
					else  words[token]++;
				}
			}
		});	
	}

	var exec = false;
	this.smartFetch = function(keyword, destArray, max) {
		var coll = new TweetCollection();
		coll.fetch(keyword, max, "en", function(json){
			tweetsToWordsCount(coll.tc, destArray);
			if (!exec){ exec = true;}
			else if (exec) {
				console.log("gone");
				trainSVM();
			}

		});
	}

	this.trainSVM = function () {
		// sort words
		var sortable = [];
		for (token in words) {
			if (words.hasOwnProperty(token)){
				sortable.push([token, words[token]]);
			}
		}
		sortable.sort( function (a, b) {
			return b[1] - a[1];
		});

		var newBOW = [];
		// only take the top words
		for (var i=0; i<bow_size; i++) {
			newBOW.push(sortable[i][0]);
		}

		var svm = new svmjs.SVM();
		labels = [];
		vectors = [];
		var j = 0;

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
		console.log(JSON.stringify(newBOW));
	}

	var words = new Array();
	posTweets = new Array();
	negTweets = new Array();

	smartFetch(":) OR :D OR :-) OR (: OR (-:", posTweets, test_size);
	smartFetch(":( OR ): OR :-( OR )-:", negTweets, test_size);
}


function advancedRecurrenceTrain(test_size, bow_size) {

	var tweetsToWordsCount = function(tweet_coll, destArray, countDest) {
		$(tweet_coll).each( function(){ // for each tweet 
			var actualTweet = this.text.delinkify().removeUsers().toLowerCase();
			var arr = actualTweet.toBOW();
			destArray.push(actualTweet);

			// upgrade counter for each word
			for (var i =0; i<arr.length; i++) {
				var token = arr[i];
				if (token.length > 1) {
					if (typeof countDest[token] === 'undefined') { countDest[token] = 1; }
					else { countDest[token]++; }
				}
			}
		});	
	}

	// TODO change 'exec' switch to something more smart
	var exec = false;
	var smartFetch = function(keyword, destArray, countDest, max) {
		var coll = new TweetCollection();
		coll.fetch(keyword, max, "en", function(){
			tweetsToWordsCount(coll.tc, destArray, countDest);

			if (!exec){ exec = true;}
			else if (exec) {
				mergeArrays();
				initSVM();
			}
		});
	}

	var initSVM = function () {
		var sortable = [];

		for (token in final_words) {
			if (final_words.hasOwnProperty(token)){
				sortable.push([token, final_words[token]]);
			}
		}
		sortable.sort( function (a, b) {
			return b[1] - a[1];
		});

		var newBOW = [];
		for (var i=0; i<bow_size; i++) {
			newBOW.push(sortable[i][0]);
			//console.log(sortable[i][1] + " " + sortable[i][0]);
		}

		var svm = new svmjs.SVM();
		var labels = [];
		var vectors = [];
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
		console.log(JSON.stringify(newBOW));
		console.log(JSON.stringify(final_words));
	}

	this.mergeArrays = function() {
		final_words = {};
		for (elem in pos_words) {
			if (pos_words.hasOwnProperty(elem));
			final_words[elem] = pos_words[elem];
		}

		for (elem in neg_words) {
			if (neg_words.hasOwnProperty(elem)){
				if (final_words.hasOwnProperty(elem)){
					if ((final_words[elem] >= neg_words[elem] && final_words[elem]/10 < neg_words[elem]) || (final_words[elem] < neg_words[elem] && neg_words[elem]/10 < final_words[elem])){
						delete final_words[elem];
					}
					else final_words[elem] += neg_words[elem];
				}
				else final_words[elem] = neg_words[elem];
			}
		}
	}

	var final_words = {};
	var pos_words = {};
	var neg_words = {};

	var posTweets = [];
	var negTweets = [];

	smartFetch(":) OR :D OR :-) OR (: OR (-:", posTweets, pos_words, test_size);
	smartFetch(":( OR ): OR :-( OR )-:", negTweets, neg_words, test_size);

}