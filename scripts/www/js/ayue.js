let loginButton, dismissButton; // 先声明变量，不立即获取
let modalCallback = null;
let versionUpdateCallback = null; // 新增：版本更新回调存储
// 新增：强制更新相关全局变量
let isForceUpdate = false;
let forceUpdateUrl = "";
let isAutoLogin = false; // 新增：标记是否为自动登录

function createGlassModal() {
    const glassModal = document.createElement('div');
    glassModal.id = 'customGlassModal';
    glassModal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 9999;
        justify-content: center;
        align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        width: 82%;
        max-width: 360px;
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 22px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
    `;

    const modalTitle = document.createElement('h4');
    modalTitle.id = 'modalTitle';
    modalTitle.style.cssText = `
        color: #e84393;
        font-size: 22px;
        margin: 0 0 16px 0;
        font-weight: 600;
    `;

    const modalText = document.createElement('p');
    modalText.id = 'modalText';
    modalText.style.cssText = `
        color: #333;
        font-size: 15px;
        line-height: 1.7;
        margin: 0 0 28px 0;
        white-space: pre-line;
    `;

    // 新增：双按钮容器，适配确认/取消
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'modalConfirmBtn';
    confirmBtn.textContent = '确定';
    confirmBtn.style.cssText = `
        background: linear-gradient(135deg, #ff6b9d, #e84393);
        color: white;
        border: none;
        border-radius: 30px;
        padding: 11px 38px;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.25s ease;
        flex: 1;
    `;
    confirmBtn.onmouseover = () => {
        confirmBtn.style.transform = 'scale(1.04)';
        confirmBtn.style.boxShadow = '0 4px 16px rgba(232, 67, 147, 0.35)';
    };
    confirmBtn.onmouseout = () => {
        confirmBtn.style.transform = 'scale(1)';
        confirmBtn.style.boxShadow = 'none';
    };

    // 新增：取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'modalCancelBtn';
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
        background: rgba(255,255,255,0.6);
        color: #333;
        border: 1px solid #ddd;
        border-radius: 30px;
        padding: 11px 38px;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.25s ease;
        flex: 1;
    `;
    cancelBtn.onmouseover = () => {
        cancelBtn.style.transform = 'scale(1.04)';
        cancelBtn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)';
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.transform = 'scale(1)';
        cancelBtn.style.boxShadow = 'none';
    };

    // 按钮点击逻辑：区分普通弹窗、版本更新弹窗、强制更新弹窗
    confirmBtn.addEventListener('click', function() {
        // 新增：强制更新逻辑 - 直接跳转，不关闭弹窗（强制用户更新）
        if (isForceUpdate && forceUpdateUrl) {
            window.open(forceUpdateUrl, "_blank");
            return;
        }

        glassModal.style.display = 'none';
        if (typeof modalCallback === 'function') {
            modalCallback();
            modalCallback = null;
        }
        if (typeof versionUpdateCallback === 'function') {
            versionUpdateCallback(true); // 传入true表示确认更新
            versionUpdateCallback = null;
        }
    });

    cancelBtn.addEventListener('click', function() {
        // 新增：强制更新时隐藏取消按钮，点击无效
        if (isForceUpdate) return;

        glassModal.style.display = 'none';
        if (typeof versionUpdateCallback === 'function') {
            versionUpdateCallback(false); // 传入false表示取消更新
            versionUpdateCallback = null;
        }
    });

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalText);
    modalContent.appendChild(buttonContainer); // 替换原单个按钮
    glassModal.appendChild(modalContent);
    document.body.appendChild(glassModal);
}

function customAlert(message, title = '提示', callback = null) {
    // 自动登录时跳过弹窗
    if (isAutoLogin) {
        if (callback) callback();
        return;
    }
    const modal = document.getElementById('customGlassModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (!modal) {
        alert(message);
        if (callback) callback();
        return;
    }

    // 普通弹窗隐藏取消按钮，版本更新弹窗显示
    if (title === '版本更新') {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }

    modalTitle.textContent = title;
    modalText.textContent = message;
    modalCallback = callback;
    modal.style.display = 'flex';
}

// 新增：版本更新弹窗专用方法 - 扩展支持强制更新
function showVersionUpdateAlert(message, callback, forceUpdate = false, updateUrl = "") {
    const modal = document.getElementById('customGlassModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (!modal) {
        const isConfirm = confirm(message);
        callback(isConfirm);
        return;
    }

    // 新增：强制更新配置
    isForceUpdate = forceUpdate;
    forceUpdateUrl = updateUrl;

    if (forceUpdate) {
        cancelBtn.style.display = 'none'; // 强制更新隐藏取消按钮
        modalTitle.textContent = '强制更新';
    } else {
        cancelBtn.style.display = 'block';
        modalTitle.textContent = '版本更新';
    }
    
    modalText.textContent = message;
    versionUpdateCallback = callback;
    modal.style.display = 'flex';
}

function md5(message) {
    message = unescape(encodeURIComponent(message));
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) return (lResult & 0x40000000) ? (lResult ^ 0xC0000000 ^ lX8 ^ lY8) : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return x ^ y ^ z; }
    function I(x, y, z) { return y ^ (x | (~z)); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(message) {
        var lWordCount, lMessageLength = message.length,
            lNumberOfWords_temp1 = lMessageLength + 8,
            lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64,
            lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16,
            lWordArray = new Array(lNumberOfWords).fill(0);
        for (lWordCount = 0; lWordCount < lMessageLength; lWordCount++) {
            lWordArray[lWordCount >> 2] |= message.charCodeAt(lWordCount) << ((lWordCount % 4) * 8);
        }
        lWordArray[lMessageLength >> 2] |= 0x80 << ((lMessageLength % 4) * 8);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function wordToHex(lValue) {
        var wordToHexValue = '', lByte;
        for (let lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue += ('0' + lByte.toString(16)).slice(-2);
        }
        return wordToHexValue;
    }
    var x = convertToWordArray(message),
        a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476,
        S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
    for (let k = 0; k < x.length; k += 16) {
        let AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k+0], S[0], 0xD76AA478);
        d = FF(d, a, b, c, x[k+1], S[1], 0xE8C7B756);
        c = FF(c, d, a, b, x[k+2], S[2], 0x242070DB);
        b = FF(b, c, d, a, x[k+3], S[3], 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k+4], S[0], 0xF57C0FAF);
        d = FF(d, a, b, c, x[k+5], S[1], 0x4787C62A);
        c = FF(c, d, a, b, x[k+6], S[2], 0xA8304613);
        b = FF(b, c, d, a, x[k+7], S[3], 0xFD469501);
        a = FF(a, b, c, d, x[k+8], S[0], 0x698098D8);
        d = FF(d, a, b, c, x[k+9], S[1], 0x8B44F7AF);
        c = FF(c, d, a, b, x[k+10], S[2], 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k+11], S[3], 0x895CD7BE);
        a = FF(a, b, c, d, x[k+12], S[0], 0x6B901122);
        d = FF(d, a, b, c, x[k+13], S[1], 0xFD987193);
        c = FF(c, d, a, b, x[k+14], S[2], 0xA679438E);
        b = FF(b, c, d, a, x[k+15], S[3], 0x49B40821);
        a = GG(a, b, c, d, x[k+1], S[4], 0xF61E2562);
        d = GG(d, a, b, c, x[k+6], S[5], 0xC040B340);
        c = GG(c, d, a, b, x[k+11], S[6], 0x265E5A51);
        b = GG(b, c, d, a, x[k+0], S[7], 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k+5], S[4], 0xD62F105D);
        d = GG(d, a, b, c, x[k+10], S[5], 0x2441453);
        c = GG(c, d, a, b, x[k+15], S[6], 0xD8A1E681);
        b = GG(b, c, d, a, x[k+4], S[7], 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k+9], S[4], 0x21E1CDE6);
        d = GG(d, a, b, c, x[k+14], S[5], 0xC33707D6);
        c = GG(c, d, a, b, x[k+3], S[6], 0xF4D50D87);
        b = GG(b, c, d, a, x[k+8], S[7], 0x455A14ED);
        a = GG(a, b, c, d, x[k+13], S[4], 0xA9E3E905);
        d = GG(d, a, b, c, x[k+2], S[5], 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k+7], S[6], 0x676F02D9);
        b = GG(b, c, d, a, x[k+12], S[7], 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k+5], S[8], 0xFFFA3942);
        d = HH(d, a, b, c, x[k+8], S[9], 0x8771F681);
        c = HH(c, d, a, b, x[k+11], S[10], 0x6D9D6122);
        b = HH(b, c, d, a, x[k+14], S[11], 0xFDE5380C);
        a = HH(a, b, c, d, x[k+1], S[8], 0xA4BEEA44);
        d = HH(d, a, b, c, x[k+4], S[9], 0x4BDECFA9);
        c = HH(c, d, a, b, x[k+7], S[10], 0xF6BB4B60);
        b = HH(b, c, d, a, x[k+10], S[11], 0xBEBFBC70);
        a = HH(a, b, c, d, x[k+13], S[8], 0x289B7EC6);
        d = HH(d, a, b, c, x[k+0], S[9], 0xEAA127FA);
        c = HH(c, d, a, b, x[k+3], S[10], 0xD4EF3085);
        b = HH(b, c, d, a, x[k+6], S[11], 0x4881D05);
        a = HH(a, b, c, d, x[k+9], S[8], 0xD9D4D039);
        d = HH(d, a, b, c, x[k+12], S[9], 0xE6DB99E5);
        c = HH(c, d, a, b, x[k+15], S[10], 0x1FA27CF8);
        b = HH(b, c, d, a, x[k+2], S[11], 0xC4AC5665);
        a = II(a, b, c, d, x[k+0], S[12], 0xF4292244);
        d = II(d, a, b, c, x[k+7], S[13], 0x432AFF97);
        c = II(c, d, a, b, x[k+14], S[14], 0xAB9423A7);
        b = II(b, c, d, a, x[k+5], S[15], 0xFC93A039);
        a = II(a, b, c, d, x[k+12], S[12], 0x655B59C3);
        d = II(d, a, b, c, x[k+3], S[13], 0x8F0CCC92);
        c = II(c, d, a, b, x[k+10], S[14], 0xFFEFF47D);
        b = II(b, c, d, a, x[k+1], S[15], 0x85845DD1);
        a = II(a, b, c, d, x[k+8], S[12], 0x6FA87E4F);
        d = II(d, a, b, c, x[k+15], S[13], 0xFE2CE6E0);
        c = II(c, d, a, b, x[k+6], S[14], 0xA3014314);
        b = II(b, c, d, a, x[k+13], S[15], 0x4E0811A1);
        a = II(a, b, c, d, x[k+4], S[12], 0xF7537E82);
        d = II(d, a, b, c, x[k+11], S[13], 0xBD3AF235);
        c = II(c, d, a, b, x[k+2], S[14], 0x2AD7D2BB);
        b = II(b, c, d, a, x[k+9], S[15], 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

// 最终修复版 RC4：字节级对齐 + 编码统一
function rc4(text, key, encrypt) {
    if (encrypt) {
        text = unescape(encodeURIComponent(text));
    } else {
        if (!/^[0-9a-fA-F]+$/.test(text) || text.length % 2 !== 0) {
            console.error('RC4解密失败：输入不是有效的十六进制字符串', text);
            return '';
        }
        let bytes = [];
        for (let i = 0; i < text.length; i += 2) {
            bytes.push(parseInt(text.substr(i, 2), 16));
        }
        text = String.fromCharCode.apply(null, bytes);
    }

    const KSA = (keyStr) => {
        let S = new Array(256);
        let keyBytes = [];
        for (let i = 0; i < keyStr.length; i++) {
            keyBytes.push(keyStr.charCodeAt(i));
        }
        for (let i = 0; i < 256; i++) {
            S[i] = i;
        }
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + keyBytes[i % keyBytes.length]) % 256;
            [S[i], S[j]] = [S[j], S[i]];
        }
        return S;
    };

    const PRGA = (S, textLen) => {
        let i = 0, j = 0;
        let keyStream = [];
        for (let k = 0; k < textLen; k++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;
            [S[i], S[j]] = [S[j], S[i]];
            keyStream.push(S[(S[i] + S[j]) % 256]);
        }
        return keyStream;
    };

    const S = KSA(key);
    const keyStream = PRGA(S, text.length);
    let resultBytes = [];

    for (let i = 0; i < text.length; i++) {
        resultBytes.push(text.charCodeAt(i) ^ keyStream[i]);
    }

    if (encrypt) {
        return resultBytes.map(byte => ('0' + byte.toString(16)).slice(-2)).join('').toLowerCase();
    } else {
        try {
            return decodeURIComponent(escape(String.fromCharCode.apply(null, resultBytes)));
        } catch (e) {
            return String.fromCharCode.apply(null, resultBytes);
        }
    }
}

function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        const rq = new Date().toLocaleString();
        deviceId = md5(rq);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

function wyDateTime(timestamp) {
    try {
        const ts = parseInt(timestamp);
        if (isNaN(ts)) return '永久有效';
        const date = new Date(ts * 1000);
        return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}时${date.getMinutes()}分${date.getSeconds()}秒`;
    } catch (e) {
        return '永久有效';
    }
}

const config = {
    baseUrl: 'https://www.skyayue.top',
    appid: '10002',
    appkey: 'bTo7cZY5PPtCmzcj',
    rc4Key: 'a88un8ua46z10002',
    rc4Enable: true,
    api: {
        login: '/api.php?api=kmlogon',
        unbind: '/api.php?api=kmunmachine',
        config: '/api.php?api=ini',
        notice: '/api.php?api=notice'
    }
};

function fetchApi(url, data = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const params = Object.entries(data).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', '*/*');
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`HTTP错误：${xhr.status}，响应内容：${xhr.responseText}`));
            }
        };
        xhr.onerror = function() {
            reject(new Error('网络错误：无法连接服务器'));
        };
        xhr.send(params);
    });
}

function parseServerResponse(response) {
    try {
        const parsed = JSON.parse(response);
        return { ...parsed, ...(parsed.msg || {}) };
    } catch (e) {
        console.error('标准 JSON 解析失败：', e.message, '响应内容：', response);
        return {
            code: null,
            msg: '响应格式非法',
            vip: null,
            check: null,
            time: null,
            app_gg: null,
            version: null,
            app_update_show: null,
            app_update_url: null,
            app_update_must: null // 新增：兼容强制更新标识字段
        };
    }
}

function testRC4Valid() {
    const testStr = '测试RC4加解密一致性123，包含中文';
    const key = config.rc4Key;
    const encrypted = rc4(testStr, key, true);
    const decrypted = rc4(encrypted, key, false);
    console.log('==== RC4 本地测试 ====');
    console.log('原始字符串:', testStr);
    console.log('加密结果:', encrypted);
    console.log('解密结果:', decrypted);
    console.log('是否一致:', testStr === decrypted);
    console.log('=====================');
    if (testStr === decrypted) {
        
    }
}

// 核心修改：新增强制更新判断
async function initApp() {
    try {
        const configUrl = new URL(config.api.config, config.baseUrl).href + `&app=${config.appid}`;
        let configRaw = await fetchApi(configUrl);
        console.log('版本配置原始响应：', configRaw);
        if (config.rc4Enable) {
            configRaw = rc4(configRaw, config.rc4Key, false);
            console.log('RC4解密后配置：', configRaw);
        }
        const configData = parseServerResponse(configRaw);
        // 新增：判断是否为强制更新
        const isForce = configData.app_update_must === 'y' || configData.app_update_must === true;
        
        if (configData.version && configData.version !== '1.0' && configData.app_update_url && configData.app_update_url !== '未提交URL') {
            const updateMsg = isForce 
                ? `发现新版本${configData.version}\n更新内容：${configData.app_update_show || '无'}\n【强制更新】不更新无法使用功能`
                : `发现新版本${configData.version}\n更新内容：${configData.app_update_show || '无'}\n是否前往更新？`;
            // 替换confirm为自定义玻璃弹窗 - 传入强制更新标识和链接
            return new Promise((resolve) => {
                showVersionUpdateAlert(updateMsg, (isConfirm) => {
                    if (isConfirm) {
                        window.open(configData.app_update_url);
                        resolve(false);
                    } else {
                        resolve(!isForce); // 强制更新时resolve(false)，阻止后续操作
                    }
                }, isForce, configData.app_update_url);
            });
        }
        return true;
    } catch (error) {
        console.log('初始化失败:', error.message);
        customAlert(`初始化失败：${error.message}`, '错误');
        return false;
    }
}

function fetchGet(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            xhr.abort();
            reject(new Error(`请求超时（${timeout}ms）`));
        }, timeout);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        xhr.onload = function() {
            clearTimeout(timer);
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText.trim());
            } else {
                reject(new Error(`HTTP错误：${xhr.status}，响应内容：${xhr.responseText}`));
            }
        };

        xhr.onerror = function() {
            clearTimeout(timer);
            reject(new Error('网络错误：无法连接服务器'));
        };

        xhr.send();
    });
}

// 封装登录逻辑为独立函数
async function doLogin(kami) {
    const sbm = getDeviceId();
    const time = Math.floor(Date.now() / 1000);
    const sign = md5(`kami=${kami}&markcode=${sbm}&t=${time}&${config.appkey}`);
    const rc4Random = rc4(`${time}极简云`, config.rc4Key, true);
    const Random = md5(`${rc4Random}${config.appkey}${sbm}`);

    let coreData = `kami=${encodeURIComponent(kami)}&markcode=${encodeURIComponent(sbm)}&t=${time}&sign=${sign}`;
    const rc4Encrypted = rc4(coreData, config.rc4Key, true).toUpperCase();
    const encodedData = encodeURIComponent(rc4Encrypted);
    const encodedValue = encodeURIComponent(Random);

    const loginUrl = `${config.baseUrl.replace(/\/$/, '')}/api.php?api=kmlogon&app=${config.appid}&data=${encodedData}&value=${encodedValue}`;

    try {
        const responseRaw = await fetchGet(loginUrl, 10000);
        const responseDecrypted = rc4(responseRaw, config.rc4Key, false);
        const responseData = parseServerResponse(responseDecrypted);

        if (responseData.code == '200') {
            localStorage.setItem('km', kami);
            // 自动登录直接跳转，不弹窗
            window.location.href = "nv.html";
        } else {
            localStorage.removeItem('km');
            // 自动登录失败不弹窗，仅打印日志
            console.log('自动登录失败:', responseData.msg || `错误码${responseData.code}`);
        }
    } catch (error) {
        console.log('自动登录异常:', error.message);
    }
}

// 页面加载完成后再初始化元素和事件
document.addEventListener('DOMContentLoaded', async function() {
    // 1. 创建玻璃弹窗
    createGlassModal();

    // 2. 页面打开时显示公告（仅首次加载触发）
    try {
        const noticeUrl = `${config.baseUrl}${config.api.notice}&app=${config.appid}`;
        let noticeRaw = await fetchApi(noticeUrl);
        console.log('公告原始响应：', noticeRaw);
        if (config.rc4Enable) {
            noticeRaw = rc4(noticeRaw, config.rc4Key, false);
            console.log('RC4解密后公告：', noticeRaw);
        }
        const noticeData = parseServerResponse(noticeRaw);
        if (noticeData.app_gg) {
            customAlert(noticeData.app_gg, '公告');
        }
    } catch (error) {
        console.log('公告加载失败:', error.message);
    }

    // 3. 获取DOM元素（关键：DOM加载完成后获取）
    loginButton = document.querySelector('button[type="submit"]');
    dismissButton = document.querySelector('button[type="dismissButton"]');
    const cardKeyInput = document.querySelector('#card-key');

    // 4. 卡密记忆核心逻辑 - 仅读取缓存
    const savedKm = localStorage.getItem('km');
    if (savedKm && cardKeyInput) {
        cardKeyInput.value = savedKm;
        // 初始化成功后执行自动登录
        const initSuccess = await initApp();
        if (initSuccess) {
            isAutoLogin = true;
            await doLogin(savedKm);
            isAutoLogin = false; // 恢复标记
        }
    }

    // 5. 登录按钮点击事件（手动登录，保留弹窗）
    if (loginButton) {
        loginButton.addEventListener('click', async function() {
            const initSuccess = await initApp();
            if (!initSuccess) return;

            const kami = cardKeyInput?.value.trim() || '';
            if (!kami) {
                customAlert('请输入卡密', '提示');
                return;
            }

            const sbm = getDeviceId();
            const time = Math.floor(Date.now() / 1000);
            const sign = md5(`kami=${kami}&markcode=${sbm}&t=${time}&${config.appkey}`);
            const rc4Random = rc4(`${time}极简云`, config.rc4Key, true);
            const Random = md5(`${rc4Random}${config.appkey}${sbm}`);

            let coreData = `kami=${encodeURIComponent(kami)}&markcode=${encodeURIComponent(sbm)}&t=${time}&sign=${sign}`;
            const rc4Encrypted = rc4(coreData, config.rc4Key, true).toUpperCase();
            const encodedData = encodeURIComponent(rc4Encrypted);
            const encodedValue = encodeURIComponent(Random);

            const loginUrl = `${config.baseUrl.replace(/\/$/, '')}/api.php?api=kmlogon&app=${config.appid}&data=${encodedData}&value=${encodedValue}`;

            try {
                const responseRaw = await fetchGet(loginUrl, 10000);
                console.log('登录原始响应（十六进制）：', responseRaw);
                console.log('响应长度：', responseRaw.length);

                const responseDecrypted = rc4(responseRaw, config.rc4Key, false);
                console.log('RC4解密后响应：', responseDecrypted);

                const responseData = parseServerResponse(responseDecrypted);
                console.log('解析后响应数据：', responseData);

                if (responseData.code == '200') {
                    const vip = responseData.vip || '永久有效';
                    const vipTime = wyDateTime(vip);
                    localStorage.setItem('km', kami);
                    customAlert(`卡密：${kami}\n到期时间：${vipTime}`, '登录成功', function() {
                        window.location.href = "nv.html";
                    });
                } else {
                    localStorage.removeItem('km');
                    const errorMsg = typeof responseData.msg === 'string'
                        ? responseData.msg
                        : JSON.stringify(responseData.msg) || `错误码${responseData.code}`;
                    customAlert(`登录失败：${errorMsg}\n请检查卡密是否正确`, '登录失败');
                }
            } catch (error) {
                console.log('登录异常:', error.message);
                customAlert(`登录请求异常：${error.message}`, '错误');
            }
        });
    }

    // 6. 解绑按钮点击事件
    if (dismissButton) {
        dismissButton.addEventListener('click', async function() {
            const initSuccess = await initApp();
            if (!initSuccess) return;

            const kami = cardKeyInput?.value.trim() || '';
            if (!kami) {
                customAlert('请输入卡密', '提示');
                return;
            }

            const sbm = getDeviceId();
            const time = Math.floor(Date.now() / 1000);
            const sign = md5(`kami=${kami}&markcode=${sbm}&t=${time}&${config.appkey}`);
            let postData = `kami=${kami}&markcode=${sbm}&t=${time}&sign=${sign}`;
            if (config.rc4Enable) {
                postData = `data=${rc4(postData, config.rc4Key, true)}`;
            }
            const unbindUrl = `${config.baseUrl}${config.api.unbind}&app=${config.appid}`;

            try {
                console.log('解绑请求数据：', postData);
                let responseRaw = await fetchApi(unbindUrl, postData);
                console.log('解绑原始响应：', responseRaw);
                if (config.rc4Enable) {
                    responseRaw = rc4(responseRaw, config.rc4Key, false);
                    console.log('RC4解密后响应：', responseRaw);
                }
                const responseData = parseServerResponse(responseRaw);
                customAlert(`解绑结果：${responseData.msg || '解绑成功'}`, '提示', function() {
                    // 解绑后清除保存的卡密
                    localStorage.removeItem('km');
                    if (cardKeyInput) {
                        cardKeyInput.value = '';
                    }
                });
            } catch (error) {
                console.log('解绑失败:', error.message);
                customAlert(`解绑失败：${error.message}`, '错误');
            }
        });
    }

    // 7. 其他初始化操作
    testRC4Valid();
    await initApp();
});