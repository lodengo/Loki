var async = require('async');
var Server = require('mongodb').Server, Db = require('mongodb').Db, ObjectID = require('mongodb').ObjectID, ReplSetServers = require('mongodb').ReplSetServers, MongoClient = require('mongodb').MongoClient

var poolModule = require('generic-pool');
var dbPool = poolModule.Pool({
	name : 'dbs',
	create : function(callback) {
		MongoClient.connect('mongodb://127.0.0.1:27017/cost', {
			server : {
				poolSize : 1
			}
		}, callback);
	},
	destroy : function(db) {
		db.close();
	},
	max : 1024
});

var db = module.exports = function db() {

};

db.createCostFile = function(data, callback) {
	var file = '';
	callback(null, file);
}

db.getCost = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').findOne({
			_id : new ObjectID(id)
		}, {fields:{idPath:-1, refFrom:-1}}, function(err, doc) {
			dbPool.release(_db);
			callback(err, doc);
		});
	});
}

db.insertCost = function(file, data, parentId, callback) {
	var me = this;
	data.nodeType = 'cost';
	data.file = file;
	data._id = data.id = new ObjectID();
	data.refFrom = [];

	dbPool.acquire(function(err, _db) {
		if (parentId) {
			data.parentId = parentId;
			me.getCost(file, parentId, function(err, parent) {
				data.idPath = parent.idPath.push(parentId);
				_db.collection('cost').insert(data, {}, function(err, doc) {
					dbPool.release(_db);
					callback(err, doc[0]);
				});
			});
		} else {
			data.parentId = null;
			data.idPath = [];
			_db.collection('cost').insert(data, {}, function(err, doc) {
				dbPool.release(_db);
				callback(err, doc[0]);
			});
		}
	});
}

db.deleteCost = function(file, costId, callback) {
	dbPool.acquire(function(err, _db) {
		var selector = {
			$or : [ {
				_id : new ObjectID(costId)
			}, {
				nodeType : 'cost',
				idPath : {
					$all : [ costId ]
				}
			}, {
				nodeType : 'fee',
				$or : [ {
					costId : costId
				}, {
					costIdPath : {
						$all : [ costId ]
					}
				} ]
			} ]
		};
		_db.collection('cost').remove(selector, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.setCostProperty = function(file, id, prop, value, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : new ObjectID(id)
		}, {
			$set : {
				prop : value
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.deleteCostProperty = function(file, id, prop, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : new ObjectID(id)
		}, {
			$unset : {
				prop : ''
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.feesToFlushOnCostCreate = function(file, costId, type, callback) {

}

db.feesToFlushOnCostUpdate = function(file, costId, type, key, callback) {

}

db.feesToFlushOnCostDelete = function(file, costId, type, callback) {

}

db.getFee = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').findOne({
			_id : new ObjectID(id)
		}, {fields:{idPath:-1, costIdPath:-1, refTo:-1, refFrom:-1}}, function(err, doc) {
			dbPool.release(_db);
			callback(err, doc);
		});
	});
}

db.createFee = function(file, data, costId, costType, parentId, callback) {

}

db.setFeeProperty = function(file, id, prop, value, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : new ObjectID(id)
		}, {
			$set : {
				prop : value
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.deleteFeeProperty = function(file, id, prop, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : new ObjectID(id)
		}, {
			$unset : {
				prop : ''
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.deleteFee = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').remove({
			$or : [ {
				_id : new ObjectID(id)
			}, {
				idPath : {
					$all : [ id ]
				}
			} ]
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.setFeeResult = function(file, id, feeResult, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : new ObjectID(id)
		}, {
			$set : {
				feeResult : feeResult
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			callback(err, data);
		});
	});
}

db.feesAdj = function(file, ids, callback) {

}

db.feesToFlushOnFeeCreate = function(file, costId, type, feeName, callback) {

}

db.createRefsTo = function(file, id, toIds, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({_id:new ObjectID(id)}, {$addToSet: {refTo: {$each: toIds}}}, {}, function(err, data){
			_db.collection('cost').findAndModify({_id: {$in: toIds}}, [], {$addToSet:{refFrom: id}}, {}, function(err, data){
				dbPool.release(_db);
				callback(err, data.refTo);
			});
		});
	});
}

db.removeRefsTo = function(file, id, toIds, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({_id:new ObjectID(id)}, {$pullAll: {refTo: {$each: toIds}}}, {}, function(err, data){
			_db.collection('cost').findAndModify({_id: {$in: toIds}}, [], {$pull:{refFrom: id}}, {}, function(err, data){
				dbPool.release(_db);
				callback(err, data.refTo);
			});
		});
	});
}

db.feeRefedToIds = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({_id:new ObjectID(id)}, {fields:{refTo:1}}, function(err, data){
			dbPool.release(_db);
			callback(err, data.refTo);
		});
	});
}
// ///////////////////////////////////////////////////////////////////
db._C = function(file, costId, prop, getId, callback) {

}

db._CF = function(file, costId, feeName, getId, callback) {

}

db._CC = function(file, costId, type, prop, getId, callback) {

}

db._CCF = function(file, costId, type, feeName, getId, callback) {

}

db._CS = function(file, costId, prop, getId, callback) {

}

db._CSF = function(file, costId, feeName, getId, callback) {

}

db._CAS = function(file, costId, prop, getId, callback) {

}