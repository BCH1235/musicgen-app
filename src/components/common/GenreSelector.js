import React from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Paper,
  useTheme 
} from '@mui/material';

// 장르 옵션 정의
const GENRE_OPTIONS = [
  { id: 'edm', label: 'EDM', color: '#FF6B6B', description: '일렉트로닉 댄스 뮤직' },
  { id: 'lofi', label: 'Lo-Fi', color: '#4ECDC4', description: '차분하고 집중하기 좋은' },
  { id: 'citypop', label: 'City Pop', color: '#45B7D1', description: '도시적이고 세련된' },
  { id: 'acoustic', label: '어쿠스틱', color: '#96CEB4', description: '자연스럽고 따뜻한' },
  { id: 'classical', label: '클래식', color: '#FFEAA7', description: '클래식한 오케스트라' },
  { id: 'jazz', label: '재즈', color: '#DDA0DD', description: '자유롭고 즉흥적인' },
  { id: 'hiphop', label: '힙합', color: '#FFB347', description: '리듬감 있는 비트' },
  { id: 'rock', label: '록', color: '#FF7F7F', description: '파워풀하고 역동적인' },
  { id: 'pop', label: '팝', color: '#87CEEB', description: '대중적이고 친근한' },
  { id: 'ambient', label: '앰비언트', color: '#B19CD9', description: '분위기 있는 배경음악' }
];

/**
 * 장르 선택 컴포넌트
 * @param {Array} selectedGenres - 선택된 장르 ID 배열
 * @param {Function} onGenreChange - 장르 선택 변경 핸들러
 * @param {Boolean} multiSelect - 다중 선택 허용 여부 (기본값: true)
 * @param {Number} maxSelection - 최대 선택 가능 개수 (기본값: 3)
 * @param {String} title - 섹션 제목
 */
const GenreSelector = ({ 
  selectedGenres = [], 
  onGenreChange, 
  multiSelect = true, 
  maxSelection = 3,
  title = "장르 선택"
}) => {
  const theme = useTheme();

  const handleGenreClick = (genreId) => {
    if (!onGenreChange) return;

    if (multiSelect) {
      if (selectedGenres.includes(genreId)) {
        // 이미 선택된 장르 제거
        onGenreChange(selectedGenres.filter(id => id !== genreId));
      } else {
        // 새 장르 추가 (최대 선택 개수 확인)
        if (selectedGenres.length < maxSelection) {
          onGenreChange([...selectedGenres, genreId]);
        }
      }
    } else {
      // 단일 선택 모드
      onGenreChange(selectedGenres.includes(genreId) ? [] : [genreId]);
    }
  };

  const isGenreSelected = (genreId) => selectedGenres.includes(genreId);
  
  const isMaxSelectionReached = selectedGenres.length >= maxSelection && multiSelect;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      {/* 섹션 헤더 */}
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="h6" 
          component="h3"
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 0.5
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {multiSelect 
            ? `최대 ${maxSelection}개까지 선택 가능 (${selectedGenres.length}/${maxSelection})`
            : '하나의 장르를 선택해주세요'
          }
        </Typography>
      </Box>

      {/* 장르 칩 목록 */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1.5,
          alignItems: 'center'
        }}
      >
        {GENRE_OPTIONS.map((genre) => {
          const isSelected = isGenreSelected(genre.id);
          const isDisabled = !isSelected && isMaxSelectionReached;

          return (
            <Chip
              key={genre.id}
              label={genre.label}
              onClick={() => handleGenreClick(genre.id)}
              variant={isSelected ? 'filled' : 'outlined'}
              disabled={isDisabled}
              sx={{
                height: 40,
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400,
                borderWidth: 2,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                bgcolor: isSelected ? `${genre.color}20` : 'transparent',
                color: isSelected ? genre.color : 'text.secondary',
                borderColor: isSelected ? genre.color : 'divider',
                '&:hover': !isDisabled ? {
                  bgcolor: isSelected ? `${genre.color}30` : `${genre.color}10`,
                  borderColor: genre.color,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 8px ${genre.color}30`,
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
          );
        })}
      </Box>

      {/* 선택된 장르 정보 표시 */}
      {selectedGenres.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            선택된 장르:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedGenres.map(genreId => {
              const genre = GENRE_OPTIONS.find(g => g.id === genreId);
              return genre ? (
                <Typography 
                  key={genreId}
                  variant="caption"
                  sx={{ 
                    color: genre.color,
                    fontWeight: 500,
                    bgcolor: `${genre.color}10`,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}
                >
                  {genre.label}: {genre.description}
                </Typography>
              ) : null;
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// 장르 옵션을 외부에서 사용할 수 있도록 export
export { GENRE_OPTIONS };
export default GenreSelector; 