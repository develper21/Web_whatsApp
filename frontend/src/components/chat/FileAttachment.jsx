import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon
} from '@mui/icons-material';

export const FileAttachment = ({ attachment, onDownload }) => {
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return <ImageIcon />;
    if (mimeType?.includes('pdf')) return <PdfIcon />;
    if (mimeType?.includes('audio')) return <AudioIcon />;
    if (mimeType?.includes('video')) return <VideoIcon />;
    return <DocumentIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Chip
        icon={getFileIcon(attachment.type)}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" component="span">
              {attachment.originalName}
            </Typography>
            <Typography variant="caption" component="span" color="text.secondary">
              ({formatFileSize(attachment.size)})
            </Typography>
          </Box>
        }
        onDelete={onDownload ? () => onDownload(attachment) : undefined}
        deleteIcon={<DownloadIcon />}
        variant="outlined"
        sx={{ 
          mr: 0.5, 
          mt: 0.5,
          borderColor: 'divider',
          color: 'text.primary',
          '& .MuiChip-deleteIcon': {
            color: 'primary.main'
          }
        }}
      />
    </Box>
  );
};