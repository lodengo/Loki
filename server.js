var express = require('express'), http = require('http'), path = require('path');
var Api = require("./api.js");

var app = express();

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.cookieSession({
		secret : 'session_secret',
		cookie : {
			maxAge : 60 * 1000
		// 60sec
		}
	}));
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

var files = {};

function costParent(file, type) {
	var types = [ '整体工程', '单项工程', '单位工程', '分部分项', '清单', '定额', '工料机' ];
	if (type == types[0]) {
		return null;
	} else {
		var idx = types.indexOf(type);
		if (idx > 0) {
			var parentType = types[idx - 1];
			var parentId = files[file][parentType].random();
			return parentId;
		} else {
			return null;
		}
	}
}

app.post('/file', function(req, res) {
	Api.createCostFile({}, function(err, file) {
		files[file] = {
			'整体工程' : [],
			'单项工程' : [],
			'单位工程' : [],
			'分部分项' : [],
			'清单' : [],
			'定额' : [],
			'工料机' : []
		};
		res.cookie('file', file);
		console.log(['create file', file]);
		res.json({
			err : err,
			file : file
		});
	});
});

function createCost(data, req, res) {
	var file = req.cookies.file;
	var type = data.type
	var parentId = costParent(file, type);
	if (type == '工料机') {
		data.type = [ "人工", "材料", "机械" ].random();
	}
	
	Api.createCost(file, data, parentId, function(err, cost) {
		files[file][type].push(cost.id);
		var id = cost.id;
		console.log(['createcost', file, type, parentId, id]);
		res.json({
			err : err,
			id : id
		});
	});
}

app.post('/ztgc', function(req, res) {
	var data = {
		type : '整体工程'
	};
	createCost(data, req, res);
});

app.post('/dxgc', function(req, res) {
	var data = {
		type : '单项工程'
	};
	createCost(data, req, res);
});

app.post('/dwgc', function(req, res) {
	var data = {
		type : '单位工程'
	};
	createCost(data, req, res);
});

app.post('/fbfx', function(req, res) {
	var data = {
		type : '分部分项'
	};
	createCost(data, req, res);
});

app.post('/qd', function(req, res) {
	var data = {
		type : '清单',
		quantity : Math.random() * 1000
	};
	createCost(data, req, res);
});

app.post('/de', function(req, res) {
	var data = {
		type : '定额',
		quantity : Math.random() * 1000
	};
	createCost(data, req, res);
});

app.post('/glj', function(req, res) {
	var data = {
		type : '工料机',
		'price' : Math.random() * 100,
		'content' : Math.random()
	};
	createCost(data, req, res);
});

var server = http.createServer(app);
server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

// var cluster = require('cluster');
// var numCPUs = require('os').cpus().length;
//
// if (cluster.isMaster) {
// for (var i = 0; i < numCPUs; i++) {
// cluster.fork();
// }
// } else {
// server.listen(app.get('port'), function() {
// console.log("Express server listening on port " + app.get('port'));
// });
// }
