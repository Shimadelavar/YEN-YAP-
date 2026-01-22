const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'yeniyapi.db');

// Database bağlantısını oluştur
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database bağlantı hatası:', err);
    } else {
        console.log('✅ SQLite database bağlantısı başarılı:', dbPath);
        initializeDatabase();
    }
});

// Database tabloları oluştur
function initializeDatabase() {
    db.serialize(() => {
        // Kullanıcılar tablosu
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ad TEXT NOT NULL,
                soyad TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                telefon TEXT NOT NULL,
                sifre TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Users tablosu oluşturma hatası:', err);
            } else {
                console.log('✅ Users tablosu hazır');
            }
        });

        // Randevular tablosu
        db.run(`
            CREATE TABLE IF NOT EXISTS randevular (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                firma TEXT NOT NULL,
                tarih DATE NOT NULL,
                saat TIME NOT NULL,
                tur TEXT DEFAULT 'office',
                durum TEXT DEFAULT 'beklemede',
                notlar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Randevular tablosu oluşturma hatası:', err);
            } else {
                console.log('✅ Randevular tablosu hazır');
            }
        });
    });
}

// Database işlemleri için helper fonksiyonlar
const dbOperations = {
    // Kullanıcı kaydı
    registerUser: (ad, soyad, email, telefon, sifre, callback) => {
        const query = `
            INSERT INTO users (ad, soyad, email, telefon, sifre)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.run(query, [ad, soyad, email, telefon, sifre], function (err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID });
            }
        });
    },

    // Email ile kullanıcı bul
    getUserByEmail: (email, callback) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            callback(err, row);
        });
    },

    // ID ile kullanıcı bul
    getUserById: (id, callback) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    // Tüm kullanıcıları getir
    getAllUsers: (callback) => {
        db.all('SELECT id, ad, soyad, email, telefon, role, created_at FROM users', (err, rows) => {
            callback(err, rows);
        });
    },

    // Randevu oluştur
    createAppointment: (user_id, firma, tarih, saat, tur, notlar, callback) => {
        const query = `
            INSERT INTO randevular (user_id, firma, tarih, saat, tur, notlar)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [user_id, firma, tarih, saat, tur, notlar], function (err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID });
            }
        });
    },

    // Kullanıcının randevularını getir
    getUserAppointments: (user_id, callback) => {
        const query = `
            SELECT * FROM randevular 
            WHERE user_id = ? 
            ORDER BY tarih DESC, saat DESC
        `;
        db.all(query, [user_id], (err, rows) => {
            callback(err, rows);
        });
    },

    // Randevu sil
    deleteAppointment: (id, callback) => {
        db.run('DELETE FROM randevular WHERE id = ?', [id], (err) => {
            callback(err);
        });
    },

    // Randevu güncelle
    updateAppointment: (id, durum, callback) => {
        db.run('UPDATE randevular SET durum = ? WHERE id = ?', [durum, id], (err) => {
            callback(err);
        });
    }
};

module.exports = { db, dbOperations };
