export const validateName = (name) => {
    if (!name.trim()) return "Name is required.";
    if (name.length < 3) return "Name must be at least 3 characters long.";
    return null;
};

export const validateEmail = (email) => {
    if (!email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return null;
};

export const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    return null;
};

export const validateLoginForm = (email, password) => {
    const errors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    
    return Object.keys(errors).length > 0 ? errors : null;
};

export const validateRegisterForm = (name, email, password) => {
    const errors = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    
    return Object.keys(errors).length > 0 ? errors : null;
};