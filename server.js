const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
async function main() {
  await mongoose.connect(process.env.ATLAS_URL);
}
main()
  .then(() => {
    console.log("connected to the database");
  })
  .catch((err) => {
    console.log(err);
  });
const questionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+\..+/.test(v); // Basic validation for URL format
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    question: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    topic: { type: String, required: true },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);
const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true }, // Ensure username is unique
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);
const Question = mongoose.model("Question", questionSchema);
app.post("/api/submit", async (req, res) => {
  const { userName, question, difficulty, topic, url, remarks } = req.body;

  if (!userName || !question) {
    return res
      .status(400)
      .json({ error: "Username and question are required" });
  }

  try {
    // Check if the user exists; if not, create a new user
    let user = await User.findOne({ userName });
    if (!user) {
      user = new User({ userName });
      await user.save();
    }

    // Create a new question object with a reference to the user
    const newQuestion = new Question({
      userId: user._id,
      url,
      question,
      difficulty,
      topic,
      remarks,
    });

    // Save the question document
    await newQuestion.save();

    console.log("Received: ", req.body);
    res
      .status(200)
      .json({ message: "Question received successfully!", question });
  } catch (error) {
    console.error("Error saving the question:", error);
    res
      .status(500)
      .json({ error: "Failed to save question. Please try again" });
  }
});
app.listen(3010, () => {
  console.log("Server is running on http://localhost:3010");
});
