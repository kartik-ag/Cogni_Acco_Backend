// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const generateQRCode = require("./qrGenerator.js");
// const sendEmail = require("./mailService.js");
// const multer = require("multer");
// const XLSX = require("xlsx");
// const fs = require("fs");

// try {
//   require("dotenv").config();
//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env file");
//   }
//   console.log("dotenv loaded successfully");
// } catch (error) {
//   console.error("Error loading dotenv:", error.message);
//   process.exit(1); // Exit if dotenv fails
// }

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.json());

// const verifyRoute = require("./routes/verify.js");
// const allotRouter = require("./routes/allot.js");
// app.use("/api", verifyRoute);
// app.use("/allot", allotRouter);

// const { admin } = require("./firebase/config.js");
// const db = admin.firestore();

// // Bulk Excel Upload Endpoint
// app.post("/upload-excel", upload.single("excelFile"), async (req, res) => {
//   try {
//     const workbook = XLSX.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const participants = XLSX.utils.sheet_to_json(sheet);

//     const participantData = [];
//     let successCount = 0;
//     let failureCount = 0;

//     for (const participant of participants) {
//       const { email, name, collegeName } = participant;
//       const uniqueID = `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//       try {
//         await sendEmail(email, name, uniqueID, collegeName);
//         participantData.push({ uniqueID, email, name, collegeName });
//         successCount++;
//       } catch (error) {
//         console.error(`Failed to send email to ${email}:`, error);
//         failureCount++;
//       }
//     }

//     fs.writeFileSync("uploads/allparticipants.json", JSON.stringify(participantData, null, 2));
//     fs.unlinkSync(req.file.path);

//     res.status(200).json({
//       message: "Processing completed",
//       successCount,
//       failureCount,
//       total: participants.length,
//     });
//   } catch (error) {
//     console.error("Error processing Excel:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Phone Verification Endpoint
// app.post("/api/auth/verify-phone", async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
//     if (!phoneNumber || phoneNumber.length < 10) {
//       return res.status(400).json({ success: false, message: "Invalid phone number format" });
//     }
//     const userDoc = await db.collection("UserTeam").doc(phoneNumber).get();
//     if (!userDoc.exists) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication failed. Phone number not authorized.",
//       });
//     }
//     const userData = userDoc.data();
//     const { name } = userData;
//     res.status(200).json({
//       success: true,
//       message: "Authentication successful",
//       user: { phoneNumber, name },
//     });
//   } catch (error) {
//     console.error("Authentication error:", error);
//     res.status(500).json({ success: false, message: "Server error during authentication" });
//   }
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // Added: Import mongoose for MongoDB
const generateQRCode = require("./qrGenerator.js");
const sendEmail = require("./mailService.js");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
try {
  require("dotenv").config();
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env file");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in .env file");
  }
  console.log("dotenv loaded successfully");
} catch (error) {
  console.error("Error loading dotenv:", error.message);
  process.exit(1);
}
// Added: Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  retryWrites: true,
  w: "majority",
});
mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err));
mongoose.connection.once("open", () => console.log("Connected to MongoDB"));

// Added: Define Participant schema for MongoDB
const participantSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  phoneNumber: {type: Number, required:true, unique: true},
  email: { type: String, required: true },
  name: { type: String, required: true },
  collegeName: { type: String },
});

const Participant = mongoose.model("Participant", participantSchema);

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const verifyRoute = require("./routes/verify.js");
const allotRouter = require("./routes/allot.js");
app.use("/api", verifyRoute);
app.use("/allot", allotRouter);

const { admin } = require("./firebase/config.js");
const db = admin.firestore();

// Bulk Excel Upload Endpoint
app.post("/upload-excel", upload.single("excelFile"), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const participants = XLSX.utils.sheet_to_json(sheet);
    const participantData = [];
    let successCount = 0;
    let failureCount = 0;

    for (const participant of participants) {
      const { email, name, collegeName, phoneNumber } = participant;
      const uniqueID = `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      try {
        await sendEmail(email, name,phoneNumber, collegeName, uniqueID);
        participantData.push({ uniqueID, phoneNumber, email, name, collegeName });
        // Added: Save to MongoDB participants collection
        await Participant.create({ uniqueID, phoneNumber, email, name, collegeName });
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failureCount++;
      }
    }

    // Unchanged: Save to filesystem (allparticipants.json)
    fs.writeFileSync("uploads/allparticipants.json", JSON.stringify(participantData, null, 2));
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Processing completed",
      successCount,
      failureCount,
      total: participants.length,
    });
  } catch (error) {
    console.error("Error processing Excel:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Phone Verification Endpoint (unchanged)
app.post("/api/auth/verify-phone", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }
    const userDoc = await db.collection("UserTeam").doc(phoneNumber).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Phone number not authorized.",
      });
    }
    const userData = userDoc.data();
    const { name } = userData;
    res.status(200).json({
      success: true,
      message: "Authentication successful",
      user: { phoneNumber, name },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, message: "Server error during authentication" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});