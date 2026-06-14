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
  state.price  = parseInt(btn.dataset.price);

  document.getElementById('pay-amount').textContent = 'Rp ' + state.price.toLocaleString('id-ID');
  document.getElementById('pay-volume').textContent = state.volume + ' ml air';
  document.getElementById('meta-vol').textContent   = state.volume + ' ml';
  document.getElementById('meta-price').textContent = 'Rp ' + state.price.toLocaleString('id-ID');
  document.getElementById('disp-target').textContent = '0 / ' + state.volume + ' ml';
  document.getElementById('rec-vol').textContent    = state.volume + ' ml';
  document.getElementById('rec-price').textContent  = 'Rp ' + state.price.toLocaleString('id-ID');

  showScreen('screen-2');
  startCountdown();

  // -- MIDTRANS: uncomment saat backend siap --
  // fetch('/api/payment/create', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ volume: state.volume, price: state.price })
  // })
  // .then(r => r.json())
  // .then(data => {
  //   // render QR dari data.qr_string pakai library qrcode.js
  //   startPolling(data.transaction_id);
  // });
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
  onPaymentSuccess();
}

function onPaymentSuccess() {
  showScreen('screen-3');
  document.getElementById('dispensing-view').classList.remove('hidden');
  document.getElementById('done-view').classList.add('hidden');
  document.getElementById('tank-fill').style.height = '0%';
  document.getElementById('tank-percent').textContent = '0%';
  document.getElementById('disp-target').textContent = '0 / ' + state.volume + ' ml';
  startDispensing();
}

// -- MIDTRANS polling: uncomment saat backend siap --
// function startPolling(txId) {
//   const poll = setInterval(async () => {
//     try {
//       const r = await fetch('/api/payment/status/' + txId);
//       const d = await r.json();
//       if (d.status === 'PAID') {
//         clearInterval(poll);
//         clearInterval(state.countdownTimer);
//         onPaymentSuccess();
//       }
//     } catch(e) { console.error(e); }
//   }, 2000);
// }

function startDispensing() {
  clearInterval(state.dispensingTimer);
  state.filled = 0;

  // Simulasi pengisian — ganti dengan polling ESP32 saat hardware terhubung
  state.dispensingTimer = setInterval(() => {
    state.filled = Math.min(state.filled + 5, state.volume);
    const pct = Math.round((state.filled / state.volume) * 100);
    document.getElementById('tank-fill').style.height = pct + '%';
    document.getElementById('tank-percent').textContent = pct + '%';
    document.getElementById('disp-target').textContent = state.filled + ' / ' + state.volume + ' ml';
    if (state.filled >= state.volume) {
      clearInterval(state.dispensingTimer);
      setTimeout(showDone, 500);
    }
  }, 100);

  // -- ESP32 real polling: uncomment saat hardware terhubung --
  // state.dispensingTimer = setInterval(async () => {
  //   const r = await fetch('/api/dispense/progress');
  //   const d = await r.json();
  //   const pct = Math.round((d.filled / state.volume) * 100);
  //   document.getElementById('tank-fill').style.height = pct + '%';
  //   document.getElementById('tank-percent').textContent = pct + '%';
  //   document.getElementById('disp-target').textContent = d.filled + ' / ' + state.volume + ' ml';
  //   if (d.status === 'DONE') { clearInterval(state.dispensingTimer); setTimeout(showDone, 500); }
  // }, 500);
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