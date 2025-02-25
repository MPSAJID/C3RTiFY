
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function generateCertificate(outputPath, USN, sem,branch, candidateName, courseName, dateofcomp, instituteLogoPath) {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);

    const { width, height } = page.getSize();
    console.log(width);
 
    
    const timesRomanFont=await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const TimesRomanBold=await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const HelveticaBold=await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const borderWidth = 2; // Set border thickness
        const borderColor = rgb(0, 0, 0); // Set border color
        page.drawRectangle({
            x: borderWidth / 2,
            y: borderWidth / 2,
            width: width - borderWidth,
            height: height - borderWidth,
            borderColor: borderColor,
            borderWidth: borderWidth,
        });
    
    page.drawText('UNIVERSITY OF VISVESVARAYA COLLEGE OF ENGINEERING', {
        x: 20,
        y: height - 80,
        size: 28,
        font: HelveticaBold,
        lineHeight: 33,
        
    });
    
    page.drawText('M A R V E L  R & D  L A B', {
        x: 200,
        y: height - 140,
        size: 27,
        font: timesRomanFont,
        color: rgb(0,0,0),
    });
    // Add institute logo
    if (instituteLogoPath) {
        const logoBytes = fs.readFileSync(instituteLogoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImage.scale(0.2);
        page.drawImage(logoImage, {
            x:300,
            y: height - 180,
            size : 125,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    // Add title
    page.drawText('Certificate of Completion', {
        x: 150,
        y: height - 220,
        size: 28,
        font: TimesRomanBold,
        color: rgb(0, 0, 0),
    });
    

    // Add recipient name, USN, and course name
    const recipientText = `
    \tHereby certifies that ${candidateName} with USN ${USN} from ${sem} sem 
    ${branch} has fulfilled all the prescribed requirements for the
    completion of the ${courseName} course as on ${dateofcomp}.
    `;
    page.drawText(recipientText.trim(), {
        x: 50,
        y: height - 280,
        size: 28,
        font: timesRomanFont,
        lineHeight: 30, // Adjust this value as needed for spacing
    });

   
    page.drawText('uvcega president',{
        x:30,
        y: height-500,
        size: 25,
    });
    page.drawText('faculty advisor',{
        x:4800,
        y: height-500,
        size: 25,
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
    const candidateName = lines[2];
    const USN = lines[4];
    const courseName = lines[6];

    return { USN, candidateName, courseName};
}



    // generateCertificate('certificate1.pdf', '12345','4thsem ','CSE', 'sajid', 'clcy-2','sept23', , 'G:/proj/C3RTiFY/public/marvel.png');
    module.exports={generateCertificate}
   