const mongoose = require('mongoose');

const projectDataSchema = new mongoose.Schema({
	userID: String,
	projectID: String,
	documentID: String,
	response:[{
		category: String,
		data: String,
		img: { data: Buffer, contentType: String },
	}, { timestamps: true }]
}, { timestamps: true });

const ProjectData = mongoose.model('ProjectData', projectDataSchema);

module.exports = ProjectData;
