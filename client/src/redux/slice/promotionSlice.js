import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchPromotions = createAsyncThunk('promotions/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/promotions');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load promotions');
  }
});

const promotionSlice = createSlice({
  name: 'promotions',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default promotionSlice.reducer;
