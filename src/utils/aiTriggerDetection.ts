/**
 * AI Trigger Detection Utilities
 * Advanced keyword and pattern detection for AI chat responses
 */

// Keywords for detecting different types of requests
const cryptoKeywords = ['crypto', 'cryptocurrency', 'price', 'bitcoin', 'eth', 'bnb', 'base', 'memecoin', 'clzd', 'ta', 'technical analysis', 'chart', 'buy', 'buying', 'purchase', 'dex', 'dexscreener'];
const gameKeywords = ['game', 'play', 'slots', 'legend', 'rpg', 'nft', 'character', 'boss', 'raid', 'spin', 'bet', 'jackpot'];
const helpKeywords = ['help', 'how', 'what is', 'explain', 'tell me about', 'info', 'information'];
const devKeywords = ['dev', 'developer', 'spacemuppett', 'who made', 'who created', 'who built', 'team', 'creator'];

// All keywords that would trigger a response
const allTriggerKeywords = [
    ...cryptoKeywords,
    ...gameKeywords,
    ...helpKeywords,
    ...devKeywords
];

/**
 * Check if AI should respond to a message
 * @param message - The message to analyze
 * @param isMentioned - Whether the bot was explicitly mentioned
 * @returns Whether the AI should respond
 */
export function shouldRespondToMessage(message: string, isMentioned: boolean): boolean {
    // Always respond if directly mentioned
    if (isMentioned) {
        return true;
    }

    // Check for trigger keywords
    const lowerMessage = message.toLowerCase();
    return allTriggerKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

/**
 * Check if message is a bot mention
 * @param message - The message to check
 * @returns Whether the message mentions the bot
 */
export function isBotMentioned(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();

    return (
        lowerMessage.startsWith('@ai') ||
        lowerMessage.startsWith('@lizard ai') ||
        lowerMessage.startsWith('@lizardai') ||
        lowerMessage.startsWith('@crimelizard') ||
        lowerMessage.includes('@crimelizardbot')
    );
}

export interface ScamDetectionResult {
    isScam: boolean;
    reason?: string;
    confidence: 'low' | 'medium' | 'high';
}

/**
 * Detect potential scam messages (BLATANT scams only - not normal crypto discussion)
 * @param message - The message to analyze
 * @returns Scam detection result
 */
export function detectScam(message: string): ScamDetectionResult {
    // Whitelist: Allow messages about our own project
    const isOurProject = /crime\s*lizard|clzd|crimelizard/i.test(message);

    // Whitelist: Allow X/Twitter posts (for raiding and legitimate engagement)
    const hasTwitterLink = /(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)\/\S+/i.test(message);

    // Whitelist: Allow normal discussion about crypto/gaming
    const normalCryptoTalk = [
        /when.*airdrop/i,  // People asking WHEN, not claiming
        /any.*airdrop/i,    // People asking about airdrops
        /looking\s+for/i,   // People looking for info
        /check.*out/i       // Sharing info (like "check out this chart")
    ].some(pattern => pattern.test(message));

    // Only flag BLATANT scam patterns (not normal crypto discussion)
    const blatantScamPatterns = [
        // Urgency + Action (scammers)
        /urgent.*(?:action|verify|claim|wallet)/i,
        /immediately.*(?:verify|claim|connect|validate)/i,

        // Direct wallet compromise attempts
        /send.*(?:seed|phrase|private.*key|recovery)/i,
        /(?:verify|validate|restore|recover).*wallet/i,
        /(?:metamask|trust\s*wallet|phantom).*(?:support|verify|connect)/i,

        // Fake giveaways (with direct claims)
        /(?:claim|get|receive).*(?:free|instant).*(?:crypto|token|bnb|eth)/i,
        /congratulations.*(?:won|selected|winner)/i,

        // Guaranteed money scams
        /guaranteed.*(?:profit|return|money)/i,
        /double.*(?:your|investment)/i,
        /(?:100%|guaranteed).*(?:profit|returns)/i,

        // Impersonation
        /admin.*(?:dm|direct.*message|contact)/i,
        /support.*team.*(?:dm|contact)/i,

        // Seed phrase/private key theft
        /seed.*phrase/i,
        /private.*key/i,
        /recovery.*phrase/i
    ];

    // Check for blatant scam patterns
    for (const pattern of blatantScamPatterns) {
        if (pattern.test(message)) {
            // Whitelist check: Skip if it's about our project or has Twitter link
            if (isOurProject || hasTwitterLink || normalCryptoTalk) {
                continue;
            }

            return {
                isScam: true,
                reason: `Blatant scam attempt detected`,
                confidence: 'high'
            };
        }
    }

    // Check suspicious URLs (but allow Twitter/X)
    const suspiciousUrlPatterns = [
        /t\.me\/\+/i, // Telegram private invite links (common for scams)
        /t\.me\/joinchat/i, // Telegram join chat links
        /bit\.ly|tinyurl|shorturl/i // Shortened URLs (often used in phishing)
    ];

    for (const pattern of suspiciousUrlPatterns) {
        if (pattern.test(message)) {
            return {
                isScam: true,
                reason: `Suspicious shortened URL or private Telegram link`,
                confidence: 'high'
            };
        }
    }

    return {
        isScam: false,
        confidence: 'low'
    };
}

/**
 * Format response length based on question complexity
 * @param response - The AI response
 * @param question - The original question
 * @returns Formatted response (shortened if needed)
 */
export function formatResponseLength(response: string, question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Complex questions that need detailed answers
    const needsDetailedAnswer = [
        'how to',
        'explain',
        'tell me about',
        'what is',
        'guide',
        'tutorial',
        'strategy',
        'best way'
    ].some(phrase => lowerQuestion.includes(phrase));

    // If it needs a detailed answer or is already short, return as-is
    if (needsDetailedAnswer || response.length <= 300) {
        return response;
    }

    // For simple questions, try to keep it under 300 chars
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());

    if (sentences.length > 1) {
        // Return first sentence if it's meaningful
        const firstSentence = sentences[0].trim();
        if (firstSentence.length > 50 && firstSentence.length <= 300) {
            return firstSentence + '.';
        }
    }

    // If still too long, truncate with ellipsis
    if (response.length > 300) {
        return response.substring(0, 297) + '...';
    }

    return response;
}
