// DrawingCanvas.tsx
import React, { useState, useRef, useEffect } from 'react';

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mode, setMode] = useState<'draw' | 'erase' | 'select'>('draw');
  const [selectedStroke, setSelectedStroke] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 5;

    const handleMouseDown = (event: MouseEvent) => {
      const { offsetX, offsetY } = event;

      if (mode === 'erase') {
        const clickedStrokeIndex = findClickedStroke(offsetX, offsetY);
        if (clickedStrokeIndex !== null) {
          // Erase the entire stroke
          setStrokes((prevStrokes) => [
            ...prevStrokes.slice(0, clickedStrokeIndex),
            ...prevStrokes.slice(clickedStrokeIndex + 1),
          ]);
        }
      } else if (mode === 'select') {
        const clickedStrokeIndex = findClickedStroke(offsetX, offsetY);
        setSelectedStroke((prevSelectedStroke) =>
          prevSelectedStroke === clickedStrokeIndex ? null : clickedStrokeIndex
        );
      } else {
        // Start drawing new strokes
        setIsDrawing(true);
        setStrokes((prevStrokes) => [...prevStrokes, [{ x: offsetX, y: offsetY }]]);
      }
    };
      

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing) return;

      const { offsetX, offsetY } = event;
      setStrokes((prevStrokes) => {
        const lastStroke = [...prevStrokes.slice(-1)[0], { x: offsetX, y: offsetY }];
        return [...prevStrokes.slice(0, -1), lastStroke];
      });
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
    };

    const findClickedStroke = (x: number, y: number): number | null => {
      // Iterate through strokes and find if the click is inside any stroke
      for (let i = strokes.length - 1; i >= 0; i--) {
        const path = new Path2D();
        path.moveTo(strokes[i][0].x, strokes[i][0].y);
        strokes[i].forEach(({ x, y }, index) => {
          if (index !== 0) {
            path.lineTo(x, y);
          }
        });

        if (canvas && context.isPointInStroke(path, x, y)) {
          return i;
        }
      }

      return null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, mode, strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke, index) => {
      context.beginPath();
      stroke.forEach(({ x, y }, i) => {
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });

      if (mode === 'select' && index === selectedStroke) {
        context.lineWidth += 4;
        context.stroke();
        context.lineWidth -= 4; // Reset to default
      } else {
        context.stroke();
      }
    });
  }, [strokes, mode, selectedStroke]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ display: 'block' }}
      />
      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
        <button onClick={() => setMode('draw')}>Draw</button>
        <button onClick={() => setMode('erase')}>Erase</button>
        <button onClick={() => setMode('select')}>Select</button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
