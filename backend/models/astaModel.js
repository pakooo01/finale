const mongoose = require("mongoose");

const astaSchema = mongoose.Schema({
  nomeProdotto: {
    type: String,
    required: true,
  },
  image:{
    type:String,
    required:true
  },
  prezzoPartenza: {
    type: String,
    required: true,
  },
  prezzoCorrente: {
    type: String,
    required:true
  },
  dataInizio: {
    type: Date,
    required: true,
  },
  dataFine: {
    type: Date,
    required: true,
  },
  offerte: [{
      offerente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      importoOfferta: {
        type: String,
      },
    },
  ],
  codiceAsta: {
    type: String,
    required: true
  }
});

const Asta = mongoose.model("Asta", astaSchema);

module.exports = Asta;