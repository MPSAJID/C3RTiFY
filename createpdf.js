
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function generateCertificate(outputPath, USN, sem,branch, candidateName, courseName, dateofcomp, clgname, instituteLogoPath) {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const { width, height } = page.getSize();
    const fontSize = 16;
 
    
    const timesRomanFont=await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    page.drawText('UNIVERSITY OF VISVESVARAYA \nCOLLEGE OF ENGINEERING', {
        x: 50,
        y: height - 4 * fontSize,
        size: 22,
        font: timesRomanFont,
        
    })

    // Add institute logo
    if (instituteLogoPath) {
        const logoBytes = fs.readFileSync(instituteLogoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImage.scale(0.2);
        page.drawImage(logoImage, {
            x: 50,
            y: height - 150,
            width: logoDims.width,
            height: logoDims.height,
        });
    }
    // Add institute name
    const instituteFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(clgname, {
        x: 50,
        y: height - 200,
        size: 15,
        font: instituteFont,
        color: rgb(0, 0, 0),
    });

    // Add title
    page.drawText('Certificate of Completion', {
        x: 50,
        y: height - 250,
        size: 25,
        font: instituteFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('MARVEL R & D LAB', {
        x: 50,
        y: height - 270,
        size: 23,
        font: instituteFont,
        color: rgb(0, 0, 0),
    });

    // Add recipient name, USN, and course name
    const recipientText = `Hereby certifies that\n${candidateName}\nwith USN ${USN}\n from ${sem} sem ${branch}\n
                    has fulfilled all the prescribed requirements for the completion of the \n${courseName}\n course as on ${dateofcomp}`;
    const recipientLines = recipientText.split('\n');
    const textY = height - 300;
    recipientLines.forEach((line, idx) => {
        page.drawText(line, {
            x: 50,
            y: textY - (fontSize + 5) * idx,
            size: fontSize,
            font: instituteFont,
            
        });
    });

    // Save the PDF document
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`Certificate generated and saved at: ${outputPath}`);
}

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
    const clgname = lines[0];
    const candidateName = lines[2];
    const USN = lines[4];
    const courseName = lines[6];

    return { USN, candidateName, courseName, clgname };
}

// Example usage:
// generateCertificate('certificate.pdf', '12345', 'John Doe', 'JavaScript Programming', 'OpenAI', 'path/to/logo.png');
// extractCertificate('certificate.pdf').then(console.log);

    // generateCertificate('certificate1.pdf', '12345','4thsem CSE', 'sajid', 'clcy-2','sept23', 'uvce', 'G:/proj/C3RTiFY/public/marvel.png');
    module.exports={generateCertificate}