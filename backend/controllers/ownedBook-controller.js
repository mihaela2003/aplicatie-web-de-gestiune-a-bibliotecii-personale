const { OwnedBook, ReadingStatus } = require("../models");
const { Op } = require("sequelize");

// 📌 Create - Adăugare carte în colecția utilizatorului
exports.addOwnedBook = async (req, res) => {
  try {
    const { type, language, date_owned, userId, bookId } = req.body;
    
    if (!type || !userId || !bookId) {
      return res.status(400).json({ message: "Type, userId și bookId sunt obligatorii!" });
    }

    // Creăm cartea OwnedBook
    const newOwnedBook = await OwnedBook.create({
      type,
      language: language || null,
      date_owned: date_owned || new Date(),
      userId,
      bookId
    });

    console.log('✅ OwnedBook creat cu ID:', newOwnedBook.id);

    // Actualizăm ReadingStatus pentru cartea și userul respectiv
    await ReadingStatus.update(
      { ownedBookId: newOwnedBook.id },
      {
        where: {
          user_id: userId,
          book_id: bookId
        }
      }
    );

    console.log('✅ ReadingStatus actualizat cu ownedBookId:', newOwnedBook.id);

    res.status(201).json({ message: "Carte adăugată în colecție și status actualizat!", ownedBook: newOwnedBook });
  } catch (error) {
    console.error("❌ Eroare la adăugare carte:", error);
    res.status(500).json({ message: "Eroare la adăugare carte", error });
  }
};

// 📌 Read - Obținere cărți deținute de un utilizator
exports.getOwnedBooks = async (req, res) => {
  try {
    const { userId } = req.params;
    const ownedBooks = await OwnedBook.findAll({
      where: { userId },
      include: [
        'Book',
        {
          model: ReadingStatus,
          as: 'ReadingStatus', 
          where: { user_id: userId },
          required: false, 
        }
      ],
      order: [['date_owned', 'DESC']]
    });

    res.json(ownedBooks);
  } catch (error) {
    console.error("Eroare la obținere cărți:", error);
    res.status(500).json({ message: "Eroare la obținere cărți", error });
  }
};

// 📌 Update - Actualizare carte deținută
exports.updateOwnedBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, language, date_owned } = req.body;

    const ownedBook = await OwnedBook.findByPk(id);
    if (!ownedBook) {
      return res.status(404).json({ message: "Carte nu a fost găsită în colecție!" });
    }

    ownedBook.type = type || ownedBook.type;
    ownedBook.language = language || ownedBook.language;
    ownedBook.date_owned = date_owned || ownedBook.date_owned;
    await ownedBook.save();

    res.json({ message: "Carte actualizată!", ownedBook });
  } catch (error) {
    console.error("Eroare la actualizare carte:", error);
    res.status(500).json({ message: "Eroare la actualizare carte", error });
  }
};

// 📌 Căutare avansată cu filtrare după dată
exports.searchOwnedBooks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, language, startDate, endDate } = req.query;

    const whereClause = { userId };
    if (type) whereClause.type = type;
    if (language) whereClause.language = { [Op.like]: `%${language}%` };
    
    if (startDate || endDate) {
      whereClause.date_owned = {};
      if (startDate) whereClause.date_owned[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date_owned[Op.lte] = new Date(endDate);
    }

    const ownedBooks = await OwnedBook.findAll({
      where: whereClause,
      include: ['Book'],
      order: [['date_owned', 'DESC']]
    });

    res.json(ownedBooks);
  } catch (error) {
    console.error("Eroare la căutare cărți:", error);
    res.status(500).json({ message: "Eroare la căutare cărți", error });
  }
};

// Delete rămâne la fel ca în versiunea anterioară
// 📌 Delete - Ștergere carte din colecție
exports.deleteOwnedBook = async (req, res) => {
    try {
      const { id } = req.params;
      const ownedBook = await OwnedBook.findByPk(id);
      
      if (!ownedBook) {
        return res.status(404).json({ message: "Carte nu a fost găsită în colecție!" });
      }
  
      await ownedBook.destroy();
      res.json({ message: "Carte ștearsă din colecție!" });
    } catch (error) {
      console.error("Eroare la ștergere carte:", error);
      res.status(500).json({ message: "Eroare la ștergere carte", error });
    }
  };