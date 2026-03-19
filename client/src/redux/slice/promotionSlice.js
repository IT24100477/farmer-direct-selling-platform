import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchPromotions = createAsyncThunk('promotions/fetch', async () => {
  const { data } = await api.get('/promotions');
  return data;
});

const promotionSlice = createSlice({
  name: 'promotions',
  initialState: { items: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPromotions.fulfilled, (state, action) => { state.items = action.payload; });
  }
});

export default promotionSlice.reducer;
