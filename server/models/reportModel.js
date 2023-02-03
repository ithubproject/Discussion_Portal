const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({
  reportedOn: {
    type: mongoose.Types.ObjectId,
  },
  count: {
    type: Number,
    default: 0,
  },
  reasons: [
    {
      type: String,
      require: true,
    },
  ],
  resolved: {
    type: Boolean,
    default: false,
  },
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
