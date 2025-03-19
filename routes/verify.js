// const express = require("express");
// const fs = require("fs");
// const path = require("path");

// const router = express.Router();
// const uploadsDir = path.join(__dirname, "../uploads");

// router.post("/verify", async (req, res) => {
//   try {
//     const { uniqueId, uniqueID } = req.body;
//     const scannedId = uniqueId || uniqueID;

//     if (!scannedId) {
//       return res.status(400).json({ success: false, message: "QR Code data missing!" });
//     }

//     const participantsFilePath = path.join(uploadsDir, "allparticipants.json");
//     const scannedFilePath = path.join(uploadsDir, "scanned.json");

//     // Check if participant exists
//     let participants = [];
//     if (fs.existsSync(participantsFilePath)) {
//       participants = JSON.parse(fs.readFileSync(participantsFilePath, "utf-8"));
//     }
//     const participantExists = participants.some((p) => p.uniqueID === scannedId);
//     if (!participantExists) {
//       return res.status(404).json({ success: false, message: "Invalid QR Code!" });
//     }
//     // Check if already scanned
//     let scannedList = [];
//     if (fs.existsSync(scannedFilePath)) {
//       scannedList = JSON.parse(fs.readFileSync(scannedFilePath, "utf-8"));
//     }
//     if (scannedList.includes(scannedId)) {
//       return res.status(200).json({ success: false, message: "Already Marked Present!" });
//     }

//     // Mark as scanned
//     scannedList.push(scannedId);
//     fs.writeFileSync(scannedFilePath, JSON.stringify(scannedList, null, 2));

//     res.json({ success: true, message: "Entry Verified!", uniqueId: scannedId });
//   } catch (error) {
//     console.error("Error verifying QR Code:", error);
//     res.status(500).json({ success: false, message: "Server Error! Please try again." });
//   }
// });
// module.exports = router;
// const express = require("express");
// const mongoose = require("mongoose"); // Added: Import mongoose for MongoDB
// const fs = require("fs");
// const path = require("path");

// const router = express.Router();
// const uploadsDir = path.join(__dirname, "../uploads");

// // Added: Define Scanned schema for MongoDB
// const scannedSchema = new mongoose.Schema({
//   uniqueID: { type: String, required: true, unique: true },
//   scannedAt: { type: Date, default: Date.now },
// });

// const Scanned = mongoose.model("Scanned", scannedSchema);

// router.post("/verify", async (req, res) => {
//   try {
//     const { uniqueId, uniqueID } = req.body;
//     const scannedId = uniqueId || uniqueID;

//     if (!scannedId) {
//       return res.status(400).json({ success: false, message: "QR Code data missing!" });
//     }

//     const participantsFilePath = path.join(uploadsDir, "allparticipants.json");
//     const scannedFilePath = path.join(uploadsDir, "scanned.json");

//     // Check if participant exists (unchanged)
//     let participants = [];
//     if (fs.existsSync(participantsFilePath)) {
//       participants = JSON.parse(fs.readFileSync(participantsFilePath, "utf-8"));
//     }
//     const participantExists = participants.some((p) => p.uniqueID === scannedId);
//     if (!participantExists) {
//       return res.status(404).json({ success: false, message: "Invalid QR Code!" });
//     }

//     // Check if already scanned (unchanged)
//     let scannedList = [];
//     if (fs.existsSync(scannedFilePath)) {
//       scannedList = JSON.parse(fs.readFileSync(scannedFilePath, "utf-8"));
//     }
//     if (scannedList.includes(scannedId)) {
//       return res.status(200).json({ success: false, message: "Already Marked Present!" });
//     }

//     // Mark as scanned (unchanged: filesystem)
//     scannedList.push(scannedId);
//     fs.writeFileSync(scannedFilePath, JSON.stringify(scannedList, null, 2));

//     // Added: Save to MongoDB scanned collection
//     await Scanned.create({ uniqueID: scannedId });

//     res.json({ success: true, message: "Entry Verified!", uniqueId: scannedId });
//   } catch (error) {
//     console.error("Error verifying QR Code:", error);
//     res.status(500).json({ success: false, message: "Server Error! Please try again." });
//   }
// });

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const scannedSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  email: {type: String,required: true,unique: true},
  name: {type: String, required: true},
  phoneNumber: {type: String, required: true, unique: true},
  scannedAt: { type: Date, default: Date.now },
});
const Scanned = mongoose.model("Scanned", scannedSchema);
// Reference the Participant model defined in index.js (unchanged)
const Participant = mongoose.model("Participant");

router.post("/verify", async (req, res) => {
  try {
    const { uniqueId, uniqueID } = req.body;
    const scannedId = uniqueId || uniqueID;

    if (!scannedId) {
      return res.status(400).json({ success: false, message: "QR Code data missing!" });
    }
    const participant = await Participant.findOne({ uniqueID: scannedId }).exec();
    console.log(participant)
    if (!participant) {
      return res.status(404).json({ success: false, message: "Invalid QR Code!" });
    }
    const existingScan = await Scanned.findOne({ uniqueID: scannedId }).exec();
    if (existingScan) {
      return res.status(200).json({ success: false, message: "Already Marked Present!" });
    }
    // Save to MongoDB scanned collection (unchanged)
    await Scanned.create({ uniqueID: scannedId, email: participant.email, name: participant.name, phoneNumber: participant.phoneNumber});

    res.json({ success: true, message: "Entry Verified!", uniqueId: scannedId });
  } catch (error) {
    console.error("Error verifying QR Code:", error);
    res.status(500).json({ success: false, message: "Server Error! Please try again." });
  }
});


router.post("/get-scanned", async (req, res) => {
  try {
    const { uniqueIDs } = req.body;
    
    if (!Array.isArray(uniqueIDs) || uniqueIDs.length === 0) {
      return res.status(400).json({ error: "Invalid input: uniqueIDs must be a non-empty array." });
    }

    const scannedRecords = await Scanned.find({ uniqueID: { $in: uniqueIDs } });

    res.status(200).json({ success: true, data: scannedRecords });
  } catch (error) {
    console.error("Error fetching scanned records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;