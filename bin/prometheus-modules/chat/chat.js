module.exports.prepare_resource_type_chat_message = function(chat_message){
	chat_message.add_fields([
		{name: "from", 		type: "text", required:true},//should be an association to User
		{name: "message", 	type: "text", required: true},
		{name: "date", 		type: "date"},
		{name: "order_in_conversation", type: "int"},
		{name: "conversation_id", type: "int"},
	]);
}


module.exports.prepare_resource_type_chat_conversation = function(chat_conversation){
	chat_conversation.add_fields([
		{name: "title", type: "text", required: true},
		{name: "random_number", type: "int"}
	]);
}

module.exports.construct_associations = function(AssocInterface){
	AssocInterface.create({
		left_type: "chat-message", 
		right_type: "chat-conversation", 
		bidirectional: true, 
		name_ltr: "is_in_conversation", 
		name_rtl: "contains_messages",
		left_required: true
	});
}

module.exports.prepare_channel_rest = function(rest){
	rest.add_path("/api/v1/chat/message", "chat_message");
	rest.add_path("/api/v1/chat/conversation", "chat_conversation");
}


module.exports.prepare_channel_www_server = function(www_server, dispatcher, dependencies){
	www_server.route({
		method: "GET", 
		path: "/api/v1/chat/conversation/{id}/messages",
		handler: function(request, reply){
			dispatcher.resources_find({conversation_id: parseInt(request.params.id)}, "chat_message")
				.then(function(resources){
					reply(resources);
				})
		}
	})
}