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
      // assert.equal(2, docs.length);
      allProjects = docs;
  });
});    

var projectsService = {

    // Projects
    getProjects: function (pageNumber, pageSize) {
        return pageItems(pageNumber, pageSize, allProjects);
        // getAllProjects(function () {
        //     return pageItems(pageNumber, pageSize, allProjects);
        // });
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

// function getAllProjects(callback) {

//     MongoClient.connect(url, function(err, db) {

//        if (err) throw err;
//        var dbo = db.db('regen');
//        assert.equal(null, err);
//        console.log("Connected correctly to server");
//        var col = dbo.collection('projects');

//   // get document
//   col.find({}).project({'name':true, 'description':true}).toArray(function(err, docs) {
//       assert.equal(null, err);
//       // assert.equal(2, docs.length);
//       allProjects = docs;
//       console.log(allProjects);

//       callback();
//   });
// });
// }

// function getAllDocuments(projectName, callback) {

//     MongoClient.connect(url, function(err, db) {

//        if (err) throw err;
//        var dbo = db.db('regen');
//        assert.equal(null, err);
//        console.log("Connected correctly to server");
//        var col = dbo.collection('projects');

//   // get document
//   col.find({'name':projectName}).project({'document':true, '_id':false}).toArray(function(err, docs) {
//       assert.equal(null, err);
//       // assert.equal(2, docs.length);
//       console.log(docs);
//       docs = docs[0].document;
//       allDocuments = docs;

//       callback();
//   });
// });    
// }

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