import React, { useRef, useState, useEffect } from "react";
import './shop.css';
import { Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { FaRegHeart } from 'react-icons/fa';
import { FcLike } from "react-icons/fc";
import {getAllProducts} from "../utils/APIRoutes"
import { addToCartRoute } from '../utils/APIRoutes';
import {addToFavorites} from '../utils/APIRoutes';
import {getFavoriteProducts} from '../utils/APIRoutes';
import { useNavigate } from "react-router-dom";
import { TbWorldSearch } from "react-icons/tb";

const ELEMENTI_PER_PAGINA = 6;
const calculateElementWidth = (containerRef, itemsPerPage) => {
  if (containerRef.current) {
    const containerWidth = containerRef.current.offsetWidth;
    return containerWidth / itemsPerPage;
  }
  return 0;
};
export default function SearchCittaBody({ ricerca}) {
  
  //inserisco tutte le variabili USESTATE che servono
  const [likesFrutta, setLikesFrutta] = useState({});
  const [likesVerdura, setLikesVerdura] = useState({});
  const [prodotti, setProdotti] = useState([]);
  const [preferiti,setPreferiti] = useState([]);
  const fruttaContainerRef = useRef(null);
  const verduraContainerRef = useRef(null);
  const ingrossoContainerRef = useRef(null);
  const [paginaFrutta, setPaginaFrutta] = useState(1);
  const [paginaVerdura, setPaginaVerdura] = useState(1);
  const quantity=1;
  const navigate = useNavigate();
  const [citta, setCitta] = useState('');

    // Recupera i dati dell'utente dal localStorage
    const user = JSON.parse(localStorage.getItem('chat-app-user'));
    const id = user ? user._id : "Ospite";
  // Aggiungi una variabile per la larghezza dinamica degli elementi
  const elementWidth = calculateElementWidth(fruttaContainerRef, ELEMENTI_PER_PAGINA);

  // Aggiorna la larghezza degli elementi in base alla larghezza dinamica calcolata
  const elementStyle = {
    width: `${elementWidth}px`,
  };
    //DEFINISCO LA FUNZIONE CHE MI PERMETTE DI PRENDERE I PRODOTTI PREFERITI
    const fetchFavoriteProducts = async () => {
      try {
        const response = await fetch(getFavoriteProducts(id));
        const data = await response.json();
        setPreferiti(data);
      } catch (error) {
        console.error('Errore durante il recupero dei prodotti preferiti:', error);
      }
    };
  
    useEffect(() => {
      fetchData();
      fetchFavoriteProducts(); 
    }, [id]);

  //definisco la richiesta FETCH PER PRENDERE I PRODOTTI 
  const fetchData = async () => {
    try {
      // Chiamata alla funzione getAllProducts del backend
      const response = await fetch(getAllProducts);
      const data = await response.json();
      setProdotti(data);
    } catch (error) {
      console.error('Errore durante il recupero dei prodotti:', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  //funzione che serve per SCROLLARE A DESTRA E A SINISTRA i prodotti
  const scrollLeft = (containerRef, paginaStateSetter) => {
    if (containerRef.current) {
      const elementWidth = calculateElementWidth(containerRef, ELEMENTI_PER_PAGINA);
      const scrollAmount = elementWidth * ELEMENTI_PER_PAGINA;
  
      containerRef.current.classList.remove("scroll-container-continuous");
      containerRef.current.scrollLeft -= scrollAmount;
      paginaStateSetter((prevPagina) => Math.max(prevPagina - 1, 1));
  
      if (containerRef.current.scrollLeft <= 0) {
        containerRef.current.scrollLeft = 0;
        containerRef.current.classList.remove("scroll-container-continuous");
      }
    }
  };
  
  const scrollRight = (containerRef, paginaStateSetter, maxPagina) => {
    if (containerRef.current) {
      const elementWidth = calculateElementWidth(containerRef, ELEMENTI_PER_PAGINA);
      const scrollAmount = elementWidth * ELEMENTI_PER_PAGINA;
  
      containerRef.current.classList.remove("scroll-container-continuous");
      containerRef.current.scrollLeft += scrollAmount;
      paginaStateSetter((prevPagina) => Math.min(prevPagina + 1, maxPagina));
  
      const maxScrollLeft = containerRef.current.scrollWidth - containerRef.current.clientWidth;
  
      if (containerRef.current.scrollLeft >= maxScrollLeft) {
        containerRef.current.scrollLeft = maxScrollLeft;
        containerRef.current.classList.remove("scroll-container-continuous");
      }
    }
  };
  
  
  
  //VALORI UTILIZZATI NELLA FUNZIONE 
  const fruttaInizio = (paginaFrutta - 1) * ELEMENTI_PER_PAGINA;
  const fruttaFine = paginaFrutta * ELEMENTI_PER_PAGINA;
  const verduraInizio = (paginaVerdura - 1) * ELEMENTI_PER_PAGINA;
  const verduraFine = paginaVerdura * ELEMENTI_PER_PAGINA;

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
  //FUNZIONE CHE CI PERMETTE DI INSERIRE I PRODOTTI NEL LIKE
  const handleAddToFavorites = async (id, productId) => {
    try {
        // Chiamata alla funzione addToCart del backend
        const response = await fetch(addToFavorites(id, productId), { method: 'POST' }); // Assuming 1 as the quantity, adjust accordingly
        // Gestisci la risposta come preferisci
        const data = await response.json();
        console.log('Prodotto aggiunto ai preferiti:', data);
    } catch (error) {
        // Gestisci gli errori qui
        console.error('Errore durante l\'aggiunta ai preferiti:', error);
    }
  };
  //DEFINISCO LA FUNZIONE CHE MI PERMETTE DI FARE LA RICERCA 
  const handleSearch = () => {
    // Naviga alla pagina di ricerca con il termine di ricerca come parametro
    navigate(`/Ortoshop/products/${citta}`);
  };

  return (
    <div className="prodotti">
      <form className="searchcitta">
        <select id="cittaPuglia" name="cittaPuglia" onChange={(e) => setCitta(e.target.value)}>
          <option value="Bari">Bari</option>
          <option value="Brindisi">Brindisi</option>
          <option value="Lecce">Lecce</option>
          <option value="Taranto">Taranto</option>
          <option value="Foggia">Foggia</option>
        </select>
        <button onClick={handleSearch} className="buttoncitta"><TbWorldSearch/></button>
      </form>
      <h2 className="sezione1">Offerte</h2>
      <div className="scroll-container" ref={ingrossoContainerRef}>
        <div className="frutta" style={{ width: `${elementWidth * prodotti.filter((prodotto) => prodotto.tipo === "ingrosso").length}px` }}>
          {prodotti
            .filter((prodotto) => prodotto.tipo === "ingrosso"&& prodotto.location === ricerca)
            .map((ingrosso) => (
              <div key={ingrosso._id} style={elementStyle}>
                <div className="like" onClick={() => { setLikesFrutta((prevLikes) => ({ ...prevLikes, [ingrosso._id]: !prevLikes[ingrosso._id] })); handleAddToFavorites(id, ingrosso._id); }}>
                  {likesFrutta[ingrosso._id] ? <FcLike className="liked"   style={{width:18,height:18}} /> : <FaRegHeart className="not-liked" style={{width:16,height:16}} />}
                </div>
                <img src={ingrosso.image} alt={ingrosso.nome} />
                <Link to={`/Ortoshop/${ingrosso._id}`} key={ingrosso._id} style={{ textDecoration: 'none', color: 'inherit'}}>
                <div>{ingrosso.nome}</div>
                <div>
                  <b>{ingrosso.price.toFixed(2)} €/kg</b>{" "}
                </div>
                </Link>
                <button onClick={() => handleAddToCart(id,ingrosso._id)}>Aggiungi al Carrello</button>
                
              </div>
            ))}
        </div>
      </div>
      <button className="scroll-button3 scroll-left" onClick={() => scrollLeft(ingrossoContainerRef, setPaginaFrutta)}><IoIosArrowBack/></button>
      <button className="scroll-button3 scroll-right" onClick={() =>scrollRight(ingrossoContainerRef, setPaginaFrutta, Math.ceil(prodotti.filter((prodotto) => prodotto.tipo === "frutta").length / ELEMENTI_PER_PAGINA))}>
        <IoIosArrowForward/>
      </button>

      <h2 className="sezione1">Aste</h2>
      
      <h2 className="sezione1">Frutta</h2>
      <div className="scroll-container" ref={fruttaContainerRef}>
        <div className="frutta" style={{ width: `${elementWidth * prodotti.filter((prodotto) => prodotto.tipo === "frutta").length}px` }}>
          {prodotti
            .filter((prodotto) => prodotto.tipo === "frutta"&& prodotto.location === ricerca)
            .map((frutto) => (
              <div key={frutto._id} style={elementStyle}>
                <div className="like" onClick={() => { setLikesFrutta((prevLikes) => ({ ...prevLikes, [frutto._id]: !prevLikes[frutto._id] })); handleAddToFavorites(id, frutto._id); }}>
                  {likesFrutta[frutto._id] ? <FcLike className="liked"   style={{width:18,height:18}} /> : <FaRegHeart className="not-liked" style={{width:16,height:16}} />}
                </div>
                <img src={frutto.image} alt={frutto.nome} />
                <Link to={`/Ortoshop/${frutto._id}`} key={frutto._id} style={{ textDecoration: 'none', color: 'inherit'}}>
                <div>{frutto.nome}</div>
                <div>
                  <b>{frutto.price.toFixed(2)} €/kg</b>{" "}
                </div>
                </Link>
                <button onClick={() => handleAddToCart(id,frutto._id)}>Aggiungi al Carrello</button>
                
              </div>
            ))}
        </div>
      </div>
      <button className="scroll-button1 scroll-left" onClick={() => scrollLeft(fruttaContainerRef, setPaginaFrutta)}><IoIosArrowBack/></button>
      <button className="scroll-button1 scroll-right" onClick={() =>scrollRight(fruttaContainerRef, setPaginaFrutta, Math.ceil(prodotti.filter((prodotto) => prodotto.tipo === "frutta").length / ELEMENTI_PER_PAGINA))}>
        <IoIosArrowForward/>
      </button>

      <h2 className="sezione2">Verdura</h2>
      <div className="scroll-container" ref={verduraContainerRef}>
        <div className="verdura" style={{ width: `${elementWidth * prodotti.filter((prodotto) => prodotto.tipo === "verdura").length}px` }}>
          {prodotti
            .filter((prodotto) => prodotto.tipo === "verdura"&& prodotto.location === ricerca)
            .map((verdura) => (
              <div key={verdura._id} style={elementStyle}>
                <div className="like" onClick={() => { setLikesVerdura((prevLikes) => ({ ...prevLikes, [verdura._id]: !prevLikes[verdura._id] })); handleAddToFavorites(id, verdura._id); }}>
                  {likesVerdura[verdura._id] ? <FcLike className="liked" style={{width:18,height:18}}/> : <FaRegHeart className="not-liked" style={{width:16,height:16}} />}
                </div>
                <img src={verdura.image} alt={verdura.nome} />
                <Link to={`/Ortoshop/${verdura._id}`} key={verdura._id} style={{ textDecoration: 'none', color: 'inherit'}}>
                <div>{verdura.nome}</div>
                <div>
                  <b>{verdura.price.toFixed(2)} €/kg</b>
                </div>
                </Link>
                <button onClick={() => handleAddToCart(id,verdura._id)}>Aggiungi al Carrello</button>
                
              </div>
            ))}
        </div>
      </div>
      <button className="scroll-button2 scroll-left" onClick={() => scrollLeft(verduraContainerRef, setPaginaVerdura)}><IoIosArrowBack/></button>
      <button className="scroll-button2 scroll-right" onClick={() =>scrollRight(verduraContainerRef, setPaginaVerdura, Math.ceil(prodotti.filter((prodotto) => prodotto.tipo === "verdura").length / ELEMENTI_PER_PAGINA))}>
        <IoIosArrowForward/>
      </button>
    </div>
  );
}