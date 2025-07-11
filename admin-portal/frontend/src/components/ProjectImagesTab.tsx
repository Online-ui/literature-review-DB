import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Tooltip,
  alpha
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/adminApi';

interface ProjectImagesTabProps {
  projectId: number;
  images: string[];
  featuredImageIndex: number;
  onImagesUpdate: () => void;
  disabled?: boolean;
}

export const ProjectImagesTab: React.FC<ProjectImagesTabProps> = ({
  projectId,
  images,
  featuredImageIndex,
  onImagesUpdate,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 20) {
      setError(`Maximum 20 images allowed. You can add ${20 - images.length} more.`);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await adminApi.uploadImages(projectId, files);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
      
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;

    try {
      await adminApi.deleteImage(projectId, deleteIndex);
      setDeleteIndex(null);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    }
  };

  const handleSetFeatured = async (index: number) => {
    try {
      await adminApi.setFeaturedImage(projectId, index);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to set featured image');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map(item => images.indexOf(item));
    
    try {
      await adminApi.reorderImages(projectId, newOrder);
      onImagesUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder images');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#0a4f3c' }}>
          Project Images Gallery
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload up to 20 images. The starred image will be used as the featured image.
          Drag and drop to reorder images.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {uploadProgress > 0 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="project-images" direction="horizontal">
          {(provided) => (
            <Grid
              container
              spacing={2}
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ mb: 2 }}
            >
              <AnimatePresence>
                {images.map((image, index) => (
                  <Draggable
                    key={`image-${index}`}
                    draggableId={`image-${index}`}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card
                            elevation={snapshot.isDragging ? 8 : 1}
                            sx={{
                              position: 'relative',
                              borderRadius: 3,
                              overflow: 'hidden',
                              transform: snapshot.isDragging ? 'scale(1.05)' : 'scale(1)',
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                boxShadow: 4,
                                '& .image-actions': {
                                  opacity: 1
                                }
                              }
                            }}
                          >
                            {index === featuredImageIndex && (
                              <Chip
                                label="Featured"
                                size="small"
                                icon={<StarIcon />}
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
                            
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: 1,
                                p: 0.5,
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' }
                              }}
                            >
                              <DragIcon />
                            </Box>

                            <CardMedia
                              component="img"
                              height="200"
                              image={image}
                              alt={`Project image ${index + 1}`}
                              sx={{
                                cursor: 'pointer',
                                objectFit: 'cover'
                              }}
                              onClick={() => setSelectedImage(image)}
                            />
                            
                            <CardActions
                              className="image-actions"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                                justifyContent: 'space-between',
                                py: 1
                              }}
                            >
                              <Tooltip title={index === featuredImageIndex ? "Featured image" : "Set as featured"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetFeatured(index)}
                                  disabled={disabled || index === featuredImageIndex}
                                  sx={{ color: 'white' }}
                                >
                                  {index === featuredImageIndex ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete image">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteIndex(index)}
                                  disabled={disabled}
                                  sx={{ color: 'white' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </CardActions>
                          </Card>
                        </motion.div>
                      </Grid>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
              
              {images.length < 20 && (
                <Grid item xs={6} sm={4} md={3}>
                  <Card
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      border: '2px dashed',
                      borderColor: alpha('#0a4f3c', 0.3),
                      bgcolor: alpha('#0a4f3c', 0.02),
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: disabled ? alpha('#0a4f3c', 0.3) : '#0a4f3c',
                        bgcolor: disabled ? alpha('#0a4f3c', 0.02) : alpha('#0a4f3c', 0.05)
                      }
                    }}
                  >
                    <label htmlFor="image-upload" style={{ cursor: 'inherit' }}>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={disabled || uploading}
                        style={{ display: 'none' }}
                      />
                      <Box sx={{ textAlign: 'center' }}>
                        {uploading ? (
                          <CircularProgress size={40} sx={{ color: '#0a4f3c' }} />
                        ) : (
                          <>
                            <UploadIcon sx={{ fontSize: 40, color: '#0a4f3c', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              Add Images
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {20 - images.length} remaining
                            </Typography>
                          </>
                        )}
                      </Box>
                    </label>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </Droppable>
      </DragDropContext>

      {images.length === 0 && (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: alpha('#0a4f3c', 0.02),
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha('#0a4f3c', 0.1)
          }}
        >
          <ImageIcon sx={{ fontSize: 64, color: alpha('#0a4f3c', 0.3), mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No images uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload images to showcase your project
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            component="label"
            disabled={disabled || uploading}
            sx={{
              background: 'linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: 3
            }}
          >
            Upload Images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              hidden
            />
          </Button>
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
      >
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this image? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIndex(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
