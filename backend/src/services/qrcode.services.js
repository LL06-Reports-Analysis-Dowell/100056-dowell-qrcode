import QRCode from 'qrcode';
import { generateFileName } from '../utils/helper.js';
import { updaloadQrcodeImage } from '../services/api.services.js';
import { productUrl } from '../utils/constant.js';

const linkTypeQrcode = async (data, qrcodeColor = '#000000',productName) => {
    const qrcodeLink = `${productUrl}/${productName}/${data}`;

    const qrCodeData = await QRCode.toBuffer(qrcodeLink, {
        errorCorrectionLevel: 'H',
        type: 'png',
        color: {
            dark: qrcodeColor,
            light: '#FFFFFF'
        },
        rendererOpts: {
            quality: 1.0
        },
        width: 250,
    });

    if (!qrCodeData) {
        return {
            success: false,
            message: 'Failed to generate QR code',
        };
    }

    const fileName = generateFileName('qrcode', 'png');
    const qrcodeUrl = await updaloadQrcodeImage(qrCodeData, fileName);

    if (!qrcodeUrl) {
        return {
            success: false,
            message: 'Failed to upload QR code image',
        };
    }

    return {
        success: true,
        message: 'QR code generated successfully',
        response: {
            qrcodeUrl,
            qrcodeLink
        }
    };
};

export {
    linkTypeQrcode
};
