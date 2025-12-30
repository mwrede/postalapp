// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const postOffice = document.getElementById('post-office').value;

    try {
        // Save user to Supabase database
        const { data, error } = await supabase
            .from('users')
            .upsert(
                {
                    first_name: firstName,
                    location: postOffice,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'first_name,location',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error && error.code !== '23505') {
            console.error('Error saving user to database:', error);
        } else {
            console.log('User saved to database:', data);
        }

        // Store user info in localStorage
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('postOffice', postOffice);
        if (data && data.id) {
            localStorage.setItem('userId', data.id);
        }

        // Redirect to main app
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        // Still allow login even if database save fails
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('postOffice', postOffice);
        window.location.href = 'index.html';
    }
});
