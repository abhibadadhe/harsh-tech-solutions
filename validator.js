const dns = require('dns');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Configure fast, reliable public DNS servers for MX record resolution
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    // If setServers fails in restricted container environments, proceed with system DNS
}

const dnsPromises = dns.promises;

// High-confidence list of popular disposable / temporary email providers
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    'guerrillamail.com',
    'tempmail.com',
    'temp-mail.org',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
    'yopmail.net',
    'throwawaymail.com',
    'dispostable.com',
    'getairmail.com',
    'sharklasers.com',
    'fakeinbox.com',
    'generator.email',
    'mohmal.com',
    'maildrop.cc',
    'crazymailing.com',
    'inboxkitten.com',
    'mytemp.email',
    'nada.ltd',
    'burnermail.io',
    'emailondeck.com',
    'minutemailbox.com',
    'tempail.com',
    'fakemailgenerator.com',
    'throwawaymail.org',
    'armyspy.com',
    'cuvox.de',
    'dayrep.com',
    'fleckens.hu',
    'gustr.com',
    'jourrapide.com',
    'rhyta.com',
    'superrito.com',
    'teleworm.us',
    'tinypm.com',
    'disposablemail.com'
]);

// Known dummy / placeholder usernames
const DUMMY_EMAIL_USERS = new Set([
    'test', 'tester', 'testing', 'fake', 'dummy', 'asdf', 'qwerty',
    'admin', 'user', 'sample', 'abc', 'xyz', 'demo', 'none',
    'noemail', 'null', 'temp', 'example', 'nobody', 'fakeuser',
    'testuser', '123', '12345', '123456'
]);

// Known dummy email domains
const DUMMY_EMAIL_DOMAINS = new Set([
    'test.com', 'testing.com', 'asdf.com', 'fake.com', 'dummy.com',
    'example.com', 'sample.com', 'email.com', 'domain.com',
    'none.com', 'temp.com', 'xyz.com', 'abc.com'
]);

// Check if string contains all identical digits (e.g. 9999999999, 0000000000)
function isAllSameDigits(digits) {
    if (!digits || digits.length < 5) return false;
    return digits.split('').every(d => d === digits[0]);
}

// Check if string is a sequence of numbers (e.g. 1234567890, 9876543210)
function isSequential(digits) {
    if (!digits || digits.length < 6) return false;
    const ascending = '01234567890123456789';
    const descending = '98765432109876543210';
    return ascending.includes(digits) || descending.includes(digits);
}

// Check if phone number exhibits fake repetitive structures
function isRepetitivePattern(digits) {
    if (!digits || digits.length < 8) return false;

    // Check repeating blocks (e.g. 9898989898, 9876598765)
    for (let blockSize = 2; blockSize <= 5; blockSize++) {
        if (digits.length % blockSize === 0) {
            const block = digits.slice(0, blockSize);
            if (block.repeat(digits.length / blockSize) === digits) {
                return true;
            }
        }
    }

    // Check 5 consecutive identical digits (e.g. 9879999901, 00000, 11111)
    if (/(.)\1{4,}/.test(digits)) {
        return true;
    }

    // Check if 8 or more of the 10 digits are identical
    const counts = {};
    for (const ch of digits) {
        counts[ch] = (counts[ch] || 0) + 1;
        if (counts[ch] >= 8) return true;
    }

    return false;
}

/**
 * Validates customer name against spam, keyboard mash, and repetitive characters.
 */
function validateName(name) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return { isValid: false, error: 'Please enter your full name (at least 2 characters).' };
    }
    const clean = name.trim();
    if (clean.length > 70) {
        return { isValid: false, error: 'Name cannot exceed 70 characters.' };
    }
    // Check 3+ consecutive repeating characters (e.g. Najjj)
    if (/(.)\1{2,}/i.test(clean)) {
        return { isValid: false, error: 'Please enter a genuine name (repetitive letters detected).' };
    }
    // Must contain letters, spaces, hyphens, dots
    if (!/^[a-zA-Z\u00C0-\u024F\s.'-]+$/.test(clean)) {
        return { isValid: false, error: 'Name should contain letters only.' };
    }
    return { isValid: true, sanitizedName: clean };
}

/**
 * Validates inquiry message content against dummy spam.
 */
function validateMessage(message, name) {
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
        return { isValid: false, error: 'Please provide at least 10 characters describing your inquiry or project.' };
    }
    const clean = message.trim();
    if (name && clean.toLowerCase() === name.trim().toLowerCase()) {
        return { isValid: false, error: 'Please describe your project or inquiry in the message field.' };
    }
    if (/(.)\1{3,}/i.test(clean)) {
        return { isValid: false, error: 'Please enter a genuine message without repeated characters.' };
    }
    const words = clean.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) {
        return { isValid: false, error: 'Please provide a brief description of your inquiry (at least 2 words).' };
    }
    return { isValid: true, sanitizedMessage: clean };
}

/**
 * Validates whether an email address is real, authentic, not disposable,
 * conforms to provider length constraints (like Gmail 6-30 chars),
 * and belongs to a domain with active mail exchange (MX) DNS records.
 *
 * @param {string} email
 * @returns {Promise<{ isValid: boolean, error?: string, sanitizedEmail?: string }>}
 */
async function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email address is required.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Basic RFC format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(cleanEmail)) {
        return { isValid: false, error: 'Please enter a valid email format (e.g. name@domain.com).' };
    }

    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
        return { isValid: false, error: 'Invalid email structure.' };
    }

    const [userPart, domainPart] = parts;

    // 2. Minimum length for ANY email username (prevents single-letter dummy emails like v@...)
    if (userPart.length < 3) {
        return {
            isValid: false,
            error: `Email username "${userPart}" is too short (minimum 3 characters required).`
        };
    }

    // 3. Provider-Specific Rules:
    // Gmail strictly enforces 6 to 30 characters (Google Account requirement)
    if (domainPart === 'gmail.com' || domainPart === 'googlemail.com') {
        if (userPart.length < 6 || userPart.length > 30) {
            return {
                isValid: false,
                error: `Gmail usernames must be between 6 and 30 characters long ("${userPart}@gmail.com" does not exist).`
            };
        }
        if (userPart.startsWith('.') || userPart.endsWith('.') || userPart.includes('..')) {
            return {
                isValid: false,
                error: 'Gmail addresses cannot begin, end, or contain consecutive dots.'
            };
        }
    }

    // Yahoo requires 4 to 32 characters
    if (domainPart.includes('yahoo.') || domainPart === 'ymail.com') {
        if (userPart.length < 4 || userPart.length > 32) {
            return {
                isValid: false,
                error: 'Yahoo email addresses must have a username between 4 and 32 characters.'
            };
        }
    }

    // Outlook / Hotmail / Live
    if (domainPart === 'outlook.com' || domainPart === 'hotmail.com' || domainPart === 'live.com') {
        if (userPart.length < 3) {
            return {
                isValid: false,
                error: 'Outlook/Hotmail email addresses must have a username of at least 3 characters.'
            };
        }
    }

    // Zoho requires at least 6 characters
    if (domainPart === 'zoho.com' && userPart.length < 6) {
        return {
            isValid: false,
            error: 'Zoho email addresses must have a username of at least 6 characters.'
        };
    }

    // 4. Reject repetitive characters in username (e.g. aaaa@..., jjj@...)
    if (/(.)\1{3,}/.test(userPart)) {
        return {
            isValid: false,
            error: 'Please enter a genuine, active email address (repetitive characters detected).'
        };
    }

    // 5. Reject obvious dummy usernames or domains
    if (DUMMY_EMAIL_DOMAINS.has(domainPart) || (DUMMY_EMAIL_USERS.has(userPart) && (domainPart === 'gmail.com' || domainPart === 'yahoo.com' || domainPart.includes('test')))) {
        return { isValid: false, error: 'Test or dummy email addresses are not allowed. Please enter your real email.' };
    }

    // 6. Reject known disposable / temporary email providers
    if (DISPOSABLE_EMAIL_DOMAINS.has(domainPart)) {
        return { isValid: false, error: 'Temporary or disposable email services are not permitted. Please use your genuine email.' };
    }

    // 7. DNS MX Record Lookup to verify the domain actually exists and accepts mail
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DNS_TIMEOUT')), 3500)
        );

        const mxLookupPromise = dnsPromises.resolveMx(domainPart);
        const mxRecords = await Promise.race([mxLookupPromise, timeoutPromise]);

        // Filter out Null MX (RFC 7505: exchange "." or empty indicates no mail accepted)
        const validMx = (mxRecords || []).filter(r => r.exchange && r.exchange.trim() !== '' && r.exchange.trim() !== '.');

        if (validMx.length === 0) {
            // As fallback, check if domain has an A record (RFC fallback)
            const aRecords = await Promise.race([dnsPromises.resolve4(domainPart), timeoutPromise]).catch(() => []);
            if (!aRecords || aRecords.length === 0) {
                return {
                    isValid: false,
                    error: `The email domain "@${domainPart}" does not exist or has no active mail server.`
                };
            }
        }
    } catch (dnsErr) {
        if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'NODATA' || dnsErr.code === 'SERVFAIL') {
            return {
                isValid: false,
                error: `The email domain "@${domainPart}" does not exist. Please check for spelling mistakes.`
            };
        }
        if (dnsErr.message === 'DNS_TIMEOUT') {
            console.warn(`[Validator] DNS lookup timed out for domain: ${domainPart}, allowing fallback.`);
        } else {
            console.warn(`[Validator] DNS resolution notice for ${domainPart}:`, dnsErr.message);
        }
    }

    return { isValid: true, sanitizedEmail: cleanEmail };
}

/**
 * Validates a phone number against international telecom numbering plans
 * and guards against dummy / repetitive test numbers.
 *
 * @param {string} phone
 * @param {string} [defaultCountry='IN']
 * @returns {{ isValid: boolean, error?: string, formattedPhone?: string }}
 */
function validatePhoneNumber(phone, defaultCountry = 'IN') {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required.' };
    }

    const cleanRaw = phone.trim();
    const digitsOnly = cleanRaw.replace(/\D/g, '');

    // Check minimum length
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        return { isValid: false, error: 'Phone number must contain between 8 and 15 digits.' };
    }

    // Check for fake dummy digits patterns (all same digits: 9999999999, sequential: 1234567890)
    const last10Digits = digitsOnly.slice(-10);
    if (isAllSameDigits(digitsOnly) || (digitsOnly.length >= 10 && isAllSameDigits(last10Digits))) {
        return { isValid: false, error: 'Please enter a genuine phone number (repetitive digits detected).' };
    }

    if (isSequential(digitsOnly) || (digitsOnly.length >= 10 && isSequential(last10Digits))) {
        return { isValid: false, error: 'Please enter a genuine phone number (sequential test numbers are not allowed).' };
    }

    if (isRepetitivePattern(last10Digits)) {
        return { isValid: false, error: 'Please enter your actual, active phone number.' };
    }

    // Check Indian 10-digit mobile number rules if no international prefix
    if (!cleanRaw.startsWith('+') && digitsOnly.length === 10) {
        const firstDigit = digitsOnly[0];
        if (!['6', '7', '8', '9'].includes(firstDigit)) {
            return {
                isValid: false,
                error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9.'
            };
        }
    }

    // Strict validation using libphonenumber-js
    try {
        const parsed = parsePhoneNumberFromString(cleanRaw, defaultCountry);

        if (!parsed || !parsed.isValid()) {
            return {
                isValid: false,
                error: 'Please enter a valid mobile number with correct area or country code (e.g. +91 98765 43210).'
            };
        }

        // Return standardized international format e.g. "+91 98220 12345"
        const formattedPhone = parsed.formatInternational();
        return { isValid: true, formattedPhone };
    } catch (parseErr) {
        return {
            isValid: false,
            error: 'Invalid phone number format. Please check the digits entered.'
        };
    }
}

/**
 * Validates full contact inquiry: Name, Email, Phone, and Message.
 *
 * @param {{ name: string, email: string, phone: string, subject?: string, message: string }} param0
 * @returns {Promise<{ isValid: boolean, error?: string, sanitizedName?: string, sanitizedEmail?: string, formattedPhone?: string, sanitizedMessage?: string }>}
 */
async function validateContactInquiry({ name, email, phone, message }) {
    // 1. Validate Name
    const nameResult = validateName(name);
    if (!nameResult.isValid) {
        return { isValid: false, error: nameResult.error };
    }

    // 2. Validate Phone
    const phoneResult = validatePhoneNumber(phone, 'IN');
    if (!phoneResult.isValid) {
        return { isValid: false, error: phoneResult.error };
    }

    // 3. Validate Email (including provider rules like Gmail 6-30 chars & DNS MX)
    const emailResult = await validateEmail(email);
    if (!emailResult.isValid) {
        return { isValid: false, error: emailResult.error };
    }

    // 4. Validate Message
    const msgResult = validateMessage(message, name);
    if (!msgResult.isValid) {
        return { isValid: false, error: msgResult.error };
    }

    return {
        isValid: true,
        sanitizedName: nameResult.sanitizedName,
        sanitizedEmail: emailResult.sanitizedEmail,
        formattedPhone: phoneResult.formattedPhone,
        sanitizedMessage: msgResult.sanitizedMessage
    };
}

module.exports = {
    validateName,
    validateMessage,
    validateEmail,
    validatePhoneNumber,
    validateContactInquiry
};
