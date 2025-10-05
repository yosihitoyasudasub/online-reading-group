const { google } = require('googleapis');

function getServiceAccountAuth() {
    return new google.auth.GoogleAuth({
        credentials: {
            type: 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
        },
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader(corsHeaders).end();
    }

    try {
        const serviceAccountAuth = getServiceAccountAuth();
        const calendar = google.calendar({ version: 'v3', auth: serviceAccountAuth });

        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

        const response = await calendar.events.list({
            calendarId: process.env.CALENDAR_ID,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            q: '読書会'
        });

        const events = response.data.items || [];

        const availableSlots = events.map(event => ({
            id: event.id,
            summary: event.summary,
            start: event.start,
            end: event.end,
            description: event.description,
            extendedProperties: event.extendedProperties
        }));

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({
            success: true,
            events: availableSlots
        });

    } catch (error) {
        console.error('Calendar API error:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({
            success: false,
            message: 'カレンダーの読み込みに失敗しました'
        });
    }
}