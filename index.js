var nodeio = require('node.io');

var myJob = new nodeio.Job({
    input: false,
    run: function () {
        this.emit('Hello World!');
    }
});

nodeio.start(myJob)

