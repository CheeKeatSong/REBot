var _ = require('lodash');
var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');
// Connection URL
const url = 'mongodb://localhost:27017';

var allProjects, allDocuments;

MongoClient.connect(url, function(err, db) {

 if (err) throw err;
 var dbo = db.db('regen');
 assert.equal(null, err);
 console.log("Connected correctly to server");
 var col = dbo.collection('projects');

 col.find({}).toArray(function(err, docs) {
  assert.equal(null, err);
      allProjects = docs;
  });
});    

var projectsService = {

    // Projects
    getProjects: function (pageNumber, pageSize) {
        return pageItems(pageNumber, pageSize, allProjects);
    },

    // Get Single Project
    getProject: function (projectName) {
        var project = _.find(allProjects, ['name', projectName]);
        return Promise.resolve(project);
    },

     // Documents
     getDocuments: function (projectName, pageNumber, pageSize) {
        for (var i = allProjects.length - 1; i >= 0; i--) 
        {
            if (projectName === allProjects[i].name) {
               allDocuments = allProjects[i].document;
           }
       }
       console.log(allDocuments.length)
       return pageItems(pageNumber, pageSize, allDocuments);
   },

    // Get Single Document
    getDocument: function (documentName) {
        var projectDocument = _.find(allDocuments, ['name', documentName]);
        return Promise.resolve(projectDocument);
    }
};

// helpers
function pageItems(pageNumber, pageSize, items) {
    var pageItems = _.take(_.drop(items, pageSize * (pageNumber - 1)), pageSize);
    var totalCount = items.length;
    return Promise.resolve({
        items: pageItems,
        totalCount: totalCount
    });
}

// export
module.exports = projectsService;