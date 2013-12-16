var async = require('async');

// Compute the intersection of n arrays
Array.prototype.intersect = function() {
	if (!arguments.length)
		return [];
	var a1 = this;
	var a = a2 = null;
	var n = 0;
	while (n < arguments.length) {
		a = [];
		a2 = arguments[n];
		var l = a1.length;
		var l2 = a2.length;
		for (var i = 0; i < l; i++) {
			for (var j = 0; j < l2; j++) {
				if (a1[i] === a2[j])
					a.push(a1[i]);
			}
		}
		a1 = a;
		n++;
	}
	return a.unique();
};

// Return new array with duplicate values removed
Array.prototype.unique = function() {
	var a = [];
	var l = this.length;
	for (var i = 0; i < l; i++) {
		for (var j = i + 1; j < l; j++) {
			// If this[i] is found later in the array
			if (this[i] === this[j])
				j = ++i;
		}
		a.push(this[i]);
	}
	return a;
};

// Return elements which are in A but not in arg0 through argn
Array.prototype.diff = function() {
	var a1 = this;
	var a = a2 = null;
	var n = 0;
	while (n < arguments.length) {
		a = [];
		a2 = arguments[n];
		var l = a1.length;
		var l2 = a2.length;
		var diff = true;
		for (var i = 0; i < l; i++) {
			for (var j = 0; j < l2; j++) {
				if (a1[i] === a2[j]) {
					diff = false;
					break;
				}
			}
			diff ? a.push(a1[i]) : diff = true;
		}
		a1 = a;
		n++;
	}
	return a.unique();
};

Array.prototype.remove = function(element) {
	var idx = this.indexOf(element);
	if (idx != -1) {
		this.splice(idx, 1);
	}
};

Array.prototype.random = function() {
	var len = this.length;
	var idx = Math.floor(Math.random() * len);
	return this[idx];
};

Array.prototype.shuffle = function() {
	var o = this;
	for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
		;
	return o;
};
// //////////////////////////////////////////////////
exports.refReg = new RegExp([ 'f', 'c', 'cf', 'cc', 'ccf', 'cs', 'csf', 'cas' ]
		.join('\\([^\\)]*\\)|')
		+ '\\([^\\)]*\\)', 'g');

// https://github.com/josdejong/mathjs/blob/master/docs/extend.md
exports.math_extend = {
	sum : function(args) {
		var total = 0;
		var argsArray = arguments;
		Object.keys(argsArray).forEach(function(key) {
			total += argsArray[key];
		});
		return total;
	}
};

function _md5(text) {
	return require('crypto').createHash('md5').update(text).digest('hex');
};

exports.dbstats = {
	totalms : 0,
	querys : 0,
	avgms : 0,
	maxms : 0,
	querystats : {},
	stats: function(){
		var me = this;
		var querystats = Object.keys(me.querystats).map(function(k){return me.querystats[k]});
		querystats.sort(function(a,b){return b.avgms - a.avgms});
		
		return {
			//totalms: me.totalms,
			querys: me.querys,
			avgms: me.avgms,
			maxms: me.maxms,
			querystats: querystats
		};
	},
	finish : function(start, query) {
		var me = this;
		var ms = new Date() - start;
		me.totalms += ms;
		me.querys += 1;
		me.avgms = me.totalms / me.querys;
		me.maxms = ms > me.maxms ? ms : me.maxms;
		var md5 = _md5(query);
		me.querystats[md5] = me.querystats[md5] ? {
			query : query,
			totalms : me.querystats[md5].totalms + ms,
			querys : me.querystats[md5].querys + 1,
			avgms : me.querystats[md5].totalms / me.querystats[md5].querys,
			maxms : ms > me.querystats[md5].maxms ? ms
					: me.querystats[md5].maxms
		} : {
			query : query,
			totalms : ms,
			querys : 1,
			avgms : ms,
			maxms : ms
		};
	}
};

exports.xml2json = function xml2json(xml) {
	return require('xml2json').toJson(xml, {
		object : true,
		coerce : true,
		sanitize : false
	});
}

exports.json2xml = function json2xml(o, tab) {
	var toXml = function(v, name, ind) {
		var xml = "";
		if (v instanceof Array) {
			for (var i = 0, n = v.length; i < n; i++)
				xml += ind + toXml(v[i], name, ind + "\t") + "\n";
		} else if (typeof (v) == "object") {
			var hasChild = false;
			xml += ind + "<" + name;
			for ( var m in v) {
				if (m.charAt(0) == "@")
					xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
				else
					hasChild = true;
			}
			xml += hasChild ? ">" : "/>";
			if (hasChild) {
				for ( var m in v) {
					if (m == "#text")
						xml += v[m];
					else if (m == "#cdata")
						xml += "<![CDATA[" + v[m] + "]]>";
					else if (m.charAt(0) != "@")
						xml += toXml(v[m], m, ind + "\t");
				}
				xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</"
						+ name + ">";
			}
		} else {
			xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
		}
		return xml;
	}, xml = "";
	for ( var m in o)
		xml += toXml(o[m], m, "");
	return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
}
