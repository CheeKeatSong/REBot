var builder = require('botbuilder');
var siteUrl = require('./site-url');
var spellService = require('./spell-service');
var luisService = require('./luis-service');

// Storage adapter dependencies
const { MongoClient } = require('mongodb'); // v3.0.1
const { MongoBotStorage } = require('botbuilder-storage');

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Welcome Dialog
var MainOptions = {
    SelectProject: 'main_options_select_project',
    CreateProject: 'main_options_create_project',
    Support: 'main_options_talk_to_support'
};

var bot = new builder.UniversalBot(connector);

// Enable Conversation Data persistence
bot.set('persistConversationData', true);

// Set default locale
bot.set('localizerSettings', {
    botLocalePath: './bot/locale',
    defaultLocale: 'en'
});

var dialog = luisService.getLUIS('/', bot);

dialog.matches('weather', (session, args) => {
    session.send('you asked for weather' + JSON.stringify(args));
})
dialog.matches('greeting', (session, args) => {
    session.send('Hi you! Wanna know wat you can do? say \'help\'.', session.message.text);
})
dialog.matches('mainMenu', (session) => {
    session.beginDialog('/mainMenu');
})
dialog.matches('help', (session) => {
    session.beginDialog('/help');
})

//=========================================================
// Storage Adapter Setup
//=========================================================

// Connect to your host
var host = 'mongodb://localhost:27017/';
MongoClient.connect(host, (err, client) => {
    if (err) { throw err };

        // Define the adapter settings
        const settings = {
            // Required. This is the collection where all
            // the conversation state data will be saved.
            collection: "rebot_collection",

            // Optional but recommended!
            ttl: {
                userData: 3600 * 24 * 365, // a year
                conversationData: 3600 * 24 * 7, // a week
                privateConversationData: 3600 * 24 * 7
            }
        }
        // Select the datebase with the client
        client = client.db('BotStorage');
        
        // Instantiate the adapter with the client and settings.
        const adapter = new MongoBotStorage(client, settings)
        
        // Configure the bot to use the adapter.
        bot.set('storage', adapter);
    });
//=========================================================

// Sub-Dialogs
bot.library(require('./dialogs/elicitation').createLibrary());
bot.library(require('./dialogs/project-selection').createLibrary());
bot.library(require('./dialogs/basic-questions').createLibrary());
bot.library(require('./dialogs/business-process').createLibrary());
bot.library(require('./dialogs/help').createLibrary());

// Validators
bot.library(require('./validators').createLibrary());

// present the user with a main menu of choices they can select from
bot.dialog('/mainMenu', [
    function (session) {

       if (localizedRegex(session, [MainOptions.SelectProject]).test(session.message.text)) {
        return session.beginDialog('elicitation:/');
    }

    var welcomeCard = new builder.HeroCard(session)
    .title('welcome_title')
    .subtitle('welcome_subtitle')
    .images([
        new builder.CardImage(session)
        .url('https://placeholdit.imgix.net/~text?txtsize=56&txt=ReGen&w=640&h=330')
        .alt('regen')
        ])
    .buttons([
        builder.CardAction.imBack(session, session.gettext(MainOptions.CreateProject), MainOptions.CreateProject),
        builder.CardAction.imBack(session, session.gettext(MainOptions.SelectProject), MainOptions.SelectProject),
        builder.CardAction.imBack(session, session.gettext(MainOptions.Support), MainOptions.Support)
        ]);

    session.send(new builder.Message(session)
        .addAttachment(welcomeCard));
}
]);

bot.dialog('/firstTime', [
    function (session) {
        session.send('Hi, welcome to ReGen, I am ReBot! I am here to help you to identify your system requirements!');
        session.endDialog();
    }]);

// Trigger secondary dialogs when 'settings' or 'support' is called
bot.use({
    botbuilder: function (session, next) {
        var text = session.message.text;

        var settingsRegex = localizedRegex(session, ['main_options_settings']);
        var supportRegex = localizedRegex(session, ['main_options_talk_to_support', 'help']);

        if (settingsRegex.test(text)) {
            // interrupt and trigger 'settings' dialog 
            return session.beginDialog('settings:/');
        } else if (supportRegex.test(text)) {
            // interrupt and trigger 'help' dialog
            return session.beginDialog('help:/');
        }

        // continue normal flow
        next();
    }
});

// Send welcome when conversation with bot is started, by initiating the root dialog
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/firstTime');
            }
        });
    }
});

// Cache of localized regex to match selection from main options
var LocalizedRegexCache = {};
function localizedRegex(session, localeKeys) {
    var locale = session.preferredLocale();
    var cacheKey = locale + ":" + localeKeys.join('|');
    if (LocalizedRegexCache.hasOwnProperty(cacheKey)) {
        return LocalizedRegexCache[cacheKey];
    }

    var localizedStrings = localeKeys.map(function (key) { return session.localizer.gettext(locale, key); });
    var regex = new RegExp('^(' + localizedStrings.join('|') + ')', 'i');
    LocalizedRegexCache[cacheKey] = regex;
    return regex;
}

// Connector listener wrapper to capture site url
var connectorListener = connector.listen();
function listen() {
    return function (req, res) {
        // Capture the url for the hosted application
        // We'll later need this url to create the checkout link 
        var url = req.protocol + '://' + req.get('host');
        siteUrl.save(url);
        connectorListener(req, res);
    };
}

// Spell Check
if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
            .getCorrectedText(session.message.text)
            .then(function (text) {
                session.message.text = text;
                next();
            })
            .catch(function (error) {
                console.error(error);
                next();
            });
        }
    });
}

// Other wrapper functions
function beginDialog(address, dialogId, dialogArgs) {
    bot.beginDialog(address, dialogId, dialogArgs);
}

function sendMessage(message) {
    bot.send(message);
}

module.exports = {
    listen: listen,
    beginDialog: beginDialog,
    sendMessage: sendMessage
};