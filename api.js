var async = require('async');
var Cost = require("./cost.js");
var Fee = require("./fee.js");
var Calc = require("./calc.js");
var Fees = require("./fees.js");

var Api = module.exports = function Api() {

}

// ////////////////////////////////////////////////////////
Api._flushFees = function(file, fees, callback) {
	async.map(fees, function(fee, cb) {
		fee.buildRef(function(err, res) {
			cb(err, fee.id);
		});
	}, function(err, ids) {
		Calc.start(file, ids, function(err, res) {
			callback(err);
		});
	});
}

Api.createCostFile = function(data, callback){
	Cost.createFile(data, callback);
}

Api.createCost = function(file, data, parentId, callback) {
	var me = this;
	var fees = Fees[data.type];
	Cost.create(file, data, parentId, function(err, cost) {
		async.each(fees, function(fee, cb) {
			cost.createFee(fee, null, cb);
		}, function(err) {
			cost.feesToFlushOnCreate(function(err, fees) {
				me._flushFees(file, fees, function(err, res) {
					callback(err, cost);
				});
			});
		});
	});
}

Api.updateCost = function(file, id, key, value, callback) {
	var me = this;
	Cost.get(file, id, function(err, cost) {
		cost.update(key, value, function(err, res) {
			cost.feesToFlushOnUpdate(key, value, function(err, fees) {
				me._flushFees(file, fees, callback);
			})
		})
	});
}

Api.deleteCost = function(file, id, callback) {
	var me = this;
	Cost.get(file, id, function(err, cost) {
		cost.feesToFlushOnDelete(function(err, fees) {
			cost.del(function(err, res) {
				me._flushFees(file, fees, callback);
			});
		});
	});
}

Api.createFee = function(file, data, costId, parentId, callback) {
	var me = this;
	Cost.get(file, id, function(err, cost) {
		cost.createFee(data, parentId, function(err, fee) {
			fee.feesToFlushOnCreate(function(err, fees) {				
				me._flushFees(file, fees, callback);
			});
		});
	});
}

Api.updateFee = function(file, id, key, value, callback) {
	Fee.get(file, id, function(err, fee) {
		fee.update(key, value, function(err, res) {
			fee.feesToFlushOnUpdate(key, value, function(err, fees) {				
				me._flushFees(file, fees, callback);
			});
		})
	});
}

Api.deleteFee = function(file, id, callback) {
	Fee.get(file, id, function(err, fee) {
		fee.feesToFlushOnDelete(function(err, fees) {
			fee.del(function(err, res) {
				me._flushFees(file, fees, callback);
			});
		});
	});
}
