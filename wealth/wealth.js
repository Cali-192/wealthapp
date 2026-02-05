// ELEMENTET E HTML
const balance = document.getElementById('balance');
const list = document.getElementById('list');
const form = document.getElementById('transaction-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const themeToggle = document.getElementById('theme-toggle');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const dateInput = document.getElementById('date');
const budgetInput = document.getElementById('budget-limit');
const budgetProgress = document.getElementById('budget-progress');
const budgetWarning = document.getElementById('budget-warning');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');
const monthFilter = document.getElementById('month-filter');
const currencySelect = document.getElementById('currency-select');
const avgDailyEl = document.getElementById('avg-daily');
const monthlyPredictEl = document.getElementById('monthly-predict');

// --- LOGJIKA E AUTENTIKIMIT DHE SIGURISË ---
let currentUser = localStorage.getItem('loggedUser') || null;
let transactions = [];
let savedBudget = "";

function handleAuth() {
    const user = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value.trim();
    const confirmPass = document.getElementById('confirm-password').value.trim();
    const secAnswer = document.getElementById('security-answer').value.trim().toLowerCase();

    if (!user || !pass) {
        alert("Ju lutem plotësoni emrin dhe fjalëkalimin!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('app_users')) || {};
    let securityData = JSON.parse(localStorage.getItem('app_security')) || {};

    if (!users[user]) {
        // Regjistrim i ri - Shfaqim fushat shtesë nëse janë të fshehura
        const regFields = document.getElementById('register-fields');
        if (regFields.style.display === 'none') {
            regFields.style.display = 'block';
            showNotification("Emër i ri! Ju lutem konfirmoni fjalëkalimin dhe pyetjen e sigurisë.", "info");
            return;
        }

        // Kontrollet e sigurisë për regjistrim
        if (pass !== confirmPass) {
            alert("Fjalëkalimet nuk përputhen!");
            return;
        }
        if (!secAnswer) {
            alert("Ju lutem jepni një përgjigje sigurie për të mbrojtur llogarinë!");
            return;
        }

        // Ruajtja e përdoruesit të ri
        users[user] = pass;
        securityData[user] = secAnswer;
        localStorage.setItem('app_users', JSON.stringify(users));
        localStorage.setItem('app_security', JSON.stringify(securityData));
        showNotification("Llogaria u krijua me sukses!");
    } else {
        // Kontrolli i fjalëkalimit për login
        if (users[user] !== pass) {
            alert("Fjalëkalimi është i gabuar!");
            return;
        }
    }

    localStorage.setItem('loggedUser', user);
    currentUser = user;
    checkAuth();
}

// Funksioni për Rikthimin e Fjalëkalimit (Forget Password)
window.toggleForgetPass = function() {
    const user = document.getElementById('username').value.trim().toLowerCase();
    if (!user) {
        alert("Shkruani emrin e përdoruesit që dëshironi të ktheni!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('app_users')) || {};
    let securityData = JSON.parse(localStorage.getItem('app_security')) || {};

    if (!users[user]) {
        alert("Ky përdorues nuk ekziston!");
        return;
    }

    const answer = prompt("Pyetje Sigurie: Cili është emri i kafshës suaj të parë?");
    if (answer && answer.toLowerCase() === securityData[user]) {
        const newPass = prompt("Saktë! Shkruani fjalëkalimin e ri:");
        if (newPass && newPass.length >= 4) {
            users[user] = newPass;
            localStorage.setItem('app_users', JSON.stringify(users));
            alert("Fjalëkalimi u ndryshua! Tani mund të kyçeni.");
        } else {
            alert("Fjalëkalimi i ri është shumë i shkurtër.");
        }
    } else if (answer) {
        alert("Përgjigje e gabuar!");
    }
};

function logout() {
    localStorage.removeItem('loggedUser');
    location.reload();
}

// --- LOGJIKA E PROFILIT ---

const uploadPhotoInput = document.getElementById('upload-photo');
if (uploadPhotoInput) {
    uploadPhotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = function() {
            const base64String = reader.result;
            localStorage.setItem(`photo_${currentUser}`, base64String);
            document.getElementById('user-photo').src = base64String;
            showNotification("Fotoja u përditësua!");
        };
        reader.readAsDataURL(file);
    });
}

window.changePassword = function() {
    const newPass = prompt("Shkruaj fjalëkalimin e ri:");
    if (newPass && newPass.length >= 4) {
        let users = JSON.parse(localStorage.getItem('app_users'));
        users[currentUser] = newPass;
        localStorage.setItem('app_users', JSON.stringify(users));
        showNotification("Fjalëkalimi u ndryshua!");
    } else if (newPass) {
        alert("Fjalëkalimi duhet të jetë të paktën 4 karaktere!");
    }
};

function checkAuth() {
    if (currentUser) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('user-display').innerText = currentUser;
        
        const savedPhoto = localStorage.getItem(`photo_${currentUser}`);
        if (savedPhoto) {
            document.getElementById('user-photo').src = savedPhoto;
        } else {
            document.getElementById('user-photo').src = `https://ui-avatars.com/api/?name=${currentUser}&background=random`;
        }

        transactions = JSON.parse(localStorage.getItem(`transactions_${currentUser}`)) || [];
        savedBudget = localStorage.getItem(`budgetLimit_${currentUser}`) || "";
        
        init();
    } else {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
}

// --- FUNKSIONET EKZISTUESE ---

let myChart;
let currentCurrency = 'EUR';
const exchangeRates = { EUR: { rate: 1, symbol: '€' }, ALL: { rate: 103.5, symbol: 'L' }, USD: { rate: 1.08, symbol: '$' } };

function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} shadow-sm border-0 py-2 px-3 mb-2`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateLocalStorage() {
    if (currentUser) {
        localStorage.setItem(`transactions_${currentUser}`, JSON.stringify(transactions));
        localStorage.setItem(`budgetLimit_${currentUser}`, budgetInput.value);
    }
}

function formatValue(val) {
    const rate = exchangeRates[currentCurrency].rate;
    const symbol = exchangeRates[currentCurrency].symbol;
    return `${(val * rate).toFixed(2)}${symbol}`;
}

function filterTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    const catVal = filterCategory.value;
    const monthVal = monthFilter.value; 

    const filtered = transactions.filter(t => {
        const matchesSearch = t.text.toLowerCase().includes(searchTerm);
        const matchesMonth = monthVal ? t.date.startsWith(monthVal) : true;
        
        let matchesCat = true;
        if (catVal === 'plus') matchesCat = t.amount > 0;
        else if (catVal === 'minus') matchesCat = t.amount < 0;
        else if (catVal !== 'all') matchesCat = t.category === catVal;

        return matchesSearch && matchesMonth && matchesCat;
    });

    renderList(filtered);
    updateSummary(filtered);
}

function renderList(filteredTransactions) {
    list.innerHTML = '';
    filteredTransactions.forEach(addTransactionDOM);
}

function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    item.classList.add('list-group-item');
    item.setAttribute('data-category', transaction.category);

    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <span class="fw-bold dark-text-fix">${transaction.text}</span> <br>
                <small class="text-muted">${transaction.category} | ${transaction.date}</small>
            </div>
            <div class="d-flex align-items-center">
                <span class="fw-bold me-3 ${transaction.amount < 0 ? 'text-danger' : 'text-success'}">
                    ${sign}${formatValue(Math.abs(transaction.amount))}
                </span>
                <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
            </div>
        </div>
    `;
    list.appendChild(item);
}

function updateSummary(filtered) {
    const amounts = filtered.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(i => i > 0).reduce((acc, i) => (acc += i), 0);
    const expense = amounts.filter(i => i < 0).reduce((acc, i) => (acc += i), 0) * -1;

    balance.innerText = formatValue(total);
    money_plus.innerText = formatValue(income);
    money_minus.innerText = formatValue(expense);

    if (expense > 0 && filtered.length > 0) {
        const avg = expense / 30; 
        avgDailyEl.innerText = formatValue(avg);
        monthlyPredictEl.innerText = formatValue(avg * 30);
    } else {
        avgDailyEl.innerText = formatValue(0);
        monthlyPredictEl.innerText = formatValue(0);
    }

    const limit = parseFloat(budgetInput.value);
    if (limit > 0) {
        const percent = (expense / limit) * 100;
        budgetProgress.style.width = `${Math.min(percent, 100)}%`;
        budgetWarning.innerText = percent >= 100 ? "⚠️ Limiti u kalua!" : `Ezauruar: ${percent.toFixed(1)}%`;
        budgetProgress.className = percent >= 100 ? "progress-bar bg-danger" : (percent >= 80 ? "progress-bar bg-warning" : "progress-bar bg-success");
    } else {
        budgetProgress.style.width = "0%";
        budgetWarning.innerText = "";
    }
}

function updateChart() {
    const canvas = document.getElementById('myChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const categories = ['Ushqim', 'Transport', 'Qira', 'Argëtim', 'Rrogë', 'Të tjera'];
    const dataValues = categories.map(cat => 
        transactions.filter(t => t.category === cat).reduce((acc, t) => acc + Math.abs(t.amount), 0)
    );

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{ data: dataValues, backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#2ecc71', '#95a5a6'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const transaction = {
        id: Math.floor(Math.random() * 1000000),
        text: text.value,
        category: category.value,
        amount: +amount.value,
        date: dateInput.value
    };
    transactions.push(transaction);
    updateLocalStorage();
    filterTransactions();
    updateChart();
    showNotification('U shtua!');
    text.value = ''; amount.value = '';
});

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    filterTransactions();
    updateChart();
    showNotification('U fshi.', 'danger');
}

window.downloadPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Raporti Financiar - ${currentUser}`, 14, 20);
    const rows = transactions.map(t => [t.text, t.category, formatValue(t.amount), t.date]);
    doc.autoTable({ head: [['Emri', 'Kategoria', 'Shuma', 'Data']], body: rows });
    doc.save(`report-${currentUser}.pdf`);
}

window.clearAll = function() {
    if(confirm("A jeni i sigurt që dëshironi të fshini të gjitha të dhënat e kësaj llogarie?")) {
        transactions = [];
        updateLocalStorage();
        filterTransactions();
        updateChart();
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateChart();
});

currencySelect.addEventListener('change', (e) => { currentCurrency = e.target.value; filterTransactions(); });
searchInput.addEventListener('input', filterTransactions);
filterCategory.addEventListener('change', filterTransactions);
monthFilter.addEventListener('change', filterTransactions);
budgetInput.addEventListener('input', () => { updateLocalStorage(); filterTransactions(); });

function init() {
    budgetInput.value = savedBudget;
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    filterTransactions();
    updateChart();
}

// NISJA KRYESORE
checkAuth();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('Service Worker not registered', err));
  });
}