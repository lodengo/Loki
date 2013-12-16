var async = require('async');
var Fee = require("./fee.js");
var db = require("./db.js");

var Cost = module.exports = function Cost(_data) {
	this._data = _data;
}

Object.defineProperty(Cost.prototype, 'id', {
	get : function() {
		return this._data.id;
	}
});

Object.defineProperty(Cost.prototype, 'type', {
	get : function() {
		return this._data.type;
	}
});

Object.defineProperty(Cost.prototype, 'file', {
	get : function() {
		return this._data.file;
	}
});

Cost.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostCreate(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
	});
}

Cost.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostUpdate(me._data, key, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
	});
}

Cost.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostDelete(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
	});
}

Cost.prototype.update = function(prop, value, callback){
	var me = this;
	var id = me.id;
	var file = me.file;
		
	var hasProp = this._data.hasOwnProperty(prop);
	var valueNotNull = (value !== undefined) && (value !== null);
	
	if(hasProp && value == me._data[prop]){
		return callback(null, 0);
	}else{
		if(hasProp && !valueNotNull){ 
			db.deleteCostProperty(file, id, prop, callback);
		}
		else if(valueNotNull){ 
			if( (!hasProp) || (value != me._data[prop]) ){
				db.setCostProperty(file, id, prop, value, callback);
			}
		}
	}	
};

Cost.prototype.del = function(callback){
	var me = this;
	var costId = me.id;
	var file = me.file;
	db.deleteCost(file, costId, callback);
}

Cost.prototype.createFee = function(data, feeParentId, callback){
	var me = this;
	var costId = me.id
	var costType = me.type;
	var file = me.file;
	Fee.create(file, data, me._data, feeParentId, function(err, nfee){
		callback(err, new Fee(nfee));
	});
}

Cost.get = function(file, id, callback){
	db.getCost(file, id, function(err, ncost){
		callback(err, new Cost(ncost));
	});	
};

Cost.create = function(file, data, parentId, callback){
	db.insertCost(file, data, parentId, function(err, ncost){
		callback(err, new Cost(ncost));
	});	
};

Cost.createFile = function(data, callback){
	db.createCostFile(data, callback);
}





