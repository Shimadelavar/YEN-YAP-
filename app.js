const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const multer = require("multer");
const { db, dbOperations } = require("./db");

const app = express();
const PORT = 3000;

// Multer config
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("Sadece resim dosyaları yükleyebilirsiniz."));
        }
    }
});

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));
app.use("/data", express.static("data"));

// Session middleware
app.use(session({
    secret: "yeniyapi-secret-key-2026",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 }
}));

// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/giris");
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") {
        next();
    } else {
        res.status(403).send("❌ Yetkiniz yok.");
    }
};


/* ===============================
   SAYFALAR (GET)
================================ */

// Anasayfa
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Giriş Sayfası
app.get("/giris", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "giris.html"));
});

// Kayıt Ol Sayfası
app.get("/kayit-ol", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "kayit-ol.html"));
});

// Hakkımızda Sayfası
app.get("/hakkimizda", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "hakkimizda.html"));
});

// KAYIT OL - POST
app.post("/kayit-ol", (req, res) => {
    const { ad, soyad, email, telefon, sifre } = req.body;

    // Validasyon
    if (!ad || !soyad || !email || !telefon || !sifre) {
        return res.status(400).json({
            success: false,
            message: "Lütfen tüm alanları doldurunuz!"
        });
    }

    if (sifre.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Şifre en az 6 karakter olmalıdır!"
        });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Geçersiz e-posta adresi!"
        });
    }

    // Telefon formatı kontrolü (basit)
    const telefonRegex = /^[0-9]{10,}$/;
    if (!telefonRegex.test(telefon.replace(/[^\d]/g, ''))) {
        return res.status(400).json({
            success: false,
            message: "Geçersiz telefon numarası!"
        });
    }

    // Kullanıcı zaten var mı kontrolü
    dbOperations.getUserByEmail(email, (err, user) => {
        if (err) {
            console.error('❌ Veritabanı hatası:', err);
            return res.status(500).json({
                success: false,
                message: "Sunucu hatası. Lütfen daha sonra tekrar deneyin!"
            });
        }

        if (user) {
            return res.status(400).json({
                success: false,
                message: "Bu e-posta adresi zaten kayıtlı!"
            });
        }

        // Yeni kullanıcı oluştur
        dbOperations.registerUser(ad, soyad, email, telefon, sifre, (err, result) => {
            if (err) {
                console.error('❌ Kayıt hatası:', err);
                return res.status(500).json({
                    success: false,
                    message: "Kayıt sırasında bir hata oluştu!"
                });
            }

            console.log('✅ Yeni kullanıcı kayıt oldu:', email);
            res.json({
                success: true,
                message: "Kayıt başarılı! Giriş yapabilirsiniz.",
                userId: result.id
            });
        });
    });
});

// LOGIN - POST
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email ve şifre gereklidir." });
    }

    // Veritabanından kullanıcı bul
    dbOperations.getUserByEmail(email, (err, user) => {
        if (err) {
            console.error('❌ Veritabanı hatası:', err);
            return res.status(500).json({ success: false, message: "Sunucu hatası." });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Email veya şifre hatalı." });
        }

        // Şifre doğrulama (basit karşılaştırma - production'da hash kullanılmalı)
        if (user.sifre !== password) {
            return res.status(401).json({ success: false, message: "Email veya şifre hatalı." });
        }

        // Session'a kullanıcı bilgilerini kaydet
        req.session.user = {
            id: user.id,
            email: user.email,
            ad: user.ad,
            soyad: user.soyad,
            role: user.role || 'user'
        };

        console.log('✅ Kullanıcı giriş yaptı:', email);
        res.json({
            success: true,
            message: "Giriş başarılı!",
            user: req.session.user,
            redirect: "/profile"
        });
    });
});

// LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        res.redirect("/");
    });
});

// CHECK AUTH
app.get("/api/check-auth", (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
});

// PROFIL SAYFASI (Protected)
app.get("/profile", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile.html"));
});

// PROJELER SAYFASI
app.get("/projeler", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "projeler.html"));
});

// RANDEVULARIMI GETIR (API - Protected)
app.get("/api/my-appointments", isAuthenticated, (req, res) => {
    const user_id = req.session.user.id;

    dbOperations.getUserAppointments(user_id, (err, appointments) => {
        if (err) {
            console.error('❌ Randevular getirme hatası:', err);
            return res.status(500).json({
                success: false,
                message: "Randevular yüklenemedi."
            });
        }

        res.json({
            success: true,
            appointments: appointments || []
        });
    });
});

// UPDATE – Kullanıcı randevusunu güncelle
app.put("/api/randevular/:id", isAuthenticated, (req, res) => {
    const appointmentId = req.params.id;
    const user_id = req.session.user.id;
    const { firma, tarih, saat, notlar } = req.body;

    // Verify the appointment belongs to the user
    db.get(
        'SELECT * FROM randevular WHERE id = ? AND user_id = ?',
        [appointmentId, user_id],
        (err, appointment) => {
            if (err) {
                console.error('❌ Randevu kontrol hatası:', err);
                return res.status(500).json({ success: false, message: "Hata oluştu." });
            }

            if (!appointment) {
                return res.status(403).json({ success: false, message: "Bu randevuyu düzenleyemesiniz." });
            }

            db.run(
                'UPDATE randevular SET firma = ?, tarih = ?, saat = ?, notlar = ? WHERE id = ?',
                [firma, tarih, saat, notlar || '', appointmentId],
                (err) => {
                    if (err) {
                        console.error('❌ Randevu güncelleme hatası:', err);
                        return res.status(500).json({ success: false, message: "Randevu güncellenemedi." });
                    }

                    console.log('✅ Randevu güncellendi:', appointmentId);
                    res.json({ success: true, message: "Randevu güncellendi." });
                }
            );
        }
    );
});

// DELETE – Kullanıcı randevusunu sil
app.delete("/api/randevular/:id", isAuthenticated, (req, res) => {
    const appointmentId = req.params.id;
    const user_id = req.session.user.id;

    // Verify the appointment belongs to the user
    db.get(
        'SELECT * FROM randevular WHERE id = ? AND user_id = ?',
        [appointmentId, user_id],
        (err, appointment) => {
            if (err) {
                console.error('❌ Randevu kontrol hatası:', err);
                return res.status(500).json({ success: false, message: "Hata oluştu." });
            }

            if (!appointment) {
                return res.status(403).json({ success: false, message: "Bu randevuyu silemezsiniz." });
            }

            dbOperations.deleteAppointment(appointmentId, (err) => {
                if (err) {
                    console.error('❌ Randevu silme hatası:', err);
                    return res.status(500).json({ success: false, message: "Randevu silinemedi." });
                }

                console.log('✅ Randevu silindi:', appointmentId);
                res.json({ success: true, message: "Randevu silindi." });
            });
        }
    );
});

// Firmalar
app.get("/firmalar", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "firmalar.html"));
});

// Firma Detay
app.get("/firma-detay", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "firma-detay.html"));
});

// Proje Detay - hem /proje-detay?id=1 hem de /proje-detay/1 çalışsın
app.get("/proje-detay", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "proje-detay.html"));
});

app.get("/proje-detay/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "proje-detay.html"));
});

// Randevu Sayfası (Protected - Giriş gerekli)
app.get("/randevu", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "randevu.html"));
});

const veriDizini = path.join(__dirname, "data");
const veriYolu = path.join(veriDizini, "randevular.json");

// CREATE – Randevu Kaydet (Protected - Giriş gerekli)
app.post("/randevu-kaydet", isAuthenticated, (req, res) => {
    const { ad, email, tarih, firma, saat, notlar } = req.body;
    const user_id = req.session.user.id;

    // Validation
    if (!ad || !email || !tarih || !firma || !saat) {
        return res.status(400).json({ success: false, message: "Tüm zorunlu alanlar gereklidir." });
    }

    if (!email.includes("@")) {
        return res.status(400).json({ success: false, message: "Geçerli email adı giriniz." });
    }

    // Database'e kaydet
    dbOperations.createAppointment(user_id, firma, tarih, saat, 'office', notlar || '', (err, result) => {
        if (err) {
            console.error('❌ Randevu kayıt hatası:', err);
            return res.status(500).json({ success: false, message: "Randevu kaydedilemedi." });
        }

        console.log('✅ Randevu başarıyla kaydedildi:', result.id);
        res.json({
            success: true,
            message: "Randevunuz başarıyla kaydedildi.",
            id: result.id
        });
    });
});

// READ – Randevu Listele (HTML page - optional)
app.get("/randevu-liste", (req, res) => {
    fs.readFile(veriYolu, "utf8", (err, data) => {
        let liste = [];

        if (!err && data) {
            liste = JSON.parse(data);
        }

        let html = `
        <h1>📅 Randevu Listesi</h1>
        <ul>
        ${liste.map(r => `
            <li>
                ${r.ad} - ${r.tarih} - ${r.firma}
                <a href="/randevu-sil/${r.id}">❌ Sil</a>
            </li>
        `).join("")}
        </ul>
        <a href="/randevu">Yeni Randevu</a>
        `;

        res.send(html);
    });
});

// DELETE – Randevu Sil (redirect version - optional)
app.get("/randevu-sil/:id", (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(veriYolu, "utf8", (err, data) => {
        let liste = JSON.parse(data);
        liste = liste.filter(r => r.id !== id);

        fs.writeFile(veriYolu, JSON.stringify(liste, null, 2), () => {
            res.redirect("/randevu-liste");
        });
    });
});

/* ===============================
   API - JSON endpoints for front-end
================================ */

const randevularPath = path.join(__dirname, "data", "randevular.json");
const firmalarPath = path.join(__dirname, "data", "firmalar.json");
const projelerPath = path.join(__dirname, "data", "projeler.json");

// ========== RANDEVULAR ==========

// READ - JSON list
app.get('/api/randevular', (req, res) => {
    fs.readFile(randevularPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }
        res.json(liste);
    });
});

// UPDATE - update an appointment
app.put('/api/randevular/:id', (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(randevularPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const idx = liste.findIndex(r => r.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Randevu bulunamadı.' });

        const updated = Object.assign({}, liste[idx], req.body);
        updated.id = liste[idx].id;
        liste[idx] = updated;

        fs.writeFile(randevularPath, JSON.stringify(liste, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Dosyaya yazılırken hata oluştu.' });
            res.json(updated);
        });
    });
});

// DELETE - API version
app.delete('/api/randevular/:id', (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(randevularPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const yeni = liste.filter(r => r.id !== id);

        fs.writeFile(randevularPath, JSON.stringify(yeni, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Dosyaya yazılırken hata oluştu.' });
            res.json({ success: true });
        });
    });
});

// ========== FIRMALAR (Admin CRUD) ==========

// GET all firmalar
app.get('/api/firmalar', (req, res) => {
    fs.readFile(firmalarPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }
        res.json(liste);
    });
});

// POST - Create firma
app.post('/api/firmalar', isAdmin, upload.single('image'), (req, res) => {
    const { name, description, city, founded } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: "İsim ve açıklama gereklidir." });
    }

    // Resim URL'sini belirle
    let imageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600";
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    fs.readFile(firmalarPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const newFirma = {
            id: Date.now(),
            name,
            description,
            image: imageUrl,
            projectCount: 0,
            founded: founded || 2020,
            city: city || "İstanbul"
        };

        liste.push(newFirma);

        fs.writeFile(firmalarPath, JSON.stringify(liste, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Firma eklenirken hata oluştu." });
            res.json(newFirma);
        });
    });
});

// PUT - Update firma
app.put('/api/firmalar/:id', isAdmin, (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(firmalarPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const idx = liste.findIndex(f => f.id === id);
        if (idx === -1) return res.status(404).json({ error: "Firma bulunamadı." });

        liste[idx] = Object.assign({}, liste[idx], req.body);
        liste[idx].id = id;

        fs.writeFile(firmalarPath, JSON.stringify(liste, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Firma güncellenirken hata oluştu." });
            res.json(liste[idx]);
        });
    });
});

// DELETE - Delete firma
app.delete('/api/firmalar/:id', isAdmin, (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(firmalarPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const yeni = liste.filter(f => f.id !== id);

        fs.writeFile(firmalarPath, JSON.stringify(yeni, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Firma silinirken hata oluştu." });
            res.json({ success: true });
        });
    });
});

// ========== PROJELER (Admin CRUD) ==========

// GET all projeler
app.get('/api/projeler', (req, res) => {
    fs.readFile(projelerPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }
        res.json(liste);
    });
});

// POST - Create proje
app.post('/api/projeler', isAdmin, upload.single('image'), (req, res) => {
    const { name, firmaId, description, location, status, price, rooms } = req.body;

    if (!name || !firmaId || !description) {
        return res.status(400).json({ error: "Zorunlu alanları doldurunuz." });
    }

    // Resim URL'sini belirle
    let imageUrl = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800";
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    fs.readFile(projelerPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const newProje = {
            id: Date.now(),
            name,
            firmaId: Number(firmaId),
            description,
            image: imageUrl,
            location: location || "İstanbul",
            status: status || "Devam Ediyor",
            price: price || "0",
            rooms: rooms || "2+1"
        };

        liste.push(newProje);

        fs.writeFile(projelerPath, JSON.stringify(liste, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Proje eklenirken hata oluştu." });
            res.json(newProje);
        });
    });
});

// PUT - Update proje
app.put('/api/projeler/:id', isAdmin, (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(projelerPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const idx = liste.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: "Proje bulunamadı." });

        liste[idx] = Object.assign({}, liste[idx], req.body);
        liste[idx].id = id;

        fs.writeFile(projelerPath, JSON.stringify(liste, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Proje güncellenirken hata oluştu." });
            res.json(liste[idx]);
        });
    });
});

// DELETE - Delete proje
app.delete('/api/projeler/:id', isAdmin, (req, res) => {
    const id = Number(req.params.id);

    fs.readFile(projelerPath, 'utf8', (err, data) => {
        let liste = [];
        if (!err && data) {
            try { liste = JSON.parse(data); } catch { }
        }

        const yeni = liste.filter(p => p.id !== id);

        fs.writeFile(projelerPath, JSON.stringify(yeni, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Proje silinirken hata oluştu." });
            res.json({ success: true });
        });
    });
});

/* ===============================
   ADMIN API ENDPOINTS
================================ */

// Admin Dashboard Stats
app.get('/api/admin/stats', isAuthenticated, isAdmin, (req, res) => {
    dbOperations.getAllUsers((err, users) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata' });

        db.all('SELECT * FROM randevular', [], (err, appointments) => {
            if (err) return res.status(500).json({ success: false, message: 'Hata' });

            const approvedCount = appointments.filter(a => a.durum === 'onaylandi').length;
            const recent = appointments.slice(-5);

            res.json({
                success: true,
                totalUsers: users.length,
                totalAppointments: appointments.length,
                approvedAppointments: approvedCount,
                recentAppointments: recent
            });
        });
    });
});

// Get All Users
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    dbOperations.getAllUsers((err, users) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata' });
        res.json({ success: true, users });
    });
});

// Create User
app.post('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    const { ad, soyad, email, telefon, sifre, role } = req.body;

    if (!ad || !soyad || !email || !telefon || !sifre) {
        return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurunuz!' });
    }

    dbOperations.getUserByEmail(email, (err, user) => {
        if (user) {
            return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı!' });
        }

        const userRole = role === 'admin' ? 'admin' : 'user';
        dbOperations.registerUser(ad, soyad, email, telefon, sifre, (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Hata oluştu' });

            // Role güncelle
            db.run('UPDATE users SET role = ? WHERE id = ?', [userRole, result.id], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Hata oluştu' });
                res.json({ success: true, message: 'Kullanıcı eklendi!' });
            });
        });
    });
});

// Delete User
app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, (req, res) => {
    const userId = req.params.id;

    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata oluştu' });

        // Kullanıcının randevularını da sil
        db.run('DELETE FROM randevular WHERE user_id = ?', [userId], (err) => {
            res.json({ success: true, message: 'Kullanıcı silindi!' });
        });
    });
});

// Get All Appointments
app.get('/api/admin/appointments', isAuthenticated, isAdmin, (req, res) => {
    const query = `
        SELECT r.*, u.ad, u.soyad 
        FROM randevular r
        LEFT JOIN users u ON r.user_id = u.id
    `;

    db.all(query, [], (err, appointments) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata' });

        const data = appointments.map(a => ({
            ...a,
            userName: a.ad ? `${a.ad} ${a.soyad}` : 'Silinmiş Kullanıcı'
        }));

        res.json({ success: true, appointments: data });
    });
});

// Update Appointment Status
app.put('/api/admin/appointments/:id', isAuthenticated, isAdmin, (req, res) => {
    const { durum } = req.body;
    const appointmentId = req.params.id;

    if (!['onaylandi', 'beklemede', 'iptal'].includes(durum)) {
        return res.status(400).json({ success: false, message: 'Geçersiz durum' });
    }

    db.run('UPDATE randevular SET durum = ? WHERE id = ?', [durum, appointmentId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata oluştu' });
        res.json({ success: true, message: 'Randevu durumu güncellendi!' });
    });
});

// Delete Appointment
app.delete('/api/admin/appointments/:id', isAuthenticated, isAdmin, (req, res) => {
    const appointmentId = req.params.id;

    db.run('DELETE FROM randevular WHERE id = ?', [appointmentId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Hata oluştu' });
        res.json({ success: true, message: 'Randevu silindi!' });
    });
});

/* ===============================
   SERVER
================================ */

app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});
