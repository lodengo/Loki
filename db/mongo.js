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
			_id : id
		}, {
			fields : {
				idPath : -1,
				refFrom : -1
			}
		}, function(err, doc) {
			dbPool.release(_db);
			callback(err, doc);
		});
	});
}

db.insertCost = function(file, data, parentId, callback) {
	var me = this;
	data.nodeType = 'cost';
	data.file = file;
	data._id = data.id = new ObjectID().toHexString();
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
				_id : costId
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
			_id : id
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
			_id : id
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

db.feesToFlushOnCostCreate = function(costData, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			$or : [ {
				costId : costId,
				nodeType : 'fee'
			}, {
				nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc.?\(" + type
				}
			}, {
				nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs.?\("
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			callback(err, docs);
		});
	});
}

db.feesToFlushOnCostUpdate = function(costData, key, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			$or : [ {
				costId : costId,
				nodeType : 'fee',
				feeExpr : {
					$regex : ".*cas\(" + key + "|c\(" + key
				}
			}, {
				nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc\(" + type + "," + key
				}
			}, {
				nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs\(" + key
				}
			}, {
				nodeType : 'fee',
				costIdPath : {
					$all : [ costId ]
				},
				feeExpr : {
					$regex : ".*cas\(" + key
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			callback(err, docs);
		});
	});
}

db.feesToFlushOnCostDelete = function(costData, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			$or : [ {
				nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc.?\(" + type
				}
			}, {
				nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs.?\("
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			callback(err, docs);
		});
	});
}

db.getFee = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').findOne({
			_id : id
		}, {}, function(err, doc) {
			dbPool.release(_db);
			callback(err, doc);
		});
	});
}

db.createFee = function(file, data, costData, parentId, callback) {
	var me = this; 
	var childFees = data.fee || [];
	delete data.fee;

	data.nodeType = 'fee';
	data.file = file;
	data.costId = costData.id;
	data.costParentId = costData.parentId;
	data.costIdPath = costData.idPath;
	data.costType = costData.type;
	data.refTo = [];
	data.refFrom = [];
	data._id = data.id = new ObjectID().toHexString();

	dbPool.acquire(function(err, _db) {
		if (parentId) {
			data.parentId = parentId;
			_db.collection('cost').findOne({
				_id : parentId
			}, {
				fields : {
					idPath : 1
				}
			}, function(err, parent) {console.log(['feeparent', parentId, parent]);
				data.idPath = parent.idPath.push(parentId); 
				_db.collection('cost').insert(data, {}, function(err, doc) {
					async.each(childFees, function(cfee, cb) {
						me.createFee(file, cfee, costData, doc[0].id, cb)
					}, function(err) {
						dbPool.release(_db);
						callback(err, doc[0]);
					});
				});
			});
		} else {
			data.parentId = null;
			data.idPath = [];
			_db.collection('cost').insert(data, {}, function(err, doc) {
				async.each(childFees, function(cfee, cb) {
					me.createFee(file, cfee, costData, doc[0].id, cb)
				}, function(err) {
					dbPool.release(_db);
					callback(err, doc[0]);
				});
			});
		}
	});
}

db.setFeeProperty = function(file, id, prop, value, callback) {
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : id
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
			_id : id
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
				_id : id
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
			_id : id
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
	this._feesAdj(file, ids, {}, callback);	
}

db._feesAdj = function(file, ids, adj, callback){
	var me = this;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({nodeType:'fee', id:{$in: ids}}, {}).toArray(function(err, docs) {
			async.concat(docs, function(r, cb){
				var id = r.id;
				var tos = r.refTo ? [].concat(r.refTo) : [];
				adj[id] = adj[id] ? adj[id].concat(tos) : tos;
				cb(null, r.refFrom? r.refFrom : []);
			}, function(err, froms){
				if(froms.length > 0){
					me._feesAdj(file, froms, adj, callback);
				}else{
					callback(err, adj);
				}
			});
		});
	});
}

db.feesToFlushOnFeeCreate = function(feeData, callback) {
	var me = this;
	var file = feeData.file;
	var costId = feeData.costId;
	var type = feeData.CostType;
	var feeName = feeData.feeName;
	var parentId = feeData.costParentId;

	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			$or : [ {
				nodeType : 'fee',
				costId : costId,
				feeExpr : {
					$regex : ".*cf\("+feeName
				}
			}, {
				nodeType : 'fee',
				costId: parentId,
				feeExpr : {
					$regex : ".*ccf\("+type+","+feeName
				}
			}, {
				nodeType : 'fee',
				costParentId:parentId,
				costId: {$ne: costId},
				feeExpr : {
					$regex : ".*csf\("+feeName
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			callback(err, docs);
		});
	});
}

db.createRefsTo = function(feeData, toIds, callback) {
	var id = feeData.id;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : id
		}, {
			$addToSet : {
				refTo : {
					$each : toIds
				}
			}
		}, {}, function(err, data) {
			_db.collection('cost').findAndModify({
				_id : {
					$in : toIds
				}
			}, [], {
				$addToSet : {
					refFrom : id
				}
			}, {}, function(err, data) {
				dbPool.release(_db);
				callback(err, data);
			});
		});
	});
}

db.removeRefsTo = function(feeData, toIds, callback) {
	var id = feeData.id;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').update({
			_id : id
		}, {
			$pullAll : {
				refTo : {
					$each : toIds
				}
			}
		}, {}, function(err, data) {
			_db.collection('cost').findAndModify({
				_id : {
					$in : toIds
				}
			}, [], {
				$pull : {
					refFrom : id
				}
			}, {}, function(err, data) {
				dbPool.release(_db);
				callback(err, data);
			});
		});
	});
}

db.feeRefedToIds = function(feeData, callback) {
	var id = feeData.id;
	// callback(null, feeData.refTo);
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').findOne({
			_id : id
		}, {
			fields : {
				refTo : 1
			}
		}, function(err, data) {
			dbPool.release(_db);
			callback(err, data.refTo);
		});
	});
}
// ///////////////////////////////////////////////////////////////////
db._C = function(feeData, prop, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			_id : costId
		}, {
			fields : {
				id : 1,
				prop : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			callback(err, values);
		});
	});
}

db._CF = function(feeData, feeName, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			nodeType : 'fee',
			costId : costId,
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			callback(err, values);
		});
	});
}

db._CC = function(feeData, type, prop, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			parentId : costId,
			type : type
		}, {
			fields : {
				id : 1,
				prop : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			callback(err, values);
		});
	});
}

db._CCF = function(feeData, type, feeName, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			costParentId : costId,
			costType : type,
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			callback(err, values);
		});
	});
}

db._CS = function(feeData, prop, getId, callback) {
	var parentId = feeData.costParentId;
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			parentId : parentId,
			id : {
				$ne : costId
			}
		}, {
			fields : {
				id : 1,
				prop : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			callback(err, values);
		});
	});
}

db._CSF = function(feeData, feeName, getId, callback) {
	var parentId = feeData.costParentId;
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').find({
			costParentId : parentId,
			costId : {
				$ne : costId
			},
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			callback(err, values);
		});
	});
}

db._CAS = function(feeData, prop, getId, callback) {
	var me = this;
	var costId = feeData.costId;
	me._cas(costId, prop, getId, callback);
}

db._cas = function(costId, prop, getId, callback){
	var me = this;
	if(!costId) return callback(null, []);
	
	dbPool.acquire(function(err, _db) {
		_db.collection('cost').findOne({id:costId}, {}, function(err, doc){
			if(doc[prop]){
				dbPool.release(_db);
				var values = getId? [doc.id]: [doc[prop]];
				callback(err, values);
			}else{
				var parentId = doc.parentId;				
				me._cas(parentId, prop, getId, callback);
			}
		});
	});
}