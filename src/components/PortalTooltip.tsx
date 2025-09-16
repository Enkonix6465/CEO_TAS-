import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function PortalTooltip({ triggerContent, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Calculate position when tooltip opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 70, // 70px above the text
        left: rect.left,    // Aligned to the left
      });
    }
  }, [isOpen]);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer inline-block"
      >
        {triggerContent}
      </div>

      {/* Portal Tooltip */}
      {isOpen && createPortal(
        <div 
          ref={tooltipRef}
          className="fixed w-[320px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-4 z-[9999]"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px` 
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

export default PortalTooltip;