const { db, dbOperations } = require("./db");

// Admin kullanıcısı oluştur
dbOperations.registerUser('Admin', 'User', 'admin@example.com', '05551234567', 'admin123', (err, result) => {
    if (err) {
        console.error('❌ Hata:', err);
        process.exit(1);
    }

    // Role'ü admin olarak güncelle
    db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', result.id], (err) => {
        if (err) {
            console.error('❌ Hata:', err);
            process.exit(1);
        }

        console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
        console.log('📧 Email: admin@example.com');
        console.log('🔐 Şifre: admin123');
        process.exit(0);
    });
});
