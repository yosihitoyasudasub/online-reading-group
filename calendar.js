const CALENDAR_CONFIG = {
    apiKey: 'YOUR_GOOGLE_API_KEY',
    calendarId: 'YOUR_CALENDAR_ID@group.calendar.google.com',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
};

let gapi;

function initializeGoogleCalendar() {
    if (typeof window.gapi !== 'undefined') {
        gapi = window.gapi;
        gapi.load('client:auth2', initClient);
    } else {
        console.error('Google API not loaded');
        loadSampleData();
    }
}

function initClient() {
    gapi.client.init({
        apiKey: CALENDAR_CONFIG.apiKey,
        discoveryDocs: CALENDAR_CONFIG.discoveryDocs,
    }).then(() => {
        loadAvailableSlots();
    }).catch((error) => {
        console.error('Error initializing Google Calendar API:', error);
        loadSampleData();
    });
}

function loadAvailableSlots() {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

    gapi.client.calendar.events.list({
        calendarId: CALENDAR_CONFIG.calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        q: '読書会'
    }).then((response) => {
        const events = response.result.items;
        displayAvailableSlots(events);
    }).catch((error) => {
        console.error('Error loading calendar events:', error);
        loadSampleData();
    });
}

function loadSampleData() {
    const sampleEvents = [
        {
            id: 'sample1',
            summary: '読書会: 「人を動かす」ディスカッション',
            start: { dateTime: '2024-10-15T19:00:00+09:00' },
            end: { dateTime: '2024-10-15T21:00:00+09:00' },
            description: '今月の課題図書「人を動かす」について語り合いましょう',
            location: 'Google Meet',
            extendedProperties: {
                private: {
                    book: '人を動かす - デール・カーネギー',
                    maxParticipants: '8'
                }
            }
        },
        {
            id: 'sample2',
            summary: '読書会: 「7つの習慣」実践編',
            start: { dateTime: '2024-10-22T19:30:00+09:00' },
            end: { dateTime: '2024-10-22T21:30:00+09:00' },
            description: '「7つの習慣」の実践方法について話し合います',
            location: 'Google Meet',
            extendedProperties: {
                private: {
                    book: '7つの習慣 - スティーブン・R・コヴィー',
                    maxParticipants: '10'
                }
            }
        },
        {
            id: 'sample3',
            summary: '読書会: 「思考は現実化する」体験談',
            start: { dateTime: '2024-10-29T20:00:00+09:00' },
            end: { dateTime: '2024-10-29T22:00:00+09:00' },
            description: '実際に本の内容を実践した体験談を共有しましょう',
            location: 'Google Meet',
            extendedProperties: {
                private: {
                    book: '思考は現実化する - ナポレオン・ヒル',
                    maxParticipants: '6'
                }
            }
        }
    ];

    displayAvailableSlots(sampleEvents);
}

function displayAvailableSlots(events) {
    const container = document.getElementById('available-slots');
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p>現在、予約可能な読書会はありません。</p>';
        return;
    }

    events.forEach(event => {
        const slotElement = createSlotElement(event);
        container.appendChild(slotElement);
    });
}

function createSlotElement(event) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'slot-item';
    slotDiv.dataset.eventId = event.id;

    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);

    const dateStr = startDate.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    const timeStr = `${startDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    })} - ${endDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    })}`;

    const book = event.extendedProperties?.private?.book || '未定';

    slotDiv.innerHTML = `
        <div class="slot-date">${dateStr}</div>
        <div class="slot-time">${timeStr}</div>
        <div class="slot-book">${book}</div>
    `;

    slotDiv.addEventListener('click', () => selectSlot(slotDiv, event));

    return slotDiv;
}

function selectSlot(slotElement, eventData) {
    document.querySelectorAll('.slot-item').forEach(item => {
        item.classList.remove('selected');
    });

    slotElement.classList.add('selected');

    document.getElementById('selected-slot').value = JSON.stringify({
        id: eventData.id,
        title: eventData.summary,
        start: eventData.start.dateTime,
        end: eventData.end.dateTime,
        book: eventData.extendedProperties?.private?.book || '未定'
    });

    document.getElementById('reservation-form').style.display = 'block';
    document.getElementById('reservation-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelReservation() {
    document.getElementById('reservation-form').style.display = 'none';
    document.querySelectorAll('.slot-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.getElementById('selected-slot').value = '';
    document.getElementById('reservation-form').reset();
}

async function submitReservation(formData) {
    try {
        const selectedSlot = JSON.parse(document.getElementById('selected-slot').value);

        const reservationData = {
            slot: selectedSlot,
            participant: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                experience: formData.get('experience'),
                message: formData.get('message')
            },
            timestamp: new Date().toISOString()
        };

        const apiUrl = window.location.hostname === 'localhost'
            ? '/api/reservations'
            : '/api/reservations';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData)
        });

        if (response.ok) {
            const result = await response.json();
            showSuccessMessage(result);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || '予約の送信に失敗しました');
        }

    } catch (error) {
        console.error('Reservation error:', error);
        showErrorMessage('予約の処理中にエラーが発生しました。もう一度お試しください。');
    }
}

function showSuccessMessage(result) {
    alert(`予約が完了しました！\n\nGoogle Meet の会議URLを ${result.email} に送信いたします。\n読書会の詳細については、後日メールでご連絡いたします。`);

    cancelReservation();
}

function showErrorMessage(message) {
    alert(`エラー: ${message}`);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGoogleCalendar();

    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            if (!document.getElementById('selected-slot').value) {
                alert('読書会の日時を選択してください。');
                return;
            }

            submitReservation(formData);
        });
    }
});