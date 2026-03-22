import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addToCart: (state, action) => {
      const exists = state.items.find((i) => i.productId === action.payload.productId);
      if (exists) {
        exists.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    updateQty: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (!item) return;
      item.quantity = Math.max(1, quantity);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    clearCart: (state) => { state.items = []; }
  }
});

export const { addToCart, updateQty, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
