import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Grid, Rating, TextField, Button,
  CircularProgress, Alert, Chip, Avatar, Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SendIcon from '@mui/icons-material/Send';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyFeedbacks, submitFeedback, clearFeedbackError } from '../../features/patient/patientSlice';
import { toast } from 'react-toastify';

const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const GiveFeedback = () => {
  const dispatch = useDispatch();
  const { feedbacks, feedbackLoading, feedbackSubmitting, feedbackError } = useSelector((s) => s.patient);

  const [form, setForm] = useState({ overallRating: 0, doctorRating: 0, serviceRating: 0, waitTimeRating: 0, comment: '' });

  useEffect(() => { dispatch(fetchMyFeedbacks()); }, [dispatch]);
  useEffect(() => {
    if (feedbackError) { toast.error(feedbackError); dispatch(clearFeedbackError()); }
  }, [feedbackError, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.overallRating === 0) { toast.error('Please provide an overall rating'); return; }
    if (!form.comment.trim()) { toast.error('Please write a comment'); return; }
    const res = await dispatch(submitFeedback(form));
    if (!res.error) {
      toast.success('Thank you for your feedback!');
      setForm({ overallRating: 0, doctorRating: 0, serviceRating: 0, waitTimeRating: 0, comment: '' });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>Give Feedback</Typography>
        <Typography variant="body2" sx={{ color: '#8A94A6', mt: 0.5 }}>Help us improve by sharing your experience</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(255,159,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FeedbackIcon sx={{ color: '#FF9F43', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4' }}>Share Your Experience</Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              {/* Rating sections */}
              {[
                { key: 'overallRating',  label: '⭐ Overall Experience', required: true  },
                { key: 'doctorRating',   label: '👨‍⚕️ Doctor\'s Care',     required: false },
                { key: 'serviceRating',  label: '🏥 Hospital Services',  required: false },
                { key: 'waitTimeRating', label: '⏱️ Wait Time',           required: false },
              ].map(({ key, label, required }) => (
                <Box key={key} sx={{ mb: 2.5 }}>
                  <Typography variant="body2" sx={{ color: '#8A94A6', fontWeight: 600, mb: 1 }}>
                    {label} {required && <span style={{ color: '#FF6B6B' }}>*</span>}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      value={form[key]}
                      onChange={(_, v) => setForm((p) => ({ ...p, [key]: v || 0 }))}
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': { color: '#FF9F43' },
                        '& .MuiRating-iconHover': { color: '#FFBB70' },
                        '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.15)' },
                      }}
                    />
                    {form[key] > 0 && (
                      <Chip
                        label={ratingLabels[form[key]]}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,159,67,0.12)', color: '#FF9F43', fontWeight: 700, fontSize: '0.72rem', border: '1px solid rgba(255,159,67,0.3)' }}
                      />
                    )}
                  </Box>
                </Box>
              ))}

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

              <TextField
                fullWidth multiline rows={4} required
                label="Your Comments"
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder="Share details about your experience..."
                InputLabelProps={{ sx: { color: '#8A94A6' } }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,159,67,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#FF9F43' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FF9F43' },
                  '& .MuiOutlinedInput-input': { color: '#E8ECF4' },
                }}
              />

              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={feedbackSubmitting}
                endIcon={feedbackSubmitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
                sx={{
                  py: 1.6, fontWeight: 700, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg,#FF9F43,#E8891F)',
                  boxShadow: '0 8px 24px rgba(255,159,67,0.3)',
                  borderRadius: '12px', textTransform: 'none',
                  '&:hover': { background: 'linear-gradient(135deg,#FFBB70,#FF9F43)', transform: 'translateY(-1px)' },
                  '&:disabled': { background: 'rgba(255,159,67,0.3)', color: 'rgba(255,255,255,0.5)' },
                  transition: 'all 0.2s',
                }}
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Past Feedbacks */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4', mb: 2 }}>My Past Feedback</Typography>
          {feedbackLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#FF9F43' }} size={32} />
            </Box>
          ) : feedbacks.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <FeedbackIcon sx={{ fontSize: 48, color: '#4A5568', mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: '#8A94A6' }}>No feedback submitted yet</Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {feedbacks.map((fb) => (
                <Card key={fb._id} sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, display: 'block' }}>
                        {fb.feedbackId} • {new Date(fb.createdAt).toLocaleDateString()}
                      </Typography>
                      {fb.doctorId?.name && (
                        <Typography variant="caption" sx={{ color: '#00C6B3', fontWeight: 600 }}>
                          Dr. {fb.doctorId.name}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ color: '#FF9F43', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#FF9F43' }}>{fb.overallRating}/5</Typography>
                    </Box>
                  </Box>
                  <Rating value={fb.overallRating} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: '#FF9F43' }, '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.12)' }, mb: 1.5 }} />
                  {fb.comment && (
                    <Typography variant="body2" sx={{ color: '#8A94A6', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid rgba(255,159,67,0.4)', pl: 1.5 }}>
                      "{fb.comment}"
                    </Typography>
                  )}
                  {fb.isPublished && (
                    <Chip label="Published" size="small" sx={{ mt: 1.5, bgcolor: 'rgba(52,211,153,0.1)', color: '#34D399', fontWeight: 600, fontSize: '0.68rem' }} />
                  )}
                </Card>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default GiveFeedback;
