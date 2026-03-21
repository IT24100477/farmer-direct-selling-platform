import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const placeOrder = createAsyncThunk('orders/place', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/orders', payload);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Order failed');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/my', async (_, thunkAPI) => {
  try {
    const role = thunkAPI.getState().auth?.user?.role;
    const endpointByRole = {
      admin: '/orders/admin',
      farmer: '/orders/farmer',
      delivery: '/orders/delivery',
      customer: '/orders/me'
    };
    const endpoint = endpointByRole[role] || '/orders/me';
    const { data } = await api.get(endpoint);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Load orders failed');
  }
});

export const fetchOrder = createAsyncThunk('orders/one', async (id, thunkAPI) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Load order failed');
  }
});

export const cancelOrder = createAsyncThunk('orders/cancel', async (id, thunkAPI) => {
  try {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Cancel order failed');
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { list: [], latest: null, selected: null, selectedError: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => { state.status = 'loading'; })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.latest = action.payload.order;
      })
      .addCase(placeOrder.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.list = action.payload; })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Load orders failed';
        state.list = [];
      })
      .addCase(fetchOrder.pending, (state) => {
        state.selectedError = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.selected = action.payload;
        state.selectedError = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.selected = null;
        state.selectedError = action.payload || 'Load order failed';
      })
      .addCase(cancelOrder.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selected = action.payload;
        state.list = state.list.map((order) => (order._id === action.payload._id ? action.payload : order));
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default orderSlice.reducer;
