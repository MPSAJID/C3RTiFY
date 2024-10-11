
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function generateCertificate(outputPath, USN, sem, branch, candidateName, courseName, dateofcomp, instituteLogoPath) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);

    const { width, height } = page.getSize();

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const TimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const borderWidth = 2;
    const borderColor = rgb(0, 0, 0);
    page.drawRectangle({
        x: borderWidth / 2,
        y: borderWidth / 2,
        width: width - borderWidth,
        height: height - borderWidth,
        borderColor: borderColor,
        borderWidth: borderWidth,
    });

    // Add institute title, center-aligned
    page.drawText('UNIVERSITY OF VISVESVARAYA COLLEGE OF ENGINEERING', {
        x: (width / 2) - 300,
        y: height - 80,
        size: 28,
        font: HelveticaBold,
    });

    page.drawText('M A R V E L  R & D  L A B', {
        x: (width / 2) - 140,
        y: height - 120,
        size: 27,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });

    // Add logo if provided
    if (instituteLogoPath) {
        const logoBytes = fs.readFileSync(instituteLogoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImage.scale(0.2);
        page.drawImage(logoImage, {
            x: (width / 2) - (logoDims.width / 2),
            y: height - 200,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    // Add certificate title, center-aligned
    page.drawText('Certificate of Completion', {
        x: (width / 2) - 150,
        y: height - 250,
        size: 28,
        font: TimesRomanBold,
        color: rgb(0, 0, 0),
    });

    // Add recipient details, left-aligned with proper spacing
    const recipientText = `
    \tHereby certifies that ${candidateName} with USN ${USN} from ${sem} sem 
    ${branch} has fulfilled all the prescribed requirements for the
    completion of the ${courseName} course as on ${dateofcomp}.
    `;
    page.drawText(recipientText.trim(), {
        x: 60,
        y: height - 320,
        size: 18,
        font: timesRomanFont,
        lineHeight: 24,
    });

    // Add signature placeholders
    page.drawText('uvcega president', {
        x: 60,
        y: 100,
        size: 25,
    });

    page.drawText('faculty advisor', {
        x: width - 240,
        y: 100,
        size: 25,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Certificate generated and saved at: ${outputPath}`);
};


async function extractCertificate(pdfPath) {
    const pdfjsLib = await import('pdfjs-dist');

    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;

    let text = '';
    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        textContent.items.forEach((item) => {
            text += item.str + '\n';
        });
    }

    const lines = text.split('\n');
    const candidateName = lines[2];
    const USN = lines[4];
    const courseName = lines[6];

    return { USN, candidateName, courseName};
}



    // generateCertificate('certificate1.pdf', '12345','4thsem ','CSE', 'sajid', 'clcy-2','sept23', , 'G:/proj/C3RTiFY//frontend/public/marvel.png');
    module.exports={generateCertificate}
   