export const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) return 'Only Images (JPG/PNG) or PDFs are allowed.';
    if (file.size > maxSize) return 'File size must be under 2MB.';
    return null;
};

export const validateSlide = (slideId, data, files, isTutor) => {
    const errors = {};
    const today = new Date();
    
    // Helper to safely trim and check for empty strings
    const trimData = (str) => (str ? str.trim() : '');

    switch (slideId) {
        case 'basics':
            if (isTutor && !trimData(data.bio)) {
                errors.bio = 'Bio is required for Tutors.';
            } else if (trimData(data.bio).length > 500) {
                errors.bio = 'Bio must be under 500 characters.';
            }
            break;

        case 'demographics':
            if (!data.dob) {
                errors.dob = 'Date of Birth is required.';
            } else {
                const dobDate = new Date(data.dob);
                const age = today.getFullYear() - dobDate.getFullYear();
                if (dobDate >= today) errors.dob = 'Date of Birth cannot be in the future.';
                else if (isTutor && age < 18) errors.dob = 'Tutors must be at least 18 years old.';
                else if (!isTutor && age < 5) errors.dob = 'Students must be at least 5 years old.';
            }
            break;

        case 'contact':
            if (!trimData(data.phoneNumber)) {
                errors.phoneNumber = 'Phone number is required.';
            } else if (!/^(0|94)[0-9]{9}$/.test(trimData(data.phoneNumber).replace(/\s+/g, ''))) {
                errors.phoneNumber = 'Must be a valid 10-digit Sri Lankan phone number.';
            }
            
            if (!trimData(data.city)) {
                errors.city = 'City is required.';
            } else if (/[0-9!@#$%^&*()_+=[\]{};':"\\|,.<>/?]+/.test(trimData(data.city))) {
                errors.city = 'City should not contain numbers or special characters.';
            }
            
            if (!trimData(data.country)) errors.country = 'Please select a country.';
            break;

        case 'emergency':
            if (!trimData(data.emergencyContactName)) errors.emergencyContactName = 'Emergency contact name is required.';
            if (!trimData(data.emergencyContactRelation)) errors.emergencyContactRelation = 'Relationship is required.';
            
            if (!trimData(data.emergencyContactPhone)) {
                errors.emergencyContactPhone = 'Emergency phone is required.';
            } else if (!/^(0|94)[0-9]{9}$/.test(trimData(data.emergencyContactPhone).replace(/\s+/g, ''))) {
                errors.emergencyContactPhone = 'Must be a valid 10-digit Sri Lankan phone number.';
            }
            break;

        case 'academic':
            if (!trimData(data.schoolOrUniversity)) errors.schoolOrUniversity = 'School/University is required.';
            if (!trimData(data.gradeLevel)) errors.gradeLevel = 'Grade level is required.';
            break;

        case 'student_needs':
            if (!trimData(data.learningNeeds)) {
                errors.learningNeeds = 'Learning needs are required.';
            } else if (trimData(data.learningNeeds).length < 10) {
                errors.learningNeeds = 'Please provide a meaningful description.';
            }
            break;

        case 'tutor_professional':
            if (!trimData(data.subjects)) errors.subjects = 'At least one subject is required.';
            
            if (!trimData(data.experience)) {
                errors.experience = 'Experience is required.';
            } else if (Number(data.experience) < 0) {
                errors.experience = 'Experience cannot be negative.';
            }
            
            if (!trimData(data.availability)) errors.availability = 'Availability is required.';
            break;

        case 'tutor_identity':
            if (!trimData(data.nicNumber)) {
                errors.nicNumber = 'NIC is required.';
            } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(trimData(data.nicNumber))) {
                errors.nicNumber = 'Must be a valid Sri Lankan NIC.';
            }
            if (!files.nicFront) errors.nicFront = 'NIC Front image is required.';
            if (!files.nicBack) errors.nicBack = 'NIC Back image is required.';
            break;

        case 'tutor_certificates':
            if (!files.certificates || files.certificates.length === 0) {
                errors.certificates = 'At least one certificate is required for verification.';
            }
            break;

        default:
            break;
    }

    return errors;
};