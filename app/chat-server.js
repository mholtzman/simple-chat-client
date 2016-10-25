const config = require('./config');
const DB = require('./db');

const path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    moment = require('moment');

const app = express();

const defaultMessage = name => {
    return `Hi ${name}, welcome to the chat!`;
};

app.use(express.static('./public'));const morgan = require('morgan');
app.use(morgan('dev'));

const createMessage = function(text, chatId, userId) {
    return DB.Message.create({ text, chat_id: chatId, user_id: userId });
};

// get all active chats
app.get('/chats', function(req, res) {
    console.log(`received request for chats`);

    return DB.Chat.findAll({ where: { active: true }, include: [DB.User] })
        .then(chats => res.status(201).json(chats))
        .catch(err => {
            console.error('could not create chat!', err);
            return res.status(500).end();
        });
});

// get all active chats
app.get('/chats/:id', function(req, res) {
    const chatId = req.params.id;

    console.log(`received request for chat ${chatId}`);

    return DB.Chat.findOne({ where: { id: chatId }, include: [DB.User] })
        .then(chat => res.status(201).json(chat))
        .catch(err => {
            console.error('could not create chat!', err);
            return res.status(500).end();
        });
});

// create a new chat with the given user email and name
app.post('/chats', bodyParser.json(), function(req, res) {
    const userId = req.body.userId;

    console.log(`received request to start chat from user ${userId}`);

    return DB.Chat.create({ created_by: userId })
        .then(chat => {
            console.log(`successfully started chat ID ${chat.id}`);

            // look up user who is creating the chat to generate default message

            return DB.User.findById(userId).then(user => {
                // create default greeting message and add it to the chat
                return createMessage(defaultMessage(user.get('firstName')), chat.get('id'), 1)
                    .then(() => res.status(201).json(chat));
            });
        })
        .catch(err => {
            console.error('could not create chat!', err);
            return res.status(500).end();
        });
});

// update a chat (namely to set it to inactive)
app.put('/chats/:id', function(req, res) {
    const chatId = req.params.id;
    const active = req.query.active && req.query.active == 'true';

    if (!active) {
        console.log(`received request to inactivate chat ${chatId}`);

        return DB.Chat.findById(chatId).then(chat => {
            console.log(`ending chat ${chatId}`);
            chat.set('active', false);
            return chat.save()
                .then(chat => res.status(200).end())
                .catch(err => {
                    console.error('could not de-activate chat!', err);
                    return res.status(500).end();
                });
        });
    } else {
        // only support inactivation
        return res.status(200).end();
    }

    
});

// get all messages from the given chat after the given timestamp
app.get('/chats/:id/messages', function(req, res) {
    const lastLoaded = moment(Number((req.query.timestamp != "false" && req.query.timestamp) || moment().subtract(10, 'm').valueOf()));
    console.log(`received request for chat messages for chatID=${req.params.id} after ${lastLoaded}`);

    return DB.Message.getLatest(req.params.id, lastLoaded)
        .then(messages => res.status(200).json(messages))
        .catch(err => {
            console.error('could not find chat messages!', err);
            return res.status(500).end();
        });
});

// post a new message
app.post('/chats/:chatId/messages', bodyParser.json(), function(req, res) {
    const chatText = req.body.text;
    const userId = req.body.userId;

    console.log(`received new chat message from user ${userId}`);

    return createMessage(chatText, req.params.chatId, userId)
        .then(() => res.status(201).end())
        .catch(err => {
            console.error('could not create chat message!', err);
            return res.status(500).end();
        });
});

app.post('/users', bodyParser.json(), function(req, res) {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    console.log(`received request for to create user ${email}`);

    // first, check if the user already exists
    return DB.User.findOne({ where: { email } })
        .then(user => {
            console.log(JSON.stringify(user));
            if (user) {
                console.log('user already exists');
                return user;
            } else {
                // user doesn't exist, create a new one
                console.log(`creating new user ${email}`);
                return DB.User.create({ email, firstName, lastName, role_id: 2 });  
            }
        })
        .then(user => res.status(201).json(user))
        .catch(err => res.status(500).send(err));
});

app.get('/', function(req, res) {
    return res.sendFile(path.join(__dirname,'../public/empty-client.html'));
});

// creates admin bot user and roles in DB
const seedDB = function() {
    return Promise.all([
        DB.Role.create({ id: 1, description: 'Site Rep' }),
        DB.Role.create({ id: 2, description: 'Customer' }),
        DB.User.create({ id: 1, email: 'admin@app.com', firstName: 'Admin', role_id: 1  })
    ]);
}

// sync with DB then start listening for requests
DB.sequelize.sync({ force: true }).then(seedDB).then(() => {
    app.listen(config.port, () => console.log(`chat server listening on port ${config.port}`))
});