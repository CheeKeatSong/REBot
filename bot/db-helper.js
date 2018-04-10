const ProjectData = require('../models/ProjectData');
const mongoose = require('mongoose');

var userID, projectID, documentID;

// Initiate the data
exports.initProjectVariables = function (userID, projectID, documentID) {
  this.userID = userID;
  this.projectID = projectID;
  this.documentID = documentID;
}

// Only once per project's document for user
exports.createProjectData = function () {

  const projectData = new ProjectData({
    userID: userID,
    projectID: projectID,
    documentID: documentID
  });

  ProjectData.find({userID: userID, projectID: projectID, documentID: documentID}, (err, existProject) => {  
  // Note that this error doesn't mean nothing was found,
  // it means the database had an error while searching, hence the 500 status
  if (err) return res.status(500).send(err)
    projectData.save(err => {  
     if (err) throw err;
     console.log("Created project data.")
   });
  // if (existProject) {
  // }else{

  // }
});
}

// Store respond to elicitation question
exports.storeResponse = function (category, response) {

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

// Store respond to elicitation question
exports.storeImage = function (category, data, contentType) {

  ProjectData.update({ "userID": userID, "projectID": projectID, "documentID": documentID },{"$push": {
    "response": {
      category: category,
      "img.data" : data,
      "img.contentType" : contentType
    }
  }}, err => {  
   if (err) throw err;
   console.log("Created response.")
 });
}

// Store respond to elicitation question
exports.getBasicFunctionality = function () {
 return new Promise(
  function (resolve, reject) {

    var doc = new Array();

    ProjectData.find({userID: userID, projectID: projectID, documentID: documentID}, (err, existProject) => {  
  // Note that this error doesn't mean nothing was found,
  // it means the database had an error while searching, hence the 500 status
  if (err) throw err;
  if (existProject) {
    console.log(existProject[0].response.length)
    for (var i = existProject[0].response.length - 1; i >= 0; i--) {
      if (existProject[0].response[i].category === "basic-functionality") {
        doc.push(existProject[0].response[i]);
      }
    }
    console.log(doc);
    resolve(doc);
  }
});
  }
  )
}
