// src/pages/MusicConversion.js
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import BlendPad from '../components/beat/BlendPad'; // 👈 이름이 바뀐 BlendPad를 import

// --- 5단계: 컴포넌트 이름 충돌 및 누락 문제 해결 ---

const colors = {
  background: '#0A0A0A',
  cardBg: '#1A1A1A',
  primary: '#50E3C2',
  text: '#FFFFFF',
  textLight: '#CCCCCC',
  border: '#333333',
};

const GRID_CONFIG = { columns: 11, rows: 11 };
const CORNER_COLORS = [
  [167, 176, 251, 1], [228, 129, 248, 1],
  [165, 249, 209, 1], [204, 247, 153, 1],
];

export default function MusicConversion() {
  const [isLoading, setIsLoading] = useState(false); // 데이터 로딩은 빠르므로 기본값을 false로 변경
  const [puck, setPuck] = useState({ x: 0.5, y: 0.5 });

  // Puck 위치를 업데이트하는 콜백 함수
  const handlePuckDrag = (e, containerElement) => {
    if (!containerElement) return;
    
    const rect = containerElement.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;

    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

    setPuck({ x, y });
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
        <Typography sx={{ ml: 2, color: colors.textLight }}>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background, py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: colors.text, fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
          <MusicNote sx={{ mr: 1, color: colors.primary }} />
          비트 블렌더 (Beat Blender)
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: colors.cardBg,
                borderRadius: 3,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
              }}
            >
              {/* ✅ JSX에 명확하게 BlendPad 컴포넌트를 렌더링합니다. */}
              <BlendPad
                gridConfig={GRID_CONFIG}
                cornerColors={CORNER_COLORS}
                puck={puck}
                onPuckDrag={handlePuckDrag}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ bgcolor: colors.cardBg, p: 3, borderRadius: 3, border: `1px solid ${colors.border}` }}>
              <Typography sx={{ color: colors.textLight }}>시퀀서 및 컨트롤 영역</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}