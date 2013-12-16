//module.exports = require("./db/neo.js");
module.exports = require("./db/basex.js");
//module.exports = require("./db/mongo.js");

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

db.feesToFlushOnCostCreate = function(costData, callback){
	
}

db.feesToFlushOnCostUpdate = function(costData, key, callback){
	
}

db.feesToFlushOnCostDelete = function(costData, callback){
	
}

db.getFee = function(file, id, callback){
	
}

db.createFee = function(file, data, costData, parentId, callback){
	
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

db.feesToFlushOnFeeCreate = function(feeData, callback){
	
}

db.createRefsTo = function(feeData, toIds, callback){
	
}

db.removeRefsTo = function(feeData, toIds, callback){
	
}

db.feeRefedToIds = function(feeData, callback){
	
}
/////////////////////////////////////////////////////////////////////
db._C = function(feeData, prop, getId, callback){
	
}

db._CF = function(feeData, feeName, getId, callback) {
	
}

db._CC = function(feeData, type, prop, getId, callback) {
	
}

db._CCF = function(feeData, type, feeName, getId, callback) {
	
}

db._CS = function(feeData, prop, getId, callback) {
	
}

db._CSF = function(feeData, feeName, getId, callback) {
	
}

db._CAS = function(feeData, prop, getId, callback) {
	
}