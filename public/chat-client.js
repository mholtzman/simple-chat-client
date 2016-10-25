angular.module('chatClient')
    .controller('chatWindowController', ['$timeout', 'User', 'Chat', 'Messages', function($timeout, User, Chat, Messages) {
        const Ctrl = this;

        const inviteToChat = 'Need help? Click to start a live chat';
        const liveChat = 'Live Chat';

        Ctrl.chatOpen = false;
        Ctrl.userInput = { firstName: 'Matt', lastName: 'Holtzman', email: 'admin@myawesomeapp.com' };
        Ctrl.messages = [];

        let poller = false;
        let lastUpdate = false;

        const isMine = msg => msg.userId == Ctrl.userId;

        const pollForUpdates = () => {
            poller = $timeout(getUpdates, 500);
        };

        const getUpdates = function() {
            console.log('getting updates for chat ID ' + Ctrl.chatId);

            Messages.query({ chatId: Ctrl.chatId, timestamp: lastUpdate }, function(messages) {
                console.log(`received ${messages.length} messages`);

                console.log(JSON.stringify(messages, undefined, 2));
                Array.prototype.push.apply(Ctrl.messages, messages);

                // a little Jquery to push the scroll to the bottom after new chats arrive
                // ideally, this should be encapsulated in a directive (or just use angularjs-scroll-glue)
                // but adding it here due to time constraints
                if (messages.length > 0) {
                    $timeout(function() {
                        const scrollPane = document.getElementById('chat-messages');
                        scrollPane.scrollTop = scrollPane.scrollHeight;
                    }, 0);
                }                

                lastUpdate = moment().valueOf();
                pollForUpdates();
            });
        };

        const updateHeaderText = function() {
            if (!Ctrl.chatId) {
                Ctrl.headerText = Ctrl.chatOpen ? liveChat : inviteToChat;
            }
        };

        const stopPolling = function() {
            $timeout.cancel(poller);
        };

        const startChat = function(chat) {
            Ctrl.chatId = chat.id;
            getUpdates();
        };

        Ctrl.chatStarted = () => Ctrl.chatId;
        Ctrl.showLogin = () => !Ctrl.chatId && !Ctrl.repChoice;
        Ctrl.isMine = msg => msg.user_id == Ctrl.userId;
        
        Ctrl.handleHeaderClick = function() {
            // close chat if open, otherwise open it
            Ctrl.chatOpen = !Ctrl.chatOpen;
            updateHeaderText();
        };

        Ctrl.joinChat = function(chatId, user) {
            Ctrl.repChoice = false;
            Ctrl.headerText += ': ' + `${user.firstName + ' ' + user.lastName}`;
            Ctrl.chatId = chatId;

            getUpdates();
        };

        Ctrl.signin = function() {
            User.save(Ctrl.userInput, function(user) {
                Ctrl.userId = user.id;
                Ctrl.userInput.firstName = user.firstName;

                if (user.isRep) {
                    // if the user is a rep, show a list of active chats to join
                    Ctrl.repChoice = true;
                    Chat.query(function(chats) {
                        Ctrl.activeChats = chats;
                    });
                } else {
                    Ctrl.headerText += ': ' + `${user.firstName + ' ' + user.lastName}`;
                    // for all other users, start a new chat
                    Chat.save({ userId: user.id }, startChat);
                }
            });
        };

        Ctrl.endChat = function() {
            if (Ctrl.chatId) {
                Chat.update({ chatId: Ctrl.chatId }, { active: false });
            }
            
            stopPolling();
            lastUpdate = false;

            Ctrl.chatId = false;
            Ctrl.userId = false;
            Ctrl.repChoice = false;
            Ctrl.activeChats = [];
        };

        Ctrl.submitMessage = function() {
            if (Ctrl.chatText) {
                stopPolling();

                Messages.save({ chatId: Ctrl.chatId }, { text: Ctrl.chatText, userId: Ctrl.userId }, pollForUpdates);
                
                Ctrl.chatText = "";
            }
        };

        // init user state
        updateHeaderText();
    }]);