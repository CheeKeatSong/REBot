var util = require('util');
var builder = require('botbuilder');
var luisService = require('../luis-service');
var dbHelper = require('../db-helper');
var request = require('request-promise').defaults({ encoding: null });

var lib = new builder.Library('business-process');
var counter = 0;

var functionality = new Array();
var totalFunctions;

// basic questions
lib.dialog('/', [
    function (session) {
     dbHelper.getBasicFunctionality().then(function (doc) {
        functionality = doc;
    })
     .catch(function (error) {
        console.error(error);
    });;
     counter = 0;
     session.send('Great job! We got the basic idea. Now let\'s proceed to clarify the business process.');
     builder.Prompts.text(session, 'Say \'ok\' to continue');
 },
 function (session, args) {
    totalFunctions = functionality.length;
    session.beginDialog('askFunction');
},
function (session, args) {
    session.send('Thank you!');
    session.endDialog();
}
]).reloadAction(
"restartBasicQuestion", "Ok. Let's start over.",
{
    matches: /^start over$/i,
    confirmPrompt: "This will abort your current progress and restart. Are you sure?"
}
).endConversationAction(
"endBasicQuestion", "Ok. Goodbye.",
{
    matches: /^cancel$|^goodbye$/i,
    confirmPrompt: "This will abort your current progress. Are you sure?"
}
);

lib.dialog('question', [
    function (session, args, next) {
        builder.Prompts.text(session, 'what_question');
    }
    ]);


var ProcessExist = {
    Yes: 'yes',
    No: 'no'
};

lib.dialog('askFunction', [
    function (session, args) {
        console.log(functionality);
        console.log(functionality[counter]);
        session.send('function_intro', functionality[counter].data);
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_purpose'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("process-purpose_" + counter, args.response);
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_trigger'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("process-trigger_" + counter, args.response);
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_responsible'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("process-responsible_" + counter, args.response);
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_work'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("process-work-" + counter, args.response);
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_result'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("process-result-" + counter, args.response);
        var promptMessage = session.gettext('process_exist');
        builder.Prompts.choice(session, promptMessage, [
            session.gettext(ProcessExist.Yes),
            session.gettext(ProcessExist.No)
            ]);
    },
    function (session, args, next) {
        if (args.response && args.response.entity === session.gettext(ProcessExist.Yes)) {
           session.beginDialog('validators:response', {
            prompt: session.gettext('process_existing_work'),
            retryPrompt: session.gettext('invalid_response')
        });
       } else {
        next();
    }
},
function (session, args, next) {
    if (args.response){
        dbHelper.storeResponse("process-existing-work-" + counter, args.response);
        next();
    } else {
        next();
    }
},
function (session, args, next) {
    if (args.response){
        session.beginDialog('addScreenshot');
    } else {
        next();
    }
},
function(session, args, next){
    if (args.response){
        session.beginDialog('validators:response', {
            prompt: session.gettext('process_existing_user_guide'),
            retryPrompt: session.gettext('invalid_response')
        });
    } else {
        next();
    }
},
function(session, args){
    dbHelper.storeResponse("process-existing-user-guide-" + counter, args.response);
    session.send("I have no more question with this process. Let's see if we have somemore on the list...");
    if (counter < functionality.length - 1) {
        counter++;
        session.replaceDialog("askFunction"); // Repeat for every function
    }else{
        session.endDialog("Alright user! It's done for now. We will continue with second discussion when enough data are collected!");
    }
}
]).reloadAction(
"restartQuestion", "Ok. Let's start over.",
{
    matches: /^start over$/i,
    confirmPrompt: "This will abort your current progress and restart. Are you sure?"
}
).endConversationAction(
"endQuestion", "Ok. Goodbye.",
{
    matches: /^cancel$|^goodbye$/i,
    confirmPrompt: "This will abort your current progress. Are you sure?"
}
);


var ScreenshotConfirm = {
    Yes: 'yes',
    No: 'no'
};


lib.dialog('addScreenshot',[
    function (session, args) {
        if(args && args.reprompt){
            var promptMessage = session.gettext('Are you able to provide us with more screen shots from this system?');
        } else {
            var promptMessage = session.gettext('If there is a system, are you able to provide us with some screen shots from this system?');
        }
        builder.Prompts.choice(session, promptMessage, [
            session.gettext(ScreenshotConfirm.Yes),
            session.gettext(ScreenshotConfirm.No)
            ]);
    },
    function (session, args) {
       if (args.response && args.response.entity === session.gettext(ScreenshotConfirm.Yes)) {
        if(args && args.reprompt){
            builder.Prompts.attachment(session, 'process_screenshot_prompt');
        }
        else{
            builder.Prompts.attachment(session, 'process_screenshot_prompt');
        }
    } else {
        session.endDialog("Okay! Let's proceed with next question.");
    }
},
function (session, args) {
    if (args.response){
       var msg = session.message;
       if (msg.attachments && msg.attachments.length > 0) {

        // Message with attachment, proceed to download it.
        var attachment = msg.attachments[0];
        var fileDownload = request(attachment.contentUrl);

        fileDownload.then(
            function (response) {
                // Send reply with attachment type & size
                var reply = new builder.Message(session)
                .text('Attachment of %s type and size of %s bytes received.', attachment.contentType, response.length);
                session.send(reply);

                // convert image to base64 string
                var imageBase64String = new Buffer(response, 'binary').toString('base64');
                dbHelper.storeImage("process-screenshot-" + counter, imageBase64String, attachment.contentType);

                // echo back uploaded image as base64 string
                var echoImage = new builder.Message(session).text('You sent:').addAttachment({
                    contentType: attachment.contentType,
                    contentUrl: 'data:' + attachment.contentType + ';base64,' + imageBase64String,
                    name: 'Uploaded image'
                });
                session.send(echoImage);
    session.replaceDialog("addScreenshot", { reprompt: true }); // Repeat asking for screenshot
}).catch(function (err) {
    console.log('Error downloading attachment:', { statusCode: err.statusCode, message: err.response.statusMessage });
});
} else {
        // Echo back users text
        session.send("You said: %s", session.message.text);
    }}}
    ]);

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};
