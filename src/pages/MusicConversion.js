import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Slider,
} from '@mui/material';
import {
  Transform,
  CloudUpload,
  Delete,
  VolumeUp,
  Refresh
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';

import GenreCardSelector from '../components/common/GenreCardSelector';
import { useMusicContext } from '../context/MusicContext';

const MusicConversion = () => {
  const navigate = useNavigate();
  const { state, actions } = useMusicContext();
  const [audioPreview, setAudioPreview] = useState(null);

  const {
    uploadedFile,
    targetGenre,
    conversionIntensity,
    isConverting,
  } = state.conversion;

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

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      actions.setUploadedFile(file);
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  }, [actions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.flac'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isConverting
  });

  const handleRemoveFile = () => {
    actions.setUploadedFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
    }
  };

  const handleGenreChange = (genres) => {
    actions.setTargetGenre(genres[0] || '');
  };

  const handleIntensityChange = (event, newValue) => {
    actions.setConversionIntensity(newValue);
  };

  const handleStartConversion = async () => {
    if (!uploadedFile || !targetGenre) {
      actions.addNotification({
        type: 'error',
        message: '파일과 변환할 장르를 선택해주세요.'
      });
      return;
    }

    try {
      actions.startConversion();
      
      // 시뮬레이션된 변환 과정
      await simulateConversionProcess();
      
      // 변환 완료 (더미 데이터)
      const convertedMusic = {
        id: Date.now(),
        title: `Converted_${uploadedFile.name}`,
        originalFile: uploadedFile.name,
        targetGenre: targetGenre,
        intensity: conversionIntensity,
        audioUrl: '/path/to/converted/audio.mp3',
        createdAt: new Date().toISOString()
      };

      actions.completeConversion(convertedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악 변환이 완료되었습니다!'
      });

      // 결과 페이지로 이동
      navigate('/result');

    } catch (error) {
      actions.setError('음악 변환 중 오류가 발생했습니다.');
    }
  };

  const simulateConversionProcess = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        actions.updateConversionProgress?.(Math.min(progress, 95));
        
        if (progress >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            actions.updateConversionProgress?.(100);
            resolve();
          }, 500);
        }
      }, 400);
    });
  };

  const isFormValid = uploadedFile && targetGenre;

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: colors.background,
      backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
    }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ p: 3, borderRadius: '50%', bgcolor: colors.cardBg, boxShadow: `0 8px 32px ${colors.shadow}` }}>
              <Transform sx={{ fontSize: '3rem', color: colors.accent }} />
            </Box>
          </Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: colors.text, mb: 2 }}>
            음악 스타일 변환
          </Typography>
          <Typography variant="h6" sx={{ color: colors.textLight, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
            기존 음악을 새로운 장르와 스타일로 변환해보세요
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
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
              <Box sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3, color: colors.text, fontWeight: 600 }}>
                  <VolumeUp sx={{ mr: 1, color: colors.accent }} />
                  원본 음악 업로드
                </Typography>
                {!uploadedFile ? (
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? colors.accent : colors.border,
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: colors.accent, bgcolor: 'rgba(255, 215, 0, 0.1)' }
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: '3rem', color: colors.accent, mb: 2 }} />
                    <Typography variant="h6" color={colors.text} sx={{ mb: 1 }}>
                      {isDragActive ? '파일을 여기에 놓아주세요' : '파일을 드래그하거나 클릭하여 업로드'}
                    </Typography>
                    <Typography variant="body2" color={colors.textLight}>
                      지원 형식: MP3, WAV, M4A, FLAC (최대 10MB)
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} color={colors.text} noWrap>
                        {uploadedFile.name}
                      </Typography>
                      <Button startIcon={<Delete />} onClick={handleRemoveFile} disabled={isConverting} sx={{ color: colors.textLight, '&:hover': { bgcolor: colors.border, color: colors.text } }} size="small">
                        제거
                      </Button>
                    </Box>
                    {audioPreview && <audio controls src={audioPreview} style={{ width: '100%' }} disabled={isConverting} />}
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3, color: colors.text, fontWeight: 600 }}>
                  <Transform sx={{ mr: 1, color: colors.primary }} />
                  변환할 스타일 선택
                </Typography>
                <GenreCardSelector selectedGenres={targetGenre ? [targetGenre] : []} onGenreChange={handleGenreChange} maxSelection={1} />
              </Box>

              <Box sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, color: colors.text, fontWeight: 600 }}>
                  변환 강도
                </Typography>
                <Typography variant="body2" color={colors.textLight} sx={{ mb: 3 }}>
                  원곡의 특성을 얼마나 유지할지 조정합니다
                </Typography>
                <Slider
                  value={conversionIntensity}
                  onChange={handleIntensityChange}
                  defaultValue={3}
                  min={1} max={5} step={1}
                  marks={[{ value: 1, label: '약간' }, { value: 3, label: '보통' }, { value: 5, label: '강하게' }]}
                  disabled={isConverting}
                  sx={{ color: colors.accent, '& .MuiSlider-markLabel': { color: colors.textLight } }}
                />
              </Box>

              <Button 
                fullWidth 
                variant="contained" 
                size="large" 
                onClick={handleStartConversion} 
                disabled={!isFormValid || isConverting}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  bgcolor: colors.accent,
                  color: '#000000',
                  boxShadow: `0 4px 14px ${colors.shadow}`,
                  '&:hover': {
                    bgcolor: colors.accent,
                    boxShadow: `0 6px 20px ${colors.shadow}`,
                    transform: 'none'
                  },
                  '&:disabled': {
                    bgcolor: colors.border,
                    color: colors.textLight,
                    boxShadow: 'none'
                  },
                  transition: 'box-shadow 0.2s ease-in-out'
                }}
              >
                {isConverting ? (
                  <>
                    <Refresh sx={{ mr: 1, animation: 'spin 1s linear infinite', color: '#000000' }} />
                    변환 중...
                  </>
                ) : (
                  <>
                    <Transform sx={{ mr: 1, color: '#000000' }} />
                    변환 시작하기
                  </>
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MusicConversion;