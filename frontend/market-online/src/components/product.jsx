import React, { useState, useEffect } from "react";
import { getProductById } from "../utils/APIRoutes";
import "./product.css";
import { addToCartRoute } from '../utils/APIRoutes';

export default function Product({ productId, id }) {
  const [product, setProduct] = useState(null);

    //FUNZIONE CHE CI PERMETTE DI INSERIRE I PRODOTTI NEL CARRELLO  
    const handleAddToCart = async (id, productId) => {
    try {
        // Chiamata alla funzione addToCart del backend
        const response = await fetch(addToCartRoute(id, productId, 1), { method: 'POST' }); // Assuming 1 as the quantity, adjust accordingly
        // Gestisci la risposta come preferisci
        const data = await response.json();
        console.log('Prodotto aggiunto al carrello:', data);
    } catch (error) {
        // Gestisci gli errori qui
        console.error('Errore durante l\'aggiunta al carrello:', error);
    }
    }; 
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(getProductById(productId));
        const data = await response.json();
        setProduct(data);
        console.log(data)
      } catch (error) {
        console.error('Errore durante il recupero del prodotto:', error);
      }
    };

    fetchProduct();
  }, [productId]);

  if (!product) {
    return <p>Caricamento del prodotto...</p>;
  }

  return (
    <div className="product-details">
        <div className="product-image">
            <img src={product.image} alt="immagine" />
        </div>
        <div className="product-description">
            <h2> {product.nome}</h2>
            <h3> {product.price.toFixed(2)} €/kg</h3><p className="euro">(euro al kg)</p>
            <p className="iva">il prezzo è compreso di IVA.</p>
            <p><b>Provenienza:</b></p>
            <p><b>Tipologia:</b> {product.tipo}</p>
            <p><b>Descrizione:</b> {product.description}</p>
            
            <button onClick={() => handleAddToCart(id,productId)}>Inserisci nel Carrello</button>
        </div>      
    </div>
  );
}
