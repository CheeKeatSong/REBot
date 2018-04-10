var builder = require('botbuilder');

// LUIS 
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;

const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f36e1bc6-efcd-4903-8cc5-98c8e5a7111b?subscription-key=d52fb645ef744373b59357e4b7522a0a&verbose=true&timezoneOffset=0&q=';

exports.getLUIS = function (route, bot) {

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var dialog = new builder.IntentDialog({recognizers: [recognizer]});

bot.dialog(route, dialog);
dialog.onDefault((session) => {
	session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

return dialog;
}
