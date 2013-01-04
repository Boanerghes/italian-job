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
	var toRet = this.match(/\w+/g);
	if (toRet == null)	return [];
	else return toRet;
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