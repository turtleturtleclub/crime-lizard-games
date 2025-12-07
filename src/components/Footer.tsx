// Terminal Style Footer
import { useLanguage } from '../contexts/LanguageContext';

function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-black border-t-2 border-[#00FF88] py-4 px-4 relative font-bbs" style={{ zIndex: 10 }}>
            <div className="container mx-auto">
                {/* Footer Content Box */}
                <div className="bg-black border-2 border-[#00FF88] px-4 py-3">
                    {/* Footer Content */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        {/* Left - Copyright */}
                        <div className="text-[#00FF88] flex items-center gap-2">
                            <span>🦎</span>
                            <span>{t.footer.copyright}</span>
                        </div>

                        {/* Center - Chat Active */}
                        <div className="text-[#00FF88] flex items-center gap-2">
                            <span>💬</span>
                            <span>{t.footer.chatActive}</span>
                        </div>

                        {/* Right - Links */}
                        <div className="flex items-center gap-4 text-gray-400">
                            <a
                                href="https://www.geckoterminal.com/bsc/pools/0x87da91ecaaa8471373fd42443a5b105ebac03758?utm_source=crimelizard&utm_medium=referral"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#00FF88] transition-colors flex items-center gap-1"
                            >
                                <span>🦎</span>
                                <span className="hidden md:inline">{t.footer.geckoTerminal}</span>
                            </a>
                            <span className="text-[#00FF88]">|</span>
                            <a
                                href="https://x.com/CrimeLizardBNB"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#00FF88] transition-colors flex items-center gap-1"
                            >
                                <span>🐦</span>
                                <span className="hidden md:inline">{t.footer.twitter}</span>
                            </a>
                            <span className="text-[#00FF88]">|</span>
                            <a
                                href="https://t.me/crimelizard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#00FF88] transition-colors flex items-center gap-1"
                            >
                                <span>📱</span>
                                <span className="hidden md:inline">{t.footer.telegram}</span>
                            </a>
                            <span className="text-[#00FF88]">|</span>
                            <a
                                href="mailto:dev@crimelizard.tech"
                                className="hover:text-[#00FF88] transition-colors flex items-center gap-1"
                            >
                                <span>📧</span>
                                <span className="hidden md:inline">{t.footer.support}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
