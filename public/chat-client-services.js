angular.module('chatClient', ['ngResource'])
    .factory('User', function($resource) {
        return $resource('/users/:id');
    })
    .factory('Chat', function($resource) {
        return $resource('/chats/:chatId', null, {
            update: { method: 'PUT' }
        });
    })
    .factory('Messages', function($resource) {
        return $resource('/chats/:chatId/messages');
    });