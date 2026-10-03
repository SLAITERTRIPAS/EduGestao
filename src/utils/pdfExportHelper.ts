import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  elementId: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a3' | 'a4' | 'letter';
  marginsMm?: { top: number; right: number; bottom: number; left: number } | number;
  scale?: number;
  title?: string;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Converts CSS oklch() color strings to rgb()/rgba() format.
 * This is crucial because html2canvas/jsPDF's CSS parser crashes when encountering oklch.
 */
function replaceOklchWithRgb(cssText: string): string {
  const oklchRegex = /oklch\(\s*([0-9.%+-]+)\s+([0-9.%+-]+)\s+([0-9.%a-z+-]+)(?:\s*\/\s*([0-9.%+-]+))?\s*\)/gi;
  
  return cssText.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) l = l / 100;
      
      let c = parseFloat(cStr);
      if (cStr.includes('%')) c = c / 100;
      
      let h = parseFloat(hStr);
      if (isNaN(h)) h = 0;
      
      let a: number | undefined = undefined;
      if (aStr) {
        a = parseFloat(aStr);
        if (aStr.includes('%')) a = a / 100;
      }
      
      // Convert h to radians
      const hRad = (h * Math.PI) / 180;
      
      // Oklch to Oklab
      const L = l;
      const aLab = c * Math.cos(hRad);
      const bLab = c * Math.sin(hRad);
      
      // Oklab to LMS
      const l_ = L + 0.3963377774 * aLab + 0.2158037573 * bLab;
      const m_ = L - 0.1055613458 * aLab - 0.0638541728 * bLab;
      const s_ = L - 0.0894841775 * aLab - 1.2914855480 * bLab;
      
      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;
      
      // LMS to Linear RGB
      const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
      
      // Linear RGB to sRGB
      const f = (x: number) => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      
      const r = Math.max(0, Math.min(255, Math.round(f(rL) * 255)));
      const g = Math.max(0, Math.min(255, Math.round(f(gL) * 255)));
      const b = Math.max(0, Math.min(255, Math.round(f(bL) * 255)));
      
      if (a !== undefined) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch (e) {
      console.warn('Failed to convert OKLCH color:', match, e);
      return 'rgb(120, 120, 120)'; // safe fallback
    }
  });
}

/**
 * Exports a report or document to PDF using A4 print styling classes defined in CSS.
 * Supports single and multi-page A4 documents, ensuring proper LaTeX-style typography,
 * high-resolution rendering, and automatic page splitting.
 */
export async function exportReportToPDF(options: PDFExportOptions): Promise<boolean> {
  const { 
    elementId, 
    fileName = 'Relatorio_Oficial_MINEDH.pdf', 
    orientation = 'portrait', 
    format = 'a4',
    marginsMm,
    scale: customScale = 2,
    onSuccess, 
    onError 
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[exportReportToPDF] Elemento com ID "${elementId}" não foi encontrado no DOM.`);
    if (onError) onError(new Error(`Elemento #${elementId} não encontrado`));
    return false;
  }

  // Backup original styles and classnames
  const originalClasses = element.className;
  const isLandscape = orientation === 'landscape';
  const isA3 = format === 'a3';
  const targetA4Class = isLandscape ? 'a4-landscape-document' : 'a4-portrait-document';

  // Ensure appropriate styling classes are attached
  if (!element.classList.contains(targetA4Class) && !element.classList.contains('printable-report')) {
    element.classList.add(targetA4Class);
    element.classList.add('printable-report');
  }

  // Hide action headers/buttons inside the print area temporarily if any exist
  const noPrintElements = element.querySelectorAll('.no-print, button');
  noPrintElements.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });

  // Backup and temporarily replace oklch colors in all active stylesheets of the document
  const styleElements = Array.from(document.querySelectorAll('style'));
  const originalStyleContents = new Map<HTMLStyleElement, string>();

  styleElements.forEach(styleEl => {
    if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
      originalStyleContents.set(styleEl, styleEl.textContent);
      styleEl.textContent = replaceOklchWithRgb(styleEl.textContent);
    }
  });

  try {
    // Window width for rendering canvas: A3 Landscape = 1587px, A4 Landscape = 1123px, A4 Portrait = 794px
    const windowWidth = isA3 
      ? (isLandscape ? 1587 : 1123) 
      : (isLandscape ? 1123 : 794);

    // Render HTML element to canvas with high resolution
    const canvas = await html2canvas(element, {
      scale: customScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth,
      onclone: (clonedDoc) => {
        // Also replace oklch in all style sheets in cloned document
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach(style => {
          if (style.textContent && style.textContent.includes('oklch')) {
            style.textContent = replaceOklchWithRgb(style.textContent);
          }
        });
        
        // Replace oklch in all inline style attributes in cloned document
        const allElements = clonedDoc.querySelectorAll('[style]');
        allElements.forEach(el => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && styleAttr.includes('oklch')) {
            el.setAttribute('style', replaceOklchWithRgb(styleAttr));
          }
        });
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: isA3 ? 'a3' : 'a4',
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    // Parse margins
    const mTop = typeof marginsMm === 'number' ? marginsMm : (marginsMm?.top ?? 0);
    const mRight = typeof marginsMm === 'number' ? marginsMm : (marginsMm?.right ?? 0);
    const mBottom = typeof marginsMm === 'number' ? marginsMm : (marginsMm?.bottom ?? 0);
    const mLeft = typeof marginsMm === 'number' ? marginsMm : (marginsMm?.left ?? 0);

    const usableWidth = pdfPageWidth - (mLeft + mRight);
    const usableHeight = pdfPageHeight - (mTop + mBottom);

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = mTop;

    // Add first page
    pdf.addImage(imgData, 'PNG', mLeft, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= usableHeight;

    // Multi-page loop for long reports
    while (heightLeft > 5) {
      position = mTop + (heightLeft - imgHeight);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', mLeft, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= usableHeight;
    }

    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(finalFileName);

    if (onSuccess) onSuccess();
    return true;
  } catch (err) {
    console.error('[exportReportToPDF] Erro ao exportar para PDF via html2canvas/jsPDF:', err);

    // Fallback to browser print if canvas rendering fails
    try {
      window.print();
    } catch (printErr) {
      console.error('[exportReportToPDF] Fallback de impressão falhou:', printErr);
    }

    if (onError) onError(err);
    return false;
  } finally {
    // Restore element classes and visibility
    element.className = originalClasses;
    noPrintElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });

    // Restore original stylesheets with OKLCH colors
    originalStyleContents.forEach((content, styleEl) => {
      styleEl.textContent = content;
    });
  }
}
