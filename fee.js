var async = require('async');
var Ref = require("./ref.js");
var db = require("./db.js");

var Fee = module.exports = function Fee(_node) {
	this._node = _node;
}

Object.defineProperty(Fee.prototype, 'file', {
	get : function() {
		return this._node.file;
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._node.costId;
	}
});

Object.defineProperty(Fee.prototype, 'costType', {
	get : function() {
		return this._node.costType;
	}
});

Object.defineProperty(Fee.prototype, 'id', {
	get : function() {
		return this._node.id;
	}
});

Object.defineProperty(Fee.prototype, 'feeName', {
	get : function() {
		return this._node.feeName;
	}
});

Object.defineProperty(Fee.prototype, 'feeExpr', {
	get : function() {
		return this._node.feeExpr+"";
	}
});

Object.defineProperty(Fee.prototype, 'feeResult', {
	get : function() {
		return this._node.feeResult;
	},
	set: function (result) {
		this._node.feeResult = result;
	}
});

Fee.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;
	var costId = me.costId;
	var type = me.costType;
	var feeName = me.feeName;
	var file = me.file;
	db.feesToFlushOnFeeCreate(file, costId, type, feeName, function(err, nfees){
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
	var id = this.id;
	var file = this.file;
	db.createRefsTo(file, id, toIds, callback);
}

Fee.prototype.removeRefsTo = function(toIds, callback) {
	var id = this.id;
	var file = this.file;
	db.removeRefsTo(file, id, toIds, callback);
}

Fee.prototype.refedToIds = function(callback) {
	var id = this.id;
	var file = this.file;
	db.feeRefedToIds(file, id, callback);
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
	var hasProp = me._node.hasOwnProperty(property);
	var valueNotNull = (value !== undefined) && (value !== null);

	if (hasProp && value == me._node[prop]) {
		return callback(null, 0);
	} else {
		if (hasProp && !valueNotNull) { 
			db.deleteFeeProperty(file, id, prop, callback);
		} else if (valueNotNull) { 
			if ((!hasProp) || (value != me._node[prop])) {
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

Fee.create = function(file, data, costId, costType, parentId, callback) {
	db.createFee(file, data, costId, costType, parentId, callback);
}
