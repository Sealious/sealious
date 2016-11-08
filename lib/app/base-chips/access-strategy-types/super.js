"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Super = {
	name: "super",
	checker_function: function(context){
		if (context.is_super){
			return Promise.resolve();
		} else {
			return Promise.reject("This action cannot be performed by a regular user, but only by the server itself.");
		}
	},
	item_sensitive: true,
};

module.exports = Super;