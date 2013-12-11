var neo4j = require('neo4j');
var _db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

function data_col(err, data, col, one, callback){
	if(err){
		callback(err, one ? null : []);
	}else{
		async.map(data, function(row, cb){
			var key = col || Object.keys(row)[0];
			cb(null, row[key]);
		}, function(err, result){
			callback(err, one ? result[0] : result);
		});
	}
}

var db = module.exports = function db() {
	
};

db.query = function(query, params, callback) {	
	var matches = query.match(/({{[^}]*}})/g);
	matches && matches.forEach(function(str) {
		var key = str.slice(2, -2);
		query = query.replace(str, params[key]);
	});
	
	_db.query(query, params, function(err, res){
		if(err) console.dir([err, query]);	
		//console.dir(query);	console.log(params); console.log(res);
		callback(err, res);
	});	
};

db.createCostFile = function(data, callback){
	var file = '';
	callback(null, file);
}

db.getCost = function(file, id, callback){
	var query = 'start node=node({id}) return node';
	this.query(query, {id: id}, function(err, data){
		data_col(err, data, null, true, function(err, node){
			var data = node.data;
			data.id = node.id;
			callback(err, data);
		});
	});
}

db.insertCost = function(file, data, parentId, callback){
	data.nodeType = 'cost';
	if(parentId){
		var query = "start parent=node({parentId}) create parent-[:costchild]->(node {data}) return node";
		this.query(query, {parentId:parentId, data: data}, function(err, data){
			data_col(err, data, null, true, function(err, node){
				var data = node.data;
				data.id = node.id;
				callback(err, data);
			});
		});
	}else{
		var query = 'create (node {data}) return node';
		this.query(query, {data: data}, function(err, data){
			data_col(err, data, null, true, function(err, node){
				var data = node.data;
				data.id = node.id;
				callback(err, data);
			});
		});
	}
}

db.deleteCost = function(file, costId, callback){
	var query = 'start cost=node({id})	match cost-[:fee|feechild|costchild*]->m with cost, m MATCH m-[r?]-(), cost-[r1?]-() delete cost, m, r, r1';
	this.query(query, {id: costId}, callback);	
}

db.setCostProperty = function(file, id, prop, value, callback){
	var query = 'start node=node({id}) set node.{{property}}={value}';
	this.query(query, {id: id, property:prop, value:value}, callback);	
}

db.deleteCostProperty = function(file, id, prop, callback){
	var query = 'start node=node({id}) delete node.{{property}}';
	this.query(query, {id: id, property:prop}, callback);	
}

db.feesToFlushOnCostCreate = function(file, costId, type, callback){
	var me = this;
	var query = 'start n=node({id}) match n-[:fee|feechild*]->fees return fees';
	me.query(query, {id: costId}, function(err, data){
		data_col(err, data, null, false, function(err, myfees){
			query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr =~ ".*cc.?\\\\({{type}}.*" return parentfees';
			me.query(query, {id: costId, type:type}, function(err, data){
				data_col(err, data, null, false, function(err, parentfees){
					query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs.*" return siblingfees';
					me.query(query, {id: costId}, function(err, data){
						data_col(err, data, null, false, function(err, siblingfees){
							var fees = myfees.concat(parentfees, siblingfees);	
							async.map(fees, function(fee, cb){
								var node = fee.data;
								node.id = fee.id;
								cb(null, node);
							}, callback);							
						});
					});
				});
			});
		});
	});	
}

db.feesToFlushOnCostUpdate = function(file, costId, type, key, callback){
	var me = this;
	var query = 'start n=node({id}) match n-[:fee|feechild*]->fees where fees.feeExpr=~".*cas\\\\({{prop}}\\\\)|c\\\\({{prop}}\\\\).*" return fees';
	me.query(query, {id: costId, prop:prop}, function(err, data){
		data_col(err, data, null, false, function(err, myfees){
			query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr=~".*cc\\\\({{type}},{{prop}}\\\\).*" return parentfees';
			me.query(query, {id: costId, type:type, prop:prop}, function(err, data){
				data_col(err, data, null, false, function(err, parentfees){
					query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs\\\\({{prop}}\\\\).*" return siblingfees';
					me.query(query, {id: costId, prop:prop}, function(err, data){
						data_col(err, data, null, false, function(err, siblingfees){
							query = 'start cost=node({id}) match cost-[:costchild*]->descendant, descendant-[:fee|feechild*]->descendantfees where descendantfees.feeExpr =~ ".*cas\\\\({{prop}}\\\\).*" return descendantfees';
							me.query(query, {id: costId, prop:prop}, function(err, data){
								data_col(err, data, null, false, function(err, descendantfees){
									var fees = myfees.concat(parentfees, siblingfees, descendantfees);
									async.map(fees, function(fee, cb){
										var node = fee.data;
										node.id = fee.id;
										cb(null, node);
									}, callback);	
								});
							});
						});
					});
				});
			});
		});
	});
}

db.feesToFlushOnCostDelete = function(file, costId, type, callback){
	var me = this;
	var query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr =~ ".*cc.?\\\\({{type}}.*" return parentfees';
	me.query(query, {id: costId, type:type}, function(err, data){
		data_col(err, data, null, false, function(err, parentfees){
			query = 'start cost=node({id}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*cs.*" return siblingfees';
			me.query(query, {id: costId}, function(err, data){
				data_col(err, data, null, false, function(err, siblingfees){
					var fees = parentfees.concat(siblingfees);
					async.map(fees, function(fee, cb){
						var node = fee.data;
						node.id = fee.id;
						cb(null, node);
					}, callback);	
				});
			});
		});
	});	
}

db.getFee = function(file, id, callback){
	var query = 'start node=node({id}) return node';
	this.query(query, {id: parseInt(id)}, function(err, data){
		data_col(err, data, null, true, function(err, node){
			var data = node.data;
			data.id = node.id;
			callback(err, data);
		});
	});	
}

db.createFee = function(file, data, costId, costType, parentId, callback){
	var me = this;
	var childFees = data.fee || [];
	delete data.fee;
	
	data.nodeType = 'fee';
	data.costId = costId;	
	data.costType = costType;
	
	if(parentId){
		var query = 'start parent=node({parentId}) create parent-[:feechild]->(node {data}) return node';
		me.query(query, {parentId:parentId, data: data}, function(err, data){
			data_col(err, data, null, true, function(err, node){
				async.each(childFees, function(cfee, cb){
					me.createFee(file, cfee, costId, costType, node.id, cb)
				}, function(err){
					var nfee = node.data;
					nfee.id = node.id;
					callback(err, nfee);
				});	
			});
		});		
	}else{
		var query = 'start cost=node({costId}) create cost-[:fee]->(node {data}) return node';
		me.query(query, {costId:costId, data: data}, function(err, data){
			data_col(err, data, null, true, function(err, node){
				async.each(childFees, function(cfee, cb){
					me.createFee(file, cfee, costId, costType, node.id, cb)
				}, function(err){
					var nfee = node.data;
					nfee.id = node.id;
					callback(err, nfee);
				});	
			});
		});		
	}	
}

db.setFeeProperty = function(file, id, prop, value, callback){
	var query = 'start node=node({id}) set node.{{property}}={value}';
	this.query(query, {id: id, property:prop, value:value}, callback);	
}

db.deleteFeeProperty = function(file, id, prop, callback){
	var query = 'start node=node({id}) delete node.{{property}}';
	this.query(query, {id: id, property:prop}, callback);	
}

db.deleteFee = function(file, id, callback){
	var query = 'start fee=node({id}) match fee-[:feechild*]->m with fee, m match m-[r?]-(), fee-[:r1?]-() delete fee, m, r, r1';
	this.query(query, {id: id}, callback);	
}

db.setFeeResult = function(file, id, feeResult, callback){
	var query = 'start fee=node({id}) set fee.feeResult={result}';
	this.query(query, {id:id, result:feeResult}, callback);
}

db.feesAdj = function(file, ids, callback){
	var me = this;
	var query = 'start fees=node({feeIds}) match fees<-[:ref*]-rfees return collect(id(rfees)) as ids';
	me.query(query, {feeIds:ids}, function(err, data){
		data_col(err, data, null, true, function(err, rfeeIds){
			var fids = ids.concat(rfeeIds);
			fids = fids.unique();
			
			query = 'start fees=node({feeIds}) match fees-[:ref]->refs return id(fees) as feeId, collect(id(refs)) as adj';
			me.query(query, {feeIds:fids}, function(err, data){
				var adj = {};
				data.forEach(function(r){				
					adj[r.feeId] = r.adj.map(function(e){return e+''});
				});
				
				fids = fids.map(function(fid){return fid+''});
				fids.diff(Object.keys(adj)).forEach(function(id){					
					adj[id] = [];
				});
				
				callback(err, adj);
			});			
		});		
	});
}

db.feesToFlushOnFeeCreate = function(file, costId, type, feeName, callback){
	var me = this;
	var query = 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeExpr=~ ".*cf\\\\({{feeName}}\\\\).*" return fees';
	me.query(query, {costId: costId, feeName:feeName}, function(err, data){
		data_col(err, data, null, false, function(err, myfees){
			query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:fee|feechild*]->parentfees where parentfees.feeExpr =~ ".*ccf\\\\({{type}},{{feeName}}\\\\).*" return parentfees';
			me.query(query, {costId: costId, type:type, feeName:feeName}, function(err, data){
				data_col(err, data, null, false, function(err, parentfees){
					query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeExpr =~ ".*csf\\\\({{feeName}}\\\\).*" return siblingfees';
					me.query(query, {id: costId, feeName:feeName}, function(err, data){
						data_col(err, data, null, false, function(err, siblingfees){
							var fees = myfees.concat(parentfees, siblingfees);
							fees = fees.unique();
							async.map(fees, function(fee, cb){
								var node = fee.data;
								node.id = fee.id;
								cb(null, node);
							}, callback);	
						});
					});
				});
			});
		});
	});	
}

db.createRefsTo = function(file, id, toIds, callback){
	var me = this;
	async.each(toIds, function(toId, cb){
		var query = 'start me=node({id}), to=node({nodes}) create me-[r:ref]->to';
		me.query(query, {id:id, nodes:toId}, cb);	
	}, callback);	
}

db.removeRefsTo = function(file, id, toIds, callback){
	var query = 'start me=node({id}), to=node({to}) match me-[r:ref]->to delete r';
	this.query(query, {id:id, to:toIds}, callback);	
}

db.feeRefedToIds = function(file, id, callback){
	var query = 'start fee=node({id}) match fee-[:ref]->node return id(node) as ids';
	this.query(query, {id: id}, function(err, data){
		data_col(err, data, null, false, callback);
	});		
}
/////////////////////////////////////////////////////////////////////
function _cb(err, data, getId, callback){
	var col = getId ? 'id' : 'value';
	data_col(err, data, col, false, callback);	
};

db._C = function(file, costId, prop, getId, callback){
	var query = 'start cost=node({costId}) return id(cost) as id, cost.{{prop}} as value';
	this.query(query, {costId: costId, prop:prop}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CF = function(file, costId, feeName, getId, callback) {
	var query = 'start cost=node({costId}) match cost-[:fee|feechild*]->fees where fees.feeName! ={feeName} return id(fees) as id, fees.feeResult as value';
	this.query(query, {costId: costId, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CC = function(file, costId, type, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost-[:costchild]->child where child.type! = {type} and has(child.{{prop}}) return id(child) as id, child.{{prop}} as value';
	this.query(query, {costId: costId, type:type, prop:pName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CCF = function(file, costId, type, feeName, getId, callback) {
	var query = 'start cost=node({costId}) match cost-[:costchild]->child, child-[:fee|feechild*]->childfees where child.type! = {type} and childfees.feeName! = {feeName} return id(childfees) as id, childfees.feeResult as value';
	this.query(query, {costId: costId, type:type, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CS = function(file, costId, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling where sibling <> cost and has(sibling.{{prop}}) return id(sibling) as id, sibling.{{prop}} as value';
	this.query(query, {costId: costId, prop:prop}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CSF = function(file, costId, feeName, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild]-parent, parent-[:costchild]->sibling, sibling-[:fee|feechild*]->siblingfees where sibling <> cost and siblingfees.feeName! ={feeName}  return id(siblingfees) as id, siblingfees.feeResult as value';
	this.query(query, {costId: costId, feeName:feeName}, function(err, data){
		_cb(err, data, getId, callback);
	});
}

db._CAS = function(file, costId, prop, getId, callback) {
	var query = 'start cost=node({costId}) match cost<-[:costchild*]-ancestor return cost.{{prop}}? as s, id(ancestor) as a, ancestor.{{prop}}? as aa';
	this.query(query, {costId: costId, prop:prop}, function(err, data){
		_cb(err, data, getId, callback);
	});
}