import React from 'react';
import { RedactionArea } from '../../types/pdf';

interface RedactionAreasListProps {
  redactionAreas: RedactionArea[];
  onRemoveArea: (index: number) => void;
  onGotoArea?: (area: RedactionArea) => void;
  currentPage?: number;
}

/**
 * Component for displaying and managing a list of redaction areas
 */
export const RedactionAreasList: React.FC<RedactionAreasListProps> = ({
  redactionAreas,
  onRemoveArea,
  onGotoArea,
  currentPage
}) => {
  // Sort areas by page number
  const sortedAreas = [...redactionAreas].sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    // If on the same page, sort by position (top to bottom, left to right)
    if (Math.abs(a.y - b.y) > 20) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  // Filter areas to show all or only current page
  const areasToShow = currentPage 
    ? sortedAreas.filter(area => area.pageNumber === currentPage)
    : sortedAreas;

  // Group areas by page
  const areasByPage = sortedAreas.reduce<Record<number, RedactionArea[]>>((acc, area) => {
    const page = area.pageNumber;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(area);
    return acc;
  }, {});

  // Get number of pages with redactions
  const pagesWithRedactions = Object.keys(areasByPage).length;

  // Handle clicking on an area to navigate to it
  const handleAreaClick = (area: RedactionArea) => {
    if (onGotoArea) {
      onGotoArea(area);
    }
  };

  return (
    <div className="p-2">
      {redactionAreas.length === 0 ? (
        <p className="text-sm text-gray-500 italic p-2">
          No redaction areas selected. Draw on the document to add redactions.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 px-2 font-semibold">
            {redactionAreas.length} {redactionAreas.length === 1 ? 'area' : 'areas'} on {pagesWithRedactions} {pagesWithRedactions === 1 ? 'page' : 'pages'}
          </div>
          {currentPage ? (
            // Show only areas on current page
            areasToShow.map((area, index) => (
              <RedactionAreaItem
                key={`${area.pageNumber}-${area.x}-${area.y}-${index}`}
                area={area}
                index={redactionAreas.indexOf(area)}
                onRemove={onRemoveArea}
                onClick={onGotoArea ? handleAreaClick : undefined}
                isCurrentPage={true}
              />
            ))
          ) : (
            // Show by page number
            Object.entries(areasByPage).map(([pageNum, areas]: [string, RedactionArea[]]) => (
              <div key={pageNum} className="mb-3">
                <h4 className="text-sm font-semibold mb-2 text-black px-2">
                  Page {pageNum} ({areas.length} {areas.length === 1 ? 'area' : 'areas'})
                </h4>
                <div className="space-y-2">
                  {areas.map((area: RedactionArea, index: number) => (
                    <RedactionAreaItem
                      key={`${area.pageNumber}-${area.x}-${area.y}-${index}`}
                      area={area}
                      index={redactionAreas.indexOf(area)}
                      onRemove={onRemoveArea}
                      onClick={onGotoArea ? handleAreaClick : undefined}
                      isCurrentPage={currentPage === area.pageNumber}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Individual redaction area item component
interface RedactionAreaItemProps {
  area: RedactionArea;
  index: number;
  onRemove: (index: number) => void;
  onClick?: (area: RedactionArea) => void;
  isCurrentPage: boolean;
}

const RedactionAreaItem: React.FC<RedactionAreaItemProps> = ({
  area,
  index,
  onRemove,
  onClick,
  isCurrentPage
}) => {
  return (
    <div 
      className={`flex justify-between items-center p-2 rounded ${
        isCurrentPage 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}
      role="listitem"
    >
      <div className="flex items-center overflow-hidden">
        <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 mr-2 text-xs font-medium text-black">
          {index + 1}
        </span>
        <span 
          className={`text-xs font-medium text-black ${onClick ? 'cursor-pointer hover:underline' : ''}`}
          onClick={onClick ? () => onClick(area) : undefined}
          title={`(${Math.round(area.x)}, ${Math.round(area.y)}) - ${Math.round(area.width)} × ${Math.round(area.height)}`}
        >
          ({Math.round(area.x)}, {Math.round(area.y)}) - {Math.round(area.width)} × {Math.round(area.height)}
        </span>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700 p-1 ml-1 flex-shrink-0"
        aria-label={`Remove redaction area ${index + 1}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}; 