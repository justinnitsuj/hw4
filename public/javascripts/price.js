const axios = require('axios');
const cheerio = require('cheerio');

const TIMEOUT = 300000; // 30 秒超時
const INTERVAL = 5000; // 每 5 秒重試一次

async function scrapeData() {
    let html = '';
    let retries = 0;
    const maxRetries = 10; // 最多重試 10 次

    while (retries < maxRetries) {
        try {
            // 發送 HTTP GET 請求,設置超時時間
            const response = await axios.get('https://price.naif.org.tw/query/QueryNow.aspx', { timeout: TIMEOUT });
            html = response.data;

            // 使用 cheerio 載入 HTML
            const $ = cheerio.load(html);

            // 檢查網頁內容是否為空
            if ($.html().trim() === '') {
                console.log('網頁內容為空,等待重試...');
                retries++;
                await new Promise(resolve => setTimeout(resolve, INTERVAL)); // 等待 5 秒後重試
            } else {
                // 提取價格資料
                const priceData = [];
                $('#hldContent_uctlChart_tabReport tr').each((index, element) => {
                    if (index > 2) { // 跳過前三行標題
                        const row = $(element).find('td');
                        const year = row.eq(0).text().trim();
                        const milkPrice = row.eq(1).text().trim();
                        const eggPrice = row.eq(2).text().trim();

                        // 檢查價格值是否為空白
                        if (milkPrice !== '-' && eggPrice !== '-') {
                            priceData.push({ year, milkPrice, eggPrice });
                        }
                    }
                });

                console.log(priceData);


                break; // 成功取得資料,退出迴圈
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED' && retries < maxRetries) {
                console.log('請求超時,等待重試...');
                retries++;
                await new Promise(resolve => setTimeout(resolve, INTERVAL)); // 等待 5 秒後重試
            } else {
                console.error('Error:', error);
                break; // 其他錯誤,退出迴圈
            }
        }
    }

    if (retries === maxRetries) {
        console.error('重試次數用盡,無法取得資料');
    }
}

scrapeData();

