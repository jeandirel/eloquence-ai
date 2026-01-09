"use client"

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QRCodePage() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');

    const generateQR = () => {
        if (url.trim()) {
            setGeneratedUrl(url.trim());
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx!.fillStyle = 'white';
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.drawImage(img, 0, 0);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = 'eloquence-ai-qr-code.png';
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl);
        alert('Lien copié dans le presse-papier ! 📋');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
            <header className="flex items-center gap-4 mb-12">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-white/10">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Share2 className="w-6 h-6 text-omni-primary" />
                                Créer un lien partageable
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        Entrez votre URL ngrok
                                    </label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://xxxx-xx-xx-xxx-xxx.ngrok.io/gestures"
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-omni-primary focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={generateQR}
                                    className="w-full bg-omni-primary hover:bg-omni-primary/80 text-black font-bold py-3 px-6 rounded-xl transition-all"
                                >
                                    Générer QR Code
                                </button>
                            </div>

                            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                <h3 className="text-sm font-bold text-blue-400 mb-2">💡 Comment obtenir l'URL ngrok ?</h3>
                                <ol className="text-xs text-white/60 space-y-1 list-decimal list-inside">
                                    <li>Installez ngrok : <a href="https://ngrok.com/download" target="_blank" className="text-omni-primary underline">ngrok.com/download</a></li>
                                    <li>Lancez : <code className="bg-black/50 px-2 py-1 rounded">ngrok http 3000</code></li>
                                    <li>Copiez l'URL "Forwarding" (commence par https://)</li>
                                    <li>Ajoutez /gestures à la fin</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Display */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-white/10 min-h-[400px] flex flex-col items-center justify-center">
                            {generatedUrl ? (
                                <>
                                    <div className="bg-white p-6 rounded-2xl mb-6">
                                        <QRCodeSVG
                                            id="qr-code-svg"
                                            value={generatedUrl}
                                            size={256}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={downloadQR}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Télécharger PNG
                                        </button>

                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                        >
                                            Copier le lien
                                        </button>
                                    </div>

                                    <div className="mt-6 p-3 bg-black/50 rounded-lg w-full">
                                        <p className="text-xs text-white/40 break-all">{generatedUrl}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-white/40">
                                    <div className="w-32 h-32 border-4 border-dashed border-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <Share2 className="w-12 h-12" />
                                    </div>
                                    <p>Entrez une URL pour générer le QR Code</p>
                                </div>
                            )}
                        </div>

                        {generatedUrl && (
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 rounded-2xl border border-green-500/30">
                                <h3 className="text-sm font-bold text-green-400 mb-2">✅ QR Code généré !</h3>
                                <p className="text-xs text-white/60">
                                    Partagez ce QR code avec vos amis. Ils pourront scanner avec leur téléphone pour accéder directement à Gesture Lab !
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
