//various methods for training the SVM

function simpleBowTrain() {
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
		var coll = new TweetCollection();
		coll.fetch(keyword, 100, "en", function(json){
			tweetsToVector(json, array);

			i++;
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


function recurrenceTrain() {
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


function advancedRecurrenceTrain() {

	this.tweetsToWordsCount = function(tweet_coll, destArray, countDest) {
		$(tweet_coll).each( function(){ 

			var actualTweet = this.text.delinkify().removeUsers().toLowerCase();
			destArray.push(actualTweet);
			var arr = actualTweet.toBOW();

			for ( var i =0; i<arr.length; i++) {
				var token = arr[i];

				if (token.length > 1) {
					if (typeof countDest[token] === 'undefined') { countDest[token] = 1; }
					else { countDest[token]++; }
				}
			}
		});	
	}

	exec = false;
	this.smartFetch = function(keyword, destArray, countDest, max) {
		var coll = new TweetCollection();
		coll.fetch(keyword, max, "en", function(){
			console.log(coll.tc.length);
			tweetsToWordsCount(coll.tc, destArray, countDest);

			if (!exec){ exec = true;}
			else if (exec) {
				mergeArrays();
				initSVM();
			}

		});
	}

	this.initSVM = function () {
		var sortable = [];

		for (token in final_words) {
			if (final_words.hasOwnProperty(token)){
				sortable.push([token, final_words[token]]);
			}
		}
		sortable.sort( function (a, b) {
			return b[1] - a[1];
		});

		newBOW = [];
		// update here for bigger BOW
		for (var i=0; i<200; i++) {
			newBOW.push(sortable[i][0]);
			//console.log(sortable[i][1] + " " + sortable[i][0]);
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
						//console.log ("deleting __" +  elem + " " + final_words[elem] + " " + neg_words[elem]);
						delete final_words[elem];
					}
					else {
						//console.log ("increasing __" +  elem + " " + final_words[elem] + " " + neg_words[elem]);

						final_words[elem] += neg_words[elem];
						
					}
				}
				else {
					//console.log ("adding __" +  elem + " " + final_words[elem] + " " + neg_words[elem]);

					final_words[elem] = neg_words[elem];
				}

			}
		}
	}

	final_words = {};
	pos_words = {};
	neg_words = {};

	posTweets = [];
	negTweets = [];

	smartFetch(":) OR :D OR :-) OR (: OR (-:", posTweets, pos_words, 1000);
	smartFetch(":( OR ): OR :-( OR )-:", negTweets, neg_words, 1000);
	
}