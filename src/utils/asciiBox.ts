/**
 * ASCII Box Drawing Utility
 *
 * Helps create perfectly aligned ASCII boxes with proper character counting.
 * Old-school BBS-style box drawing requires precise character width calculations.
 */

/**
 * Calculate the visual width of a string, accounting for emojis
 * Emojis typically take 2 character widths in monospace fonts
 */
export function visualWidth(str: string): number {
    let width = 0;
    // Use Array.from to properly handle Unicode characters
    for (const char of Array.from(str)) {
        const codePoint = char.codePointAt(0) || 0;
        // Emojis and other wide characters (most are in these ranges)
        if (
            (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) || // Emojis
            (codePoint >= 0x2600 && codePoint <= 0x26FF) ||   // Misc symbols
            (codePoint >= 0x2700 && codePoint <= 0x27BF) ||   // Dingbats
            (codePoint >= 0xFE00 && codePoint <= 0xFE0F) ||   // Variation selectors
            (codePoint >= 0x1F600 && codePoint <= 0x1F64F) || // Emoticons
            (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) || // Transport symbols
            (codePoint >= 0x1F900 && codePoint <= 0x1F9FF)    // Supplemental symbols
        ) {
            width += 2; // Emojis take 2 spaces
        } else {
            width += 1; // Regular characters take 1 space
        }
    }
    return width;
}

/**
 * Pad a line to exact width, centering the content
 */
export function padCenter(text: string, totalWidth: number): string {
    const contentWidth = visualWidth(text);
    const padding = Math.max(0, totalWidth - contentWidth);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;

    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Pad a line to exact width, aligning left
 */
export function padLeft(text: string, totalWidth: number): string {
    const contentWidth = visualWidth(text);
    const padding = Math.max(0, totalWidth - contentWidth);

    return text + ' '.repeat(padding);
}

/**
 * Pad a line to exact width, aligning right
 */
export function padRight(text: string, totalWidth: number): string {
    const contentWidth = visualWidth(text);
    const padding = Math.max(0, totalWidth - contentWidth);

    return ' '.repeat(padding) + text;
}

/**
 * Create a complete ASCII box with properly aligned content
 *
 * @param lines - Array of text lines to display in the box
 * @param width - Internal width (characters between the ║ bars)
 */
export function createBox(lines: string[], width: number = 50): string {
    const topBorder = '╔' + '═'.repeat(width + 2) + '╗';
    const bottomBorder = '╚' + '═'.repeat(width + 2) + '╝';

    const boxLines = [topBorder];

    // Add each line with proper padding
    for (const line of lines) {
        const paddedLine = padCenter(line, width);
        boxLines.push('║ ' + paddedLine + ' ║');
    }

    boxLines.push(bottomBorder);

    return boxLines.join('\n');
}

/**
 * Create a simple section divider with optional title
 */
export function createDivider(width: number = 50, title?: string): string {
    const line = '─'.repeat(width);

    if (title) {
        const titlePadded = padCenter(`  ${title}  `, width);
        return '┌' + line + '┐\n│' + titlePadded + '│\n└' + line + '┘';
    }

    return '┌' + line + '┐\n└' + line + '┘';
}

/**
 * Quick helper to create a title box (commonly used pattern)
 */
export function titleBox(title: string, subtitle?: string, width: number = 50): string {
    const lines = [title];
    if (subtitle) {
        lines.push(subtitle);
    }
    return createBox(lines, width);
}
