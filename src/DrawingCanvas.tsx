import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import './style.css'

const Button = styled.button`
  width: 40px;
  height: 40px;
  background-color: white;
  border: 1px solid black;
  border-radius: 10px;
`;

const SelectedButton = styled.button`
  width: 40px;
  height: 40px;
  background-color: #89CFF0;
  border: 1px solid #89CFF0;
  border-radius: 10px;
`;

interface Point {
  x: number;
  y: number;
}

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mode, setMode] = useState<'draw' | 'erase' | 'select' | 'curve'>('draw');
  const [selectedStroke, setSelectedStroke] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number; width: number; color: string; }>>>([]);
  const [isDrawingCurve, setIsDrawingCurve] = useState(false);
  const [controlPoints, setControlPoints] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [showWidthSlider, setShowWidthSlider] = useState(false);
  const [widthValue, setWidthValue] = useState(5);
  
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(event.target.value);
  };

  const handleSliderClick = () => {
    setShowWidthSlider(!showWidthSlider);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWidthValue(Number(event.target.value));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = widthValue;
    context.strokeStyle = selectedColor;

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
        setStrokes((prevStrokes) => [...prevStrokes, [{ x: offsetX, y: offsetY, width: widthValue, color: selectedColor }]]);
      }
    };
      

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing) return;

      const { offsetX, offsetY } = event;
      setStrokes((prevStrokes) => {
        const lastStroke = [...prevStrokes.slice(-1)[0], { x: offsetX, y: offsetY, width: widthValue, color: selectedColor }];
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
  }, [isDrawing, mode, selectedColor, strokes, widthValue]);

  // scroll to adjust thickness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = event.deltaY;
      strokes.forEach((stroke, index) => {
        if (mode === 'select' && index === selectedStroke) {
          context.lineWidth = delta;
          stroke.forEach((point, index) => {
            stroke[index].width = delta;
          });
          context.stroke();
        } else {
          context.stroke();
        }
      });
    };

    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [mode, selectedStroke, strokes]);

  // Keyboardin input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;
      
      if (event.key === 'R' || event.key === 'r') {
        console.log('R pressed');
        strokes.forEach((stroke, index) => {
          if (mode === 'select' && index === selectedStroke) {
            const minX = Math.min(...stroke.map(point => point.x));
            const minY = Math.min(...stroke.map(point => point.y));
            const maxX = Math.max(...stroke.map(point => point.x));
            const maxY = Math.max(...stroke.map(point => point.y));
            const width = stroke[0].width;
        
            strokes[index] = [
              { x: minX, y: minY, width, color: selectedColor },
              { x: minX, y: maxY, width, color: selectedColor },
              { x: maxX, y: maxY, width, color: selectedColor },
              { x: maxX, y: minY, width, color: selectedColor },
              { x: minX, y: minY, width, color: selectedColor },
            ];
          }

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.beginPath();
          // If not selected, draw the current stroke
          stroke.forEach(({ x, y, width }, i) => {
            if (i === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
              context.lineWidth = width;
            }
          });
          context.stroke();
        });
      } else if (event.key === 'L' || event.key === 'l') {
        console.log('L pressed');
        context.clearRect(0, 0, canvas.width, canvas.height);

        strokes.forEach((stroke, index) => {
          context.beginPath();
        
          if (mode === 'select' && index === selectedStroke) {
            // If selected, redraw as a line from strokes[index][0] to strokes[index][-1]
            const start = stroke[0];
            const end = stroke[stroke.length - 1];
        
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.lineWidth = end.width; // Set line width to the end of the stroke
            context.strokeStyle = selectedColor;
            context.stroke();
            strokes[index] = [start, end];
          } else {
            // If not selected, draw the current stroke
            stroke.forEach(({ x, y, width, color }, i) => {
              if (i === 0) {
                context.moveTo(x, y);
              } else {
                context.lineTo(x, y);
                context.lineWidth = width;
                context.strokeStyle = color;
              }
            });
            
            context.stroke();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [mode, selectedColor, selectedStroke, strokes]);

  // selection opacity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke, index) => {
      context.beginPath();
      stroke.forEach(({ x, y, width, color }, i) => {
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
          context.lineWidth = width;
          context.strokeStyle = color;
        }
      });

      if (mode === 'select' && index !== selectedStroke) {
        context.globalAlpha = 0.4;
        context.stroke();
      } else {
        context.globalAlpha = 1;
        context.stroke();
      }
    });
  }, [strokes, mode, selectedStroke, selectedColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    if (mode === "curve") {
      const handleMouseDown = (event: MouseEvent) => {
        setIsDrawingCurve(true);
        setControlPoints([{ x: event.clientX, y: event.clientY }]);
      };
  
      const handleMouseMove = (event: MouseEvent) => {
        if (!isDrawingCurve) return;
        setControlPoints((prevPoints) => [...prevPoints, { x: event.clientX, y: event.clientY }]);
      };
  
      const handleMouseUp = () => {
        setIsDrawingCurve(false);
        // Perform additional actions after releasing the mouse button if needed
      };
  
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
  
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDrawingCurve, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    if (mode === 'curve') {
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (controlPoints.length === 4) {
        context.beginPath();
        context.moveTo(controlPoints[0].x, controlPoints[0].y);
        context.bezierCurveTo(
          controlPoints[1].x,
          controlPoints[1].y,
          controlPoints[2].x,
          controlPoints[2].y,
          controlPoints[3].x,
          controlPoints[3].y
        );
        context.stroke();
      }
    }
  }, [controlPoints, mode]);

  return (
    <div className='main'>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className='canvas'
      />
      <div className='buttons'>
        {mode === "draw" ? <SelectedButton onClick={() => setMode('draw')}>Draw</SelectedButton> : <Button onClick={() => setMode('draw')}>Draw</Button>}
        {mode === "erase" ? <SelectedButton onClick={() => setMode('erase')}>Erase</SelectedButton> : <Button onClick={() => setMode('erase')}>Erase</Button>}
        {mode === "select" ? <SelectedButton onClick={() => setMode('select')}>Select</SelectedButton> : <Button onClick={() => setMode('select')}>Select</Button>}
        {mode === "curve" ? <SelectedButton onClick={() => setMode('curve')}>Curve</SelectedButton> : <Button onClick={() => setMode('curve')}>Curve</Button>}
        <input
          type="color"
          value={selectedColor}
          onChange={handleColorChange}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            appearance: 'none', // Remove default styles (e.g., iOS appearance)
            outline: 'none', // Remove outline on focus
            border: '1px solid #89CFF0',
            backgroundColor: selectedColor,
          }}
        />
        {showWidthSlider ? <SelectedButton onClick={handleSliderClick}>Thicc</SelectedButton> : <Button onClick={handleSliderClick}>Thicc</Button>}
        {showWidthSlider && (
          <input
            type="range"
            min={1}
            max={10}
            value={widthValue}
            onChange={handleSliderChange}
          />
        )}
      </div>
    </div>
  );
};

export default DrawingCanvas;
