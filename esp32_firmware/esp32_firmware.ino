#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>


#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 34
#define RAIN_PIN 35
#define LDR_PIN 32
#define BUZZER_PIN 26
#define LED_PIN 27

const char *ssid = "wifi_name";
const char *password = "password";
const char *serverName = "http://your_IP_Address:5000/api/sensor";

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi!");
}

void loop() {

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int airQuality = analogRead(MQ135_PIN);
  int rainfall = analogRead(RAIN_PIN);
  int ldr = analogRead(LDR_PIN);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT Read Failed!");
    return;
  }

  Serial.println("----- Sensor Readings -----");
  Serial.print("Temperature: ");
  Serial.println(temperature);
  Serial.print("Humidity: ");
  Serial.println(humidity);
  Serial.print("Air Quality: ");
  Serial.println(airQuality);
  Serial.print("Rainfall: ");
  Serial.println(rainfall);
  Serial.print("LDR: ");
  Serial.println(ldr);

  // 🚨 ALERT CONDITIONS
  if (airQuality > 2500 || rainfall < 500) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_PIN, HIGH);
    Serial.println("⚠ ALERT CONDITION TRIGGERED!");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
  }

  // Send to Server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"temperature\":" + String(temperature) + ",";
    jsonData += "\"humidity\":" + String(humidity) + ",";
    jsonData += "\"airQuality\":" + String(airQuality) + ",";
    jsonData += "\"rainfall\":" + String(rainfall) + ",";
    jsonData += "\"ldr\":" + String(ldr);
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);

    http.end();
  }

  Serial.println("----------------------------\n");
  delay(10000);
}
