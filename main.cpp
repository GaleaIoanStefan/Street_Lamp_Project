#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

const char* ssid = "Galaxy A20e3722";
const char* password = "lucl1474";

typedef struct __attribute__((packed)) struct_message {
    int lumina;
    bool comandaLed;
} struct_message;

struct_message data;
int threshold = 50; // Pragul dat cand incepi programul
const int numReadings = 10;
int readings[numReadings];
int readIndex = 0;
long total = 0;
int averageLumina = 0;

unsigned long lastWebNotify = 0;
bool lastLedState = false;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");


int getPercentage(int raw) {
    int p = map(raw, 0, 1024, 100, 0);
    return constrain(p, 0, 100);
}

void notifyClients() {
    StaticJsonDocument<150> doc;
    doc["lumina"] = getPercentage(data.lumina); 
    doc["avg"] = averageLumina;
    doc["threshold"] = threshold;
    String jsonString;
    serializeJson(doc, jsonString);
    ws.textAll(jsonString);
}

void OnDataRecv(const uint8_t * mac, const uint8_t *incomingBytes, int len) {
    if (len == sizeof(data)) {
        memcpy(&data, incomingBytes, sizeof(data));

        int luminaProcent = getPercentage(data.lumina);

        // Calcul moving average
        total = total - readings[readIndex];
        readings[readIndex] = luminaProcent;
        total = total + readings[readIndex];
        readIndex = (readIndex + 1) % numReadings;
        averageLumina = total / numReadings;

        // Logica: Daca Lumina (%) < Prag (%) -> Aprinde (true)
        bool currentLedState = (averageLumina < threshold);

        // Trimitem comanda doar daca s-a schimbat starea
        if (currentLedState != lastLedState) {
            // Verificam si adaugam Peer-ul daca lipseste
            if (!esp_now_is_peer_exist(mac)) {
                esp_now_peer_info_t peerInfo = {};
                memcpy(peerInfo.peer_addr, mac, 6);
                peerInfo.channel = WiFi.channel();
                peerInfo.encrypt = false;
                esp_now_add_peer(&peerInfo);
            }

            data.comandaLed = currentLedState;
            esp_now_send(mac, (uint8_t *) &data, sizeof(data));
            
            lastLedState = currentLedState;
            Serial.printf("Trimis la Amica -> LED: %d | Lumina: %d%% | Prag: %d%%\n", 
                          currentLedState, averageLumina, threshold);
        }

        // Notifica browserul 
        if (millis() - lastWebNotify > 333) {
            notifyClients();
            lastWebNotify = millis();
        }
    }
}

void setup() {
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }

    if (esp_now_init() != ESP_OK) return;
    esp_now_register_recv_cb(OnDataRecv);

    ws.onEvent([](AsyncWebSocket *s, AsyncWebSocketClient *c, AwsEventType t, void *arg, uint8_t *d, size_t l) {
        if(t == WS_EVT_DATA) {
            StaticJsonDocument<100> doc;
            if(!deserializeJson(doc, d, l)) {
                threshold = doc["threshold"];
                Serial.printf("Prag nou primit: %d%%\n", threshold);
            }
        }
    });
    server.addHandler(&ws);
    server.begin();
    Serial.println("\nLolin32 ONLINE");
}

void loop() { ws.cleanupClients(); }