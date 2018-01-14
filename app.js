var restify = require('restify');
var builder = require('botbuilder');
var path = require('path');

// Storage adapter dependencies
var istorage= require('./lib/IStorageClient');
var azure = require('./lib/AzureBotStorage.js');
var conf = require('./config/conf.js');

//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

//=========================================================
// Storage Session Setup
//=========================================================
// Store session and context temporary as cache
// var inMemoryStorage = new builder.MemoryBotStorage();

// Store session and context into mongodb
var docDbClient = new istorage.IStorageClient();
var tableStorage = new azure.AzureBotStorage({ gzipData: false },docDbClient);
var bot = new builder.UniversalBot(connector).set('storage', tableStorage);//set your storage here

bot.use(builder.Middleware.dialogVersion({ version: 3.0, resetCommand: /^reset/i }));

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("You said: %s", session.message.text);
// });

// var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Add a global LUIS recognizer to your bot using the endpoint URL of your LUIS app
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f36e1bc6-efcd-4903-8cc5-98c8e5a7111b?subscription-key=d52fb645ef744373b59357e4b7522a0a&timezoneOffset=0&verbose=true&q=';
// bot.recognizer(new builder.LuisRecognizer(model));
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

.matches('weather', (session, args) => {
    session.send('you asked for weather' + JSON.stringify(args));
})
.matches('greeting', (session, args) => {
    session.send('Hi you!', session.message.text);
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    