var async = require('async');
var Ref = require("./ref.js");
var db = require("./db.js");

var Fee = module.exports = function Fee(_data) {
	this._data = _data;
}

Object.defineProperty(Fee.prototype, 'file', {
	get : function() {
		return this._data.file;
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._data.costId;
	}
});

Object.defineProperty(Fee.prototype, 'costType', {
	get : function() {
		return this._data.costType;
	}
});

Object.defineProperty(Fee.prototype, 'id', {
	get : function() {
		return this._data.id;
	}
});

Object.defineProperty(Fee.prototype, 'feeName', {
	get : function() {
		return this._data.feeName;
	}
});

Object.defineProperty(Fee.prototype, 'feeExpr', {
	get : function() {
		return this._data.feeExpr+"";
	}
});

Object.defineProperty(Fee.prototype, 'feeResult', {
	get : function() {
		return this._data.feeResult;
	},
	set: function (result) {
		this._data.feeResult = result;
	}
});

Fee.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;	
	db.feesToFlushOnFeeCreate(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){cb(null, new Fee(nfee));}, callback);
	});
}

Fee.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	if (key != 'feeExpr') {
		var feeExpr = fee.feeExpr;
		var regex = 'f\\(' + key + '\\)';
		if (feeExpr.match(regex)) {
			callback(null, [me]);
		}else{
			callback(null, []);
		}
	} else {
		callback(null, [me]);
	}
}

Fee.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	me.feesToFlushOnCreate(callback);
}

Fee.prototype.createRefTo = function(toIds, callback) {
	var me = this;
	db.createRefsTo(me._data, toIds, callback);
}

Fee.prototype.removeRefsTo = function(toIds, callback) {
	var me = this;
	db.removeRefsTo(me._data, toIds, callback);
}

Fee.prototype.refedToIds = function(callback) {
	var me = this;
	db.feeRefedToIds(me._data, callback);
}

Fee.prototype.refToIdsByExpr = function(callback) {
	var me = this;
	var ref = new Ref(me);
	ref.refToIdsByExpr(function(err, nodes){
		callback(err, nodes);
	});
}

Fee.prototype.buildRef = function(callback) {
	var me = this;
	me.refedToIds(function(err, refedToIds) {
		me.refToIdsByExpr(function(err, refToIdsByExpr){	
			//console.log(['ref', me.costType, me.feeName, refedToIds, refToIdsByExpr]);			
			me.removeRefsTo(refedToIds.diff(refToIdsByExpr), function(err){
				me.createRefTo(refToIdsByExpr.diff(refedToIds), callback);
			});
		});	
	});
}

Fee.prototype.update = function(prop, value, callback) {
	var me = this;
	var id = me.id;
	var file = me.file;
	var hasProp = me._data.hasOwnProperty(property);
	var valueNotNull = (value !== undefined) && (value !== null);

	if (hasProp && value == me._data[prop]) {
		return callback(null, 0);
	} else {
		if (hasProp && !valueNotNull) { 
			db.deleteFeeProperty(file, id, prop, callback);
		} else if (valueNotNull) { 
			if ((!hasProp) || (value != me._data[prop])) {
				db.setFeeProperty(file, id, prop, value, callback);
			}
		}
	}
};

Fee.prototype.del = function(callback) {
	var me = this;
	var id = me.id;
	var file = me.file;
	db.deleteFee(file, id, callback);
}

Fee.get = function(file, id, callback) {
	db.getFee(file, id, function(err, nfee) {
		callback(err, new Fee(nfee))
	});
}

Fee.create = function(file, data, costData, parentId, callback) {
	db.createFee(file, data, costData, parentId, callback);
}
