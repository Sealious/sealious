"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Chip = require("./chip.js");
const Errors = locreq("lib/response/error.js");
const ChipManager = locreq("lib/chip-types/chip-manager.js");

function AccessStrategyType(declaration){
	if (declaration instanceof AccessStrategyType){
		return declaration;
	} else if (typeof declaration === "string"){
		return ChipManager.get_chip("access_strategy_type", declaration);
	}
	Chip.call(this, "access_strategy_type", declaration.name);
	this.declaration = declaration;
	this.checker_function = null;
	this.name = declaration.name;
	if (declaration){
		this._process_declaration(declaration);
	}
}

AccessStrategyType.prototype._process_declaration = function(declaration){
	this.checker_function = declaration.checker_function === undefined ? null : declaration.checker_function;
};
AccessStrategyType.prototype.__is_item_sensitive = function(declaration, params){
	if (typeof declaration.item_sensitive === "function"){
		return Promise.resolve(declaration.item_sensitive(params));
	} else {
		return Promise.resolve(Boolean(declaration.item_sensitive));
	}
};
AccessStrategyType.prototype.__check = function(declaration, context, params, item){
	if (context.is_super){
		return Promise.resolve();
	}
	return this.__is_item_sensitive(declaration, params)
	.then(function(is_item_sensitive){
		if (is_item_sensitive && item === undefined){
			return Promise.resolve(undefined);
		} else {
			return Promise.try(function(){
				return Promise.method(declaration.checker_function)(context, params, item)
					.then(function(result){
						if (result === false){
							return Promise.reject("Access denied");
						} else {
							return Promise.resolve(result);
						}
					});
			});
		}
	}).catch(function(error){
		if (typeof error === "string"){
			return Promise.reject(new Errors.BadContext(error));
		} else {
			return Promise.reject(error);
		}
	});
};
AccessStrategyType.prototype.is_item_sensitive = function(params){
	return this.__is_item_sensitive(this.declaration, params);
};
AccessStrategyType.prototype.check = function(context, params, item){
	return this.__check(this.declaration, context, params, item);
};

AccessStrategyType.type_name = "access_strategy_type";

module.exports = AccessStrategyType;