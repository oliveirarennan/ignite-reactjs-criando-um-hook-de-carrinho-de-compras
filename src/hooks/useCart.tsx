import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

function updateLocalStorage(cart: Product[]): void{
  localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const isProductInCart = cart.find(product => product.id === productId);
      
      if(isProductInCart){
        //TODO
        updateProductAmount({productId, amount: isProductInCart.amount + 1})
        return
      }
      const {data: newCartProductStock} = await api(`stock/${productId}`);

      if(newCartProductStock.amount < 1){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const {data: newCartProduct} = await api.get(`products/${productId}`);

      newCartProduct.amount = 1;

      const updatedCart = [...cart, newCartProduct];

      setCart(updatedCart)
      updateLocalStorage(updatedCart)

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const isProductInCart = cart.find(product => product.id === productId);
      
      if(!isProductInCart){
        throw Error;
      }
      
      const updatedCart = cart.filter(product => product.id !== productId);
      
      setCart(updatedCart)
      updateLocalStorage(updatedCart)
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };


  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      if(amount < 1){
        return
      }

      const {data: itemStock} = await api.get<Stock>(`/stock/${productId}`);

      const selectCartProduct = cart.find(product => product.id === productId);

      if(!selectCartProduct) {
        throw new Error("Error on Update Cart Product Amount")
      }

      if(amount > itemStock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

    const updatedCart = cart.map(product => {
        if(product.id === productId){
          const updatedProduct = {
            ...product,
            amount
          }
          return updatedProduct
        }
        return product
      })

      setCart(updatedCart);
      updateLocalStorage(updatedCart);



    } catch(err) {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
