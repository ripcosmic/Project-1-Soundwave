const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

let pendingLoginEmail = null;

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// Account management using localStorage
const signupBtn = document.getElementById('signupBtn');
const signinBtn = document.getElementById('signinBtn');
const signupMessage = document.getElementById('signupMessage');
const signinMessage = document.getElementById('signinMessage');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const otpMessage = document.getElementById('otpMessage');

function getAccounts(){
    try{
        return JSON.parse(localStorage.getItem('soundwave_accounts')) || [];
    }catch(e){
        return [];
    }
}

function saveAccounts(acc){
    localStorage.setItem('soundwave_accounts', JSON.stringify(acc));
}

// Send OTP via server
async function sendOTP(email) {
    try {
        const response = await fetch('http://localhost:8000/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        return response.ok;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

// Verify OTP with server
async function verifyOTPWithServer(email, otp) {
    try {
        const response = await fetch('http://localhost:8000/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
        });
        return response.ok;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return false;
    }
}

// Show OTP form
function showOTPForm(email) {
    pendingLoginEmail = email;
    document.querySelector('.sign-in').style.display = 'none';
    document.querySelector('.toggle-container').style.display = 'none';
    document.getElementById('otpForm').classList.add('show');
    document.getElementById('otp-input').focus();
}

// Hide OTP form
function hideOTPForm() {
    document.querySelector('.sign-in').style.display = 'flex';
    document.querySelector('.toggle-container').style.display = 'block';
    document.getElementById('otpForm').classList.remove('show');
    document.getElementById('otp-input').value = '';
    otpMessage.textContent = '';
}

// Resend OTP
async function resendOTP() {
    if (pendingLoginEmail) {
        otpMessage.textContent = 'Sending OTP...';
        otpMessage.style.color = '#666';
        const sent = await sendOTP(pendingLoginEmail);
        if (sent) {
            otpMessage.textContent = 'OTP resent successfully!';
            otpMessage.style.color = 'green';
        } else {
            otpMessage.textContent = 'Failed to resend OTP';
            otpMessage.style.color = 'red';
        }
    }
}

if(signupBtn){
    signupBtn.addEventListener('click', () => {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;

        if(!name || !email || !password){
            signupMessage.textContent = 'Please fill all fields.';
            signupMessage.style.color = 'red';
            return;
        }

        const accounts = getAccounts();
        if(accounts.find(a => a.email === email)){
            signupMessage.textContent = 'An account with that email already exists.';
            signupMessage.style.color = 'red';
            return;
        }

        accounts.push({name, email, password});
        saveAccounts(accounts);
        signupMessage.textContent = 'Account created. Redirecting...';
        signupMessage.style.color = 'green';
        localStorage.setItem('soundwave_current', email);
        setTimeout(() => {
            window.location.href = '../menu-contents/index.html';
        }, 800);
    });
}

if(signinBtn){
    signinBtn.addEventListener('click', async () => {
        const email = document.getElementById('signin-email').value.trim().toLowerCase();
        const password = document.getElementById('signin-password').value;

        if(!email || !password){
            signinMessage.textContent = 'Enter email and password.';
            signinMessage.style.color = 'red';
            return;
        }

        const accounts = getAccounts();
        const match = accounts.find(a => a.email === email && a.password === password);
        if(match){
            signinMessage.textContent = 'Sending OTP...';
            signinMessage.style.color = '#666';
            
            // Send OTP
            const otpSent = await sendOTP(email);
            if (otpSent) {
                signinMessage.textContent = 'OTP sent to your email!';
                signinMessage.style.color = 'green';
                setTimeout(() => {
                    showOTPForm(email);
                }, 500);
            } else {
                signinMessage.textContent = 'Failed to send OTP. Please try again.';
                signinMessage.style.color = 'red';
            }
        } else {
            signinMessage.textContent = 'Invalid email or password.';
            signinMessage.style.color = 'red';
        }
    });
}

if(verifyOtpBtn){
    verifyOtpBtn.addEventListener('click', async () => {
        const otp = document.getElementById('otp-input').value.trim();

        if(!otp || otp.length !== 6){
            otpMessage.textContent = 'Please enter a valid 6-digit OTP.';
            otpMessage.style.color = 'red';
            return;
        }

        otpMessage.textContent = 'Verifying OTP...';
        otpMessage.style.color = '#666';

        const verified = await verifyOTPWithServer(pendingLoginEmail, otp);
        
        if (verified) {
            otpMessage.textContent = 'OTP verified! Redirecting...';
            otpMessage.style.color = 'green';
            localStorage.setItem('soundwave_current', pendingLoginEmail);
            setTimeout(() => {
                window.location.href = '../menu-contents/index.html';
            }, 500);
        } else {
            otpMessage.textContent = 'Invalid OTP. Please try again.';
            otpMessage.style.color = 'red';
        }
    });
}