
import { PDFPage, PDFContext, PDFName } from 'pdf-lib';
import { createCutContourPath } from '../cutContourUtils';
import { createSpotColor, createCutContourGraphicsState } from '../cutContourUtils';
import { addColorSpaceToResources, addGraphicsStateToResources, addCutContourToPage } from './pdfResourceUtils';

type CreateCutContourParams = {
  page: PDFPage;
  pdfContext: PDFContext;
  pdfPageWidth: number;
  pdfPageHeight: number;
  spotColorName: string;
  cutContourOffset: number;
  progress: any;
};

// Add cut contour to the PDF
export const createCutContour = async ({
  page,
  pdfContext,
  pdfPageWidth,
  pdfPageHeight,
  spotColorName,
  cutContourOffset,
  progress
}: CreateCutContourParams) => {
  try {
    console.log('Creating spot color for cut contour');
    // Create true spot color for the cut contour
    const spotColorData = createSpotColor(pdfContext, spotColorName);
    
    progress.incrementProgress(5, 'Erstelle Schnittmarken...');
    
    console.log('Adding spot color to page resources');
    // Add the spot color to the page resources
    addColorSpaceToResources(page, pdfContext, spotColorData);
    
    console.log('Creating graphics state for cut contour');
    // Create graphics state for the cut contour
    const gsRef = createCutContourGraphicsState(pdfContext);
    
    console.log('Adding graphics state to page resources');
    // Add the graphics state to the page resources
    addGraphicsStateToResources(page, pdfContext, gsRef);
    
    // Define cut contour path data based on image dimensions
    // The offset is the inset distance from the edge in mm
    console.log(`Creating cut contour path with offset: ${cutContourOffset}mm`);
    const pathData = createCutContourPath(
      pdfPageWidth, 
      pdfPageHeight, 
      cutContourOffset 
    );
    
    console.log('Adding cut contour path to page');
    // Add the cut contour path to the page
    addCutContourToPage(page, pdfContext, pathData);
    
    progress.incrementProgress(10, 'Schnittmarken hinzugefügt');
    
    return true;
  } catch (error) {
    console.error('Error adding cut contour:', error);
    // Continue creating the PDF without cut contour - don't fail the whole process
    console.warn('PDF will be created without cut contour');
    return false;
  }
};
