*Check out the original walkthrough [here](http://bughunting.guide/building-bughuntbot-an-xss-payload-twitterbot-inspired-by-peter-kim/).[This post](http://bughunting.guide/a-gentle-introduction-to-cross-site-scripting-xss/) will walk you through the basics of XSS.*

If read a lot of penetration testing literature, you've probably come across Peter Kim's pentesting walkthrough, [The Hacker's Playbook: A Practical Guide to Penetration Testing](http://www.amazon.com/The-Hacker-Playbook-Practical-Penetration/dp/1494932636).

In the book, Peter (Mr. Kim) discusses a short script he uses to scrape XSS payloads from r/xss, a subreddit devoted to publishing and discussing XSS vulnerabilities. Here's the script, for reference.

````
#!/usr/bin/env python
#Reddit XSS
#Author: Cheetz
import urllib2, sys
import logging, os, re, sys, urllib, string
from optparse import OptionParser
from urlparse import urlparse
 
class Lookup:
        def run(self,url):
                request = urllib2.Request(url)
                request.add_header('User-Agent', 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.7) Gecko/20091221 Firefox/3.5.7 (.NET CLR 3.5.30729)')
                response = urllib2.urlopen(request)
                resolve_response = response.read()
                self.regex(resolve_response)
                #print resolve_response
        def regex(self,resolve_response):
                file = open("output_xss.txt", 'a')
                n = re.compile(r'href=\"http.*?>', re.IGNORECASE)
                result = n.findall(resolve_response)
                for a in result:
                        
                        if ("reddit" not in a):
                                remove_string = 'href="'
                                a = a.replace(remove_string,"")
                                b = a.split('"')
                                a = b[0]
                                file.write(a.replace(remove_string,""))
                                file.write('\n')
 
                p = re.compile(r'count=(\d+)&amp;after=(.*?)\"', re.IGNORECASE)
                link = p.findall(resolve_response)
                next_string = "http://www.reddit.com/r/xss/?count="+link[0][0]+"&after="+link[0][1]
                file.close()
                self.run(next_string)
 
 
if __name__ == '__main__':
        url = "http://www.reddit.com/r/xss"
        app = Lookup()
        app.run(url)
```

And here's a snippet of what the script outputs if you run it &mdash; a pretty substantial list of XSS payloads downloaded to a file named `output_xss.txt`.

````
http://h30499.www3.hp.com/t5/Fortify-Application-Security/XSS-and-App-Security-through-HTML5-s-PostMessage/ba-p/6515002
http://nahamsec.com/2014/05/single-vulnerability-to-cause-stored-xss-in-yahoo-flickr-google-twitter-amazon-youtube/
http://h30499.www3.hp.com/t5/Fortify-Application-Security/XSS-Beyond-the-Alert-Box/ba-p/6491366
http://john.com/login.php?id=%27;alert%28String.fromCharCode%2871,117,105,100,111,90,32,88,83,83%29%29//\%27;alert%28String.fromCharCode%2871,117,105,100,111,90,32,88,83,83%29%29//%22;alert%28String.fromCharCode%2871,117,105,100,111,90,32,88,83,83%29%29//\%22;alert%28String.fromCharCode%2871,117,105,100,111,90,32,88,83,83%29%29//--%3E%3C/SCRIPT%3E%22%3E%27%3E%3CSCRIPT%3Ealert%28String.fromCharCode%2871,117,105,100,111,90,32,88,83,83%29%29%3C/SCRIPT%3E
http://www.usatoday.com/story/tech/2014/05/01/microsoft-issues-internet-explorer-security-fix/8562737/
```

It's a neat tool (though one that, as you can see, produces some noise in the form of perfectly valid links). If you're scratching you're head, wondering why a bunch of XSS payloads might be useful, there a couple reasons.

1. XSS payloads can be incorporated into open-source scanners, increasing their ability to effectively mimic malicious attacks.
2. A general understanding of common XSS filter bypasses can inform better web application security architecture and data sanitation processes (e.g. OWASP's [XSS Filter Evasion Cheat Sheet](https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet)) 

But both of those really boil down to the same fundamental truth: When security researchers share techniques, tools, and payloads, they can better perform the difficult tests they need to in order to ensure critical web applications are secure and the web as a whole prospers. Open source web securiy in general is one of the most promising ways forward for keeping the Internet an open, secure, and distributed system.

So with all of that in mind, I've decided on a fun project &mdash; spreading the Peter Kim gospel through the evangelism of Twitterbots!

## Building the Bot

Twitterbots come in a variety of different flavors and languages, but as an unapologetic javascripter and lapsed rubyist, [Nodejs](http://nodejs.org/) seems the best option for our purposes.

If you haven't had the pleasure of using npm, the node packager manager, it's a welcome addition to a modular world already pioneered by Ruby's gems and Linux's `apt-get`. And thanks to the current status of nodejs, there's a package for just about everything under the sun, including (very unsurprisingly) the Twitter API.

But since the Twitter API is very straightforward and will represent one of the easier parts of this application, let's start with something theoretically less direct &mdash; pulling the contents of Mr. Kim's scraping.

There are several ways to go about doing this. We could translate Big Daddy K's Python script into a javascript framework tailor made for scraping ([Phantomjs](http://phantomjs.org/) or its extension [Casperjs](http://casperjs.org/)). Phantom and casper aren't actually node modules per se, but rather seperate repos that also use the npm system. You can *also* try to make all these things jive together with a library known as [Spookyjs](https://github.com/WaterfallEngineering/SpookyJS), but that requires tracking data and logic through three seperate javascript scopes and other weird workarounds. A task that is &mdash; technically speaking &mdash; **super hard**. 

I'm a good programmer, by which I mean I'm an *incredibly lazy* human being. I tap into this otherwise-not-very-great quality to benefit software engineering and society as a whole. In this instance, that laziness is telling me that there's a simple solution staring me straight in the face &mdash; incorporating K Diddy's script itself.

It turns out that node has an incredibly simple solution for running python scripts called `python-shell`. After installing it via `npm install --save python-shell` and putting our script under a `python` directory, where the package expects to find it, it only takes a quick glance through the documentation to discover the snippet to do what we want.

````javascript
var PythonShell = require('python-shell');

// run a simple script
PythonShell.run('reddit.py', function (err, results) {
  // script finished
  console.log(err);
  console.log("finished!")
});
```
There's a lot of support in `python-shell` for doing things like fiddling with the script's input and output via `stdin` and `stdout`, changing how the data is encoded and transmitted, etc, but again, I'm so *very tired*. Is there any solution for a hardworkin' bit-jockey like myself &mdash; one that doesn't require adding a persistent database layer or anything that will add an extra layer of complexity?

Actually, we already have a sort of database &mdash; the `output_xss.txt` file the `reddit.py` script creates and writes to every time it runs. If we can schedule when it runs, making sure the file is there before the Twitterbot attempts to draw from it, then we can just read and write directly from it. That sounds much more doable.

We already have the code to download the contents for and create the `output_xss.txt` file, courtesy of Special K, now we just need to read the file, tweet the contents, and schedule the whole mess.

Reading the file is simple with node's built in `fs` module. Looking through the node API documentation, we see this code will open our file and log its contents:

````javascript
fs.readFile('output_xss.txt', 'utf8', function (err, data) {
  if (err) throw err;
  console.log(data)
});
```
In our case, we don't want to log the data, we want to tweet it &mdash; in pieces. But baby steps!

First, let's split up the content based on the `\n` character, so we can add deal with the payloads line-by-line:

`xssPayloads = data.split("\n");`

Then we want to make sure we strip out all the undefined values, just in case the `split()` picks up some blank newlines:

````javascript
var goodPayloads = []; 

for (var index in xssPayloads) { 
  if( xssPayloads[index] ) { 
    goodPayloads.push(xssPayloads[index]); 
  } 
}  

xssPayloads = goodPayloads;
```
Now that we've got all good array values, we can display the last item with the following code:

````javascript
var payloadIndex = xssPayloads.length -1;
console.log(goodPayloads[payloadIndex]);
```

Pretty soon we'll start to add the code for actually tweeting this snippet, but for now, we'll just move on to deleting it, in order to make sure we don't push the same information twice. Luckily, it couldn't be easier. We'll just delete the last item in the array, and rewrite the `output_xss.txt` file.

The first part is crazy easy. Removing the last item in an array looks like this:

`xssPayloads.pop();`

For rewriting the modified array to `output_xss.txt`, we'll have to use `fs` module once again. Luckily, it's super simple. First we need to join all the xssPayloads array objects into a single string object we can write into the file. Still within your `fs.readFile()` callback, enter:

````javascript
joinedPayloads = "";

for (index in xssPayloads) {
  joinedPayloads +='\n' + xssPayloads[index];
}

fs.writeFile('output_xss.txt', joinedPayloads, function (err) {
  if (err) throw err;
});
```
Alright, only two more things left: We need to add the ability to tweet and the ability to schedule both tweeting and pulling scraping data!

Tweeting first. Node has several fantastic wrappers for the Twitter API, both RESTful and streaming. In this post we're going to use something I've had success with before, `twit`.

After installing `twit` with `npm install --save twit`, we're going to create a file called `tweet.js` and `config.js`. This where we're going to put our actual twitter logic and secret keys/tokens respectively. `config.js` will look like this:

````javascript
module.exports = {
    consumer_key:         '...'
  , consumer_secret:      '...'
  , access_token:         '...'
  , access_token_secret:  '...'
}
```

Adapting the API documentation for posting, here's the final picture of what the `tweet.js` file looks like:

````javascript
module.exports = {
    postTweet: function (content) {
        var Twit = require('twit');
        var twitterInfo = require('./config.js');
        var T = new Twit(twitterInfo);

        T.post('statuses/update', { status: content }, function(err, data, response) {
        });
    }
}
```

Commenting out everything but the code loading the `tweet.js` file and `Twitter.postTweet("Hello World");` we test it out and find it works. Hello BugHuntBot!

Now it's just a hop, skip and a jump to scheduling it and we're off the races! since we're hacking this quick and dirty (to start at least) the important thing for us is that the bot doesn't run out of links to tweet. With that in mind, let's shoot for the bot to post every hour and pull data every 24 hours. Good thing for us node (as ever) has the perfect module for that `node-schedule`.

`node-schedule` uses a very simple syntax to setting up recurring jobs. It's as simple as defining a rule object and passing that object to your schedule job function.

It also supports an object literal construction. This snippet will pull our data every Sunday at 10:30

````javascript
var j = schedule.scheduleJob({hour: 22, minute: 30, dayOfWeek: 0}, function(){
    PythonShell.run('reddit.py', function (err, results) {
    console.log(err);
    console.log("finished!")
    });
});
```
Once we write the code scheduling the `tweet.js` tweet, which also includes the `fs` code to pull and rewrite Mr. K's script, we're finished! There are some extra features we could (and will later) add for brownie points, but this is a perfectly respectful MVP for one evening's work.

## Running the Bot

With both our scheduled jobs set up (for pulling data and posting tweets), the only thing left to do is run the script. The best, fault-tolerant way of setting up a node script to run for a long time is `forever`, a node package easily installed in the usual way (though it's important to run it globally):

`sudo npm install -g forever`

Then all it takes is... `forever start index.js` and we're in business!

## Parting Thoughts.

In his book, Peter Kim warns users not to click on these links, because that could be construed as attacks on the site. I have to make the same statement here. However, I still think there is value in sharing (in a common medium) information that is vital to freelance security researchers. Users on the /r/xss subreddit are told explicitly in the forum and its rules to not post anything illegal or malicious and it is my hope that their restraint will preserve the utility of BugHuntBot as a research tool.

If you have questions or corrections, feel free to reach out to me at contact@bughunting.guide and of course, if you'd like a more general introduction to pentesting, check out my [book](https://leanpub.com/bughuntaquickstartguidetopenetrationtesting).

Thanks for reading and, as ever, happy hunting!