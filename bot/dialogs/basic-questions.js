var util = require('util');
var builder = require('botbuilder');

var lib = new builder.Library('basic-questions');

const ProjectData = require('../../models/ProjectData');
const mongoose = require('mongoose');

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

// basic questions
lib.dialog('/', [
    function (session) {
        session.send('requirement_elicitation_intro');
        session.beginDialog('validators:response', {
            prompt: session.gettext('role_responsible'),
            retryPrompt: session.gettext('invalid_response')
        });
        // builder.Prompts.text(session, 'role_responsible');
    },
    function (session, args) {
        session.send('acknowledgement');
        createProjectData("5a8eaa123c7874268c0243b7","5ac0c07d11ccae31c8b9f5c5","5ac0c0af11ccae31c8b9f5c9", function(){
            storeResponse("5a8eaa123c7874268c0243b7","5ac0c07d11ccae31c8b9f5c5","5ac0c0af11ccae31c8b9f5c9","role/responsible", args.response);}
            );
        session.beginDialog('validators:response', {
            prompt: session.gettext('basic_functionality'),
            retryPrompt: session.gettext('invalid_response')
        });
        // builder.Prompts.text(session, 'basic_functionality');
    },
    function (session, args) {
        storeResponse("5a8eaa123c7874268c0243b7","5ac0c07d11ccae31c8b9f5c5","5ac0c0af11ccae31c8b9f5c9","basic-functionality", args.response);
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
        // // See overview?
        // var shouldShowOverview = args.response.toLowerCase();
        // if (shouldShowOverview && shouldShowOverview !== "no") {
        //     console.log("Quick Overview Section...")
        //     session.send('overview');
        //     // return overview information from the analysis of overall data
        //     // session.endDialogWithResult({ overview : overview });
        // }
        var promptMessage = session.gettext('ask_question');
        builder.Prompts.choice(session, promptMessage, [
            session.gettext(AskQuestion.Yes),
            session.gettext(AskQuestion.No)
            ]);
        // builder.Prompts.text(session, 'ask_question');
    },
    function (session, args, next) {
        // // Ask whether user has a question
        // var askQuestion = args.response.toLowerCase();
        // if (askQuestion && askQuestion !== "no") {
        //     builder.Prompts.text(session, 'what_question');
        // }
        // next();
        if (args.response && args.response.entity === session.gettext(AskQuestion.Yes)) {
            // Underdevelopment, will ignore question asked
            builder.Prompts.text(session, 'what_question');
        }
    },
    function (session, args) {
        session.beginDialog('validators:response', {
            prompt: session.gettext('specific_function'),
            retryPrompt: session.gettext('invalid_response')
        });
        // builder.Prompts.text(session, 'specific_function');
    },
    function (session, args) {
        storeResponse("5a8eaa123c7874268c0243b7","5ac0c07d11ccae31c8b9f5c5","5ac0c0af11ccae31c8b9f5c9","specific-functionality", args.response);
        session.dialogData.note = args.response;
        session.beginDialog('sender');
    },
    function (session, args) {
        session.dialogData.sender = args.sender;
        var details = {
            recipient: {
                firstName: session.dialogData.recipientFirstName,
                lastName: session.dialogData.recipientLastName,
                phoneNumber: session.dialogData.recipientPhoneNumber
            },
            note: session.dialogData.note,
            sender: session.dialogData.sender
        };
        session.endDialogWithResult({ details: details });
    }
    ]);

// Sender details
var UseSavedInfoChoices = {
    Yes: 'yes',
    No: 'edit'
};

lib.dialog('sender', [
    function (session, args, next) {
        var sender = session.userData.sender;
        if (sender) {
            // sender data previously saved
            var promptMessage = session.gettext('use_this_email_and_phone_number', sender.email, sender.phoneNumber);
            builder.Prompts.choice(session, promptMessage, [
                session.gettext(UseSavedInfoChoices.Yes),
                session.gettext(UseSavedInfoChoices.No)
                ]);
        } else {
            // no data
            next();
        }
    },
    function (session, args, next) {
        if (args.response && args.response.entity === session.gettext(UseSavedInfoChoices.Yes) && session.userData.sender) {
            // Use previously saved data, store it in dialogData
            // Next steps will skip if present
            session.dialogData.useSaved = true;
            session.dialogData.email = session.userData.sender.email;
            session.dialogData.phoneNumber = session.userData.sender.phoneNumber;
        }
        next();
    },
    function (session, args, next) {
        if (session.dialogData.useSaved) {
            return next();
        }
        session.beginDialog('validators:email', {
            prompt: session.gettext('ask_email'),
            retryPrompt: session.gettext('invalid_email')
        });
    },
    function (session, args, next) {
        if (session.dialogData.useSaved) {
            return next();
        }
        session.dialogData.email = args.response;
        session.beginDialog('validators:phonenumber', {
            prompt: session.gettext('ask_phone_number'),
            retryPrompt: session.gettext('invalid_phone_number')
        });
    },
    function (session, args, next) {
        if (session.dialogData.useSaved) {
            return next();
        }
        session.dialogData.phoneNumber = args.response;
        builder.Prompts.confirm(session, 'ask_save_info');
    },
    function (session, args) {
        var sender = {
            email: session.dialogData.email,
            phoneNumber: session.dialogData.phoneNumber
        };

        // Save data?
        var shouldSave = args.response;
        if (shouldSave) {
            session.userData.sender = sender;
        }

        // return sender information
        session.endDialogWithResult({ sender: sender });
    }
    ]);

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};


// Only once per project's document for user
function createProjectData(userID, projectID, documentID, callback) {

    const projectData = new ProjectData({
        userID: userID,
        projectID: projectID,
        documentID: documentID
    });

    projectData.save(err => {  
     if (err) throw err;
     console.log("Created project data.")
     callback();
 });
}

// Store respond to elicitation question
function storeResponse(userID, projectID, documentID, category, response) {

    ProjectData.update({ "userID": userID, "projectID": projectID, "documentID": documentID },{"$push": {
        "response": {
            category: category,
            data: response,
        }
    }}, err => {  
     if (err) throw err;
     console.log("Created response.")
 });
}
