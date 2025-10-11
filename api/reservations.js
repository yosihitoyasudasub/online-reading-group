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
        scopes: [
            'https://www.googleapis.com/auth/calendar'
        ]
    });
}

async function getEventMeetLink(slot) {
    try {
        const serviceAccountAuth = getServiceAccountAuth();
        const calendar = google.calendar({ version: 'v3', auth: serviceAccountAuth });

        // 既存イベントを取得
        const response = await calendar.events.get({
            calendarId: process.env.CALENDAR_ID,
            eventId: slot.id
        });

        const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri ||
                        response.data.hangoutLink ||
                        null;

        if (!meetLink) {
            throw new Error('Google Meet URLが見つかりません。管理者がイベントにGoogle Meetを追加してください。');
        }

        return meetLink;

    } catch (error) {
        console.error('Error getting Google Meet link:', error);
        throw new Error('Google Meet URLの取得に失敗しました');
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader(corsHeaders).end();
    }

    try {
        const { slot, participant } = req.body;

        if (!slot || !participant) {
            return res.status(400).json({
                success: false,
                message: '必要な情報が不足しています'
            });
        }

        const meetLink = await getEventMeetLink(slot);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({
            success: true,
            message: '予約が完了しました',
            meetLink: meetLink
        });

    } catch (error) {
        console.error('Reservation error:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({
            success: false,
            message: '予約の処理中にエラーが発生しました'
        });
    }
}