
import React, { useState, useEffect } from "react";
import { getAllAste } from "../utils/APIRoutes";
import io from 'socket.io-client';
import {  aggiornaPrezzo } from '../utils/APIRoutes';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import { TbFilterSearch } from 'react-icons/tb';
import { Link, useNavigate  } from "react-router-dom";


const socket = io.connect('http://localhost:3000');

function CountdownTimer({ dataFine }) {
  const [tempoRimanente, setTempoRimanente] = useState({
    giorni: 0,
    ore: 0,
    minuti: 0,
    secondi: 0,
  });
  const [isAstaTerminata, setIsAstaTerminata] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const differenzaTempo = dataFine - now;

      if (differenzaTempo > 0) {
        const giorni = Math.floor(differenzaTempo / (1000 * 60 * 60 * 24));
        const ore = Math.floor((differenzaTempo % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minuti = Math.floor((differenzaTempo % (1000 * 60 * 60)) / (1000 * 60));
        const secondi = Math.floor((differenzaTempo % (1000 * 60)) / 1000);

        setTempoRimanente({ giorni, ore, minuti, secondi });
      } else {
        clearInterval(intervalId);
        setTempoRimanente({ giorni: 0, ore: 0, minuti: 0, secondi: 0 });
        setIsAstaTerminata(true); // Imposta la variabile di stato quando l'asta è terminata
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dataFine]);
  return (
    <div>
      <h2>Tempo rimanente:</h2>
      {isAstaTerminata ? (
        <p className="asta-terminata">ASTA TERMINATA</p>
      ) : (
        <p>{`${tempoRimanente.giorni} giorni, ${tempoRimanente.ore} ore, ${tempoRimanente.minuti} minuti, ${tempoRimanente.secondi} secondi`}</p>
      )}
    </div>
  );
}


export default function SearchBodyAsta({ ricerca }) {
  // Recupera i dati dell'utente dal localStorage
  const user = JSON.parse(localStorage.getItem('chat-app-user'));

  // Verifica se l'utente è loggato e ottieni l'id
  const userid = user ? user._id : 'Ospite';

  // DEFINISCO TUTTE LE VARIABILI USESTATE
  const [AllAste, setAllAste] = useState([]);
  const [filteredAste, setFilteredAste] = useState([]);
  const [aste, setAste] = useState([]);
  const [inputMessages, setInputMessages] = useState({});
  const [productMessages, setProductMessages] = useState({});
  const [codiceAsta, setCodiceAsta] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Funzione per caricare i dati delle aste
    const fetchAste = async () => {
      try {
        const response = await fetch(getAllAste);
        const data = await response.json();
        setAste(data);
      } catch (error) {
        console.error('Errore durante il recupero delle aste:', error);
      }
    };

    // Carica i dati delle aste iniziali
    fetchAste();

    // Ascolta gli aggiornamenti dal server
    socket.on('receive_message', (data) => {
      // Aggiorna lo stato delle aste quando ricevi un nuovo messaggio
      setAste((prevAste) => {
        const updatedAste = prevAste.map((asta) =>
          asta.nomeProdotto === data.prodotto ? { ...asta, ...data.asta } : asta
        );
        return updatedAste;
      });

      // Aggiorna lo stato dei messaggi del prodotto
      setProductMessages((prevMessages) => ({
        ...prevMessages,
        [data.prodotto]: [...(prevMessages[data.prodotto] || []), data.messaggio],
      }));
    });

    // Pulisce l'ascolto degli aggiornamenti quando il componente viene smontato
    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = (astaId, productName, prezzoCorrente) => {
    const message = inputMessages[productName];

    if (!/^\d+(\.\d{1,2})?$/.test(message)) {
      alert('Devi inserire un importo numerico valido');
      return;
    }

    const puntata = parseFloat(message);
    const ultimaPuntata =
      parseFloat(productMessages[productName]?.slice(-1)[0]?.messaggio) || 0;

    if (puntata <= ultimaPuntata) {
      alert('Inserisci un importo più elevato');
      return;
    }

    socket.emit('send_message', { messaggio: message, prodotto: productName });

    setProductMessages((prevMessages) => ({
      ...prevMessages,
      [productName]: [...(prevMessages[productName] || []), { utente: 'Tu', messaggio: message }],
    }));

    setInputMessages({ ...inputMessages, [productName]: '' });

    console.log('ID Asta in aggiornaPrezzo:', astaId);
    console.log(userid);
    console.log(puntata);

    // Chiamata API per aggiornare il prezzo
    fetch(aggiornaPrezzo(astaId, userid, puntata), {
      method: 'PUT',
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Risposta API:', data);
      })
      .catch((error) => {
        console.error('Errore durante l\'aggiornamento del prezzo:', error);
      });
  };

  const handleRedeem = (productName) => {
    console.log('avviato');
    const asta = aste.find((a) => a.nomeProdotto === productName);

    if (!asta) {
      console.error('Asta non trovata');
      return;
    }

    const ultimaOfferta = asta.offerte.slice(-1)[0];

    // Controlla se il tempo è scaduto
    const now = new Date();
    const isExpired = now >= new Date(asta.dataFine);

    console.log('Tempo scaduto?', isExpired);
    console.log('Ultima offerta:', ultimaOfferta);
    console.log('ID Utente corrente:', userid);

    if (!isExpired) {
      alert(`Il tempo non è ancora scaduto per ${productName}`);
      return;
    }

    // Controlla se l'utente corrisponde all'offerente dell'ultima offerta
    const isCurrentUserOfferer = ultimaOfferta && ultimaOfferta.offerente === userid;

    console.log('Utente corrisponde all\'offerente?', isCurrentUserOfferer);

    if (isCurrentUserOfferer) {
      // Puoi eseguire il riscatto solo se l'utente corrisponde all'offerente dell'ultima offerta
      // Altre logiche di riscatto...
      alert(`Riscattato per ${productName}`);
    } else {
      alert(`Solo l'offerente dell'ultima offerta può riscattare per ${productName}`);
    }
  };


  // DEFINISCO LA FETCH PER PRENDERE TUTTI I PRODOTTI
  const fetchData = async () => {
    try {
      const response = await fetch(getAllAste);
      const data = await response.json();
      setAllAste(data);
    } catch (error) {
      console.error('Errore durante il recupero dei prodotti:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // EFFETTUO IL FILTRAGGIO DEI PRODOTTI IN BASE ALLA RICERCA
  useEffect(() => {
    
    const filtered = AllAste.filter(asta =>
      asta.codiceAsta.toLowerCase().includes(ricerca.toLowerCase())
    );
    setFilteredAste(filtered);
    console.log(filtered)
  }, [ricerca, AllAste]);
    //DEFINISCO LA FUNZIONE CHE MI PERMETTE DI FARE LA RICERCA 
    const handleSearch = () => {
        // Naviga alla pagina di ricerca con il termine di ricerca come parametro
        navigate(`/Ortoshop/aste/${codiceAsta}`);
      };

  return (
    <div>
    <form  onClick={handleSearch}>
    <input placeholder={`codice asta..`} className='codiceInput' onChange={(e) => setCodiceAsta(e.target.value)}/>
    <button className='codiceButton'>
      <TbFilterSearch />
    </button>
  </form>
    <div className="searchAsta"style={{width: 500}}>
      {filteredAste.map(asta => (
        <div className='AstaContainer' key={asta._id} style={{ marginRight: '10px' }}>
            <h2>{asta.nomeProdotto}</h2>
            <img src={asta.image} alt={`${asta.nomeProdotto} Image`} />
            <p>
              <b>Prezzo di partenza:</b> {asta.prezzoPartenza}$
            </p>
            <p className='prezzoCorrente'>
              <b>Prezzo Corrente:</b>{' '}
              {productMessages[asta.nomeProdotto]?.slice(-1)[0]?.messaggio || asta.prezzoCorrente}$
            </p>
            <div className='inputContainer'>
              <input
                placeholder={`La tua puntata...`}
                value={inputMessages[asta.nomeProdotto] || ''}
                onChange={(e) =>
                  setInputMessages((prevInputMessages) => ({
                    ...prevInputMessages,
                    [asta.nomeProdotto]: e.target.value,
                  }))
                }
              />
              <button
                className='bottone'
                onClick={() => sendMessage(asta._id, asta.nomeProdotto, asta.prezzoCorrente)}
              >
                <FaMoneyBillTransfer className='paga' />
              </button>
            </div>
            <CountdownTimer dataFine={new Date(asta.dataFine)} />
            <button onClick={() => {
              handleRedeem(asta.nomeProdotto);  
            }}>
            Riscatta
          </button>

            <div></div>
          </div>
        ))}
    </div>
    </div>
  );
}