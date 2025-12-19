
document.addEventListener('DOMContentLoaded', () => {
    const pixForm = document.getElementById('pixForm');
    const keyTypeSelect = document.getElementById('keyType');
    const pixKeyInput = document.getElementById('pixKey');
    const resultDiv = document.getElementById('result');
    const qrcodeContainer = document.getElementById('qrcode');
    const copyButton = document.getElementById('copyButton');
    const pixCopyPasteTextarea = document.getElementById('pixCopyPaste');

    // --- Lógica de Geração do PIX (Validada e Completa) ---
    const formatField = (id, value) => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
    };

    const calculateCRC16 = (data) => {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    const generateTxid = () => {
        return 'TXID' + Date.now() + Math.random().toString(36).substring(2, 15);
    };

    const generatePIXPayload = ({ pixKey, amount }) => {
        const beneficiaryName = 'EstoqueFacil'; // Valor Fixo
        const beneficiaryCity = 'Parnaiba';       // Valor Fixo
        const txid = '***'; // Simplificado para máxima compatibilidade sem complexidade de txid aleatório para o usuário

        let payload = '000201';
        const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey);
        payload += formatField('26', merchantAccountInfo);
        payload += '52040000';
        payload += '5303986';

        if (amount && parseFloat(amount) > 0) {
            payload += formatField('54', parseFloat(amount).toFixed(2));
        }

        payload += '5802BR';
        payload += formatField('59', beneficiaryName);
        payload += formatField('60', beneficiaryCity);
        payload += formatField('62', formatField('05', txid));
        payload += '6304';

        return payload + calculateCRC16(payload);
    };

    // --- Lógica da Interface ---
    const applyMask = () => {
        let value = pixKeyInput.value;
        const type = keyTypeSelect.value;
        value = value.replace(/\D/g, '');

        switch (type) {
            case 'cpf':
                value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                pixKeyInput.setAttribute('maxlength', '14');
                break;
            case 'cnpj':
                value = value.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
                pixKeyInput.setAttribute('maxlength', '18');
                break;
            case 'phone':
                if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
                else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
                else value = value.replace(/^(\d*)/, "($1");
                pixKeyInput.setAttribute('maxlength', '15');
                break;
            default:
                pixKeyInput.value = pixKeyInput.value.replace(/[\.\-\/\(\) ]/g, '');
                return;
        }
        pixKeyInput.value = value;
    };

    pixKeyInput.addEventListener('input', applyMask);
    keyTypeSelect.addEventListener('change', () => { pixKeyInput.value = ''; applyMask(); });

    pixForm.addEventListener('submit', (event) => {
        event.preventDefault();

        let key = pixKeyInput.value;
        const type = keyTypeSelect.value;
        if (['cpf', 'cnpj', 'phone'].includes(type)) {
            key = key.replace(/\D/g, '');
        }
        if (type === 'phone') {
            key = `+55${key}`;
        }

        const payload = generatePIXPayload({
            pixKey: key,
            amount: document.getElementById('amount').value
        });

        qrcodeContainer.innerHTML = '';
        new QRCode(qrcodeContainer, {
            text: payload,
            width: 220,
            height: 220,
            correctLevel: QRCode.CorrectLevel.M
        });

        pixCopyPasteTextarea.value = payload;
        resultDiv.classList.remove('hidden');
    });

    copyButton.addEventListener('click', () => {
        pixCopyPasteTextarea.select();
        document.execCommand('copy');
        alert('Código PIX copiado!');
    });

    applyMask();
});
