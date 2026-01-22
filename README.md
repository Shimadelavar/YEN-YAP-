# YeniYapı.com - Final Projesi

## 📋 Proje Özet

Türkiye'nin gayrimenkul sektöründe dijital bir platform olan **YeniYapı.com**, kullanıcıların inşaat firmalarını ve konut projelerini keşfedebileceği, randevu alabilecek ve admin tarafından projelerin yönetileceği bir web uygulamasıdır.

---

## ✅ Gereksinimler Kontrol Listesi

- ✅ **En az 5 sayfa:** İndex, Giriş, Firmalar, Proje Detayı, Randevu (+ Admin Panel)
- ✅ **CRUD İşlemleri:** Firmalar, Projeler, Randevular (Create, Read, Update, Delete)
- ✅ **HTML:** Tüm sayfalar HTML5 ile yapılmış
- ✅ **CSS:** Bootstrap 5 + Custom CSS styling
- ✅ **JavaScript:** Client-side form handling, fetch API, dynamic rendering
- ✅ **Node.js & Express:** Backend server, routing, middleware
- ✅ **Bootstrap:** Tüm sayfalar responsive Bootstrap grid kullanıyor

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Sunucuyu Başlat
```bash
npm start
```

### 3. Tarayıcıda Aç
```
http://localhost:3000
```

---

## 👤 Demo Hesapları

| Rol  | Email | Şifre |
|------|-------|-------|
| Admin | admin@yeniyapi.com | admin123 |
| User | user@yeniyapi.com | user123 |

---

## 📁 Proje Yapısı

```
YeniYapi/
├── app.js                          # Express server & routes
├── package.json                    # Dependencies
├── public/
│   └── style.css                   # Global styling
├── data/
│   ├── users.json                  # Mock users (login credentials)
│   ├── firmalar.json               # Building companies
│   ├── projeler.json               # Projects
│   └── randevular.json             # Appointments
└── views/
    ├── index.html                  # Homepage
    ├── giris.html                  # Login page
    ├── firmalar.html               # Companies list
    ├── firma-detay.html            # Company details
    ├── proje-detay.html            # Project details
    ├── randevu.html                # Appointment booking
    └── admin-panel.html            # Admin dashboard
```

---

## 🔐 Authentication & Authorization

- **Session-based authentication** (`express-session`)
- Login sayfasında email/şifre ile giriş yapabilirsiniz
- Admin rolündeki kullanıcılar `/admin-panel`'a erişebilir
- Session cookies ile güvenli yönetim

---

## 🛠️ Özellikler

### Ziyaretçi (Unauthenticated)
- Anasayfayı görebilir
- Firmalar listesini görebilir
- Proje detaylarını görebilir
- Giriş yapabilir

### Authenticated User
- Randevu alabilir
- Randevularını görebilir/düzenleyebilir/silebilir
- Çıkış yapabilir

### Admin User
- **Firmalar yönetimi:** Ekle, Düzenle, Sil
- **Projeler yönetimi:** Ekle, Düzenle, Sil
- Tüm CRUD işlemleri yapabilir
- Admin panele eksklusif erişim

---

## 📡 API Endpoints

### Authentication
- `POST /login` - Giriş yap
- `GET /logout` - Çıkış yap
- `GET /api/check-auth` - Oturum durumunu kontrol et

### Firmalar (Admin only)
- `GET /api/firmalar` - Tüm firmaları listele
- `POST /api/firmalar` - Firma ekle
- `PUT /api/firmalar/:id` - Firma güncelle
- `DELETE /api/firmalar/:id` - Firma sil

### Projeler (Admin only)
- `GET /api/projeler` - Tüm projeleri listele
- `POST /api/projeler` - Proje ekle
- `PUT /api/projeler/:id` - Proje güncelle
- `DELETE /api/projeler/:id` - Proje sil

### Randevular (Public create, owned user can edit/delete)
- `POST /randevu-kaydet` - Randevu ekle
- `GET /api/randevular` - Randevuları listele
- `PUT /api/randevular/:id` - Randevu güncelle
- `DELETE /api/randevular/:id` - Randevu sil

---

## ✨ Teknik Detaylar

### Frontend
- **Bootstrap 5:** Responsive grid sistemi
- **Fetch API:** Asynchronous API calls
- **Form Validation:** Client-side & server-side
- **Dynamic Rendering:** JavaScript ile dynamic HTML oluşturma

### Backend
- **Express.js:** Web server framework
- **Session Management:** express-session middleware
- **File I/O:** JSON dosyaları ile veri yönetimi
- **Error Handling:** Comprehensive error responses

### Veri Depolama
- JSON dosyaları (users.json, firmalar.json, projeler.json, randevular.json)
- Server-side validation

---

## 🎨 UI/UX Özellikleri

- ✨ Modern, profesyonel tasarım
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎯 Smooth animations ve transitions
- ♿ Accessible forms ve buttons
- 🎨 Consistent color scheme (Navy + Gold)
- 🔔 Success/Error notifications

---

## 📝 Form Validasyon

- **Client-side:** Boş alanlar, email format, tarih format
- **Server-side:** Aynı validasyonlar + injection prevention
- **Hata mesajları:** Kullanıcı-dostu türkçe hata metinleri

---

## 🔒 Güvenlik

- Session-based authentication
- Password protection (mock passwords in demo)
- Admin middleware (role-based access control)
- XSS prevention (HTML escaping)

---

## 📊 Örnek Veriler

- **3 Firma:** Artaş Grubu, Tahincioğlu, Mesa Holding
- **3 Proje:** Avrupa Konutları, Nidapark, Mesa Orman
- **2 Kullanıcı:** Admin ve Regular User

---

## 🛑 Bilinen Limitasyonlar

- Mock veri (production database yok)
- No email verification
- Şifreler plain text (demo amaçlı)
- No image upload functionality

---

## 🎓 Eğitim Amaçlı Proje

Bu proje Node.js, Express ve Frontend geliştirme becerilerini göstermek amacıyla oluşturulmuştur.

---

## 📞 İletişim

- **Proje:** YeniYapı.com - Final Project 2026
- **Tarih:** Ocak 2026
- **Versiyon:** 1.0.0

---

**Başarılar!** 🚀
