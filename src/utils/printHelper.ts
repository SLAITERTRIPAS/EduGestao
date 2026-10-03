/**
 * Universal Print Helper for MINEDH EduGestão Documents
 * Safely handles printing A4/A3 documents, certificates, declarations, pautas and reports
 * across all browsers, modals, and iframe preview environments.
 */
export interface PrintOptions {
  elementId?: string;
  title?: string;
  afterPrint?: () => void;
}

export function printDocument(param?: string | PrintOptions) {
  let elementId: string | undefined;
  let afterPrint: (() => void) | undefined;

  if (typeof param === 'string') {
    elementId = param;
  } else if (param && typeof param === 'object') {
    elementId = param.elementId;
    afterPrint = param.afterPrint;
  }

  try {
    if (elementId) {
      const targetElem = document.getElementById(elementId);
      if (targetElem) {
        targetElem.classList.add('print-target-active');
      }
    }

    // Trigger standard browser print
    window.print();

    if (afterPrint) {
      setTimeout(() => {
        afterPrint();
      }, 500);
    }
  } catch (err) {
    console.error('Falha ao acionar a impressão do navegador:', err);

    // Fallback: If window.print() fails or is blocked, open clean print window
    if (elementId) {
      const targetElem = document.getElementById(elementId);
      if (targetElem) {
        const printWindow = window.open('', '_blank', 'width=950,height=1150');
        if (printWindow) {
          const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(s => s.outerHTML)
            .join('\n');

          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt">
              <head>
                <meta charset="utf-8">
                <title>EduGestão MINEDH • Impressão de Documento Oficial</title>
                ${styles}
                <style>
                  body { background: #ffffff !important; color: #000000 !important; padding: 0 !important; margin: 0 !important; }
                  .no-print, button, header, nav, aside { display: none !important; }
                  .a4-portrait-document, .a4-landscape-document, .printable-area {
                    margin: 0 auto !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                </style>
              </head>
              <body>
                <div style="padding: 10px;">
                  ${targetElem.outerHTML}
                </div>
                <script>
                  window.onload = function() {
                    window.focus();
                    window.print();
                    setTimeout(function() { window.close(); }, 800);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          if (afterPrint) afterPrint();
        }
      }
    }
  }
}

export const triggerPrint = printDocument;
