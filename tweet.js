module.exports = {
	postTweet: function (content) {
		var Twit = require('twit');
		var twitterInfo = require('./config.js');
		var T = new Twit(twitterInfo);

		T.post('statuses/update', { status: content }, function(err, data, response) {
		});
	}
}