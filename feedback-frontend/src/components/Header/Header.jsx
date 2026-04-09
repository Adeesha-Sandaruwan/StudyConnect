import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
} from '@mui/material';
import FeedbackRoundedIcon from '@mui/icons-material/FeedbackRounded';
import PeopleIcon from '@mui/icons-material/People';

const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" color="inherit" elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}
    >
      <Toolbar sx={{ gap: 1.5 }}>

        {/* Logo */}
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          <FeedbackRoundedIcon fontSize="small" />
        </Avatar>
        <Typography variant="h6" fontWeight={800} color="primary" sx={{ flexGrow: 1 }}>
          FeedbackHub
        </Typography>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>

         

          <Button
            variant="contained"
            startIcon={<FeedbackRoundedIcon />}
            onClick={() => navigate('/feedbacks')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Feedbacks
          </Button>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;