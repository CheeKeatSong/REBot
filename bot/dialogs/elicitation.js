var util = require('util');
var builder = require('botbuilder');
var dbHelper = require('../db-helper');

var lib = new builder.Library('elicitation');
lib.dialog('/', [
    function (session) {
        // Prompt user to select one of their project
        dbHelper.initProjectVariables("5a8eaa123c7874268c0243b7","5ac0c07d11ccae31c8b9f5c5","5ac0c0af11ccae31c8b9f5c9");
        dbHelper.createProjectData();
        session.beginDialog('project-selection:/');
    },
    function (session, args) {
        // Retrieve selection, continue to elicitation process
        session.dialogData.selection = args.selection;
        session.send('confirm_choice', session.dialogData.selection.name);
        session.beginDialog('basic-questions:/');
    },
    function (session, args) {
        session.beginDialog('business-process:/');
    }
]);

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};