const axios = require('axios');

async function testFetch() {
    try {
        const res = await axios.get('https://acm-agencies-backend.vercel.app/api/retailers');
        const data = res.data;
        console.log("Response Type:", typeof data);
        console.log("Has 'data' property?", data.data !== undefined);

        let retailers = [];
        if (data && data.data) {
            retailers = data.data;
        } else {
            retailers = data;
        }

        console.log("Total retailers:", retailers.length);
        if (retailers.length > 0) {
            console.log("First retailer sample:", JSON.stringify(retailers[0], null, 2));
        }
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

testFetch();
