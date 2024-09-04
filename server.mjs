import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import cors from "cors";
import nodemailer from "nodemailer";
// Use dynamic import for ES module
const { Octokit } = await import("@octokit/rest");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const octokit = new Octokit({ auth: `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` });
const owner = "Yoogaprakash";
const repo = "YAR_Backend";

const formatTimestamp = () => {
    const date = new Date();
    return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
};

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

const sendResponseEmail = async (name, email, formType) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'web.yarts@gmail.com',
            pass: 'jgyxdfhhspjizjpz',
        },
    });

    const mailOptions = {
        from: 'web.yarts@gmail.com',
        to: email,
        subject: 'Application Received',
        text: `Hello ${name},

Thank you for your interest in our ${formType}. We have received your application and will review it shortly.

Best regards,
YAR Tech Services`,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to ', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const uploadFileToGitHub = async (fileName, content) => {
    try {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: fileName,
            message: `Added ${fileName}`,
            content: content.toString('base64'), // Encode file content to base64
            committer: {
                name: "Yoogaprakash",
                email: "yoogaprakash.k@gmail.com",
            },
            author: {
                name: "Yoogaprakash",
                email: "yoogaprakash.k@gmail.com",
            },
        });
        console.log(`${fileName} uploaded to GitHub.`);
    } catch (error) {
        console.error('Error uploading file to GitHub:', error);
    }
};

app.post("/api/submit", upload.single("resume"), async (req, res) => {
    const { name, email, phone, formType, coverLetter } = req.body;

    if (!req.file && formType === "jobs") {
        return res.status(400).send("Resume file is required for job applications.");
    }

    const filePath = path.join("applications.xlsx");
    let workbook;

    if (fs.existsSync(filePath)) {
        workbook = XLSX.readFile(filePath);
    } else {
        workbook = XLSX.utils.book_new();
    }

    let sheetName = formType === "jobs" ? "Job_Applications" : "Intern_Applications";

    let worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        worksheet = formType === "jobs"
            ? XLSX.utils.aoa_to_sheet([["Name", "Email", "Phone", "Resume"]]) // Header row for jobs
            : XLSX.utils.aoa_to_sheet([["Name", "Email", "Phone", "Cover Letter"]]); // Header row for internships
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (formType === "jobs") {
        data.push([name, email, phone, req.file.originalname]);
    } else {
        data.push([name, email, phone, coverLetter]);
    }

    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;

    // Write Excel file to memory
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    await uploadFileToGitHub('applications.xlsx', excelBuffer);

    if (formType === "jobs") {
        const resumeFileName = `${name}_${formatTimestamp()}${path.extname(req.file.originalname)}`;
        await uploadFileToGitHub(`resumes/${resumeFileName}`, req.file.buffer);
    }

    try {
        await sendResponseEmail(name, email, formType);
        res.status(200).send("Application submitted successfully, and an email has been sent.");
    } catch (error) {
        res.status(500).send("Application submitted, but there was an error sending the email.");
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
