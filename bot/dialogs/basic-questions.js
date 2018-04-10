var util = require('util');
var builder = require('botbuilder');
var luisService = require('../luis-service');
var dbHelper = require('../db-helper');

var lib = new builder.Library('basic-questions');

// See overview
var SeeOverview = {
    Yes: 'yes',
    No: 'no'
};

// Ask whether a user has question
var AskQuestion = {
    Yes: 'yes',
    No: 'no'
};

var dialog = luisService.getLUIS('bot', lib);

dialog.matches('stakeholderIntro', (session, args) => {
    var roleEntity = builder.EntityRecognizer.findEntity(args.entities, 'role');
    var responsibilitiesEntity = builder.EntityRecognizer.findEntity(args.entities, 'responsibilities');
    if (roleEntity){
        session.send('Great to know that you are a/n ' + roleEntity.entity + '!');
        dbHelper.storeResponse("role", roleEntity.entity);
    } else {
        session.send('Great to know that!');
    }
    session.endDialog();
    // if (responsibilitiesEntity) {
    //     session.send('Great to know that you are a ' + responsibilitiesEntity.entity + '!')
    // }
});

// basic questions
lib.dialog('/', [
    function (session) {
        session.send('requirement_elicitation_intro');
        session.send('role');
        session.beginDialog('bot');
    },
    function (session, args) {
        session.beginDialog('validators:response', {
            prompt: session.gettext('responsible'),
            retryPrompt: session.gettext('invalid_response')
        });
    },
    function (session, args) {
        dbHelper.storeResponse("responsibility", args.response);
        session.send('Very interesting!');
        session.beginDialog('addBasicFunction');
    },
    function (session, args) {
      // sender data previously saved
      var promptMessage = session.gettext('quick_overview');
      builder.Prompts.choice(session, promptMessage, [
        session.gettext(SeeOverview.Yes),
        session.gettext(SeeOverview.No)
        ]);
        // builder.Prompts.text(session, 'quick_overview');
    },
    function (session, args, next) {
        if (args.response && args.response.entity === session.gettext(SeeOverview.Yes)) {
            // Underdevelopment
            session.send('overview');
        }
        // See overview?
        var promptMessage = session.gettext('ask_question');
        builder.Prompts.choice(session, promptMessage, [
            session.gettext(AskQuestion.Yes),
            session.gettext(AskQuestion.No)
            ]);
    },
    function (session, args, next) {
        // Ask whether user has a question
        if (args.response && args.response.entity === session.gettext(AskQuestion.Yes)) {
            // Underdevelopment, will ignore question asked
            session.beginDialog('question');
        }else{
            next();
        }
    },
    function (session, args) {
        if (args.response) {
           session.send('QnA maker goes here - in implementation');
       }
       session.beginDialog('validators:response', {
        prompt: session.gettext('business_overview'),
        retryPrompt: session.gettext('invalid_response')
    });
   },
   function (session, args) {
    dbHelper.storeResponse("business-overview", args.response);
    session.dialogData.note = args.response;
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


lib.dialog('addBasicFunction', [
    function (session, args) {
            // more function
            if(args && args.reprompt){
               builder.Prompts.text(session, 'more_basic_functionality');
           }
           else{
            builder.Prompts.text(session, 'basic_functionality');
        }
    },
    function(session, args){
        if(args.response){
            if(args.response.match(/^no more$/i)){
                session.endDialog("Okay! Let's move on then.");
            }
            else {
             dbHelper.storeResponse("basic-functionality", args.response);
                session.replaceDialog("addBasicFunction", { reprompt: true }); // Repeat asking basic function
            }
        }
    }
    ]);

// // Sender details
// var UseSavedInfoChoices = {
//     Yes: 'yes',
//     No: 'edit'
// };

// lib.dialog('sender', [
//     function (session, args, next) {
//         var sender = session.userData.sender;
//         if (sender) {
//             // sender data previously saved
//             var promptMessage = session.gettext('use_this_email_and_phone_number', sender.email, sender.phoneNumber);
//             builder.Prompts.choice(session, promptMessage, [
//                 session.gettext(UseSavedInfoChoices.Yes),
//                 session.gettext(UseSavedInfoChoices.No)
//                 ]);
//         } else {
//             // no data
//             next();
//         }
//     },
//     function (session, args, next) {
//         if (args.response && args.response.entity === session.gettext(UseSavedInfoChoices.Yes) && session.userData.sender) {
//             // Use previously saved data, store it in dialogData
//             // Next steps will skip if present
//             session.dialogData.useSaved = true;
//             session.dialogData.email = session.userData.sender.email;
//             session.dialogData.phoneNumber = session.userData.sender.phoneNumber;
//         }
//         next();
//     },
//     function (session, args, next) {
//         if (session.dialogData.useSaved) {
//             return next();
//         }
//         session.beginDialog('validators:email', {
//             prompt: session.gettext('ask_email'),
//             retryPrompt: session.gettext('invalid_email')
//         });
//     },
//     function (session, args, next) {
//         if (session.dialogData.useSaved) {
//             return next();
//         }
//         session.dialogData.email = args.response;
//         session.beginDialog('validators:phonenumber', {
//             prompt: session.gettext('ask_phone_number'),
//             retryPrompt: session.gettext('invalid_phone_number')
//         });
//     },
//     function (session, args, next) {
//         if (session.dialogData.useSaved) {
//             return next();
//         }
//         session.dialogData.phoneNumber = args.response;
//         builder.Prompts.confirm(session, 'ask_save_info');
//     },
//     function (session, args) {
//         var sender = {
//             email: session.dialogData.email,
//             phoneNumber: session.dialogData.phoneNumber
//         };

//         // Save data?
//         var shouldSave = args.response;
//         if (shouldSave) {
//             session.userData.sender = sender;
//         }

//         // return sender information
//         session.endDialogWithResult({ sender: sender });
//     }
//     ]);

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};
