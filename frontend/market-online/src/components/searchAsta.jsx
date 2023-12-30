import React from "react";
import Header from "../components/header";
import { useLocation, useParams } from "react-router-dom";
import SearchBodyAsta from "./searchBodyAsta";


export default function SearchAsta() {
    // RECUPERO I DATI DALL'URL
    const { state } = useLocation();
    const { codiceAsta } = useParams();

    console.log(codiceAsta);
    // Recupera i dati dell'utente dal localStorage
    const user = JSON.parse(localStorage.getItem('chat-app-user'));

    // Verifica se l'utente è loggato e ottieni il nome
    const userName = user ? user.nome : "Ospite";
    const surname = user ? user.cognome : "Ospite";
    const email = user ? user.email : "Ospite";
    const id = user ? user._id : "Ospite";
    return(
        <>
            <Header userName={userName} surname={surname} email={email} id={id}/>
            <SearchBodyAsta ricerca={codiceAsta}/>
        </>
    );
}