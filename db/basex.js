var util = require("../util.js");
var async = require('async');
var basex = require('simple-basex');
var _db = new basex.Session({
	host : 'localhost',
	port : 1984,
	username : 'admin',
	password : 'admin'
});

var db = module.exports = function db() {
	
};

db.query = function(func, args, col, one, callback) {
	var start = new Date();
	function str(arg) {
		if (typeof arg !== 'string') {
			return arg;
		} else {
			if (arg[0] === '<' && arg.slice(-1) === '>') {
				return arg;
			} else {
				return "'" + arg + "'";
			}
		}
	}
	if (typeof args === 'function' && typeof callback === 'undefined') {
		callback = args;
		args = null;
	}

	var query = "import module namespace cost = 'cost'; cost:" + func + "(";

	var params = "";
	if (typeof args === 'undefined' || args === null) {

	} else if (typeof args === 'object') {
		var vs = [];
		Object.keys(args).forEach(function(k) {
			vs.push(str(args[k]));
		});
		params = vs.join(',');
	} else {
		params = str(args);
	}

	query = query + params + ")";

	_db.query(query, function(err, qresult) {
		if (err)
			console.dir(err);

		var result = {};
		try {
			result = util.xml2json(qresult);
		} catch (e) {
			console.log(query);
			console.log(qresult);
		}

		var key = Object.keys(result)[0];
		var data = result[key];

		if (col) {
			if (data[col]) {
				data = one ? data[col] : [].concat(data[col]);
			} else {
				data = one ? null : [];
			}
		} else {
			data = one ? data : [].concat(data);
		}
		util.dbstats.finish(start, func);
		// console.dir(query); //console.log(data);
		callback && callback(err, data);
	});
}

db.createCostFile = function(data, callback) {
	this.query('createFile', 0, null, true, callback);
}

db.getCost = function(file, id, callback) {
	this.query('getCost', [ file, id ], null, true, callback);
}

db.insertCost = function(file, data, parentId, callback) {
	parentId = parentId || '';
	this.query('insertCost', [ file, util.json2xml({
		cost : data
	}), parentId ], null, true, callback);
}

db.deleteCost = function(file, costId, callback) {
	this.query('deleteCost', [ file, costId ], null, true, callback);
}

db.setCostProperty = function(file, id, prop, value, callback) {
	this.query('setCostProperty', [ file, id, prop, value ], null, true,
			callback);
}

db.deleteCostProperty = function(file, id, prop, callback) {
	this.query('deleteCostProperty', [ file, id, prop ], null, true, callback);
}

db.feesToFlushOnCostCreate = function(costData, callback) {
	var file = costData.file;
	var costId = costData.id;
	var type = costData.type;
	this.query('feesToFlushOnCostCreate', [ file, costId, type ], 'fee', false,
			callback);
}

db.feesToFlushOnCostUpdate = function(costData, key, callback) {
	var file = costData.file;
	var costId = costData.id;
	var type = costData.type;
	this.query('feesToFlushOnCostUpdate', [ file, costId, type, key ], 'fee',
			false, callback);
}

db.feesToFlushOnCostDelete = function(costData, callback) {
	var file = costData.file;
	var costId = costData.id;
	var type = costData.type;
	this.query('feesToFlushOnCostDelete', [ file, costId, type ], 'fee', false,
			callback);
}

db.getFee = function(file, id, callback) {
	this.query('getFee', [ file, id ], null, true, callback);
}

db.createFee = function(file, data, costData, parentId, callback) {
	parentId = parentId || '';
	var costId = costData.id;
	var costType = costData.type;
	this.query('createFee', [ file, util.json2xml({
		fees : {
			fee : data
		}
	}), costId, costType, parentId ], null, true, callback);
}

db.setFeeProperty = function(file, id, prop, value, callback) {
	this.query('setFeeProperty', [ file, id, prop, value ], null, true,
			callback);
}

db.deleteFeeProperty = function(file, id, prop, callback) {
	this.query('deleteFeeProperty', [ file, id, prop ], null, true, callback);
}

db.deleteFee = function(file, id, callback) {
	this.query('deleteFee', [ file, id ], null, true, callback);
}

db.setFeeResult = function(file, id, feeResult, callback) {
	this.query('setFeeResult', [ file, id, feeResult ], null, true, callback);
}

db.feesAdj = function(file, ids, callback) {
	this._feesAdj(file, ids, {}, callback);
}

db._feesAdj = function(file, ids, adj, callback) {
	var me = this;
	me.query('feesAdj', [ file, util.json2xml({
		ids : {
			id : ids
		}
	}) ], 'adj', false, function(err, data) {
		async.concat(data, function(r, cb) {
			var id = r.id;
			var tos = r.refTo ? [].concat(r.refTo) : [];
			adj[id] = adj[id] ? adj[id].concat(tos) : tos;
			cb(null, r.refFrom ? r.refFrom : []);
		}, function(err, froms) {
			if (froms.length > 0) {
				me._feesAdj(file, froms, adj, callback);
			} else {
				callback(err, adj);
			}
		});
	});
}

db.feesToFlushOnFeeCreate = function(feeData, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	var type = feeData.CostType;
	var feeName = feeData.feeName;
	this.query('feesToFlushOnFeeCreate', [ file, costId, type, feeName ],
			'fee', false, callback);
}

db.createRefsTo = function(feeData, toIds, callback) {
	var file = feeData.file;
	var id = feeData.id;
	if (toIds.length == 0)
		return callback(null, null);
	this.query('createRefsTo', [ file, id, util.json2xml({
		ids : {
			id : toIds
		}
	}) ], null, true, callback);
}

db.removeRefsTo = function(feeData, toIds, callback) {
	var file = feeData.file;
	var id = feeData.id;
	if (toIds.length == 0)
		return callback(null, null);
	this.query('removeRefsTo', [ file, id, util.json2xml({
		ids : {
			id : toIds
		}
	}) ], null, true, callback);
}

db.feeRefedToIds = function(feeData, callback) {
	var file = feeData.file;
	var id = feeData.id;
	this.query('feeRefedToIds', [ file, id ], 'refTo', false, callback);
}
// ///////////////////////////////////////////////////////////////////
function _cb(err, data, getId, callback) {
	var values = data.map(function(e) {
		return getId ? e.id : e.value;
	});
	callback(err, values);
};

db._C = function(feeData, prop, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_C', [ file, costId, prop ], 'result', false, function(err,
			data) {
		_cb(err, data, getId, callback);
	});
}

db._CF = function(feeData, feeName, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CF', [ file, costId, feeName ], 'result', false, function(err,
			data) {
		_cb(err, data, getId, callback);
	});
}

db._CC = function(feeData, type, prop, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CC', [ file, costId, type, prop ], 'result', false, function(
			err, data) {
		_cb(err, data, getId, callback);
	});
}

db._CCF = function(feeData, type, feeName, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CCF', [ file, costId, type, feeName ], 'result', false,
			function(err, data) {
				_cb(err, data, getId, callback);
			});
}

db._CS = function(feeData, prop, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CS', [ file, costId, prop ], 'result', false, function(err,
			data) {
		_cb(err, data, getId, callback);
	});
}

db._CSF = function(feeData, feeName, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CSF', [ file, costId, feeName ], 'result', false, function(
			err, data) {
		_cb(err, data, getId, callback);
	});
}

db._CAS = function(feeData, prop, getId, callback) {
	var file = feeData.file;
	var costId = feeData.costId;
	this.query('_CAS', [ file, costId, prop ], 'result', false, function(err,
			data) {
		_cb(err, data, getId, callback);
	});
}