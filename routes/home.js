const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/firmalar", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/firmalar.html"));
});

router.get("/firma-detay", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/firma-detay.html"));
});

router.get("/proje-detay", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/proje-detay.html"));
});

router.get("/giris", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/giris.html"));
});

router.get("/randevu", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/randevu.html"));
});

module.exports = router;
