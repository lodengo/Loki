//module.exports = require("./db/neo.js");
module.exports = require("./db/basex.js");


var db = function db() {
	
};

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
db._C = function(file, costId, prop, getId, callback){
	
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