require('dotenv').config();
const axios = require('axios');
const {HttpsProxyAgent} = require('https-proxy-agent');
const chalk = require('chalk');
const readlineSync = require('readline-sync');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const {Buffer} = require('buffer');
const userAgents = require('user-agents');
const ethers = require('ethers');
const {get} = require("axios");
const API_BASE_URL = 'https://api-v2.polyflow.tech/api';
const readTokens = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'token.txt'), 'utf8');
        return data.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error(chalk.red(`❌ Error reading token.txt: ${error.message}`));
        process.exit(1);
    }
};
const readAccounts = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'accounts.txt'), 'utf8');
        const privateKeys = data.split('\n').map(line => line.trim()).filter(line => line);
        if (!privateKeys.length) throw new Error('No tokens found in accounts.txt');
        return privateKeys;
    } catch (error) {
        console.error(chalk.red(`❌ Error reading accounts.txt: ${error.message}`));
        process.exit(1);
    }
}
const readProxies = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'proxies.txt'), 'utf8');
        const proxies = data.split('\n').map(line => line.trim()).filter(line => line);
        return proxies.length ? proxies : null;
    } catch (error) {
        console.error(chalk.red(`❌ Error reading proxies.txt: ${error.message}`));
        return null;
    }
};

const getRandomProxy = (proxies) => {
    if (!proxies || !proxies.length) return null;
    return proxies[Math.floor(Math.random() * proxies.length)];
};
const getRandomUserAgent = () => {
    const ua = new userAgents({deviceCategory: 'desktop'});
    return ua.toString();
}
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFloat = (min, max, decimals = 2) => {
    const num = Math.random() * (max - min) + min;
    return parseFloat(num.toFixed(decimals));
};

const getRandomDate = () => {
    const now = new Date();
    const daysAgo = getRandomInt(0, 30);
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - daysAgo);
    return randomDate.toLocaleDateString();
};

const getRandomName = () => {
    const firstNames = ['John', 'Jane', 'Mike', 'Emma', 'David', 'Sarah', 'Robert', 'Linda', 'William', 'Emily',
        'James', 'Olivia', 'Alex', 'Sophia', 'Daniel', 'Mia', 'Thomas', 'Ava', 'Joseph', 'Isabella'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Moore', 'Jackson', 'Martin', 'Lee',
        'Davis', 'White', 'Harris', 'Clark', 'Lewis', 'Young', 'Walker', 'Hall', 'Allen', 'Wright'];

    return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
};

const generateFileName = () => {
    const randomString = Math.random().toString(36).substring(2, 12);
    const timestamp = Date.now();
    return `invoice-${timestamp}-${randomString}.png`;
};


const getPresignedUrl = async (fileName, token, proxy) => {
    const userAgent = getRandomUserAgent();
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.6',
        'authorization': token,
        'content-type': 'application/json',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'Referer': 'https://app.polyflow.tech/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'user-agent': userAgent,
    };
    try {
        const response = await axios.get(`${API_BASE_URL}/scan2earn/get_presigned_url?file_name=${fileName}`, {
            headers,
            httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        });

        if (response.data?.msg?.presigned_url) {
            const urlStart = response.data.msg.presigned_url.substring(0, 30);
            console.log(chalk.white(`  📝 Got presigned URL: ${urlStart}... (key: ${response.data.msg.key})`));
        } else {
            console.log(chalk.white(`  📝 Got presigned URL response`));
        }

        if (!response.data?.msg?.presigned_url || !response.data?.msg?.key) {
            throw new Error('Invalid presigned URL response');
        }
        const url = response.data.msg.presigned_url;
        const key = response.data.msg.key;
        if (!url.startsWith('https://')) {
            throw new Error(`Invalid URL format: ${url}`);
        }
        return {url, key};
    } catch (error) {
        console.error(chalk.red(`  ❌ Error getting presigned URL: ${error.message}`));
        throw error;
    }
};

const uploadInvoice = async (presignedUrl, fileBuffer, proxy) => {
    const userAgent = getRandomUserAgent();
    try {
        new URL(presignedUrl);
        await axios.put(presignedUrl, fileBuffer, {
            headers: {
                'user-agent': userAgent,
                'content-type': 'application/octet-stream',
            },
            httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        });
        console.log(chalk.green('  ✅ Invoice uploaded successfully'));
    } catch (error) {
        console.error(chalk.red(`  ❌ Error uploading invoice: ${error.message}`));
        throw error;
    }
};

const saveInvoice = async (invoicePath, token, proxy, retries = 3) => {
    const userAgent = getRandomUserAgent();
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.6',
        'authorization': token,
        'content-type': 'application/json',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'Referer': 'https://app.polyflow.tech/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'user-agent': userAgent,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(`${API_BASE_URL}/scan2earn/save_invoice`, {
                invoice_path: invoicePath,
            }, {
                headers,
                httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
            });
            console.log(chalk.green('  ✅ Invoice saved successfully'));
            return response.data;
        } catch (error) {
            console.error(chalk.red(`  ❌ Error saving invoice: ${error.message}`));
            if (attempt === retries) {
                throw error;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
};

async function generateInvoice(invoice) {
    const estimateTextWidth = (text, fontSize = 12) => text.length * (fontSize * 0.75);
    const maxTextWidth = Math.max(
        estimateTextWidth(invoice.invoiceNumber, 14),
        estimateTextWidth(invoice.date, 14),
        estimateTextWidth(invoice.payer, 14),
        estimateTextWidth(invoice.payee, 14),
        estimateTextWidth(invoice.description, 14),
        estimateTextWidth(`${invoice.currency} ${invoice.amount}`, 14),
        estimateTextWidth(invoice.paymentAddress, 14)
    );
    const width = maxTextWidth + 100;
    const height = 60 + 220;

    const templates = [
        (invoice) => `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet">
                <rect width="100%" height="100%" fill="#FFFFFF"/>
                <text x="20" y="40" font-family="Arial" font-size="20" font-weight="bold" fill="#000000">Billing</text>
                <line x1="0" y1="60" x2="${width}" y2="60" stroke="#007BFF" stroke-width="2"/>
                <text x="20" y="80" font-family="Arial" font-size="14" font-weight="bold" fill="#000000">Invoice #: ${invoice.invoiceNumber}</text>
                <text x="20" y="100" font-family="Arial" font-size="12" fill="#000000">Date: ${invoice.date}</text>
                <text x="20" y="120" font-family="Arial" font-size="12" fill="#000000">From: ${invoice.payer}</text>
                <text x="20" y="140" font-family="Arial" font-size="12" fill="#000000">To: ${invoice.payee}</text>
                <text x="20" y="160" font-family="Arial" font-size="12" fill="#000000">Description: ${invoice.description}</text>
                <text x="20" y="180" font-family="Arial" font-size="12" fill="#000000">Amount: ${invoice.currency} ${invoice.amount}</text>
                <text x="20" y="200" font-family="Arial" font-size="12" fill="#000000">Payment Address:</text>
                <text x="20" y="220" font-family="Arial" font-size="12" fill="#000000">${invoice.paymentAddress}</text>
                <line x1="20" y1="240" x2="${width - 20}" y2="240" stroke="#D3D3D3" stroke-width="1"/>
                <text x="20" y="260" font-family="Arial" font-size="12" fill="#000000">Thank you for your payment!</text>
            </svg>`,
        (invoice) => `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="20" y="30" font-family="Arial" font-size="18" font-weight="bold" fill="#000000">INVOICE</text>
        <text x="${width * 0.6}" y="30" font-family="Arial" font-size="12" fill="#555555">Date: ${invoice.date}</text>

        <text x="20" y="60" font-family="Arial" font-size="12" fill="#000000">Invoice #: ${invoice.invoiceNumber}</text>
        <text x="20" y="75" font-family="Arial" font-size="12" fill="#000000">From: ${invoice.payer}</text>
        <text x="20" y="90" font-family="Arial" font-size="12" fill="#000000">To: ${invoice.payee}</text>

        <rect x="20" y="110" width="${width - 40}" height="20" fill="#007BFF"/>
        <text x="25" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff">Description</text>
        <text x="${width * 0.4}" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff">Amount</text>
        <text x="${width * 0.6}" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff">Status</text>
        <text x="${width * 0.76}" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff">Discount</text>

        <rect x="20" y="130" width="${width - 40}" height="20" fill="#f8f8f8"/>
        <text x="25" y="145" font-family="Arial" font-size="12" fill="#000000">${invoice.description}</text>
        <text x="${width * 0.4}" y="145" font-family="Arial" font-size="12" fill="#000000">${invoice.currency} ${invoice.amount}</text>
        <text x="${width * 0.6}" y="145" font-family="Arial" font-size="12" fill="#000000">${invoice.status}</text>
        <text x="${width * 0.76}" y="145" font-family="Arial" font-size="12" fill="#000000">${invoice.discount}%</text>

        <text x="20" y="180" font-family="Arial" font-size="12" fill="#000000">Payment Method:</text>
        <text x="20" y="195" font-family="Arial" font-size="12" fill="#000000">${invoice.paymentAddress}</text>

        <line x1="20" y1="210" x2="${width - 20}" y2="210" stroke="#ccc" stroke-width="1"/>
        <text x="20" y="230" font-family="Arial" font-size="12" fill="#888888">Thank you for your business.</text>
    </svg>`,
        (invoice) => `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet">
                <rect width="100%" height="100%" fill="#F8F8F8"/>
                <text x="20" y="30" font-family="Verdana" font-size="18" fill="#333333">Billing Statement</text>
                <text x="300" y="30" font-family="Verdana" font-size="12" fill="#666666">${invoice.date}</text>
                <text x="20" y="60" font-family="Verdana" font-size="12" fill="#000000">Invoice #: ${invoice.invoiceNumber}</text>
                <text x="20" y="80" font-family="Verdana" font-size="12" fill="#000000">Payer: ${invoice.payer}</text>
                <text x="20" y="100" font-family="Verdana" font-size="12" fill="#000000">Payee: ${invoice.payee}</text>
                <text x="20" y="120" font-family="Verdana" font-size="12" fill="#000000">${invoice.description}</text>
                <text x="20" y="140" font-family="Verdana" font-size="12" fill="#000000">Amount: ${invoice.currency} ${invoice.amount}</text>
                <text x="20" y="160" font-family="Verdana" font-size="12" fill="#000000">Pay at: ${invoice.paymentAddress}</text>
                <line x1="20" y1="180" x2="${width - 20}" y2="180" stroke="#CCCCCC" stroke-width="1"/>
                <text x="20" y="200" font-family="Verdana" font-size="12" fill="#888888">Thank you for doing business with us!</text>
            </svg>`,
    ];

    const svgContent = getRandomItem(templates)(invoice);
    const metadata = generateFakeMetadata();

    return await sharp(Buffer.from(svgContent)).png({text: metadata}).toBuffer();
}

function generateInvoiceNumber() {
    const prefix = getRandomItem(['TRD', 'INV', 'PAY', 'BLN']);
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
        String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${letters}-${digits}`;
}

function generateRandomInvoice() {
    const payers = getRandomName();
    const payees = ['TradeRiser Inc.', 'StockPro Ltd.', 'InvestEasy Co.', 'CryptoPay LLC'];
    const paymentMethods = [
        'Bank: IBAN GB29NWBK60161331926819',
        'PayPal: payments@traderiser.com',
        'Bank Transfer: HSBC UK 12345678',
        'Credit Card: Visa ending 1234',
        'Wire Transfer: Chase Bank 87654321',
        'Check Payment: Ref# 456789',
        'Cash Payment: Office Drop-off'
    ];
    const statuses = ['Pending', 'Paid', 'Overdue', 'Cancelled'];
    const descriptions = ['Payment for stock trading services', 'Subscription fee', 'Investment consultation', 'Crypto transaction fee'];

    const date = getRandomDate();

    return {
        invoiceNumber: generateInvoiceNumber(),
        date,
        payer: payers,
        payee: getRandomItem(payees),
        paymentAddress: getRandomItem(paymentMethods),
        amount: (Math.random() * 100 + 100).toFixed(2),
        currency: getRandomItem(['USD', 'BTC', 'ETH', 'INR']),
        description: getRandomItem(descriptions),
        status: getRandomItem(statuses),
        discount: getRandomFloat(0, 15)  // discount từ 0% - 15%
    };
}

function generateFakeMetadata() {
    const authors = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Emily Brown'];
    const startDate = new Date('2015-01-01');
    const endDate = new Date('2025-04-12');
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

    return {
        Title: `Invoice-${Math.floor(Math.random() * 10000)}`,
        Author: authors[Math.floor(Math.random() * authors.length)],
        Description: `Generated invoice for payment on ${randomDate.toLocaleDateString('en-US')}`,
        Software: `InvoiceGen v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
        'Creation Time': randomDate.toISOString(),
        Company: ['TradeRiser', 'StockPro', 'InvestEasy'][Math.floor(Math.random() * 3)]
    };
}

const processInvoice = async (token, proxy, scanIndex, totalScans, tokenIndex) => {
    console.log(chalk.cyan(`\n🔄 [${scanIndex}/${totalScans}] Starting scan...`));
    try {
        const fileName = generateFileName();
        console.log(chalk.white(`  📄 Generating unique invoice: ${fileName}`));

        const invoiceData = generateRandomInvoice();

        const accountDir = path.join(__dirname, 'invoices', `wallet-${tokenIndex}`);
        await fs.mkdir(accountDir, {recursive: true});

        const invoiceBuffer = await generateInvoice(invoiceData);

        console.log(chalk.white('  🔑 Fetching presigned URL...'));
        const {url: presignedUrl, key} = await getPresignedUrl(fileName, token, proxy);

        console.log(chalk.white(`  📤 Uploading invoice to S3...`));
        await uploadInvoice(presignedUrl, invoiceBuffer, proxy);

        console.log(chalk.white('  💾 Saving invoice metadata...'));
        const data = await saveInvoice(key, token, proxy);
        if (data) {
            const outputPath = path.join(accountDir, fileName);
            await fs.writeFile(outputPath, invoiceBuffer);
            console.log(chalk.green(`  💾 Invoice image saved to: ${outputPath}`));
        }

        console.log(chalk.green(`✅ [${scanIndex}/${totalScans}] Scan completed successfully`));
        return true;
    } catch (error) {
        console.error(chalk.red(`❌ [${scanIndex}/${totalScans}] Failed to process invoice: ${error.message}`));
        return false;
    }
};

const getNonceMessage = async (proxy, address) => {
    const userAgent = getRandomUserAgent();
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.6',
        'content-type': 'application/json',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'Referer': 'https://app.polyflow.tech/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'user-agent': userAgent,
    };
    try {
        const response = await axios.get(`${API_BASE_URL}/account/sign_content?address=${address}`, {
            headers,
            httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        });
        return response.data['msg']['content'];
    } catch (error) {
        console.error(chalk.red(`❌ Error getting nonce message: ${error.message}`));
        throw error;
    }
}
const getBearerToken = async (proxy, wallet) => {
    const userAgent = getRandomUserAgent();
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.6',
        'content-type': 'application/json',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'Referer': 'https://app.polyflow.tech/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'user-agent': userAgent,
    };
    const message = await getNonceMessage(proxy, wallet.address);
    try {
        const sign = await wallet.signMessage(message);
        const dataSign = {
            signature: sign,
            address: wallet.address,
            chain_id: 1,
            referral_code: ""
        };
        const response = await axios.post(`${API_BASE_URL}/account/login`, dataSign, {
            headers,
            httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        });
        console.log(chalk.white(`   🔑 Token generated successfully for wallet: ${wallet.address}`));
        return response.data['msg']['token'];
    } catch (error) {
        console.error(chalk.red(`   ❌ Error generating token: ${error.message}`));
        throw error;
    }
};
const generateAndSaveTokens = async (privateKeys) => {
    const tokens = [];
    for (const [index, privateKey] of privateKeys.entries()) {
        const wallet = new ethers.Wallet(privateKey);
        const proxy = null; // Adjust if proxies are needed
        const token = `Bearer ${await getBearerToken(proxy, wallet)}`;
        tokens.push(token);
    }
    const tokenLines = tokens.join('\n');
    await fs.writeFile(path.join(__dirname, 'token.txt'), tokenLines, 'utf8');
    console.log(chalk.green(`💾 Tokens saved to token.txt`));
    return tokens;
};
const main = async () => {
    console.clear();

    console.log(chalk.white('--------------------------------------------------------'));
    console.log(chalk.white('       AUTO POLYFLOW '));
    console.log(chalk.white('--------------------------------------------------------'));

    const privateKeys = await readAccounts();
    console.log(chalk.green(`\n✅ Loaded ${privateKeys.length} tokens`));
    privateKeys.forEach((pk, i) => {
        console.log(chalk.white(`  🔑 Wallet ${i + 1}: ${pk.slice(0, 10)}...`));
    });
    let tokens = [];
    try {
        tokens = await readTokens();
        if (tokens.length !== privateKeys.length) {
            console.log(chalk.yellow(`⚠️ Token count (${tokens.length}) does not match wallet count (${privateKeys.length}). Regenerating tokens...`));
            tokens = await generateAndSaveTokens(privateKeys);
        }
    } catch (error) {
        console.log(chalk.yellow(`⚠️ Token file is empty or missing. Generating tokens...`));
        tokens = await generateAndSaveTokens(privateKeys);
    }
    const proxies = await readProxies();
    if (proxies) {
        console.log(chalk.green(`✅ Loaded ${proxies.length} proxies`));
    } else {
        console.log(chalk.yellow(`⚠️ No proxies loaded, running without proxy`));
    }

    console.log(chalk.yellow('\n⚙️ CONFIGURATION'));
    console.log(chalk.white('--------------------------------------------------------'));
    const scanCount = readlineSync.questionInt(chalk.white('📊 Enter the number of scans to perform: '), {
        min: 1,
    });
    console.log(chalk.green(`✅ Will perform ${scanCount} scan(s)`));

    console.log(chalk.yellow('\n🔄 PROCESSING SCANS'));
    console.log(chalk.white('--------------------------------------------------------'));

    let successfulScans = 0;
    const startTime = Date.now();

    for (let i = 1; i <= scanCount; i++) {
        const tokenIndex = (i - 1) % tokens.length;
        const token = tokens[tokenIndex];

        const proxy = getRandomProxy(proxies);
        if (proxy) console.log(chalk.white(`  🌐 Using proxy: ${proxy}`));
        const success = await processInvoice(token, proxy, i, scanCount, tokenIndex + 1);
        if (success) successfulScans++;
        if (i < scanCount) {
            console.log(chalk.white('  ⏱️ Waiting 1 second before next scan...'));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.yellow('\n🏁 SCAN SUMMARY'));
    console.log(chalk.white('--------------------------------------------------------'));
    console.log(chalk.green(`✅ Completed ${successfulScans}/${scanCount} scans successfully`));
    console.log(chalk.white(`⏱️ Total time: ${duration} seconds\n`));

    if (successfulScans < scanCount) {
        console.log(chalk.yellow('⚠️ Some scans failed. Check token validity or API status.'));
    }
};

main().catch(error => {
    console.error(chalk.red(`❌ FATAL ERROR: ${error.message}`));
    process.exit(1);
});
