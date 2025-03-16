// const express = require("express");
// const router = express.Router();
// const Participant = require("../models/Participant"); // Import your Participant model
// // Verify Scanned QR Code
// router.post("/verify", async (req, res) => {
//   try {
//     const { uniqueId } = req.body;
//     // Check if the unique ID exists in the database
//     const participant = await Participant.findOne({ uniqueId });

//     if (!participant) {
//       return res.status(400).json({ success: false, message: "Invalid QR Code!" });
//     }
//     // Check if already scanned
//     if (participant.isScanned) {
//       return res.status(200).json({ success: false, message: "Already Marked Present!" });
//     }
//     // Mark attendance
//     participant.isScanned = true;
//     await participant.save();
//     res.json({ success: true, message: "Entry Verified!", participant });
//   } catch (error) {
//     console.error("Error verifying QR Code:", error);
//     res.status(500).json({ success: false, message: "Server Error!" });
//   }
// });
// module.exports = router;
