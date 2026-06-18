const API_BASE_URL = 'http://localhost:3000';

const state = {
  volume: 0,
  price: 0,
  countdown: 120,
  countdownTimer: null,
  dispensingTimer: null,
  filled: 0,
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function selectVolume(btn) {
  state.volume = parseInt(btn.dataset.volume);
  state.price = parseInt(btn.dataset.price);

  document.getElementById('pay-amount').textContent = 'Rp ' + state.price.toLocaleString('id-ID');
  document.getElementById('pay-volume').textContent = state.volume + ' ml air';
  document.getElementById('meta-vol').textContent = state.volume + ' ml';
  document.getElementById('meta-price').textContent = 'Rp ' + state.price.toLocaleString('id-ID');
  document.getElementById('disp-target').textContent = '0 / ' + state.volume + ' ml';
  document.getElementById('rec-vol').textContent = state.volume + ' ml';
  document.getElementById('rec-price').textContent = 'Rp ' + state.price.toLocaleString('id-ID');

  showScreen('screen-2');
  startCountdown();

  // Tampilkan loading, sembunyikan gambar QR sebelumnya (jika ada transaksi baru)
  document.getElementById('qr-loading').style.display = 'flex';
  document.getElementById('qr-image').style.display = 'none';
  document.getElementById('qr-image').src = '';

  // -- MIDTRANS: Fetch ke backend --
  fetch(`${API_BASE_URL}/api/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: state.volume, price: state.price })
  })
    .then(r => r.json())
    .then(data => {
      // Sembunyikan loading animasi dan tampilkan gambar QR
      document.getElementById('qr-loading').style.display = 'none';
      const qrImg = document.getElementById('qr-image');
      qrImg.style.display = 'block';

      // Gunakan qr_url langsung dari Midtrans jika tersedia, jika tidak fallback ke generate qr_string
      if (data.qr_url) {
        qrImg.src = data.qr_url;
      } else if (data.qr_string) {
        QRCode.toDataURL(data.qr_string, { width: 160, margin: 1 }, function (error, url) {
          if (error) console.error('Gagal render QR:', error);
          else qrImg.src = url;
        });
      }

      startPolling(data.transaction_id);
    })
    .catch(err => {
      console.error('Error create payment:', err);
      document.querySelector('#qr-loading p').textContent = 'Gagal memuat QR';
      document.querySelector('#qr-loading .spinner').style.display = 'none';
    });
}

function goBack() {
  clearInterval(state.countdownTimer);
  showScreen('screen-1');
}

function startCountdown() {
  clearInterval(state.countdownTimer);
  state.countdown = 120;
  updateCountdownUI(120);
  state.countdownTimer = setInterval(() => {
    state.countdown--;
    updateCountdownUI(state.countdown);
    if (state.countdown <= 0) {
      clearInterval(state.countdownTimer);
      alert('Waktu pembayaran habis. Silakan coba lagi.');
      showScreen('screen-1');
    }
  }, 1000);
}

function updateCountdownUI(sec) {
  document.getElementById('countdown-num').textContent = sec;
  const offset = 176 - (sec / 120) * 176;
  const circle = document.getElementById('countdown-circle');
  circle.setAttribute('stroke-dashoffset', offset);
  circle.setAttribute('stroke', sec <= 20 ? '#F87171' : '#0EA5E9');
}

// Hapus fungsi ini saat Midtrans sudah aktif
function simulatePayment() {
  clearInterval(state.countdownTimer);
  onPaymentSuccess('sim-tx-' + Date.now());
}

function onPaymentSuccess(txId) {
  showScreen('screen-3');
  document.getElementById('dispensing-view').classList.remove('hidden');
  document.getElementById('done-view').classList.add('hidden');
  document.getElementById('tank-fill').style.height = '0%';
  document.getElementById('tank-percent').textContent = '0%';
  document.getElementById('disp-target').textContent = '0 / ' + state.volume + ' ml';
  startDispensing(txId);
}

// -- MIDTRANS polling: uncomment saat backend siap --
function startPolling(txId) {
  const poll = setInterval(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/payment/status/` + txId);
      const d = await r.json();
      if (d.status === 'PAID') {
        clearInterval(poll);
        clearInterval(state.countdownTimer);
        onPaymentSuccess(txId);
      }
    } catch (e) { console.error(e); }
  }, 2000);
}

function startDispensing(txId) {
  clearInterval(state.dispensingTimer);
  state.filled = 0;

  // -- ESP32 real polling: akan berjalan otomatis memantau hardware --
  state.dispensingTimer = setInterval(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/dispense/progress/${txId}`);
      const d = await r.json();
      
      // Update UI sesuai data dari ESP32
      const pct = Math.round((d.filled / state.volume) * 100);
      document.getElementById('tank-fill').style.height = pct + '%';
      document.getElementById('tank-percent').textContent = pct + '%';
      document.getElementById('disp-target').textContent = d.filled + ' / ' + state.volume + ' ml';
      
      if (d.status === 'DONE' || d.filled >= state.volume) { 
        clearInterval(state.dispensingTimer); 
        setTimeout(showDone, 500); 
      }
    } catch (e) {
      console.error('Error memantau progress ESP32:', e);
    }
  }, 500);
}

function showDone() {
  document.getElementById('dispensing-view').classList.add('hidden');
  document.getElementById('done-view').classList.remove('hidden');
}

function restart() {
  state.volume = 0; state.price = 0; state.filled = 0;
  clearInterval(state.countdownTimer);
  clearInterval(state.dispensingTimer);
  showScreen('screen-1');
}