import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import { logger } from '../utils/logger.js';

/**
 * Generate a clean ATS-friendly PDF using JS-native pdf-lib (no LaTeX required).
 */
export async function generateNativePDF(data, outputPath) {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText(data.name || 'Full Name', { x: margin, y, size: 20, font: fontBold });
    y -= 25;
    
    const contactLine = [data.phone, data.email, data.location].filter(Boolean).join(' | ');
    page.drawText(contactLine, { x: margin, y, size: 10, font: fontRegular });
    y -= 20;

    // Summary
    if (data.summary) {
      page.drawText('PROFESSIONAL SUMMARY', { x: margin, y, size: 12, font: fontBold });
      y -= 15;
      const lines = wrapText(data.summary, 85);
      for (const line of lines) {
        page.drawText(line, { x: margin, y, size: 10, font: fontRegular });
        y -= 12;
      }
      y -= 10;
    }

    // Experience
    if (data.experience?.length) {
      page.drawText('WORK EXPERIENCE', { x: margin, y, size: 12, font: fontBold });
      y -= 15;

      for (const exp of data.experience) {
        page.drawText(`${exp.company || 'Company'} - ${exp.title || 'Role'}`, { x: margin, y, size: 11, font: fontBold });
        const dateStr = exp.dates || '';
        const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 10);
        page.drawText(dateStr, { x: width - margin - dateWidth, y, size: 10, font: fontRegular });
        y -= 12;

        for (const bullet of (exp.bullets || [])) {
          const bLines = wrapText(`• ${bullet}`, 80);
          for (const line of bLines) {
            page.drawText(line, { x: margin + 10, y, size: 10, font: fontRegular });
            y -= 12;
          }
        }
        y -= 8;
        if (y < 50) break; // Simple overflow check
      }
    }

    // Skills
    if (data.skills) {
      y -= 5;
      page.drawText('TECHNICAL SKILLS', { x: margin, y, size: 12, font: fontBold });
      y -= 15;
      
      let skillsText = '';
      if (Array.isArray(data.skills)) {
        skillsText = data.skills.join(', ');
      } else {
        skillsText = [
          data.skills.languages?.join(', '),
          data.skills.frameworks?.join(', '),
          data.skills.tools?.join(', ')
        ].filter(Boolean).join(' | ');
      }
      
      const sLines = wrapText(skillsText, 85);
      for (const line of sLines) {
        page.drawText(line, { x: margin, y, size: 10, font: fontRegular });
        y -= 12;
      }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    logger.info(`Native PDF generated at: ${outputPath}`);
    return outputPath;
  } catch (err) {
    logger.error('Native PDF generation failed:', err);
    throw err;
  }
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  lines.push(currentLine);
  return lines;
}
