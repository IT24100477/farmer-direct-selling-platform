import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, clearCart, updateQty } from '../redux/slices/cartSlice.js';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/currency.js';

const Cart = () => {
  const { items } = useSelector((s) => s.cart);
  const dispatch = useDispatch();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-semibold">Cart</h2>
      {!items.length && <p>Your cart is empty.</p>}
      {items.map((item) => (
        <div key={item.productId} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{item.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <button className="px-2 border rounded" onClick={() => dispatch(updateQty({ productId: item.productId, quantity: item.quantity - 1 }))}>-</button>
              <input
                className="w-16 border rounded px-2 py-1"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => dispatch(updateQty({ productId: item.productId, quantity: Number(e.target.value) }))}
              />
              <button className="px-2 border rounded" onClick={() => dispatch(updateQty({ productId: item.productId, quantity: item.quantity + 1 }))}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <p>{formatCurrency(item.price * item.quantity)}</p>
            <button className="text-sm text-red-500" onClick={() => dispatch(removeFromCart(item.productId))}>Remove</button>
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-semibold">Total: {formatCurrency(total)}</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="text-sm text-gray-500" onClick={() => dispatch(clearCart())}>Clear</button>
            <Link to="/checkout" className="btn text-sm w-full sm:w-auto text-center">Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
