import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  MusicNote,
  PlayArrow,
  Settings,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  BookmarkBorder,
  Refresh,
  VolumeUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 컴포넌트 import (경로가 맞는지 확인해주세요)
import GenreCardSelector from '../components/common/GenreCardSelector';
import MoodSelector from '../components/common/MoodSelector';
import { useMusicContext } from '../context/MusicContext';

const MusicGeneration = () => {
  const navigate = useNavigate();
  const { state, actions } = useMusicContext();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(120);

  // 검은색 배경에 에메랄드 테마
  const colors = {
    background: '#0A0A0A',         // 검은색 배경
    cardBg: '#1A1A1A',            // 어두운 카드 배경
    primary: '#50E3C2',           // 에메랄드 (Emerald)
    secondary: '#40D9B8',         // 연한 에메랄드
    accent: '#2DD4BF',            // 터콰이즈 (Teal)
    text: '#FFFFFF',              // 흰색 텍스트
    textLight: '#CCCCCC',         // 연한 회색 텍스트
    border: '#333333',            // 어두운 테두리
    shadow: 'rgba(80, 227, 194, 0.3)' // 에메랄드 그림자
  };

  // 로컬 상태에서 Context 상태 가져오기
  const {
    selectedGenres,
    selectedMoods,
    description,
    duration,
    isGenerating,
    generationProgress
  } = state.generation;

  // 음악 길이 옵션
  const durationOptions = [
    { value: 15, label: '15초' },
    { value: 30, label: '30초' },
    { value: 45, label: '45초' },
    { value: 60, label: '1분' }
  ];

  // 폼 유효성 검증
  const isFormValid = selectedGenres.length > 0 || selectedMoods.length > 0;

  // 이벤트 핸들러들
  const handleGenreChange = (genres) => {
    actions.setSelectedGenres(genres);
  };

  const handleMoodChange = (moods) => {
    actions.setSelectedMoods(moods);
  };

  const handleDescriptionChange = (event) => {
    actions.setDescription(event.target.value);
  };

  const handleDurationChange = (event) => {
    const value = event.target.value;
    if (value === 'custom') {
      actions.setDuration(customDuration);
    } else {
      actions.setDuration(parseInt(value));
    }
  };

  // 음악 생성 시작
  const handleGenerateMusic = async () => {
    if (!isFormValid) {
      actions.addNotification({
        type: 'error',
        message: '장르 또는 분위기를 최소 하나 이상 선택해주세요.'
      });
      return;
    }

    try {
      actions.startGeneration();
      await simulateGenerationProcess();

      const generatedMusic = {
        id: Date.now(),
        title: `AI_Generated_${Date.now()}`,
        genres: selectedGenres,
        moods: selectedMoods,
        description: description,
        duration: duration,
        audioUrl: '/path/to/generated/audio.mp3',
        createdAt: new Date().toISOString()
      };

      actions.completeGeneration(generatedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악이 성공적으로 생성되었습니다!'
      });

      navigate('/result');

    } catch (error) {
      actions.setError('음악 생성 중 오류가 발생했습니다.');
      actions.addNotification({
        type: 'error',
        message: '음악 생성에 실패했습니다. 다시 시도해주세요.'
      });
    }
  };

  // 생성 과정 시뮬레이션 함수
  const simulateGenerationProcess = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        actions.updateGenerationProgress(Math.min(progress, 95));
        
        if (progress >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            actions.updateGenerationProgress(100);
            resolve();
          }, 500);
        }
      }, 300);
    });
  };

  const handleSaveToLibrary = () => {
    try {
      actions.addToLibrary(state.generation.generatedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악이 라이브러리에 저장되었습니다!'
      });
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: '라이브러리 저장에 실패했습니다.'
      });
    }
  };

  const handleRegenerateMusic = () => {
    actions.clearGeneratedMusic();
    handleGenerateMusic();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: colors.background,
      backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
    }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* 페이지 헤더 */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{
              p: 3,
              borderRadius: '50%',
              bgcolor: colors.cardBg,
              boxShadow: `0 8px 32px ${colors.shadow}`
            }}>
              <AutoAwesome sx={{ fontSize: '3rem', color: colors.primary }} />
            </Box>
          </Box>
          
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              color: colors.text,
              mb: 2
            }}
          >
            AI 음악 생성
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: colors.textLight,
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            원하는 장르와 분위기를 선택하여 AI가 만든 음악을 경험해보세요
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* 음악 생성 폼 */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                bgcolor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
                boxShadow: `0 4px 20px ${colors.shadow}`
              }}
            >
              {/* 장르 선택 */}
              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    color: colors.text,
                    fontWeight: 600
                  }}
                >
                  <MusicNote sx={{ mr: 1, color: colors.primary }} />
                  장르 선택
                </Typography>
                <GenreCardSelector
                  selectedGenres={selectedGenres}
                  onGenreChange={handleGenreChange}
                  maxSelection={1}
                />
              </Box>

              {/* 분위기 선택 */}
              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    color: colors.text,
                    fontWeight: 600
                  }}
                >
                  <Settings sx={{ mr: 1, color: colors.secondary }} />
                  분위기 선택
                </Typography>
                <MoodSelector
                  selectedMoods={selectedMoods}
                  onMoodChange={handleMoodChange}
                  maxSelection={3}
                />
              </Box>

              {/* 프롬프트 입력 */}
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    color: colors.text,
                    fontWeight: 600
                  }}
                >
                  추가 설명
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={handleDescriptionChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: colors.cardBg,
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: colors.border,
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary,
                      },
                    },
                  }}
                />
              </Box>

              {/* 생성 버튼 */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGenerateMusic}
                disabled={isGenerating || selectedGenres.length === 0}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  bgcolor: colors.primary,
                  color: '#000000',
                  boxShadow: `0 4px 14px ${colors.shadow}`,
                  '&:hover': {
                    bgcolor: colors.primary,
                    boxShadow: `0 6px 20px ${colors.shadow}`,
                    transform: 'none'
                  },
                  '&:disabled': {
                    bgcolor: colors.border,
                    color: colors.textLight
                  },
                  transition: 'box-shadow 0.2s ease-in-out'
                }}
              >
                {isGenerating ? (
                  <>
                    <Refresh sx={{ mr: 1, animation: 'spin 1s linear infinite', color: '#000000' }} />
                    음악 생성 중...
                  </>
                ) : (
                  <>
                    <PlayArrow sx={{ mr: 1, color: '#000000' }} />
                    음악 생성하기
                  </>
                )}
              </Button>

              {/* 생성 진행률 */}
              {isGenerating && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress 
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: colors.border,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.primary,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 1, 
                      textAlign: 'center',
                      color: colors.textLight
                    }}
                  >
                    AI가 당신만의 음악을 만들고 있습니다...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 사이드바 */}
          <Grid item xs={12} md={4}>
            {/* ... existing sidebar content with updated colors ... */}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MusicGeneration;