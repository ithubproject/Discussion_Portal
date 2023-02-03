const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Question = require("../models/questionModel");
const Comment = require("../models/commentModel");
const Report = require("../models/reportModel");

//? Admin ko kam haru

//* Posting events and notice of the club
//* updating images of the events conducted by the club
//* creating polls for member elections also for new event and workshop
//* review reported questions and comments and reset report or delete the reported post
//* increment users to new semester after the end of running semester
//* choose next admin and leave the admin position
//*
