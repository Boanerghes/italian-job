String.prototype.linkify=function(){
    return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&;\?\/.=]+/g,function(m){
        return m.link(m);
    });
};

String.prototype.linkuser=function(){
    return this.replace(/[@]+[A-Za-z0-9-_]+/g,function(u){
        return u.link("http://twitter.com/"+u.replace("@",""));
    }); 
};

String.prototype.linktag=function(){
    return this.replace(/[]+[A-Za-z0-9-_]+/,function(t){
        return t;
    });
};

function fetch_tweets(elem){
    elem=$(elem);
    keyword=escape(elem.attr('title'));
    num=elem.attr('class').split(' ').slice(-1);
    var url="http://search.twitter.com/search.json?q="+keyword+"&rpp="+num+"&callback=?"+"&lang=it";
    $.getJSON(url,function(json){
        elem.html('');
        $(json.results).each(function(){
			var tweet='<div class="tweet"><div class="tweet-left"><a target="_blank" href="http://twitter.com/'+this.from_user+'"><img width="48" height="48" alt="'+this.from_user+' on Twitter" src="'+this.profile_image_url+'" /></a></div><div class="tweet-right"><p class="text">'+this.text.linkify().linkuser().linktag().replace(/<a/g,'<a target="_blank"')+'<br />'+'</p></div><br style="clear: both;" /></div>';            
			elem.append(tweet);
        });
    });
    return(false);
}
