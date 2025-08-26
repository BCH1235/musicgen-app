// src/components/beat/BlendPad.jsx
import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { generate4PointGradient } from '../../lib/color.js';

// --- 유틸리티 함수 (캔버스 렌더링 관련) ---
const toCSSString = (color) => `rgba(${~~color[0]},${~~color[1]},${~~color[2]},${color[3] || 1})`;
const dpr = () => window.devicePixelRatio || 1;

const setCanvasSize = (canvas, width, height) => {
  canvas.width = width * dpr();
  canvas.height = height * dpr();
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const renderGrid = (ctx, grid, getColor) => {
  const { columns, rows, width, height } = grid;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      ctx.fillStyle = toCSSString(getColor(x, y));
      ctx.fillRect(x * cellWidth * dpr(), y * cellHeight * dpr(), cellWidth * dpr(), cellHeight * dpr());
    }
  }
};

// --- 메인 컴포넌트 ---
const BlendPad = ({ gridConfig, cornerColors, puck, onPuckDrag }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // 그라데이션 색상 계산
  const gradientColors = React.useMemo(() => {
    return generate4PointGradient(
      cornerColors[0], cornerColors[1],
      cornerColors[2], cornerColors[3],
      gridConfig.columns, gridConfig.rows
    );
  }, [gridConfig, cornerColors]);

  // 캔버스 렌더링 Hook
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    
    setCanvasSize(canvas, width, height);
    
    const gridToRender = { ...gridConfig, width, height };
    renderGrid(ctx, gridToRender, (x, y) => gradientColors[x][y]);
  }, [gridConfig, gradientColors]);

  // 마우스/터치 이벤트 핸들러
  const handleDrag = (e) => {
    if (e.buttons !== 1 && e.type === 'mousemove') return;
    e.preventDefault();
    onPuckDrag(e, containerRef.current);
  };

  return (
    <Box
      ref={containerRef}
      onMouseDown={handleDrag}
      onMouseMove={handleDrag}
      onTouchStart={handleDrag}
      onTouchMove={handleDrag}
      sx={{
        width: '100%',
        aspectRatio: '1 / 1',
        position: 'relative',
        cursor: 'pointer',
        touchAction: 'none', // 모바일에서 스크롤 방지
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      <Box
        sx={{
          position: 'absolute',
          left: `${puck.x * 100}%`,
          top: `${puck.y * 100}%`,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '2px solid rgba(0,0,0,0.5)',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 20px 5px rgba(80, 227, 194, 0.3)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default BlendPad;