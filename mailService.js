const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const QRCode = require("qrcode");
require("dotenv").config();

const sendEmail = async (to, name, uniqueId, collegeName) => {
  try {
    const pdfPath = `./uploads/${uniqueId}.pdf`;

    // Generate QR Code as base64
    const qrCodeData = await QRCode.toDataURL(uniqueId);

    // Create PDF Document
    const pdfDoc = new PDFDocument({ size: "A4", margins: { top: 50, left: 50, right: 50, bottom: 50 } });
    pdfDoc.pipe(fs.createWriteStream(pdfPath));
    const logoPath = "./uploads/cogni.jpg";

    pdfDoc.image(logoPath, 40, 50, { width: 50 });
    pdfDoc.moveDown(1);
    pdfDoc.font("Helvetica-Bold").fontSize(24).text("COGNIZANCE 2025 IIT ROORKEE", { align: "center" });
    pdfDoc.moveDown(1);

    const idCardX = 100,
      idCardY = 150,
      idCardWidth = 400,
      idCardHeight = 220;
    pdfDoc.lineWidth(2.5).rect(idCardX, idCardY, idCardWidth, idCardHeight).stroke();

    const photoX = idCardX + idCardWidth - 90;
    pdfDoc.rect(photoX, idCardY + 10, 80, 80).stroke();
    pdfDoc.fontSize(10).text("Photo", photoX + 25, idCardY + 45);

    const textStartX = idCardX + 20,
      textStartY = idCardY + 20;
    pdfDoc.fontSize(14).fill("black");
    pdfDoc.font("Helvetica-Bold").text("Name:", textStartX, textStartY);
    pdfDoc.font("Helvetica").text(name, textStartX + 80, textStartY);
    pdfDoc.font("Helvetica-Bold").text("Email:", textStartX, textStartY + 25);
    pdfDoc.font("Helvetica").text(to, textStartX + 80, textStartY + 25);
    pdfDoc.font("Helvetica-Bold").text("College:", textStartX, textStartY + 50); // Added college name
    pdfDoc.font("Helvetica").text(collegeName, textStartX + 80, textStartY + 50);
    pdfDoc.font("Helvetica-Bold").text("Unique ID:", textStartX, textStartY + 75);
    pdfDoc.font("Helvetica").text(uniqueId, textStartX + 80, textStartY + 75);

    pdfDoc.image(qrCodeData, textStartX, idCardY + 110, { width: 100 });

    const signatureX = idCardX + idCardWidth - 130,
      signatureY = idCardY + 170;
    pdfDoc.font("Helvetica-Bold").text("Signature", signatureX, signatureY);
    pdfDoc.moveTo(signatureX, signatureY + 20).lineTo(signatureX + 100, signatureY + 20).stroke();

    const halfPageY = 420;
    pdfDoc.moveTo(50, halfPageY).lineTo(550, halfPageY).lineWidth(2).stroke();

    const instructionX = idCardX;
    pdfDoc.font("Helvetica-Bold").fontSize(18).text("Instructions!", instructionX, halfPageY + 20);
    pdfDoc.font("Helvetica").fontSize(14);
    pdfDoc.text("• Please bring this ID card on the event day.", instructionX, halfPageY + 50);
    pdfDoc.text("• Only valid QR codes will be accepted for entry.", instructionX, halfPageY + 70);
    pdfDoc.text("• Ensure that your details match the registration.", instructionX, halfPageY + 90);
    pdfDoc.end();

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
      subject: "Cognizance 2025 Final Ticket",
      text: `Dear ${name},\n\nAttached is your ID card for Cognizance 2025. Please print it and bring it to the event.`,
      attachments: [
        {
          filename: "Cognizance_2025_ID_Card.pdf",
          path: pdfPath,
          contentType: "application/pdf",
        }, 
      ],
    });
    // Clean up PDF file after sending
    fs.unlinkSync(pdfPath);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Propagate error to caller
  }
};

module.exports = sendEmail;