import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 50 },
    { duration: '25s', target: 50 },
  ]
};

export default function () {
  // Test /webhook endpoint
  const webhookRes = http.post('http://localhost:3001/webhook', JSON.stringify({
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "time": 1693466001,
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "PHONE_NUMBER",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {
              "name": "NAME"
            },
            "wa_id": "WHATSAPP_USER_ID"
          }],
          "messages": [{
            "context": {
              "from": "WHATSAPP_USER_ID",
              "id": "wamid.ID",
            },
            "from": "WHATSAPP_USER_ID",
            "id": "wamid.ID",
            "timestamp": "1693465990",
            "text": {
              "body": "Hello"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }), { headers: { 'Content-Type': 'application/json' } });
  check(webhookRes, { 'status is 200': (r) => r.status === 200 });

  // Test /send endpoint
  const sendRes = http.post('http://localhost:3001/send', JSON.stringify({
    "message": "Hello from k6!",
    "phoneNumber": "PHONE_NUMBER"
  }), { headers: { 'Content-Type': 'application/json' } });
  check(sendRes, { 'status is 200': (r) => r.status === 200 });

  sleep(1);
}
