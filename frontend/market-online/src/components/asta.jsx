import io from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import { getAllAste, aggiornaPrezzo, getAsteByUserId, addAstaByCodice } from '../utils/APIRoutes';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import './asta.css';
import { useNavigate } from 'react-router-dom';

const socket = io.connect('http://localhost:3000');



function CountdownTimer({ dataFine, isCurrentUser }) {
  const [tempoRimanente, setTempoRimanente] = useState({
    giorni: 0,
    ore: 0,
    minuti: 0,
    secondi: 0,
  });
  const [isAstaTerminata, setIsAstaTerminata] = useState(false);
  const [isInputVisible, setIsInputVisible] = useState(true);

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
        setIsAstaTerminata(true);
        setIsInputVisible(false);
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
      {isCurrentUser && !isAstaTerminata && <p>TU</p>}
    </div>
  );
}

function Asta() {
  const [astePubbliche, setAstePubbliche] = useState([]);
  const [astePrivate, setAstePrivate] = useState([]);
  const [inputMessages, setInputMessages] = useState({});
  const [productMessages, setProductMessages] = useState({});
  const [codiceAsta, setCodiceAsta] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('chat-app-user'));
  const userId = user ? user._id : 'Ospite';

  useEffect(() => {
    const fetchAste = async () => {
      try {
        const response = await fetch(getAllAste);
        const data = await response.json();
        console.log('Aste Pubbliche:', data);
        setAstePubbliche(data);
      } catch (error) {
        console.error('Errore durante il recupero delle aste pubbliche:', error);
      }
    };

    const fetchAstePrivate = async () => {
      if (userId !== 'Ospite') {
        try {
          const response = await fetch(getAsteByUserId(userId));
          const data = await response.json();
          console.log('Aste Private:', data);
          setAstePrivate(data);
        } catch (error) {
          console.error('Errore durante il recupero delle aste private:', error);
        }
      }
    };

    fetchAste();
    fetchAstePrivate();

    socket.on('receive_message', (data) => {
      setAstePubbliche((prevAste) => {
        const updatedAste = prevAste.map((asta) =>
          asta.nomeProdotto === data.prodotto ? { ...asta, ...data.asta } : asta
        );
        return updatedAste;
      });

      setProductMessages((prevMessages) => ({
        ...prevMessages,
        [data.prodotto]: [...(prevMessages[data.prodotto] || []), data.messaggio],
      }));
    });

    return () => {
      socket.off('receive_message');
    };
  }, [userId]);

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
  
    socket.emit('send_message', {
      messaggio: message,
      prodotto: productName,
      offerente: 'TU', // Aggiungi l'informazione sull'offerente (TU)
    });
  
    setProductMessages((prevMessages) => ({
      ...prevMessages,
      [productName]: [...(prevMessages[productName] || []), { utente: 'TU', messaggio: message }],
    }));
  
    setInputMessages({ ...inputMessages, [productName]: '' });
  
    console.log('ID Asta in aggiornaPrezzo:', astaId);
    console.log(userId);
    console.log(puntata);
  
    fetch(aggiornaPrezzo(astaId, userId, puntata), {
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
  

  const handleRedeem = async (productName) => {
    const asta = astePubbliche.find((a) => a.nomeProdotto === productName);
  
    if (!asta) {
      console.error('Asta non trovata');
      return;
    }
  
    const ultimaOfferta = asta.offerte.slice(-1)[0];
  
    if (!ultimaOfferta || ultimaOfferta.importoOfferta === undefined) {
      console.error('Ultima offerta non valida:', ultimaOfferta);
      return;
    }
  
    const now = new Date();
    const isExpired = now >= new Date(asta.dataFine);
  
    console.log('Tempo scaduto?', isExpired);
    console.log('Ultima offerta:', ultimaOfferta);
    console.log('ID Utente corrente:', userId);
  
    const isCurrentUserOfferer = ultimaOfferta.offerente === userId;
  
    console.log('L\'utente corrisponde all\'offerente?', isCurrentUserOfferer);
  
    if (isCurrentUserOfferer) {
      const importoOfferta = parseFloat(ultimaOfferta.importoOfferta);
  
      if (isNaN(importoOfferta) || importoOfferta <= 0) {
        console.error('L\'importo dell\'offerta non è un numero valido:', ultimaOfferta.importoOfferta);
        return;
      }
  
      try {
        const res = await fetch('http://localhost:3000/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({
            totalAmount: importoOfferta
          })
        });
  
        const data = await res.json();
        console.log('Risposta checkout:', data);
  
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('URL di indirizzamento non definito');
        }
      } catch (error) {
        console.error('Errore', error);
      }
    } else if (isExpired) {
      alert(`Solo l'offerente dell'ultima offerta può riscattare per ${productName}`);
    } else {
      alert(`Il tempo non è ancora scaduto per ${productName}`);
    }
  };
  
  

  const handleAddAsta = async () => {
    try {
      // Chiama la funzione addAstaByCodice con il codiceAsta e l'userId
      const response = await fetch(addAstaByCodice(userId, codiceAsta), {
        method: 'POST', // Assicurati che il tuo server gestisca le richieste POST per questa route
      });

      const data = await response.json();

      if (data.success) {
        // Se l'aggiunta ha avuto successo, mostra un messaggio di successo
        alert('Asta aggiunta con successo');

        // Ricarica la pagina
        window.location.reload();
      } else {
        // Altrimenti, gestisci l'errore o mostra un messaggio all'utente
        console.error('Errore durante l\'aggiunta dell\'asta:', data.message);
        // Puoi anche mostrare un messaggio all'utente, ad esempio:
        // alert('Errore durante l\'aggiunta dell\'asta: ' + data.message);
      }
    } catch (error) {
      console.error('Errore durante la gestione dell\'aggiunta dell\'asta:', error);
      // Puoi anche mostrare un messaggio all'utente, ad esempio:
      // alert('Errore durante l\'aggiunta dell\'asta');
    }
  };
  

  return (
    <div>
      {/* Sezione Aste Pubbliche */}
      <div className='App' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {astePubbliche.map((asta, index) => (
          <div className='AstaContainer' key={index} style={{ marginRight: '10px' }}>
            <h2>{asta.nomeProdotto}</h2>
            <img src={asta.image} alt={`${asta.nomeProdotto} Image`} />
            <p>
              <b>Prezzo di partenza:</b> {asta.prezzoPartenza}$
            </p>
            <p className='prezzoCorrente'>
            <b>Prezzo Corrente:</b>{' '}
            {productMessages[asta.nomeProdotto]?.slice(-1)[0]?.utente === 'TU'
                ? `TU: ${productMessages[asta.nomeProdotto]?.slice(-1)[0]?.messaggio}`
                : ` ${productMessages[asta.nomeProdotto]?.slice(-1)[0]?.messaggio || asta.prezzoCorrente}`}$
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
            <CountdownTimer dataFine={new Date(asta.dataFine)} isCurrentUser={userId === 'Tu'} />
            <button onClick={() => {
              handleRedeem(asta.nomeProdotto);
            }}>
              Riscatta
            </button>
            <div></div>
          </div>
        ))}
      </div>

      {/* Sezione Aste Private */}
      <div className='AstePrivateSection' style={{ marginTop: '20px' }}>
        <h2>Aste Private</h2>
        <form className="codiceAsta" onClick={handleAddAsta}>
          <input
            placeholder={`codice asta..`}
            className='codiceInput'
            onChange={(e) => setCodiceAsta(e.target.value)}
          />
          <button type="submit">Aggiungi Asta</button>
        </form>
        <div className='App' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {astePrivate.map((asta, index) => (
            <div className='AstaContainer' key={index} style={{ marginRight: '10px' }}>
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
    </div>
  );
}

export default Asta;

