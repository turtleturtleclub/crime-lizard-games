/**
 * @title CLZD Token ABI
 * @notice ERC20 ABI for the Crime Lizard ($CLZD) token
 * @dev Standard ERC20 functions needed for balance checks and approvals
 */
export const CLZD_ABI = [
    // Standard ERC20 View Functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",

    // Standard ERC20 Write Functions
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
] as const;

/**
 * CLZD Token Address on BSC Mainnet (Chain ID 56)
 */
export const CLZD_TOKEN_ADDRESS = {
    mainnet: "0xa5996Fc5007dD2019F9a9Ff6c50c1c847Aa64444"
} as const;

/**
 * Helper to get CLZD address
 */
export const getCLZDAddress = (): string => {
    return CLZD_TOKEN_ADDRESS.mainnet;
};
