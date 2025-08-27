import { auth, database } from './firebase-init.js';

// Toggle between login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }

    // Clear error messages
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('signupError').style.display = 'none';
    document.getElementById('signupSuccess').style.display = 'none';
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMessage = document.getElementById('loginError');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if user is admin
        const adminRef = database.ref('admins/' + user.uid);
        const adminSnapshot = await adminRef.once('value');
        
        if (adminSnapshot.exists()) {
            window.location.href = 'admin/indexA.html';
        } else {
            // Check if user is worker
            const workerRef = database.ref('workers/' + user.uid);
            const workerSnapshot = await workerRef.once('value');
            
            if (workerSnapshot.exists()) {
                window.location.href = 'worker/index.html';
            } else {
                errorMessage.textContent = 'User not authorized';
                errorMessage.style.display = 'block';
            }
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('signupError');
    const successMessage = document.getElementById('signupSuccess');

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save user data as a worker
        await database.ref('workers/' + user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Show success message
        successMessage.textContent = 'Account created successfully! You can now login.';
        successMessage.style.display = 'block';

        // Clear form
        document.getElementById('signupForm').reset();

        // Switch to login form after 2 seconds
        setTimeout(() => {
            toggleForms();
        }, 2000);

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // Check if user is admin
        database.ref('admins/' + user.uid).once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    window.location.href = 'admin/indexA.html';
                } else {
                    // Check if user is worker
                    return database.ref('workers/' + user.uid).once('value');
                }
            })
            .then((snapshot) => {
                if (snapshot && snapshot.exists()) {
                    window.location.href = 'worker/index.html';
                }
            });
    }
});

// Make toggleForms globally accessible
window.toggleForms = toggleForms;