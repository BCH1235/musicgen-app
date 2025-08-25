// src/pages/MusicGeneration.js
import React from 'react';
import {
  Container, Box, Typography, Paper, TextField, Button, Grid, LinearProgress
} from '@mui/material';
import { MusicNote, PlayArrow, Settings, AutoAwesome, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import GenreCardSelector from '../components/common/GenreCardSelector';
import MoodSelector from '../components/common/MoodSelector';
import { useMusicContext } from '../context/MusicContext';

// ✅ 백엔드 호출
import { generateAndWait } from '../services/musicApi';

const MusicGeneration = () => {
  const navigate = useNavigate();
  const { state, actions } = useMusicContext();

  const colors = {
    background: '#0A0A0A',
    cardBg: '#1A1A1A',
    primary: '#50E3C2',
    secondary: '#40D9B8',
    accent: '#2DD4BF',
    text: '#FFFFFF',
    textLight: '#CCCCCC',
    border: '#333333',
    shadow: 'rgba(80, 227, 194, 0.3)'
  };

  const {
    selectedGenres,
    selectedMoods,
    description,
    duration,
    isGenerating
  } = state.generation;

  const isFormValid = selectedGenres.length > 0 || selectedMoods.length > 0;

  const handleGenreChange = (genres) => actions.setSelectedGenres(genres);
  const handleMoodChange = (moods) => actions.setSelectedMoods(moods);
  const handleDescriptionChange = (e) => actions.setDescription(e.target.value);

  // 프롬프트 조합
  const buildPrompt = () => {
    const g = selectedGenres.join(', ');
    const m = selectedMoods.join(', ');
    return [description, g && `genres: ${g}`, m && `mood: ${m}`]
      .filter(Boolean)
      .join(', ');
  };

  // 실제 음악 생성
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
      const prompt = buildPrompt();
      const dur = Number(duration || 30);

      const final = await generateAndWait(
        { description: prompt, duration: dur },
        (s) => actions.updateGenerationProgress(s.status && s.status !== 'succeeded' ? 50 : 0)
      );

      const generatedMusic = {
        id: Date.now(),
        title: `AI_Generated_${Date.now()}`,
        genres: selectedGenres,
        moods: selectedMoods,
        description: prompt,
        duration: dur,
        audioUrl: final.result.audioUrl, // ▶️ 실제 mp3 URL
        createdAt: new Date().toISOString()
      };

      actions.completeGeneration(generatedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악이 성공적으로 생성되었습니다!'
      });

      navigate('/result');
    } catch (error) {
      console.error(error);
      actions.setError(error.message || '음악 생성 중 오류가 발생했습니다.');
      actions.addNotification({
        type: 'error',
        message: '음악 생성에 실패했습니다. 다시 시도해주세요.'
      });
    } finally {
      // 실패하든 성공하든 스피너가 멈추도록 안전장치
      actions.updateGenerationProgress?.(0);
      actions.setGenerating?.(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.background,
        backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* 헤더 */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '50%',
                bgcolor: colors.cardBg,
                boxShadow: `0 8px 32px ${colors.shadow}`
              }}
            >
              <AutoAwesome sx={{ fontSize: '3rem', color: colors.primary }} />
            </Box>
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700, color: colors.text, mb: 2 }}
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
              {/* 장르 */}
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

              {/* 분위기 */}
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

              {/* 프롬프트 */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: colors.text, fontWeight: 600 }}
                >
                  추가 설명
                </Typography>
                <TextField
                  placeholder="어떤 느낌/상황/악기 등을 적어 주세요 (예: energetic EDM for gaming)"
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={handleDescriptionChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: colors.cardBg,
                      borderRadius: 2,
                      '& fieldset': { borderColor: colors.border },
                      '&:hover fieldset': { borderColor: colors.primary },
                      '&.Mui-focused fieldset': { borderColor: colors.primary }
                    },
                    // ✨ 입력 글씨/플레이스홀더/라벨 색상
                    '& .MuiInputBase-input': {
                      color: colors.text
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: colors.textLight,
                      opacity: 0.8
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.textLight
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: colors.primary
                    }
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
                  color: '#000',
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
                    <Refresh
                      sx={{ mr: 1, animation: 'spin 1s linear infinite', color: '#000' }}
                    />
                    음악 생성 중...
                  </>
                ) : (
                  <>
                    <PlayArrow sx={{ mr: 1, color: '#000' }} />
                    음악 생성하기
                  </>
                )}
              </Button>

              {/* 진행률 */}
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
                    sx={{ mt: 1, textAlign: 'center', color: colors.textLight }}
                  >
                    AI가 당신만의 음악을 만들고 있습니다...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* (필요 시) 사이드바 콘텐츠 */}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MusicGeneration;
