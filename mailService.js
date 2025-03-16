const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");
require("dotenv").config();

const sendEmail = async (to, name, phoneNumber, collegeName, uniqueId) => {
  try {
    // Paths for two PDFs
    const idCardPath = `./uploads/${uniqueId}_ID.pdf`;
    const rulesPath =`./uploads/${uniqueId}_Rules.pdf`;

    // Generate QR Code as base64
    const qrCodeData = await QRCode.toDataURL(uniqueId);

    // First PDF: ID Card
    const idCardDoc = new PDFDocument({ size: "A4", margins: { top: 50, left: 50, right: 50, bottom: 50 } });
    idCardDoc.pipe(fs.createWriteStream(idCardPath));

    // Logo and Header
    const logoPath = "./uploads/cogni.jpg";
    idCardDoc.image(logoPath, 40, 50, { width: 50 });
    idCardDoc.font("Helvetica-Bold").fontSize(24).text("COGNIZANCE 2025 IIT ROORKEE", { align: "center" });
    idCardDoc.moveDown(1);

    // ID Card dimensions (converted to points: 1px = 0.75pt in PDF)
    const idCardWidth = 660 * 0.75;  // 495pt
    const idCardHeight = 667 * 0.75; // 500.25pt
    const idCardX = (595.28 - idCardWidth) / 2; // Center horizontally on A4 (595.28pt width)
    const idCardY = 150;

    idCardDoc.lineWidth(2.5).rect(idCardX, idCardY, idCardWidth, idCardHeight).stroke();

    // Photo position (left-shifted, above QR)
    const photoX = idCardX + 20;
    const photoY = idCardY + idCardHeight - 90;
    idCardDoc.rect(photoX, photoY, 80, 80).stroke();
    idCardDoc.fontSize(10).text("Photo", photoX + 25, photoY + 35);

    // Text content
    const textStartX = idCardX + 120;
    const textStartY = idCardY + 20;
    idCardDoc.fontSize(14).fill("black");
    idCardDoc.font("Helvetica-Bold").text("Name:", textStartX, textStartY);
    idCardDoc.font("Helvetica").text(name, textStartX + 80, textStartY);
    idCardDoc.font("Helvetica-Bold").text("Email:", textStartX, textStartY + 25);
    idCardDoc.font("Helvetica").text(to, textStartX + 80, textStartY + 25);
    idCardDoc.font("Helvetica-Bold").text("Phone:", textStartX, textStartY + 50);
    idCardDoc.font("Helvetica").text(phoneNumber, textStartX + 80, textStartY + 50);
    idCardDoc.font("Helvetica-Bold").text("College:", textStartX, textStartY + 75);
    idCardDoc.font("Helvetica").text(collegeName, textStartX + 80, textStartY + 75);

    // QR Code (below photo)
    idCardDoc.image(qrCodeData, photoX, photoY - 110, { width: 100 });

    // Instructions
    const instructionX = idCardX;
    idCardDoc.font("Helvetica-Bold").fontSize(18).text("Instructions!", instructionX, idCardY + idCardHeight + 20);
    idCardDoc.font("Helvetica").fontSize(14);
    idCardDoc.text("• Please bring this ID card on the event day.", instructionX, idCardY + idCardHeight + 50);
    idCardDoc.text("• Only valid QR codes will be accepted for entry.", instructionX, idCardY + idCardHeight + 70);
    idCardDoc.text("• Ensure that your details match the registration.", instructionX, idCardY + idCardHeight + 90);
    idCardDoc.end();

    // Second PDF: Rules and Guidelines (static content from provided document)
    const rulesDoc = new PDFDocument({ size: "A4", margins: { top: 50, left: 50, right: 50, bottom: 50 } });
    rulesDoc.pipe(fs.createWriteStream(rulesPath));

    rulesDoc.font("Helvetica-Bold").fontSize(20).text("Cognizance 2025 - Rules and Guidelines", 50, 50);
    rulesDoc.moveDown(1);

    // Important Instructions
    rulesDoc.font("Helvetica-Bold").fontSize(14).text("Important Instructions for Participants");
    rulesDoc.font("Helvetica").fontSize(12);
    rulesDoc.text("1. Photographs: Carry three (3) passport-size photographs.");
    rulesDoc.text("2. Security Deposit: Carry ₹300 cash (refundable on final night).");
    rulesDoc.text("3. No-Objection Certificate: Carry printed, signed NOC.");
    rulesDoc.text("4. Extension Boards: Bring your own as per requirements.");
    rulesDoc.text("5. ID Card: Carry printed provisional ID card with photo.");
    rulesDoc.text("6. Compliance: Strictly follow all rules or face expulsion.");
    rulesDoc.moveDown(1);

    // Rules and Guidelines
    rulesDoc.font("Helvetica-Bold").fontSize(14).text("Rules and Guidelines");
    rulesDoc.font("Helvetica").fontSize(12);
    rulesDoc.text("1. General Conduct");
    rulesDoc.text("   1.1. Maintain decorum and professionalism.");
    rulesDoc.text("   1.2. No misconduct, harassment, or abuse.");
    rulesDoc.text("   1.3. Follow staff instructions.");
    rulesDoc.text("2. Verification and Identification");
    rulesDoc.text("   2.1. Present valid ID and provisional ID card when requested.");
    rulesDoc.text("   2.2. Wear approved ID card visibly at all times.");
    rulesDoc.text("3. Event Participation");
    rulesDoc.text("   3.1. Arrive 15 minutes early to events.");
    rulesDoc.text("   3.2. No cheating or plagiarism.");
    rulesDoc.text("   3.3. Maintain confidentiality of event materials.");
    rulesDoc.text("4. Safety and Security");
    rulesDoc.text("   4.1. No weapons or hazardous materials.");
    rulesDoc.text("   4.2. No smoking, alcohol, or narcotics.");
    rulesDoc.text("   4.3. Follow safety protocols.");
    rulesDoc.text("5. Property and Equipment");
    rulesDoc.text("   5.1. Handle equipment carefully.");
    rulesDoc.text("   5.2. No unauthorized use of property.");
    rulesDoc.text("6. Communication and Media");
    rulesDoc.text("   6.1. No unauthorized recording or broadcasting.");
    rulesDoc.text("   6.2. No derogatory remarks on public platforms.");
    rulesDoc.text("7. Disciplinary Actions");
    rulesDoc.text("   7.1. Committee may impose disciplinary measures.");
    rulesDoc.text("   7.2. Committee decisions are final.");
    rulesDoc.text("8. Legal and Liability");
    rulesDoc.text("   8.1. Organizers not responsible for losses or injuries.");
    rulesDoc.text("   8.2. Participation implies acceptance of rules.");
    rulesDoc.end();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Cognizance 2025 Final Tickets",
      text: `Dear ${name},\n\nAttached are your ID card and Rules & Guidelines for Cognizance 2025. Please print both and bring them to the event.`,
      attachments: [
        {
          filename: "Cognizance_2025_ID_Card.pdf",
          path: idCardPath,
          contentType: "application/pdf",
        },
        {
          filename: "Cognizance_2025_Rules_Guidelines.pdf",
          path: rulesPath,
          contentType: "application/pdf",
        },
      ],
    });

    // Clean up PDF files
    fs.unlinkSync(idCardPath);
    fs.unlinkSync(rulesPath);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;