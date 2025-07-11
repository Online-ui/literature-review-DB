import React, { useState } from 'react';
import {
  Box,
  ImageList,
  ImageListItem,
  IconButton,
  Dialog,
  DialogContent,
  Typography,
  Chip,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectImageGalleryProps {
  images: string[];
  featuredImageIndex?: number;
}

export const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({
  images,
  featuredImageIndex = 0
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'Escape') {
      setSelectedIndex(null);
    }
  };

  if (images.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
          bgcolor: alpha('#0a4f3c', 0.02),
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#0a4f3c', 0.1)
        }}
      >
        <Typography color="text.secondary">
          No images available for this project
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <ImageList cols={4} gap={8} sx={{ mt: 0 }}>
        {images.map((image, index) => (
          <ImageListItem
            key={index}
            sx={{
              cursor: 'pointer',
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              '&:hover': {
                '& img': {
                  transform: 'scale(1.05)'
                }
              }
            }}
            onClick={() => setSelectedIndex(index)}
          >
            {index === featuredImageIndex && (
              <Chip
                icon={<StarIcon />}
                label="Featured"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 1,
                  bgcolor: 'rgba(10, 79, 60, 0.9)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
            <img
              src={image}
              alt={`Project image ${index + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
            />
          </ImageListItem>
        ))}
      </ImageList>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            m: 0,
            maxHeight: '100vh'
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedIndex(null)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedIndex !== null && (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedIndex}
                  src={images[selectedIndex]}
                  alt={`Project image ${selectedIndex + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '90vh',
                    objectFit: 'contain'
                  }}
                />
              </AnimatePresence>

              {/* Navigation */}
              {selectedIndex > 0 && (
                <IconButton
                  onClick={handlePrevious}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              )}

              {selectedIndex < images.length - 1 && (
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              )}

              {/* Image counter */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}
              >
                <Typography variant="body2">
                  {selectedIndex + 1} / {images.length}
                </Typography>
              </Box>

              {/* Featured indicator */}
              {selectedIndex === featuredImageIndex && (
                <Chip
                  icon={<StarIcon />}
                  label="Featured Image"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: 'rgba(10, 79, 60, 0.9)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
