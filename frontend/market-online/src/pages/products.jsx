import React from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header";
import "./market.css";
import Product from "../components/product";

export default function Products() {

  const user = JSON.parse(localStorage.getItem("chat-app-user"));

  const userName = user ? user.nome : "Ospite";
  const surname = user ? user.cognome : "Ospite";
  const email = user ? user.email : "Ospite";
  const id = user ? user._id : "Ospite";
  const carrello = user ? user.prodottiNelCarrello : "Ospite";

  const { productId } = useParams();
  



  return (
    <>
      <Header userName={userName} surname={surname} email={email} id={id} />
      <Product productId={productId} id={id}/>
    </>
  );
}
