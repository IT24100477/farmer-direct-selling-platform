import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/notifications');
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load notifications');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => { state.items = action.payload; });
  }
});

export default notificationSlice.reducer;
