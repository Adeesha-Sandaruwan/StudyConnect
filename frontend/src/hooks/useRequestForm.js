import { useState, useCallback } from 'react';

/**
 * useRequestForm Custom Hook
 * Handles form state, validation, and submission for student requests
 * Validates: required fields, field lengths, enum values
 */

export const useRequestForm = (initialData = null, onSubmit) => {
    const defaultFormData = {
        subject: '',
        description: '',
        gradeLevel: '',
        requestType: 'ongoing',
        priority: 'medium',
        preferredSchedule: '',
    };

    const [formData, setFormData] = useState(initialData || defaultFormData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Validation rules
    const validationRules = {
        subject: {
            required: true,
            message: 'Subject is required',
            validate: (value) => value && value.trim().length > 0,
        },
        description: {
            required: true,
            min: 20,
            max: 1000,
            message: 'Description is required and must be between 20-1000 characters',
            validate: (value) => {
                if (!value || value.trim().length === 0) return false;
                const len = value.trim().length;
                return len >= 20 && len <= 1000;
            },
        },
        gradeLevel: {
            required: true,
            message: 'Grade level is required',
            validate: (value) => {
                const validGrades = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
                return value && validGrades.includes(String(value));
            },
        },
        requestType: {
            required: false,
            enum: ['once', 'ongoing'],
            message: 'Invalid request type',
            validate: (value) => !value || ['once', 'ongoing'].includes(value),
        },
        priority: {
            required: false,
            enum: ['low', 'medium', 'high', 'urgent'],
            message: 'Invalid priority level',
            validate: (value) => !value || ['low', 'medium', 'high', 'urgent'].includes(value),
        },
        preferredSchedule: {
            required: false,
            max: 500,
            validate: (value) => !value || value.length <= 500,
        },
    };

    // Validate single field
    const validateField = useCallback((fieldName, value) => {
        const rule = validationRules[fieldName];
        if (!rule) return '';

        if (rule.required && !rule.validate(value)) {
            return rule.message;
        }

        if (!rule.required && !value) {
            return '';
        }

        if (!rule.validate(value)) {
            return rule.message;
        }

        return '';
    }, []);

    // Validate entire form
    const validateForm = useCallback(() => {
        const newErrors = {};

        Object.keys(validationRules).forEach(fieldName => {
            const error = validateField(fieldName, formData[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, validateField]);

    // Handle field change
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    }, [errors]);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onSubmit(formData);
            
            // Success
            setSuccessMessage('Request submitted successfully! 🎉');
            
            // Reset form after success
            setTimeout(() => {
                setFormData(defaultFormData);
                setSuccessMessage('');
            }, 2000);

            return result;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to submit request';
            setErrors({ submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, onSubmit]);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData(defaultFormData);
        setErrors({});
        setSuccessMessage('');
    }, []);

    // Set form data manually
    const setFormValues = useCallback((newData) => {
        setFormData(prev => ({
            ...prev,
            ...newData,
        }));
    }, []);

    return {
        // State
        formData,
        errors,
        isSubmitting,
        successMessage,

        // Methods
        handleChange,
        handleSubmit,
        validateField,
        validateForm,
        resetForm,
        setFormValues,
    };
};

export default useRequestForm;
