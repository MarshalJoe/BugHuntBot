var PythonShell = require('python-shell');
var fs = require('fs');
var Twitter = require('./tweet.js');
var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(0, 6)];
rule.minute = 13;

var j = schedule.scheduleJob({hour: 22, minute: 30, dayOfWeek: 0}, function(){
    PythonShell.run('reddit.py', function (err, results) {
    console.log(err);
    console.log("finished!")
    });
});
 
var k = schedule.scheduleJob(rule, function(){
	fs.readFile('output_xss.txt', 'utf8', function (err, data) {
	  if (err) throw err;
	  xssPayloads = data.split("\n");
	 
	  // strip undefined values 
		var goodPayloads = []; 

		for (var index in xssPayloads) { 
		  if( xssPayloads[index] ) { 
		    goodPayloads.push(xssPayloads[index]); 
		  } 
		}  

		xssPayloads = goodPayloads;
		
		var payloadIndex = xssPayloads.length -1;
	  Twitter.postTweet(goodPayloads[payloadIndex]);
	  
	  // pop off the tweeted content
	  xssPayloads.pop();

	  joinedPayloads = "";

	  // rejoin the content
	  for (index in xssPayloads) {
	  	joinedPayloads +='\n' + xssPayloads[index];
	  }

	  fs.writeFile('output_xss.txt', joinedPayloads, function (err) {
	  	if (err) throw err;
		});
	});  

});

