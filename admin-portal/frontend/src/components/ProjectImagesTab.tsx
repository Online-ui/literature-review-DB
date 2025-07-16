import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CloudUpload as UploadIcon,
  DragIndicator as DragIcon,
  Refresh as RefreshIcon,
  ImageSearch as ExtractIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Project } from '../../types';
import { adminApi } from '../../services/adminApi';

interface ProjectImagesTabProps {
  project: Project;
  onUpdate: () => void;
}

export const ProjectImagesTab: React.FC<ProjectImagesTabProps> = ({ project, onUpdate }) => {
  const [images, setImages] = useState<string[]>(project.images || []);
  const [featuredIndex, setFeaturedIndex] = useState(project.featured_image_index || 0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [imageVersion, setImageVersion] = useState<{ [key: string]: number }>({});

  // Add cache busting to image URLs
  const getImageUrl = (path: string) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const version = imageVersion[path] || 0;
    return `${baseUrl}${cleanPath}?v=${version}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check limit
    if (images.length + files.length > 20) {
      setSnackbar({ open: true, message: 'Maximum 20 images allowed', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.uploadImages(project.id, Array.from(files));
      setImages(response.images);
      setSnackbar({ open: true, message: 'Images uploaded successfully', severity: 'success' });
      onUpdate();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to upload images', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;

    setLoading(true);
    try {
      await adminApi.deleteImage(project.id, deleteIndex);
      
      // Update local state
      const newImages = [...images];
      newImages.splice(deleteIndex, 1);
      setImages(newImages);
      
      // Adjust featured index if needed
      if (featuredIndex >= newImages.length) {
        setFeaturedIndex(0);
      }
      
      // Force cache refresh for all images
      const newVersions = { ...imageVersion };
      images.forEach(img => {
        newVersions[img] = (newVersions[img] || 0) + 1;
      });
      setImageVersion(newVersions);
      
      setSnackbar({ open: true, message: 'Image deleted successfully', severity: 'success' });
      onUpdate();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to delete image', severity: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteIndex(null);
    }
  };

  const handleSetFeatured = async (index: number) => {
    setLoading(true);
    try {
      await adminApi.setFeaturedImage(project.id, index);
      setFeaturedIndex(index);
      setSnackbar({ open: true, message: 'Featured image updated', severity: 'success' });
      onUpdate();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to update featured image', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Create new order array
    const newOrder = Array.from({ length: images.length }, (_, i) => i);
    const [movedIndex] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, movedIndex);

    setImages(items);
    setLoading(true);

    try {
      await adminApi.reorderImages(project.id, newOrder);
      setSnackbar({ open: true, message: 'Images reordered successfully', severity: 'success' });
      onUpdate();
    } catch (error: any) {
      // Revert on error
      setImages(images);
      setSnackbar({ open: true, message: error.message || 'Failed to reorder images', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExtractImages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.extractProjectImages(project.id);
      
      // Refresh the images list
      const updatedProject = await adminApi.getProjects({ search: project.title });
      const currentProject = updatedProject.find(p => p.id === project.id);
      
      if (currentProject) {
        setImages(currentProject.images || []);
        setSnackbar({ 
          open: true, 
          message: response.message || 'Images extracted successfully', 
          severity: 'success' 
        });
        onUpdate();
      }
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to extract images', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshImages = () => {
    // Force refresh all image versions
    const newVersions = { ...imageVersion };
    images.forEach(img => {
      newVersions[img] = Date.now();
    });
    setImageVersion(newVersions);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Project Images ({images.length}/20)
        </Typography>
        <Box>
          <Tooltip title="Refresh Images">
            <IconButton onClick={refreshImages} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {project.document_filename && (
            <Button
              variant="outlined"
              startIcon={<ExtractIcon />}
              onClick={handleExtractImages}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Extract from PDF
            </Button>
          )}
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading || images.length >= 20}
          >
            Upload Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Box>

      {images.length === 0 ? (
        <Alert severity="info">
          No images uploaded yet. Upload images or extract them from the PDF document.
        </Alert>
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
                {images.map((image, index) => (
                  <Draggable key={image} draggableId={image} index={index}>
                    {(provided, snapshot) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Badge
                          badgeContent={index === featuredIndex ? <StarIcon /> : null}
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                        >
                          <Card
                            sx={{
                              opacity: snapshot.isDragging ? 0.5 : 1,
                              cursor: 'move',
                            }}
                          >
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 0.5,
                                bgcolor: 'grey.100',
                              }}
                            >
                              <DragIcon />
                            </Box>
                            <CardMedia
                              component="img"
                              height="200"
                              image={getImageUrl(image)}
                              alt={`Image ${index + 1}`}
                              sx={{ objectFit: 'cover' }}
                              onError={(e: any) => {
                                e.target.src = '/placeholder-image.png'; // Add a placeholder image
                              }}
                            />
                            <CardActions>
                              <Tooltip title={index === featuredIndex ? 'Featured Image' : 'Set as Featured'}>
                                <IconButton
                                  onClick={() => handleSetFeatured(index)}
                                  disabled={loading}
                                  color={index === featuredIndex ? 'primary' : 'default'}
                                >
                                  {index === featuredIndex ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Image">
                                <IconButton
                                  onClick={() => {
                                    setDeleteIndex(index);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={loading}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </CardActions>
                          </Card>
                        </Badge>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this image? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
