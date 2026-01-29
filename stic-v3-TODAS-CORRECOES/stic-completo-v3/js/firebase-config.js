// Configuração do Firebase - STIC 7ª RPM PMMG
// ✅ PROJETO NOVO - DO ZERO!
// Projeto: stic7rpmmg-948b1

const firebaseConfig = {
    apiKey: "AIzaSyDQrStDcMZ_nkcPBGcE8miMXitxQYeFVMw",
    authDomain: "stic7rpmmg-948b1.firebaseapp.com",
    projectId: "stic7rpmmg-948b1",
    storageBucket: "stic7rpmmg-948b1.firebasestorage.app",
    messagingSenderId: "994246517238",
    appId: "1:994246517238:web:5b709f13a908116421a7d7"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências principais
const db = firebase.firestore();
// Storage removido - usando Base64 no Firestore

// ====================================
// COLLECTIONS - ESTRUTURA DO FIRESTORE
// ====================================

// SISTEMA DE ORDENS DE SERVIÇO
const ordensServicoRef = db.collection('ordens_servico');
const materiaisRef = db.collection('materiais');
const entradasRef = db.collection('entradas_material');
const saidasRef = db.collection('saidas'); // ✅ EMPRÉSTIMOS - NÃO MUDAR!
const assinaturasRef = db.collection('assinaturas');

// SISTEMA DE HORAS EXTRAS
const militaresRef = db.collection('militares_horas');
const horasRef = db.collection('horas_extras');

// USUÁRIOS E RECEBEDORES
const usuariosRef = db.collection('usuarios_recebedores');

console.log('🔥 Firebase inicializado com sucesso! - STIC 7ª RPM PMMG');
console.log('📊 Projeto: stic7rpmmg-948b1');
