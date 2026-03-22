import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchProducts = createAsyncThunk('products/fetch', async (params = {}, thunkAPI) => {
  try {
    const { data } = await api.get('/products', { params });
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to load products');
  }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, thunkAPI) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to load product');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    pages: 1,
    selected: null,
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  }
});

export default productSlice.reducer;
