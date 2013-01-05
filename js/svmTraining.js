//various methods for training the SVM

function simpleBowTrain() {
	var posVector = new Array();
	var negVector = new Array();
	var i = 0;

	var tweetsToVector = function(tweet_coll, array) {
		$(tweet_coll).each( function(){ 
			var actualTweet = this.text.delinkify().removeUsers().removeHash().toLowerCase();
			var arr = actualTweet.toBOW();
			var res = BOW.getPresence(arr);
			if (res.sum != 0){ 
				array.push(res.result);
			} 
		});	
	}

	var recursiveFetch = function(keyword, array, max) {
		var coll = new TweetCollection();
		coll.fetch(keyword, max, "en", function(json){
			tweetsToVector(coll.tc, array);

			i++;
			if (i == 2) initializeSVM();
		});
	}

	recursiveFetch(":) OR :D OR :-) OR (: OR (-:", posVector, 2500);
	recursiveFetch(":( OR ): OR :-( OR )-:", negVector, 2500);

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
}


function recurrenceTrain() {
	this.tweetsToWordsCount = function(tweet_coll, destArray) {
		$(tweet_coll).each( function(){ 

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


function advancedRecurrenceTrain() {

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
		// update here for bigger BOW
		for (var i=0; i<200; i++) {
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
					if ((final_words[elem] >= neg_words[elem] && final_words[elem]/10 < neg_words[elem]) || (final_words[elem] < neg_words[elem] && neg_words[elem]/10 < final_words[elem]) ){
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

	smartFetch(":) OR :D OR :-) OR (: OR (-:", posTweets, pos_words, 1000);
	smartFetch(":( OR ): OR :-( OR )-:", negTweets, neg_words, 1000);

}