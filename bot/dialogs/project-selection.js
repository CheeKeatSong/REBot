var _ = require('lodash');
var builder = require('botbuilder');
var projects = require('../../services/projects');
var SimpleWaterfallDialog = require('./SimpleWaterfallDialog');
var CarouselPagination = require('./CarouselPagination');

var carouselOptions = {
    showMoreTitle: 'title_show_more',
    showMoreValue: 'show_more',
    selectTemplate: 'select',
    pageSize: 5,
    unknownOption: 'unknown_option'
};

var lib = new builder.Library('project-selection');

// These steps are defined as a waterfall dialog,
// but the control is done manually by calling the next func argument.
lib.dialog('/',
    new SimpleWaterfallDialog([
        // First message
        function (session, args, next) {
            session.send('choose_project');
            next();
        },
        // Show Projects
        CarouselPagination.create(projects.getProjects, projects.getProject, projectMapping, carouselOptions),
        // Project selected
        function (session, args, next) {
            var project = args.selected;
            session.send('choose_document_from_project', project.name);
            session.dialogData.project = project;
            session.message.text = null;            // remove message so next step does not take it as input
            next();
        },
        // Show Documents
        function (session, args, next) {
            var projectName = session.dialogData.project.name;
            CarouselPagination.create(
                function (pageNumber, pageSize) { return projects.getDocuments(projectName, pageNumber, pageSize); },
                projects.getDocument,
                documentMapping,
                carouselOptions
            )(session, args, next);
        },
        // Document selected
        function (session, args, next) {
            // this is last step, calling next with args will end in session.endDialogWithResult(args)
            next({ selection: args.selected });
        }
]));

function projectMapping(project) {
    return {
        title: project.name,
        subtitle: project.description,
        imageUrl: 'https://placeholdit.imgix.net/~text?txtsize=48&txt=Project%20&w=640&h=330',
        buttonLabel: 'view_projects'
    };
}

function documentMapping(projectDocument) {
    return {
        title: projectDocument.name,
        subtitle: projectDocument.description,
        imageUrl: 'https://placeholdit.imgix.net/~text?txtsize=48&txt=Document%20&w=640&h=330',
        buttonLabel: 'choose_this'
    };
}

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};