"use strict";
const Single = {
	encode: function(context, field, value_in_code){
		return field.encode(context, field.params, value_in_code);
	},
	decode: function(context, field, value_in_datastore){
		return field.decode(context, field.params, value_in_datastore);
	},
	is_proper_value: function(context, field, new_value, old_value){
		return field.is_proper_value(context, field.params, new_value, old_value);
	}
};

module.exports = Single;