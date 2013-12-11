var basex = require('simple-basex');
var _db = new basex.Session({
	host : 'localhost',
	port : 1984,
	username : 'admin',
	password : 'admin'
});

var db = module.exports = function db() {
	
};

db.query = function(func, args, callback) {
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
	
	_db.query(query, function(err, result) {
		if (err)
			console.dir(err);	
		var result = util.xml2json(result); 
		var key = Object.keys(result)[0];
		var data = result[key];
		//console.dir(query);		console.log(data);
		callback && callback(err, data);
	});
}

db.createCostFile = function(data, callback){
	
}

db.getCost = function(file, id, callback){
	
}

db.insertCost = function(file, data, parentId, callback){
	
}

db.deleteCost = function(file, costId, callback){
	
}

db.setCostProperty = function(file, id, prop, value, callback){
	
}

db.deleteCostProperty = function(file, id, prop, callback){
	
}

db.feesToFlushOnCostCreate = function(file, costId, type, callback){
	
}

db.feesToFlushOnCostUpdate = function(file, costId, type, key, callback){
	
}

db.feesToFlushOnCostDelete = function(file, costId, type, callback){
	
}

db.getFee = function(file, id, callback){
	
}

db.createFee = function(file, data, costId, costType, parentId, callback){
	
}

db.setFeeProperty = function(file, id, prop, value, callback){
	
}

db.deleteFeeProperty = function(file, id, prop, callback){
	
}

db.deleteFee = function(file, id, callback){
	
}

db.setFeeResult = function(file, id, feeResult, callback){
	
}

db.feesAdj = function(file, ids, callback){
	
}

db.feesToFlushOnFeeCreate = function(file, costId, type, feeName, callback){
	
}

db.createRefsTo = function(file, id, toIds, callback){
	
}

db.removeRefsTo = function(file, id, toIds, callback){
	
}

db.feeRefedToIds = function(file, id, callback){
	
}
/////////////////////////////////////////////////////////////////////
function _cb(err, data, getId, callback){
	var result = data.result ? [].concat(data.result) : [];
	var values = result.map(function(e) {
		return getId? e.id : e.value;
	});		
	callback(err, values);
};

db._C = function(file, costId, prop, getId, callback){
	this._exec('_C', [file, costId, prop], function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CF = function(file, costId, feeName, getId, callback) {
	this._exec('_CF', [file, costId, feeName], function(err, data){	
		_cb(err, data, getId, callback);
	});
}


db._CC = function(file, costId, type, prop, getId, callback) {
	this._exec('_CC', [file, costId, type, prop], function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CCF = function(file, costId, type, feeName, getId, callback) {
	this._exec('_CCF', [file, costId, type, feeName], function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CS = function(file, costId, prop, getId, callback) {
	this._exec('_CS', [file, costId, prop], function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CSF = function(file, costId, feeName, getId, callback) {
	this._exec('_CSF', [file, costId, feeName], function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CAS = function(file, costId, prop, getId, callback) {
	this._exec('_CAS', [file, costId, prop], function(err, data){
		_cb(err, data, getId, callback);
	});
}