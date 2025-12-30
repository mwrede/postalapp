// Handle login form submission
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const postOffice = document.getElementById('post-office').value;

    // Store user info in localStorage
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('postOffice', postOffice);

    // Redirect to main app
    window.location.href = 'index.html';
});
