const Product = require('../models/productModel')
const User = require('../models/userModel')
const Asta = require('../models/astaModel')



module.exports.getAllAste = async (req, res) => {
  try {
    const aste = await Asta.find({ codiceAsta: '' });
    res.json(aste);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.addAstaByCodice = async (req, res) => {
  console.log('andudincr')
  const { codiceAsta, userId } = req.params;

  try {
    // Trova l'asta con il codice specificato
    const astaDaAggiungere = await Asta.findOne({ codiceAsta });

    if (!astaDaAggiungere) {
      return res.status(404).json({ message: 'Asta non trovata con il codice specificato' });
    }

    // Trova l'utente
    const utente = await User.findById(userId);

    if (!utente) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Verifica se l'asta è già presente nell'array asteUtente dell'utente
    if (utente.asteUtente.includes(astaDaAggiungere._id)) {
      return res.status(400).json({ message: 'L\'asta è già presente nell\'array asteUtente dell\'utente' });
    }

    // Aggiungi l'asta all'array asteUtente dell'utente
    utente.asteUtente.push(astaDaAggiungere._id);
    
    // Salva le modifiche
    await utente.save();

    res.status(200).json({ message: 'Asta aggiunta con successo all\'array asteUtente dell\'utente', asta: astaDaAggiungere });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





module.exports.getAsteByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('UserID:', userId); // Aggiungi questo console.log per verificare l'ID dell'utente
    const user = await User.findById(userId).populate('asteUtente');

    if (!user) {
      throw new Error('Utente non trovato');
    }

    const asteUtente = user.asteUtente;
    res.json(asteUtente);
  } catch (error) {
    res.status(500).json({ error: `Errore durante il recupero delle aste dell'utente: ${error.message}` });
  }
};


module.exports.aggiornaPrezzo = async (req, res) => {
  console.log('chiamato');
  const { astaId, userid, puntata } = req.params;
  try {
    // Effettua la logica di aggiornamento del prezzo qui
    const updatedAsta = await Asta.findOneAndUpdate(
      { _id: astaId, 'offerte.offerente': userid },
      {
        $set: {
          'offerte.$.importoOfferta': puntata,
          prezzoCorrente: puntata,
        },
      },
      { new: true }
    );

    if (!updatedAsta) {
      // L'utente non ha ancora fatto un'offerta, aggiungilo all'array
      await Asta.updateOne(
        { _id: astaId },
        {
          $push: {
            offerte: {
              offerente: userid,
              importoOfferta: puntata,
            },
          },
          prezzoCorrente: puntata,
        }
      );
    }

    return { success: true, message: 'Prezzo aggiornato con successo' };
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del prezzo:', error);
    return { success: false, message: 'Errore durante l\'aggiornamento del prezzo' };
  }
};

// Controller per aggiungere un'asta a un utente
module.exports.addAstaToUser = async (req, res) => {
  try {
    const { userId, codiceAsta } = req.params;

    // Verifica se l'utente esiste
    const user = await User.findById(userId); 
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Cerca l'asta con il codice specificato
    const asta = await Asta.findOne({ codiceAsta });
    if (!asta) {
      return res.status(404).json({ success: false, message: 'Asta non trovata' });
    }

    // Verifica se l'asta è già presente nell'array asteUtente dell'utente
    const isAstaAlreadyAdded = user.asteUtente.some((astaUtente) => astaUtente.astaId.equals(asta._id));
    if (isAstaAlreadyAdded) {
      return res.status(400).json({ success: false, message: 'Asta già aggiunta all\'utente' });
    }

    // Aggiungi l'asta all'array asteUtente dell'utente
    user.asteUtente.push({ astaId: asta._id });
    await user.save();

    return res.json({ success: true, message: 'Asta aggiunta con successo all\'utente' });
  } catch (error) {
    console.error('Errore durante l\'aggiunta dell\'asta all\'utente:', error);
    return res.status(500).json({ success: false, message: 'Errore durante l\'aggiunta dell\'asta all\'utente' });
  }
};

module.exports.addAsta = async (req, res) => {
    try {
      const nuovaAsta = new Asta({
        nomeProdotto: req.body.nomeProdotto,
        descrizioneProdotto: req.body.descrizioneProdotto,
        prezzoPartenza: req.body.prezzoPartenza,
        dataInizio: req.body.dataInizio,
        dataFine: req.body.dataFine,
      });
  
      const astaSalvata = await nuovaAsta.save();
      res.status(201).json(astaSalvata);
    } catch (error) {
      console.error('Errore durante l\'inserimento dell\'asta:', error);
      res.status(500).json({ errore: 'Errore durante l\'inserimento dell\'asta'});
    }
};

module.exports.addToCartAsta = async (req, res) => {
  try {

      const { userId, astaId, quantity } = req.params;
      console.log('Richiesta addToCart ricevuta');
      console.log('userId:', userId);
      console.log('productId:', astaId);
      console.log('quantity:', quantity);
      
    // Verifica se l'utente esiste
      const user = await User.findById(userId);
      if (!user) {
          throw new Error('Utente non trovato');
    }

    // Verifica se il prodotto esiste
      const product = await Asta.findById(astaId);
      if (!product) {
          throw new Error('Prodotto non trovato');
    }

    // Aggiunge il prodotto al carrello dell'utente
      const existingCartItemIndex = user.prodottiNelCarrello.findIndex(item => item.astaId.equals(astatId));

      if (existingCartItemIndex !== -1) {
      // Se il prodotto è già nel carrello, aggiorna solo la quantità
          user.prodottiNelCarrello[existingCartItemIndex].quantity += parseInt(quantity, 10) || 1;
      } else {
      // Altrimenti, aggiungi il prodotto al carrello con la quantità specificata o 1 se non specificata
          user.prodottiNelCarrello.push({ astaId, quantity: parseInt(quantity, 10) || 1 });
    }

    // Salva le modifiche dell'utente nel database
      await user.save();

    // Restituisci l'array aggiornato dei prodotti nel carrello dell'utente
      res.json(user.prodottiNelCarrello);
  } catch (error) {
      res.status(500).json({ error: `Errore durante l'aggiunta al carrello: ${error.message}` });
  }
};