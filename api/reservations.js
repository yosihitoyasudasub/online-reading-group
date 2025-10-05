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
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    });
}

function getTransporter() {
    let nodemailer;
    try {
        nodemailer = require('nodemailer');
        console.log('nodemailer loaded:', typeof nodemailer);
        console.log('nodemailer.default:', typeof nodemailer.default);
        console.log('nodemailer.createTransporter:', typeof nodemailer.createTransporter);

        // Try default export if createTransporter is not directly available
        if (nodemailer.default && typeof nodemailer.default.createTransporter === 'function') {
            nodemailer = nodemailer.default;
        }
    } catch (error) {
        console.error('Error loading nodemailer:', error);
        throw error;
    }

    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
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

async function sendConfirmationEmail(participant, slot, meetLink) {
    const slotDate = new Date(slot.start);
    const dateStr = slotDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    const timeStr = slotDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const mailOptions = {
        from: `オンライン読書会 <${process.env.EMAIL_USER}>`,
        to: participant.email,
        subject: '読書会予約確認 - ご参加ありがとうございます',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B4513;">読書会予約確認</h2>

            <p>${participant.name} 様</p>

            <p>この度は、オンライン読書会にお申し込みいただき、ありがとうございます。<br>
            以下の内容で予約を承りました。</p>

            <div style="background: #FFF8DC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">予約詳細</h3>
                <p><strong>日時:</strong> ${dateStr} ${timeStr}</p>
                <p><strong>課題図書:</strong> ${slot.book}</p>
                <p><strong>参加方法:</strong> オンライン（Google Meet）</p>
            </div>

            <div style="background: #F4A460; padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
                <h3 style="margin-top: 0;">Google Meet 参加URL</h3>
                <p style="word-break: break-all;">
                    <a href="${meetLink}" style="color: white; text-decoration: underline;">
                        ${meetLink}
                    </a>
                </p>
            </div>

            <div style="background: #F5F5DC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">参加前の準備</h3>
                <ul>
                    <li>課題図書を事前にお読みください</li>
                    <li>気になった箇所やご感想をメモしておくと、より充実した議論ができます</li>
                    <li>開始時刻の5分前には会議室にお入りください</li>
                    <li>マイクとカメラの動作確認をお願いします</li>
                </ul>
            </div>

            <p>ご質問やご不明な点がございましたら、このメールにご返信ください。</p>

            <p>読書会でお会いできることを楽しみにしております。</p>

            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
                オンライン読書会<br>
                Email: ${process.env.EMAIL_USER}
            </p>
        </div>
        `
    };

    try {
        const transporter = getTransporter();
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', participant.email);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('確認メールの送信に失敗しました');
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

        await sendConfirmationEmail(participant, slot, meetLink);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({
            success: true,
            message: '予約が完了しました',
            email: participant.email,
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