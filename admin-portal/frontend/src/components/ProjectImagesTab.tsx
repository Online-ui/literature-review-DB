import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  DragIndicator as DragIcon,
  ImageSearch as ExtractIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { adminApi } from '../services/adminApi';

interface ProjectImage {
  id: number;
  filename: string;
  image_url: string;
  is_featured: boolean;
  order_index: number;
}

interface ProjectImagesTabProps {
  projectId: number;
  images: ProjectImage[];
  onImagesUpdate: () => void;
  disabled?: boolean;
}

export const ProjectImagesTab: React.FC<ProjectImagesTabProps> = ({
  projectId,
  images,
  onImagesUpdate,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleExtractImages = async () => {
    if (disabled) return;
    
    setExtracting(true);
    setError('');
    
    try {
      const result = await adminApi.extractProjectImages(projectId);
      
      if (result.message) {
        alert(result.message);
        onImagesUpdate();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract images');
    } finally {
      setExtracting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || disabled) return;

    const files = Array.from(event.target.files);
    
    // Check total limit
    if (images.length + files.length > 20) {
      setError('Maximum 20 images allowed per project');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await adminApi.uploadProjectImages(projectId, files);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (disabled) return;
    
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setDeleting(imageId);
    setError('');

    try {
      await adminApi.deleteProjectImage(projectId, imageId);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetFeatured = async (imageId: number) => {
    if (disabled) return;
    
    try {
      await adminApi.setFeaturedImage(projectId, imageId);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to set featured image');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || disabled) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Get new order of image IDs
    const imageIds = items.map(img => img.id);

    try {
      await adminApi.reorderProjectImages(projectId, imageIds);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder images');
    }
  };

  // Sort images by order_index
  const sortedImages = [...images].sort((a, b) => a.order_index - b.order_index);

  return (
    <Box>
      {/* Header with Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          bgcolor: '#f8f9fa'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
              Project Images
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {images.length}/20 images • Drag to reorder • Click star to set featured
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={extracting ? <CircularProgress size={20} /> : <ExtractIcon />}
              onClick={handleExtractImages}
              disabled={disabled || extracting}
              sx={{
                borderRadius: 3,
                borderColor: '#0a4f3c',
                color: '#0a4f3c',
                '&:hover': {
                  borderColor: '#063d2f',
                  bgcolor: alpha('#0a4f3c', 0.04)
                }
              }}
            >
              {extracting ? 'Extracting...' : 'Extract from Document'}
            </Button>
            
            <Button
              variant="contained"
              component="label"
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              disabled={disabled || uploading || images.length >= 20}
              sx={{
                borderRadius: 3,
                bgcolor: '#0a4f3c',
                '&:hover': { bgcolor: '#063d2f' }
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={disabled || uploading}
              />
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Images Grid */}
      {sortedImages.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#f8f9fa'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No images uploaded yet. Upload images or extract them from the document.
          </Typography>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <Grid
                container
                spacing={2}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedImages.map((image, index) => (
                  <Draggable
                    key={`image-${image.id}`}
                    draggableId={`image-${image.id}`}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Card
                          elevation={snapshot.isDragging ? 8 : 0}
                          sx={{
                            position: 'relative',
                            border: '1px solid',
                            borderColor: image.is_featured ? '#0a4f3c' : 'rgba(0,0,0,0.08)',
                            borderRadius: 3,
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          {/* Drag Handle */}
                          <Box
                            {...provided.dragHandleProps}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              borderRadius: 1,
                              p: 0.5,
                              cursor: 'grab',
                              '&:active': { cursor: 'grabbing' }
                            }}
                          >
                            <DragIcon />
                          </Box>

                          {/* Featured Badge */}
                          {image.is_featured && (
                            <Chip
                              label="Featured"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#0a4f3c',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          )}

                          {/* Image */}
                          <CardMedia
                            component="img"
                            height="200"
                            image={`${process.env.REACT_APP_API_URL}${image.image_url}`}
                            alt={image.filename}
                            sx={{
                              cursor: 'pointer',
                              objectFit: 'cover'
                            }}
                            onClick={() => setSelectedImage(image.image_url)}
                          />

                          {/* Actions */}
                          <CardActions sx={{ justifyContent: 'space-between' }}>
                            <Tooltip title={image.is_featured ? 'Featured image' : 'Set as featured'}>
                              <IconButton
                                onClick={() => handleSetFeatured(image.id)}
                                disabled={disabled}
                                sx={{
                                  color: image.is_featured ? '#0a4f3c' : 'text.secondary'
                                }}
                              >
                                {image.is_featured ? <StarIcon /> : <StarBorderIcon />}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete image">
                              <IconButton
                                onClick={() => handleDeleteImage(image.id)}
                                disabled={disabled || deleting === image.id}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': { bgcolor: alpha('#f44336', 0.1) }
                                }}
                              >
                                {deleting === image.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Grid>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Image Preview</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img
              src={`${process.env.REACT_APP_API_URL}${selectedImage}`}
              alt="Preview"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedImage(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
