var util = require('util');
var builder = require('botbuilder');

var lib = new builder.Library('elicitation');
lib.dialog('/', [
    function (session) {
        // Prompt user to select one of their project
        session.beginDialog('project-selection:/');
    },
    // function (session, args) {
    //     // Retrieve selection, continue to elicitation process
    //     session.dialogData.selection = args.selection;
    //     session.beginDialog('delivery:date');
    // },
    function (session, args) {
        // Retrieve selection, continue to elicitation process
        session.dialogData.selection = args.selection;
        session.send('confirm_choice', session.dialogData.selection.name);
        session.beginDialog('basic-questions:/');
    },
    function (session, args) {
        // Retrieve details, continue to billing address
        session.dialogData.details = args.details;
        session.beginDialog('address:billing');
    },
    function (session, args, next) {
        // Retrieve billing address
        session.dialogData.billingAddress = args.billingAddress;
        next();
    },
    function (session, args) {
        // Continue to checkout
        var order = {
            selection: session.dialogData.selection,
            delivery: {
                date: session.dialogData.deliveryDate,
                address: session.dialogData.recipientAddress
            },
            details: session.dialogData.details,
            billingAddress: session.dialogData.billingAddress
        };

        console.log('order', order);
        session.beginDialog('checkout:/', { order: order });
    }
]);

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};