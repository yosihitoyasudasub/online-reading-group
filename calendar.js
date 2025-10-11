const CALENDAR_CONFIG = {
    apiKey: 'YOUR_GOOGLE_API_KEY',
    calendarId: 'YOUR_CALENDAR_ID@group.calendar.google.com',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
};

let gapi;

function initializeGoogleCalendar() {
    loadAvailableSlots();
}

async function loadAvailableSlots() {
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? '/api/calendar'
            : '/api/calendar';

        const response = await fetch(apiUrl);

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayAvailableSlots(data.events);
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('カレンダーの読み込みに失敗しました');
        }
    } catch (error) {
        console.error('Error loading calendar events:', error);
        loadSampleData();
    }
}

function loadSampleData() {
    const sampleEvents = [
        {
            id: 'sample1',
            summary: '読書会: 「人を動かす」ディスカッション',
            start: { dateTime: '2025-10-15T19:00:00+09:00' },
            end: { dateTime: '2025-10-15T21:00:00+09:00' },
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
            start: { dateTime: '2025-10-22T19:30:00+09:00' },
            end: { dateTime: '2025-10-22T21:30:00+09:00' },
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
            start: { dateTime: '2025-10-29T20:00:00+09:00' },
            end: { dateTime: '2025-10-29T22:00:00+09:00' },
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

    const book = event.summary || 'イベントタイトルなし';

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
        book: eventData.summary || 'イベントタイトルなし'
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
                displayName: formData.get('displayName'),
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
    const meetUrl = result.meetLink || 'URLの取得に失敗しました';

    // モーダルを作成
    const modalHTML = `
        <div class="modal-overlay active" id="success-modal">
            <div class="modal-content">
                <h3>🎉 予約が完了しました！</h3>
                <p>以下のGoogle Meet URLで当日ご参加ください</p>
                <div class="meet-url-container">
                    <div class="meet-url" id="meet-url-text">${meetUrl}</div>
                </div>
                <p style="font-size: 0.9rem; color: #d9534f;">※このURLは必ず保存してください</p>
                <div class="modal-buttons">
                    <button class="copy-button" id="copy-url-btn">URLをコピー</button>
                    <button class="close-modal-button" id="close-modal-btn">閉じる</button>
                </div>
            </div>
        </div>
    `;

    // モーダルをbodyに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // コピーボタンのイベントリスナー
    document.getElementById('copy-url-btn').addEventListener('click', function() {
        copyToClipboard(meetUrl, this);
    });

    // 閉じるボタンのイベントリスナー
    document.getElementById('close-modal-btn').addEventListener('click', function() {
        closeModal();
    });

    // オーバーレイクリックで閉じる
    document.getElementById('success-modal').addEventListener('click', function(e) {
        if (e.target.id === 'success-modal') {
            closeModal();
        }
    });
}

function copyToClipboard(text, button) {
    // Clipboard API を試す
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showCopySuccess(button);
            })
            .catch(() => {
                // フォールバック: テキストを選択状態にする
                fallbackCopyToClipboard(text, button);
            });
    } else {
        // 古いブラウザ用のフォールバック
        fallbackCopyToClipboard(text, button);
    }
}

function fallbackCopyToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(button);
        } else {
            // コマンドが失敗した場合、URLテキストを選択状態にする
            selectUrlText();
            alert('自動コピーに失敗しました。URLを長押しして手動でコピーしてください。');
        }
    } catch (err) {
        selectUrlText();
        alert('自動コピーに失敗しました。URLを長押しして手動でコピーしてください。');
    }

    document.body.removeChild(textArea);
}

function selectUrlText() {
    const urlElement = document.getElementById('meet-url-text');
    if (urlElement) {
        const range = document.createRange();
        range.selectNodeContents(urlElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'コピーしました！';
    button.classList.add('copied');

    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
    }, 2000);
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.remove();
    }
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